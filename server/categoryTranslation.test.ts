import { describe, it, expect } from "vitest";
import {
  getCategoryDisplayName,
  getCategoryTranslationKey,
  categoryDisplayNameMapZh,
  categoryDisplayNameMapEn,
} from "../client/src/lib/categoryTranslation";

// Note: This test file imports from client code for testing purposes
// In a real project, category translation logic should be in shared code

describe("categoryTranslation", () => {
  describe("getCategoryDisplayName", () => {
    it("should return Chinese display name by default", () => {
      expect(getCategoryDisplayName("Electronics -電子產品")).toBe("電子產品");
      expect(getCategoryDisplayName("House Related 房屋用品")).toBe("家居");
      expect(getCategoryDisplayName("服飾")).toBe("服飾");
    });

    it("should return English display name when language is 'en'", () => {
      expect(getCategoryDisplayName("Electronics -電子產品", "en")).toBe(
        "Electronics"
      );
      expect(getCategoryDisplayName("House Related 房屋用品", "en")).toBe(
        "House Related"
      );
      expect(getCategoryDisplayName("服飾", "en")).toBe("Clothing");
    });

    it("should return original name if not found in mapping", () => {
      expect(getCategoryDisplayName("Unknown Category")).toBe("Unknown Category");
      expect(getCategoryDisplayName("Unknown Category", "en")).toBe(
        "Unknown Category"
      );
    });

    it("should handle all mapped Chinese categories", () => {
      const chineseCategories = [
        "Electronics -電子產品",
        "House Related 房屋用品",
        "服飾",
        "運動用品",
        "免費商品",
        "汽車類",
        "飾品",
        "房屋租賃",
      ];

      chineseCategories.forEach((category) => {
        const result = getCategoryDisplayName(category, "zh");
        expect(result).toBeTruthy();
        expect(result).not.toBe("Unknown");
      });
    });

    it("should handle all mapped English categories", () => {
      const englishCategories = [
        "Electronics -電子產品",
        "House Related 房屋用品",
        "服飾",
        "運動用品",
        "免費商品",
        "汽車類",
        "飾品",
        "房屋租賃",
      ];

      englishCategories.forEach((category) => {
        const result = getCategoryDisplayName(category, "en");
        expect(result).toBeTruthy();
        expect(result).not.toBe("Unknown");
      });
    });
  });

  describe("getCategoryTranslationKey", () => {
    it("should return Chinese display name by default", () => {
      expect(getCategoryTranslationKey("Electronics -電子產品")).toBe(
        "電子產品"
      );
      expect(getCategoryTranslationKey("運動用品")).toBe("運動用品");
    });

    it("should return English display name when language is 'en'", () => {
      expect(getCategoryTranslationKey("Electronics -電子產品", "en")).toBe(
        "Electronics"
      );
      expect(getCategoryTranslationKey("運動用品", "en")).toBe("Sports");
    });
  });

  describe("category mappings", () => {
    it("should have matching keys in both Chinese and English maps", () => {
      const zhKeys = Object.keys(categoryDisplayNameMapZh);
      const enKeys = Object.keys(categoryDisplayNameMapEn);

      // Both maps should have the same keys
      expect(zhKeys.sort()).toEqual(enKeys.sort());
    });

    it("should not have empty values in mappings", () => {
      Object.entries(categoryDisplayNameMapZh).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(value.length).toBeGreaterThan(0);
      });

      Object.entries(categoryDisplayNameMapEn).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it("should have at least the main categories", () => {
      const mainCategories = [
        "Electronics -電子產品",
        "House Related 房屋用品",
        "服飾",
        "運動用品",
      ];

      mainCategories.forEach((category) => {
        expect(categoryDisplayNameMapZh).toHaveProperty(category);
        expect(categoryDisplayNameMapEn).toHaveProperty(category);
      });
    });
  });

  describe("language switching", () => {
    it("should correctly switch between Chinese and English", () => {
      const testCategories = [
        "Electronics -電子產品",
        "House Related 房屋用品",
        "運動用品",
      ];

      testCategories.forEach((category) => {
        const zh = getCategoryDisplayName(category, "zh");
        const en = getCategoryDisplayName(category, "en");

        // Chinese and English should be different
        expect(zh).not.toBe(en);

        // Both should be non-empty
        expect(zh.length).toBeGreaterThan(0);
        expect(en.length).toBeGreaterThan(0);
      });
    });
  });
});
