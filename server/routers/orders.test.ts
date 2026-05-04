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


describe("Orders Router - Product Image Display", () => {
  describe("getOrderById - Product Image Inclusion", () => {
    it("should return order with product information including images", async () => {
      const mockOrder = {
        id: 1,
        buyerId: 123,
        sellerId: 456,
        productId: 789,
        totalPrice: 59900,
        status: "pending",
        recipientName: "John Doe",
        recipientPhone: "0987654321",
        recipientAddress: "123 Main St",
        trackingNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 789,
          userId: 456,
          title: "Airpods Pro",
          description: "Airpods Pro一代降噪版",
          price: 59900,
          categoryId: 1,
          status: "active",
          condition: "like_new",
          views: 100,
          isAiGenerated: 0,
          createdAt: new Date(),
          images: [
            {
              id: 1,
              productId: 789,
              imageUrl: "/manus-storage/airpods-pro-1.jpg",
              imageKey: "airpods-pro-1",
              displayOrder: 0,
              isAiGenerated: 0,
              createdAt: new Date(),
            },
          ],
        },
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getOrderById as any).mockResolvedValue(mockOrder);

      const caller = ordersRouter.createCaller(mockContext);
      const result = await caller.getById({ id: 1 });

      expect(result).toBeDefined();
      expect((result as any).product).toBeDefined();
      expect((result as any).product.images).toHaveLength(1);
      expect((result as any).product.images[0].imageUrl).toBe(
        "/manus-storage/airpods-pro-1.jpg"
      );
    });

    it("should return order with product that has multiple images", async () => {
      const mockOrder = {
        id: 2,
        buyerId: 123,
        sellerId: 456,
        productId: 790,
        totalPrice: 99900,
        status: "pending",
        recipientName: "Jane Doe",
        recipientPhone: "0987654322",
        recipientAddress: "456 Oak St",
        trackingNumber: null,
        notes: "Fragile - Handle with care",
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 790,
          userId: 456,
          title: "Camera Kit",
          description: "Professional camera kit with accessories",
          price: 99900,
          categoryId: 3,
          status: "active",
          condition: "like_new",
          views: 200,
          isAiGenerated: 0,
          createdAt: new Date(),
          images: [
            {
              id: 3,
              productId: 790,
              imageUrl: "/manus-storage/camera-1.jpg",
              imageKey: "camera-1",
              displayOrder: 0,
              isAiGenerated: 0,
              createdAt: new Date(),
            },
            {
              id: 4,
              productId: 790,
              imageUrl: "/manus-storage/camera-2.jpg",
              imageKey: "camera-2",
              displayOrder: 1,
              isAiGenerated: 0,
              createdAt: new Date(),
            },
          ],
        },
      };

      const mockContext = {
        user: { id: 123, email: "test@example.com", role: "user" as const },
        req: {} as any,
        res: {} as any,
      };

      (db.getOrderById as any).mockResolvedValue(mockOrder);

      const caller = ordersRouter.createCaller(mockContext);
      const result = await caller.getById({ id: 2 });

      expect((result as any).product.images).toHaveLength(2);
      expect((result as any).product.images[0].imageUrl).toBe(
        "/manus-storage/camera-1.jpg"
      );
      expect((result as any).product.images[1].imageUrl).toBe(
        "/manus-storage/camera-2.jpg"
      );
    });
  });

  describe("getMyOrders - Product Images Inclusion", () => {
    it("should return all orders with product images", async () => {
      const mockOrders = [
        {
          id: 1,
          buyerId: 123,
          sellerId: 456,
          productId: 789,
          totalPrice: 59900,
          status: "pending",
          recipientName: "John Doe",
          recipientPhone: "0987654321",
          recipientAddress: "123 Main St",
          trackingNumber: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 789,
            userId: 456,
            title: "Airpods Pro",
            description: "Airpods Pro一代降噪版",
            price: 59900,
            categoryId: 1,
            status: "active",
            condition: "like_new",
            views: 100,
            isAiGenerated: 0,
            createdAt: new Date(),
            images: [
              {
                id: 1,
                productId: 789,
                imageUrl: "/manus-storage/airpods-pro-1.jpg",
                imageKey: "airpods-pro-1",
                displayOrder: 0,
                isAiGenerated: 0,
                createdAt: new Date(),
              },
            ],
          },
        },
        {
          id: 2,
          buyerId: 123,
          sellerId: 789,
          productId: 790,
          totalPrice: 29900,
          status: "shipped",
          recipientName: "Jane Doe",
          recipientPhone: "0987654322",
          recipientAddress: "456 Oak St",
          trackingNumber: "TRACK123456",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 790,
            userId: 789,
            title: "Used Laptop",
            description: "Good condition laptop",
            price: 29900,
            categoryId: 2,
            status: "active",
            condition: "good",
            views: 50,
            isAiGenerated: 0,
            createdAt: new Date(),
            images: [
              {
                id: 2,
                productId: 790,
                imageUrl: "/manus-storage/laptop-1.jpg",
                imageKey: "laptop-1",
                displayOrder: 0,
                isAiGenerated: 0,
                createdAt: new Date(),
              },
            ],
          },
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

      expect(result).toHaveLength(2);
      expect((result as any)[0].product?.images?.[0].imageUrl).toBe(
        "/manus-storage/airpods-pro-1.jpg"
      );
      expect((result as any)[1].product?.images?.[0].imageUrl).toBe(
        "/manus-storage/laptop-1.jpg"
      );
    });
  });
});
