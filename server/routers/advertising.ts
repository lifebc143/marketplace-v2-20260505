import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllNativeAds,
  getNativeAdById,
  createNativeAd,
  updateNativeAd,
  deleteNativeAd,
  recordAdImpression,
  recordAdClick,
  getAdStatistics,
  getTotalAdStats,
} from "../db";
import { storagePut } from "../storage";

export const advertisingRouter = router({
  // Banner routes
  banners: router({
    // Public: Get all active banners
    getAll: publicProcedure.query(async () => {
      return getAllBanners();
    }),

    // Public: Get single banner by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBannerById(input.id);
      }),

    // Admin: Create banner
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          imageUrl: z.string(),
          imageKey: z.string(),
          externalLink: z.string().url(),
          position: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        return createBanner({
          title: input.title,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          externalLink: input.externalLink,
          position: input.position,
          isActive: 1,
        });
      }),

    // Admin: Update banner
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          externalLink: z.string().url().optional(),
          position: z.number().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateBanner(id, data);
        return getBannerById(id);
      }),

    // Admin: Delete banner
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBanner(input.id);
        return { success: true };
      }),
  }),

  // Native Ads routes
  nativeAds: router({
    // Public: Get all active native ads
    getAll: publicProcedure.query(async () => {
      return getAllNativeAds();
    }),

    // Public: Get single native ad by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getNativeAdById(input.id);
      }),

    // Admin: Create native ad
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          imageUrl: z.string(),
          imageKey: z.string(),
          price: z.number().optional(),
          discount: z.string().optional(),
          externalLink: z.string().url(),
          label: z.string().default("贊助"),
          position: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        return createNativeAd({
          title: input.title,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          price: input.price,
          discount: input.discount,
          externalLink: input.externalLink,
          label: input.label,
          position: input.position,
          isActive: 1,
        });
      }),

    // Admin: Update native ad
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          price: z.number().optional(),
          discount: z.string().optional(),
          externalLink: z.string().url().optional(),
          label: z.string().optional(),
          position: z.number().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateNativeAd(id, data);
        return getNativeAdById(id);
      }),

    // Admin: Delete native ad
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNativeAd(input.id);
        return { success: true };
      }),
  }),

  // Analytics routes
  analytics: router({
    // Public: Record banner impression
    recordBannerImpression: publicProcedure
      .input(z.object({ bannerId: z.number() }))
      .mutation(async ({ input }) => {
        await recordAdImpression(input.bannerId, "banner");
        return { success: true };
      }),

    // Public: Record banner click
    recordBannerClick: publicProcedure
      .input(z.object({ bannerId: z.number() }))
      .mutation(async ({ input }) => {
        await recordAdClick(input.bannerId, "banner");
        return { success: true };
      }),

    // Public: Record native ad impression
    recordNativeAdImpression: publicProcedure
      .input(z.object({ adId: z.number() }))
      .mutation(async ({ input }) => {
        await recordAdImpression(input.adId, "native_ad");
        return { success: true };
      }),

    // Public: Record native ad click
    recordNativeAdClick: publicProcedure
      .input(z.object({ adId: z.number() }))
      .mutation(async ({ input }) => {
        await recordAdClick(input.adId, "native_ad");
        return { success: true };
      }),

    // Admin: Get banner statistics
    getBannerStats: adminProcedure
      .input(z.object({ bannerId: z.number() }))
      .query(async ({ input }) => {
        const daily = await getAdStatistics(input.bannerId, "banner");
        const total = await getTotalAdStats(input.bannerId, "banner");
        return { daily, total };
      }),

    // Admin: Get native ad statistics
    getNativeAdStats: adminProcedure
      .input(z.object({ adId: z.number() }))
      .query(async ({ input }) => {
        const daily = await getAdStatistics(input.adId, "native_ad");
        const total = await getTotalAdStats(input.adId, "native_ad");
        return { daily, total };
      }),
  }),
});
