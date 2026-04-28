import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the database functions
vi.mock("../db", () => ({
  getOrCreateConversation: vi.fn(),
  getConversationById: vi.fn(),
  getUserConversations: vi.fn(),
  sendMessage: vi.fn(),
  getConversationMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
  getUnreadMessageCount: vi.fn(),
  getProductById: vi.fn(),
  getUserProfile: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@test.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("messages router", () => {
  const mockProduct = { id: 1, userId: 2, title: "Test Product", price: 100 };
  const mockConversation = {
    id: 1,
    buyerId: 1,
    sellerId: 2,
    productId: 1,
    orderId: null,
    lastMessageAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateConversation", () => {
    it("should create a new conversation", async () => {
      const { getOrCreateConversation: mockGetOrCreate, getProductById: mockGetProduct } = await import("../db");
      vi.mocked(mockGetProduct).mockResolvedValue(mockProduct as any);
      vi.mocked(mockGetOrCreate).mockResolvedValue(1);

      const ctx = createContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.messages.getOrCreateConversation({
        productId: 1,
        sellerId: 2,
      });

      expect(result).toEqual({ conversationId: 1 });
    });

    it("should reject if product not found", async () => {
      const { getProductById: mockGetProduct } = await import("../db");
      vi.mocked(mockGetProduct).mockResolvedValue(null);

      const ctx = createContext(1);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.messages.getOrCreateConversation({
          productId: 1,
          sellerId: 2,
        })
      ).rejects.toThrow("商品不存在");
    });

    it("should reject if user tries to message themselves", async () => {
      const { getProductById: mockGetProduct } = await import("../db");
      vi.mocked(mockGetProduct).mockResolvedValue({ ...mockProduct, userId: 1 } as any);

      const ctx = createContext(1);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.messages.getOrCreateConversation({
          productId: 1,
          sellerId: 1, // Same as user
        })
      ).rejects.toThrow("無法與自己對話");
    });
  });

  describe("getConversation", () => {
    it("should fetch conversation details", async () => {
      const { getConversationById: mockGetConv, markMessagesAsRead: mockMarkRead } = await import("../db");
      vi.mocked(mockGetConv).mockResolvedValue(mockConversation as any);
      vi.mocked(mockMarkRead).mockResolvedValue(undefined);

      const ctx = createContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.messages.getConversation({ id: 1 });

      expect(result).toEqual(mockConversation);
      expect(mockMarkRead).toHaveBeenCalledWith(1, 1);
    });

    it("should reject if user is not a participant", async () => {
      const { getConversationById: mockGetConv } = await import("../db");
      vi.mocked(mockGetConv).mockResolvedValue(mockConversation as any);

      const ctx = createContext(999);
      const caller = appRouter.createCaller(ctx);
      await expect(caller.messages.getConversation({ id: 1 })).rejects.toThrow("無權訪問此對話");
    });
  });

  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      const { getConversationById: mockGetConv, sendMessage: mockSend } = await import("../db");
      vi.mocked(mockGetConv).mockResolvedValue(mockConversation as any);
      vi.mocked(mockSend).mockResolvedValue(1);

      const ctx = createContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.messages.sendMessage({
        conversationId: 1,
        content: "Hello seller",
      });

      expect(result).toEqual({ messageId: 1, success: true });
      expect(mockSend).toHaveBeenCalledWith({
        conversationId: 1,
        senderId: 1,
        content: "Hello seller",
      });
    });

    it("should reject if user is not a participant", async () => {
      const { getConversationById: mockGetConv } = await import("../db");
      vi.mocked(mockGetConv).mockResolvedValue(mockConversation as any);

      const ctx = createContext(999);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.messages.sendMessage({
          conversationId: 1,
          content: "Hello",
        })
      ).rejects.toThrow("無權發送訊息到此對話");
    });
  });

  describe("getMessages", () => {
    it("should fetch conversation messages", async () => {
      const { getConversationById: mockGetConv, getConversationMessages: mockGetMsgs } = await import("../db");
      const mockMessages = [
        {
          id: 1,
          conversationId: 1,
          senderId: 2,
          content: "Hi buyer",
          isRead: 1,
          createdAt: new Date(),
        },
      ];
      vi.mocked(mockGetConv).mockResolvedValue(mockConversation as any);
      vi.mocked(mockGetMsgs).mockResolvedValue(mockMessages as any);

      const ctx = createContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.messages.getMessages({ conversationId: 1 });

      expect(result).toEqual(mockMessages);
    });
  });
});
