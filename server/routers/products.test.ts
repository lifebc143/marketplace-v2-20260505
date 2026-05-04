import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "../db";

// Mock the database
vi.mock("../db");

describe("Products Router - Image Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProductsByUserId - Image URL Mapping", () => {
    it("should return products with correct imageUrl field", async () => {
      const userId = 123;
      const mockProducts = [
        {
          id: 1,
          userId,
          title: "Product 1",
          description: "Description 1",
          price: 10000,
          categoryId: 1,
          status: "active" as const,
          condition: "like_new" as const,
          views: 100,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
      ];

      const mockImages = [
        {
          id: 1,
          productId: 1,
          imageUrl: "/manus-storage/product-1-image-1.jpg",
          imageKey: "product-1-image-1",
          displayOrder: 0,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
      ];

      // Mock database functions
      vi.mocked(db.getProductsByUserId).mockResolvedValueOnce([
        {
          ...mockProducts[0],
          images: mockImages,
        },
      ]);

      // Call the function
      const result = await db.getProductsByUserId(userId);

      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].images).toHaveLength(1);
      expect(result[0].images[0]).toHaveProperty("imageUrl");
      expect(result[0].images[0].imageUrl).toBe(
        "/manus-storage/product-1-image-1.jpg"
      );
    });

    it("should handle products with multiple images", async () => {
      const userId = 456;
      const mockProduct = {
        id: 2,
        userId,
        title: "Multi-Image Product",
        description: "Product with multiple images",
        price: 20000,
        categoryId: 2,
        status: "active" as const,
        condition: "good" as const,
        views: 50,
        isAiGenerated: 0,
        createdAt: "2026-04-28T00:00:00Z",
      };

      const mockImages = [
        {
          id: 1,
          productId: 2,
          imageUrl: "/manus-storage/product-2-image-1.jpg",
          imageKey: "product-2-image-1",
          displayOrder: 0,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
        {
          id: 2,
          productId: 2,
          imageUrl: "/manus-storage/product-2-image-2.jpg",
          imageKey: "product-2-image-2",
          displayOrder: 1,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
        {
          id: 3,
          productId: 2,
          imageUrl: "/manus-storage/product-2-image-3.jpg",
          imageKey: "product-2-image-3",
          displayOrder: 2,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
      ];

      vi.mocked(db.getProductsByUserId).mockResolvedValueOnce([
        {
          ...mockProduct,
          images: mockImages,
        },
      ]);

      const result = await db.getProductsByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0].images).toHaveLength(3);
      expect(result[0].images[0].imageUrl).toBe(
        "/manus-storage/product-2-image-1.jpg"
      );
      expect(result[0].images[1].imageUrl).toBe(
        "/manus-storage/product-2-image-2.jpg"
      );
      expect(result[0].images[2].imageUrl).toBe(
        "/manus-storage/product-2-image-3.jpg"
      );
    });

    it("should handle products without images", async () => {
      const userId = 789;
      const mockProduct = {
        id: 3,
        userId,
        title: "No Image Product",
        description: "Product without images",
        price: 5000,
        categoryId: 3,
        status: "active" as const,
        condition: "fair" as const,
        views: 20,
        isAiGenerated: 0,
        createdAt: "2026-04-28T00:00:00Z",
      };

      vi.mocked(db.getProductsByUserId).mockResolvedValueOnce([
        {
          ...mockProduct,
          images: [],
        },
      ]);

      const result = await db.getProductsByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0].images).toHaveLength(0);
    });

    it("should return multiple products with correct image URLs", async () => {
      const userId = 999;
      const mockProducts = [
        {
          id: 4,
          userId,
          title: "Product 4",
          description: "Description 4",
          price: 15000,
          categoryId: 1,
          status: "active" as const,
          condition: "like_new" as const,
          views: 80,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
          images: [
            {
              id: 1,
              productId: 4,
              imageUrl: "/manus-storage/product-4-image-1.jpg",
              imageKey: "product-4-image-1",
              displayOrder: 0,
              isAiGenerated: 0,
              createdAt: "2026-04-28T00:00:00Z",
            },
          ],
        },
        {
          id: 5,
          userId,
          title: "Product 5",
          description: "Description 5",
          price: 25000,
          categoryId: 2,
          status: "sold" as const,
          condition: "good" as const,
          views: 120,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
          images: [
            {
              id: 2,
              productId: 5,
              imageUrl: "/manus-storage/product-5-image-1.jpg",
              imageKey: "product-5-image-1",
              displayOrder: 0,
              isAiGenerated: 0,
              createdAt: "2026-04-28T00:00:00Z",
            },
          ],
        },
      ];

      vi.mocked(db.getProductsByUserId).mockResolvedValueOnce(mockProducts);

      const result = await db.getProductsByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result[0].images[0].imageUrl).toBe(
        "/manus-storage/product-4-image-1.jpg"
      );
      expect(result[1].images[0].imageUrl).toBe(
        "/manus-storage/product-5-image-1.jpg"
      );
    });

    it("should preserve image display order", async () => {
      const userId = 111;
      const mockProduct = {
        id: 6,
        userId,
        title: "Ordered Images Product",
        description: "Product with ordered images",
        price: 30000,
        categoryId: 1,
        status: "active" as const,
        condition: "like_new" as const,
        views: 200,
        isAiGenerated: 0,
        createdAt: "2026-04-28T00:00:00Z",
      };

      const mockImages = [
        {
          id: 1,
          productId: 6,
          imageUrl: "/manus-storage/product-6-image-1.jpg",
          imageKey: "product-6-image-1",
          displayOrder: 0,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
        {
          id: 2,
          productId: 6,
          imageUrl: "/manus-storage/product-6-image-2.jpg",
          imageKey: "product-6-image-2",
          displayOrder: 1,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
      ];

      vi.mocked(db.getProductsByUserId).mockResolvedValueOnce([
        {
          ...mockProduct,
          images: mockImages,
        },
      ]);

      const result = await db.getProductsByUserId(userId);

      // Verify images are in correct order
      expect(result[0].images[0].displayOrder).toBe(0);
      expect(result[0].images[1].displayOrder).toBe(1);
      expect(result[0].images[0].imageUrl).toBe(
        "/manus-storage/product-6-image-1.jpg"
      );
      expect(result[0].images[1].imageUrl).toBe(
        "/manus-storage/product-6-image-2.jpg"
      );
    });
  });

  describe("getProductImages", () => {
    it("should return images with imageUrl field", async () => {
      const productId = 1;
      const mockImages = [
        {
          id: 1,
          productId,
          imageUrl: "/manus-storage/image-1.jpg",
          imageKey: "image-1",
          displayOrder: 0,
          isAiGenerated: 0,
          createdAt: "2026-04-28T00:00:00Z",
        },
      ];

      vi.mocked(db.getProductImages).mockResolvedValueOnce(mockImages);

      const result = await db.getProductImages(productId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("imageUrl");
      expect(result[0].imageUrl).toBe("/manus-storage/image-1.jpg");
    });

    it("should return empty array for product with no images", async () => {
      const productId = 999;

      vi.mocked(db.getProductImages).mockResolvedValueOnce([]);

      const result = await db.getProductImages(productId);

      expect(result).toHaveLength(0);
    });
  });
});
