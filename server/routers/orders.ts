import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { and, or, eq } from "drizzle-orm";
import { createOrder, addOrderItem, getOrdersByBuyerId, getOrderById, getProductById, updateOrderStatus, getUserProfile, getDb } from "../db";
import { conversations, messages } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const ordersRouter = router({
  // 創建訂單
  create: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        recipientName: z.string().min(1),
        recipientPhone: z.string().min(1),
        recipientAddress: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 查詢商品信息以獲取賣家和價格
        const product = await getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "商品不存在",
          });
        }

        // 驗證商品狀態
        if (product.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "商品已不可購買",
          });
        }

        // 防止用戶購買自己的商品
        if (product.userId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "無法購買自己的商品",
          });
        }

        // 計算訂單總額
        const totalAmount = product.price * input.quantity;

        // 創建訂單
        const orderId = await createOrder({
          buyerId: ctx.user.id,
          sellerId: product.userId,
          status: "pending",
          totalAmount,
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          recipientAddress: input.recipientAddress,
          notes: input.notes || null,
        });

        // 添加訂單項目
        await addOrderItem({
          orderId,
          productId: input.productId,
          quantity: input.quantity,
          price: product.price,
        });

        return { orderId, status: "pending" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create order:", {
          error: error instanceof Error ? error.message : String(error),
          sqlMessage: (error as any)?.sqlMessage,
          code: (error as any)?.code,
          errno: (error as any)?.errno,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法創建訂單",
        });
      }
    }),

  // 獲取用戶的訂單列表（作為買家）
  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orders = await getOrdersByBuyerId(ctx.user.id);
      return orders;
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "無法獲取訂單列表",
      });
    }
  }),

  // 獲取單個訂單詳情
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const order = await getOrderById(input.id);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "訂單不存在",
          });
        }

        // 驗證用戶是買家或賣家
        if (order.buyerId !== ctx.user.id && order.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權訪問此訂單",
          });
        }

        return order;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法獲取訂單",
        });
      }
    }),

  // 取得賣家信息
  getSellerInfo: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "訂單不存在",
          });
        }

        // 驗證用戶是買家或賣家
        if (order.buyerId !== ctx.user.id && order.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權訪問此訂單信息",
          });
        }

        const sellerProfile = await getUserProfile(order.sellerId);
        return {
          sellerId: order.sellerId,
          phone: sellerProfile?.phone || "未提供",
          address: sellerProfile?.address || "未提供",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch seller info:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法取得賣家信息",
        });
      }
    }),

  // 聯絡賣家
  contactSeller: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "訂單不存在",
          });
        }

        // 只有買家可以聯絡賣家
        if (order.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "只有買家可以聯絡賣家",
          });
        }

        // 取得買家信息
        const buyerProfile = await getUserProfile(order.buyerId);
        if (!buyerProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "買家信息不存在",
          });
        }

        // 向賣家發送訊息（創建訊息或通知）
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          
          // 檢查是否已經有對話
          let conversation = await db.select().from(conversations)
            .where(
              and(
                or(
                  and(eq(conversations.buyerId, order.buyerId), eq(conversations.sellerId, order.sellerId)),
                  and(eq(conversations.buyerId, order.sellerId), eq(conversations.sellerId, order.buyerId))
                )
              )
            )
            .limit(1);
          
          let conversationId: number;
          if (conversation.length === 0) {
            // 創建新的對話
            const result = await db.insert(conversations).values({
              buyerId: order.buyerId,
              sellerId: order.sellerId,
              productId: order.id, // 使用 orderId 作為 productId
              lastMessageAt: new Date(),
            });
            conversationId = (result as any)?.insertId ?? (result as any)?.[0]?.insertId;
          } else {
            conversationId = conversation[0].id;
          }
          
          // 創建訊息
          await db.insert(messages).values({
            conversationId,
            senderId: order.buyerId,
            content: `你好，我對訂單 #${order.id} 感興趣。\n收件人: ${order.recipientName}\n收件电話: ${order.recipientPhone}\n收件地址: ${order.recipientAddress}${order.notes ? `\n備註: ${order.notes}` : ''}`,
            createdAt: new Date(),
          });
        } catch (messageError) {
          console.error("Failed to send seller message:", messageError);
        }

        // 返回買家信息供賣家聯絡
        return {
          success: true,
          message: "已向賣家發送你的聯絡信息",
          buyerInfo: {
            orderId: order.id,
            buyerPhone: buyerProfile?.phone || "未提供",
            recipientName: order.recipientName,
            recipientPhone: order.recipientPhone,
            recipientAddress: order.recipientAddress,
            notes: order.notes,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to contact seller:", {
          error: error instanceof Error ? error.message : String(error),
          sqlMessage: (error as any)?.sqlMessage,
          code: (error as any)?.code,
          errno: (error as any)?.errno,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法联絡賣家",
        });
      }
    }),

  // 確認訂單（買家確認收貨）
  confirm: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const order = await getOrderById(input.id);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "訂單不存在",
          });
        }

        // 只有買家可以確認訂單
        if (order.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "無權確認此訂單",
          });
        }

        // 只有待發貨或已發貨的訂單可以確認
        if (order.status !== "shipped" && order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "訂單狀態不允許確認",
          });
        }

        // 更新訂單狀態為已送達
        await updateOrderStatus(input.id, "delivered");
        
        return { success: true, status: "delivered" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to confirm order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "無法確認訂單",
        });
      }
    }),
});
