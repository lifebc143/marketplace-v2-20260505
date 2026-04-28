import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserProfile, updateUserProfile } from "../db";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  // Get current user's profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserProfile(ctx.user.id);
    return {
      user: ctx.user,
      profile: profile || null,
    };
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(500).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      } catch (error) {
        console.error("[Users] Update profile error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),
});
