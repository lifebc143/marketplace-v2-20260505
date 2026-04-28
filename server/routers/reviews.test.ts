import { describe, it, expect, beforeEach, vi } from "vitest";
import { reviewsRouter } from "./reviews";
import * as db from "../db";

// Mock database functions
vi.mock("../db", () => ({
  getReviewsByProductId: vi.fn(),
  getReviewById: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
  getAverageRating: vi.fn(),
  getReviewCount: vi.fn(),
  getOrderById: vi.fn(),
}));

describe("Reviews Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByProductId", () => {
    it("should fetch reviews with average rating and count", async () => {
      const mockReviews = [
        {
          id: 1,
          productId: 1,
          buyerId: 1,
          orderId: 1,
          rating: 5,
          title: "Great product",
          content: "Very satisfied",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getReviewsByProductId).mockResolvedValue(mockReviews);
      vi.mocked(db.getAverageRating).mockResolvedValue(4.5);
      vi.mocked(db.getReviewCount).mockResolvedValue(1);

      const caller = reviewsRouter.createCaller({
        user: { id: 1, role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getByProductId({
        productId: 1,
        limit: 10,
        offset: 0,
      });

      expect(result.reviews).toHaveLength(1);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalCount).toBe(1);
    });
  });

  describe("create", () => {
    it("should create a review successfully", async () => {
      const mockOrder = {
        id: 1,
        buyerId: 1,
        sellerId: 2,
        status: "shipped",
        totalAmount: 10000,
        recipientName: "John",
        recipientPhone: "123456",
        recipientAddress: "123 Main St",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getOrderById).mockResolvedValue(mockOrder);
      vi.mocked(db.getReviewsByProductId).mockResolvedValue([]);
      vi.mocked(db.createReview).mockResolvedValue({ insertId: 1 } as any);

      const caller = reviewsRouter.createCaller({
        user: { id: 1, role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.create({
        productId: 1,
        orderId: 1,
        rating: 5,
        title: "Great product",
        content: "Very satisfied with this purchase",
      });

      expect(result.success).toBe(true);
      expect(db.createReview).toHaveBeenCalled();
    });

    it("should prevent non-buyer from creating review", async () => {
      const mockOrder = {
        id: 1,
        buyerId: 2,
        sellerId: 3,
        status: "shipped",
        totalAmount: 10000,
        recipientName: "John",
        recipientPhone: "123456",
        recipientAddress: "123 Main St",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getOrderById).mockResolvedValue(mockOrder);

      const caller = reviewsRouter.createCaller({
        user: { id: 1, role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.create({
          productId: 1,
          orderId: 1,
          rating: 5,
          title: "Great product",
          content: "Very satisfied with this purchase",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("update", () => {
    it("should update review successfully", async () => {
      const mockReview = {
        id: 1,
        productId: 1,
        buyerId: 1,
        orderId: 1,
        rating: 5,
        title: "Great product",
        content: "Very satisfied",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getReviewById).mockResolvedValue(mockReview);
      vi.mocked(db.updateReview).mockResolvedValue(undefined);

      const caller = reviewsRouter.createCaller({
        user: { id: 1, role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.update({
        id: 1,
        rating: 4,
        title: "Good product",
      });

      expect(result.success).toBe(true);
      expect(db.updateReview).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete review successfully", async () => {
      const mockReview = {
        id: 1,
        productId: 1,
        buyerId: 1,
        orderId: 1,
        rating: 5,
        title: "Great product",
        content: "Very satisfied",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getReviewById).mockResolvedValue(mockReview);
      vi.mocked(db.deleteReview).mockResolvedValue(undefined);

      const caller = reviewsRouter.createCaller({
        user: { id: 1, role: "user" as const },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(db.deleteReview).toHaveBeenCalled();
    });
  });
});
