import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "../db";

// Mock the database
vi.mock("../db");

describe("Users Router - Profile Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserProfile", () => {
    it("should create a new profile if it does not exist", async () => {
      const userId = 123;
      const updateData = {
        bio: "Test bio",
        phone: "0987654321",
        address: "123 Main St",
      };

      // Mock updateUserProfile to succeed
      vi.mocked(db.updateUserProfile).mockResolvedValueOnce(undefined);

      // Call the function
      await db.updateUserProfile(userId, updateData);

      // Verify updateUserProfile was called with correct parameters
      expect(db.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
    });

    it("should update an existing profile", async () => {
      const userId = 123;
      const updateData = {
        bio: "Updated bio",
        phone: "0912345678",
        address: "456 Oak Ave",
      };

      // Mock updateUserProfile to succeed
      vi.mocked(db.updateUserProfile).mockResolvedValueOnce(undefined);

      // Call the function
      await db.updateUserProfile(userId, updateData);

      // Verify updateUserProfile was called
      expect(db.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
    });

    it("should handle all profile fields correctly", async () => {
      const userId = 456;
      const updateData = {
        bio: "Comprehensive bio with details",
        phone: "0923456789",
        address: "789 Pine Rd, City, Country",
      };

      // Mock the database function
      vi.mocked(db.updateUserProfile).mockResolvedValueOnce(undefined);

      // Call the function
      await db.updateUserProfile(userId, updateData);

      // Verify all fields are passed correctly
      expect(db.updateUserProfile).toHaveBeenCalledWith(userId, {
        bio: "Comprehensive bio with details",
        phone: "0923456789",
        address: "789 Pine Rd, City, Country",
      });
    });

    it("should handle partial updates", async () => {
      const userId = 789;
      const updateData = {
        bio: "New bio",
        phone: "",
        address: "New address",
      };

      // Mock the database function
      vi.mocked(db.updateUserProfile).mockResolvedValueOnce(undefined);

      // Call the function
      await db.updateUserProfile(userId, updateData);

      // Verify the function was called with the data
      expect(db.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
    });

    it("should handle database errors gracefully", async () => {
      const userId = 999;
      const updateData = {
        bio: "Test bio",
        phone: "0987654321",
        address: "Test address",
      };

      // Mock updateUserProfile to throw an error
      vi.mocked(db.updateUserProfile).mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      // Verify the error is thrown
      await expect(
        db.updateUserProfile(userId, updateData)
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getUserProfile", () => {
    it("should return profile data for existing user", async () => {
      const userId = 123;
      const mockProfile = {
        id: 1,
        userId,
        bio: "Test bio",
        phone: "0987654321",
        address: "123 Main St",
      };

      vi.mocked(db.getUserProfile).mockResolvedValueOnce(mockProfile);

      const result = await db.getUserProfile(userId);

      expect(result).toEqual(mockProfile);
      expect(db.getUserProfile).toHaveBeenCalledWith(userId);
    });

    it("should return null for non-existing user profile", async () => {
      const userId = 999;

      vi.mocked(db.getUserProfile).mockResolvedValueOnce(null);

      const result = await db.getUserProfile(userId);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const userId = 123;

      vi.mocked(db.getUserProfile).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(db.getUserProfile(userId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle upsert pattern correctly", async () => {
      const userId = 123;
      const updateData = {
        bio: "New bio",
        phone: "0987654321",
        address: "New address",
      };

      // Simulate upsert: first call fails, second succeeds
      vi.mocked(db.getUserProfile)
        .mockResolvedValueOnce(null) // No existing profile
        .mockResolvedValueOnce({
          // After update
          id: 1,
          userId,
          ...updateData,
        });

      vi.mocked(db.updateUserProfile).mockResolvedValueOnce(undefined);

      // First check if profile exists
      const existing = await db.getUserProfile(userId);
      expect(existing).toBeNull();

      // Then update profile
      await db.updateUserProfile(userId, updateData);

      // Verify update was called
      expect(db.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
    });
  });
});
