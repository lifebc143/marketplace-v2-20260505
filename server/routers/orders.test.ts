import { describe, it, expect, vi, beforeEach } from "vitest";
import { ordersRouter } from "./orders";
import * as db from "../db";

// Mock the db module
vi.mock("../db", () => ({
  createOrder: vi.fn(),
  addOrderItem: vi.fn(),
  getOrdersByBuyerId: vi.fn(),
  getOrderById: vi.fn(),
  getProductById: vi.fn(),
}));

describe("Orders Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create an order with valid input", async () => {
      const mockOrderId = 1;
      const mockProduct = {
        id: 456,
        userId: 789,
        title: "Test Product",
        price: 10000,
        status: "active",
        description: "Test",
        condition: "new",
        categoryId: 1,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      // Mock the database functions
      (db.getProductById as any).mockResolvedValue(mockProduct);
      (db.createOrder as any).mockResolvedValue({ id: mockOrderId, status: "pending" });
      (db.addOrderItem as any).mockResolvedValue(1);

      const caller = ordersRouter.createCaller(mockContext);

      const result = await caller.create({
        productId: 456,
        quantity: 1,
        recipientName: "John Doe",
        recipientPhone: "123-456-7890",
        recipientAddress: "123 Main St, City, Country",
        notes: "Please deliver after 3pm",
      });

      expect(result).toEqual({
        orderId: mockOrderId,
        status: "pending",
      });

      expect(db.getProductById).toHaveBeenCalledWith(456);

      expect(db.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerId: 123,
          sellerId: 789,
          productId: 456,
          status: "pending",
          totalPrice: 10000,
          shippingAddress: expect.stringContaining("John Doe"),
        })
      );

      expect(db.addOrderItem).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: mockOrderId,
          productId: 456,
          quantity: 1,
          price: 10000,
        })
      );
    });

    it("should fail if product does not exist", async () => {
      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getProductById as any).mockResolvedValue(null);

      const caller = ordersRouter.createCaller(mockContext);

      await expect(
        caller.create({
          productId: 999,
          quantity: 1,
          recipientName: "John Doe",
          recipientPhone: "123-456-7890",
          recipientAddress: "123 Main St, City, Country",
        })
      ).rejects.toThrow("商品不存在");
    });

    it("should fail if product is not active", async () => {
      const mockProduct = {
        id: 456,
        userId: 789,
        title: "Test Product",
        price: 10000,
        status: "sold",
        description: "Test",
        condition: "new",
        categoryId: 1,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getProductById as any).mockResolvedValue(mockProduct);

      const caller = ordersRouter.createCaller(mockContext);

      await expect(
        caller.create({
          productId: 456,
          quantity: 1,
          recipientName: "John Doe",
          recipientPhone: "123-456-7890",
          recipientAddress: "123 Main St, City, Country",
        })
      ).rejects.toThrow("商品已不可購買");
    });

    it("should fail if user tries to buy their own product", async () => {
      const mockProduct = {
        id: 456,
        userId: 123,
        title: "Test Product",
        price: 10000,
        status: "active",
        description: "Test",
        condition: "new",
        categoryId: 1,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getProductById as any).mockResolvedValue(mockProduct);

      const caller = ordersRouter.createCaller(mockContext);

      await expect(
        caller.create({
          productId: 456,
          quantity: 1,
          recipientName: "John Doe",
          recipientPhone: "123-456-7890",
          recipientAddress: "123 Main St, City, Country",
        })
      ).rejects.toThrow("無法購買自己的商品");
    });
  });

  describe("getMyOrders", () => {
    it("should return user's orders", async () => {
      const mockOrders = [
        {
          id: 1,
          buyerId: 123,
          sellerId: 456,
          status: "pending",
          totalAmount: 10000,
          recipientName: "John Doe",
          recipientPhone: "123-456-7890",
          recipientAddress: "123 Main St",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getOrdersByBuyerId as any).mockResolvedValue(mockOrders);

      const caller = ordersRouter.createCaller(mockContext);
      const result = await caller.getMyOrders();

      expect(result).toEqual(mockOrders);
      expect(db.getOrdersByBuyerId).toHaveBeenCalledWith(123);
    });
  });

  describe("getById", () => {
    it("should return order if user is buyer", async () => {
      const mockOrder = {
        id: 1,
        buyerId: 123,
        sellerId: 456,
        status: "pending",
        totalAmount: 10000,
        recipientName: "John Doe",
        recipientPhone: "123-456-7890",
        recipientAddress: "123 Main St",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getOrderById as any).mockResolvedValue(mockOrder);

      const caller = ordersRouter.createCaller(mockContext);
      const result = await caller.getById({ id: 1 });

      expect(result).toEqual(mockOrder);
      expect(db.getOrderById).toHaveBeenCalledWith(1);
    });

    it("should throw error if user is not buyer or seller", async () => {
      const mockOrder = {
        id: 1,
        buyerId: 999,
        sellerId: 888,
        status: "pending",
        totalAmount: 10000,
        recipientName: "John Doe",
        recipientPhone: "123-456-7890",
        recipientAddress: "123 Main St",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getOrderById as any).mockResolvedValue(mockOrder);

      const caller = ordersRouter.createCaller(mockContext);

      await expect(caller.getById({ id: 1 })).rejects.toThrow("無權訪問此訂單");
    });
  });
});
