import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { productsRouter } from "./routers/products";
import { usersRouter } from "./routers/users";
import { adminRouter } from "./routers/admin";
import { ordersRouter } from "./routers/orders";
import { reviewsRouter } from "./routers/reviews";
import { messagesRouter } from "./routers/messages";
import { notificationsRouter } from "./routers/notifications";
import { advertisingRouter } from "./routers/advertising";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Marketplace routers
  products: productsRouter,
  users: usersRouter,
  admin: adminRouter,
  orders: ordersRouter,
  reviews: reviewsRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  advertising: advertisingRouter,
});

export type AppRouter = typeof appRouter;
