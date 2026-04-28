import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../db";

export const notificationsRouter = router({
  /**
   * Get user's notifications
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const notifications = await getUserNotifications(
          ctx.user.id,
          input.limit,
          input.offset
        );
        return notifications;
      } catch (error) {
        console.error("Failed to get notifications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取通知",
        });
      }
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return { count };
    } catch (error) {
      console.error("Failed to get unread count:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "無法獲取未讀通知數",
      });
    }
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await markNotificationAsRead(input.id);
        return { success: true };
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法標記通知為已讀",
        });
      }
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "無法標記所有通知為已讀",
      });
    }
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteNotification(input.id);
        return { success: true };
      } catch (error) {
        console.error("Failed to delete notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法刪除通知",
        });
      }
    }),

  /**
   * Create notification (internal use only)
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["order", "message", "review", "system"]),
        title: z.string(),
        content: z.string(),
        relatedId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Only allow users to create notifications for themselves
        if (input.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權創建此通知",
          });
        }

        const id = await createNotification({
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          relatedId: input.relatedId,
          isRead: 0,
        });

        return { id, success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法創建通知",
        });
      }
    }),
});
