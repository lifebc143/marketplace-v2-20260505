import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";

export const uploadRouter = router({
  // Upload image endpoint
  image: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        type: z.enum(['banner', 'native-ad']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Determine content type
        const contentType = input.fileName.toLowerCase().endsWith('.png') 
          ? 'image/png' 
          : 'image/jpeg';
        
        // Generate unique key based on type
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileKey = `${input.type}/${timestamp}-${randomStr}-${input.fileName}`;
        
        // Upload to S3
        const { url, key } = await storagePut(fileKey, buffer, contentType);
        
        return {
          success: true,
          url,
          key,
        };
      } catch (error) {
        console.error('[Upload] Error:', error);
        throw new Error('Image upload failed');
      }
    }),
});
