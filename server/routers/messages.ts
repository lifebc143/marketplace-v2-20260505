import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getOrCreateConversation,
  getConversationById,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  getUnreadMessageCount,
  getProductById,
  getUserProfile,
} from "../db";
import { TRPCError } from "@trpc/server";

export const messagesRouter = router({
  // 獲取用戶的所有對話
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const conversations = await getUserConversations(ctx.user.id);
      return conversations;
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "無法獲取對話列表",
      });
    }
  }),

  // 獲取或創建對話
  getOrCreateConversation: protectedProcedure
    .input(
      z.object({
        productId: z.number().optional(),
        sellerId: z.number(),
        orderId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 驗證商品存在（如果提供了 productId）
        if (input.productId && input.productId !== 0) {
          const product = await getProductById(input.productId);
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "商品不存在",
            });
          }

          // 驗證賣家
          if (product.userId !== input.sellerId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "賣家信息不正確",
            });
          }
        }

        // 防止與自己對話
        if (ctx.user.id === input.sellerId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "無法與自己對話",
          });
        }

        const conversation = await getOrCreateConversation(
          ctx.user.id,
          input.sellerId,
          input.productId
        );
        const conversationId = conversation.id;

        return { conversationId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法創建對話",
        });
      }
    }),

  // 獲取對話詳情
  getConversation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const conversation = await getConversationById(input.id);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "對話不存在",
          });
        }

        // 驗證用戶是對話參與者
        if (conversation.buyerId !== ctx.user.id && conversation.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權訪問此對話",
          });
        }

        // 標記訊息為已讀
        await markMessagesAsRead(input.id, ctx.user.id);

        return conversation;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取對話",
        });
      }
    }),

  // 獲取對話訊息
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const conversation = await getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "對話不存在",
          });
        }

        // 驗證用戶是對話參與者
        if (conversation.buyerId !== ctx.user.id && conversation.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權訪問此對話",
          });
        }

        const messages = await getConversationMessages(input.conversationId);

        return messages.reverse(); // 返回時間順序正確的訊息
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch messages:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取訊息",
        });
      }
    }),

  // 發送訊息
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const conversation = await getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "對話不存在",
          });
        }

        // 驗證用戶是對話參與者
        if (conversation.buyerId !== ctx.user.id && conversation.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權發送訊息到此對話",
          });
        }

        const message = await sendMessage(
          input.conversationId,
          ctx.user.id,
          input.content
        );
        const messageId = message.id;

        return { messageId, success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to send message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法發送訊息",
        });
      }
    }),

  // 獲取未讀訊息數
  getUnreadCount: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const conversation = await getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "對話不存在",
          });
        }

        // 驗證用戶是對話參與者
        if (conversation.buyerId !== ctx.user.id && conversation.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權訪問此對話",
          });
        }

        const count = await getUnreadMessageCount(ctx.user.id);
        return { count };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch unread count:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取未讀訊息數",
        });
      }
    }),
});
