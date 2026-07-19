import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getAllCategories,
  getActiveProducts,
  getProductById,
  getProductsByUserId,
  searchProducts,
  createProduct,
  updateProduct,
  getProductImages,
  addProductImage,
  incrementProductViews,
  getDb,
} from "../db";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";
import { productImages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  // Get all categories
  categories: publicProcedure.query(async () => {
    return getAllCategories();
  }),

  // Get featured/active products with pagination
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const products = await getActiveProducts(input.limit, input.offset);
      return products;
    }),

  // Search and filter products
  search: publicProcedure
    .input(
      z.object({
        query: z.string().default(""),
        categoryId: z.number().int().optional(),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const results = await searchProducts(
        input.query,
        input.categoryId,
        input.limit,
        input.offset
      );
      return results;
    }),

  // Get product details by ID
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const product = await getProductById(input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // getProductById 已經包含 images，直接返回
      return product;
    }),

  // Get user's products
  myProducts: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await getProductsByUserId(ctx.user.id);
      return products.slice(input.offset, input.offset + input.limit);
    }),

  // Create new product
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        titleCn: z.string().max(255).optional(),
        description: z.string().min(1),
        price: z.number().int().positive(),
        location: z.string().min(1).max(100),
        categoryId: z.number().int().positive(),
        condition: z.enum(["brand_new", "like_new", "good", "fair"]).default("good"),
        images: z
          .array(
            z.object({
              data: z.any(),
              mimeType: z.string(),
              isAiGenerated: z.boolean().default(false),
            })
          )
          .min(1)
          .max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create product
        const product = await createProduct({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          title: input.title,
          titleCn: input.titleCn,
          description: input.description,
          price: input.price,
          location: input.location,
          condition: input.condition,
          status: "pending_review",
          isAiGenerated: input.images.some((img) => img.isAiGenerated) ? 1 : 0,
        });

        if (!product) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create product",
          });
        }

        // Upload images
        for (let i = 0; i < input.images.length; i++) {
          const image = input.images[i];
          const fileKey = `products/${product.id}/image-${i}-${Date.now()}`;

          // Convert Uint8Array to Buffer for storage
          const buffer = Buffer.from(image.data);

          const { url, key } = await storagePut(
            fileKey,
            buffer,
            image.mimeType
          );

          await addProductImage({
            productId: product.id,
            imageUrl: url,
            imageKey: key,
            displayOrder: i,
            isAiGenerated: image.isAiGenerated ? 1 : 0,
          });
        }

        return { id: product.id, status: "pending_review" };
      } catch (error) {
        console.error("[Products] Create error:", {
          error: error instanceof Error ? error.message : String(error),
          sqlMessage: (error as any)?.sqlMessage,
          code: (error as any)?.code,
          errno: (error as any)?.errno,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        });
      }
    }),

  // Update product
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        price: z.number().int().positive().optional(),
        categoryId: z.number().int().positive().optional(),
        condition: z.enum(["like_new", "good", "fair", "poor"]).optional(),
        images: z.array(z.object({
          data: z.instanceof(Uint8Array),
          mimeType: z.string(),
        })).optional(),
        existingImageIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await getProductById(input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own products",
        });
      }

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.categoryId !== undefined)
        updateData.categoryId = input.categoryId;
      if (input.condition !== undefined) updateData.condition = input.condition;

      await updateProduct(input.id, updateData);

      // Handle images if provided
      if (input.images && input.images.length > 0) {
        for (const imageData of input.images) {
          const buffer = Buffer.from(imageData.data);
          const fileName = `product-${input.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          const { url, key } = await storagePut(fileName, buffer, imageData.mimeType);
          await addProductImage({
            productId: input.id,
            imageUrl: url,
            imageKey: key,
            displayOrder: 0,
            isAiGenerated: 0,
          });
        }
      }

      // Remove images if specified - for now, just skip this as it's complex
      // In production, implement proper image removal logic

      return { success: true, id: input.id };
    }),

  // Delist/remove product
  delist: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const product = await getProductById(input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delist your own products",
        });
      }

      await updateProduct(input.id, { status: "sold" });
      return { success: true };
    }),

  // Increment product view count
  incrementViews: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        await incrementProductViews(input.id);
        return { success: true };
      } catch (error) {
        console.error("[Products] Increment views error:", error);
        // Don't throw - view count increment is not critical
        return { success: false };
      }
    }),
});
