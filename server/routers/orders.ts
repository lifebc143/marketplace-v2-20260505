import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createOrder, addOrderItem, getOrdersByBuyerId, getOrderById, getProductById, updateOrderStatus } from "../db";
import { TRPCError } from "@trpc/server";

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
        console.error("Failed to create order:", error);
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
