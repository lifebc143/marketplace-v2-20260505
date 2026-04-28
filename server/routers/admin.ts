import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, products, userProfiles, categories } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Admin-only procedure wrapper
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Get all users
  users: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const allUsers = await db.select().from(users);
      return allUsers.slice(input.offset, input.offset + input.limit);
    }),

  // Get user details with profile
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRecord[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, input.userId))
        .limit(1);

      return {
        user: userRecord[0],
        profile: profile[0] || null,
      };
    }),

  // Disable user account
  disableUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRecord[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db
        .update(userProfiles)
        .set({ isActive: 0 })
        .where(eq(userProfiles.userId, input.userId));

      return { success: true };
    }),

  // Remove user account
  removeUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Delete user profile first (cascade will handle products and images)
      await db.delete(userProfiles).where(eq(userProfiles.userId, input.userId));

      // Delete user
      await db.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Get pending review products
  pendingProducts: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const pendingProducts = await db
        .select()
        .from(products)
        .where(eq(products.status, "pending_review"));

      return pendingProducts.slice(input.offset, input.offset + input.limit);
    }),

  // Approve product (change status to active)
  approveProduct: adminProcedure
    .input(z.object({ productId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await db
        .update(products)
        .set({ status: "active" })
        .where(eq(products.id, input.productId));

      return { success: true };
    }),

  // Remove product
  removeProduct: adminProcedure
    .input(z.object({ productId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      if (!product[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await db
        .update(products)
        .set({ status: "removed" })
        .where(eq(products.id, input.productId));

      return { success: true };
    }),

  // Category management
  categories: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(categories);
  }),

  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        await db.insert(categories).values({
          name: input.name,
          slug: input.slug,
        });

        return { success: true };
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Category slug already exists",
          });
        }
        throw error;
      }
    }),

  updateCategory: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      try {
        await db
          .update(categories)
          .set({
            name: input.name,
            slug: input.slug,
          })
          .where(eq(categories.id, input.id));

        return { success: true };
      } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Category slug already exists",
          });
        }
        throw error;
      }
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if category has products
      const productsInCategory = await db
        .select()
        .from(products)
        .where(eq(products.categoryId, input.id))
        .limit(1);

      if (productsInCategory.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot delete category with existing products",
        });
      }

      await db.delete(categories).where(eq(categories.id, input.id));

      return { success: true };
    }),
});
