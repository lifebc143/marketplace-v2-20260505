import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getReviewsByProductId, getReviewById, createReview, updateReview, deleteReview, getAverageRating, getReviewCount, getOrderById, getOrderItems } from "../db";
import { TRPCError } from "@trpc/server";

export const reviewsRouter = router({
  // 獲取商品評論列表
  getByProductId: publicProcedure
    .input(z.object({ productId: z.number(), limit: z.number().default(10), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      try {
        const reviewList = await getReviewsByProductId(input.productId, input.limit, input.offset);
        const avgRating = await getAverageRating(input.productId);
        const count = await getReviewCount(input.productId);

        return {
          reviews: reviewList,
          averageRating: avgRating,
          totalCount: count,
        };
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取評論",
        });
      }
    }),

  // 獲取單個評論
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const review = await getReviewById(input.id);
        if (!review) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "評論不存在",
          });
        }
        return review;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取評論",
        });
      }
    }),

  // 創建評論
  create: protectedProcedure
    .input(z.object({
      productId: z.number(),
      orderId: z.number(),
      rating: z.number().min(1).max(5),
      title: z.string().min(1).max(100),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 驗證訂單存在且用戶是買家
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "訂單不存在",
          });
        }

        if (order.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "只有買家可以評論",
          });
        }

        // 檢查是否已評論
        const existingReviews = await getReviewsByProductId(input.productId);
        const alreadyReviewed = existingReviews.some(r => r.buyerId === ctx.user.id && r.orderId === input.orderId);
        if (alreadyReviewed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "你已經評論過此商品",
          });
        }

        await createReview({
          productId: input.productId,
          buyerId: ctx.user.id,
          orderId: input.orderId,
          rating: input.rating,
          title: input.title,
          content: input.content,
        });

        return { success: true, message: "評論已發佈" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法發佈評論",
        });
      }
    }),

  // 編輯評論
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      rating: z.number().min(1).max(5).optional(),
      title: z.string().min(1).max(100).optional(),
      content: z.string().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const review = await getReviewById(input.id);
        if (!review) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "評論不存在",
          });
        }

        // 驗證用戶是評論者
        if (review.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權編輯此評論",
          });
        }

        await updateReview(input.id, {
          rating: input.rating,
          title: input.title,
          content: input.content,
        });

        return { success: true, message: "評論已更新" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法更新評論",
        });
      }
    }),

  // 刪除評論
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const review = await getReviewById(input.id);
        if (!review) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "評論不存在",
          });
        }

        // 驗證用戶是評論者或管理員
        if (review.buyerId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權刪除此評論",
          });
        }

        await deleteReview(input.id);
        return { success: true, message: "評論已刪除" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to delete review:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法刪除評論",
        });
      }
    }),
});
