/**
 * Category translation mapping utility
 * Maps category names to translation keys for i18n support
 */

export const categoryNameToKeyMap: Record<string, string> = {
  // Database category names - English with Chinese
  "Electronics -電子產品": "products.categories.electronics",
  "House Related 房屋用品": "products.categories.houseRelated",
  "運動用品": "products.categories.sports",
  "免費商品": "products.categories.houseRental",
  "房屋租賃": "products.categories.houseRental",
  "飾品": "products.categories.other",
  "分類廣告": "products.categories.other",
  "找工作": "products.categories.other",
  "相親-男女": "products.categories.other",
  "其他類別": "products.categories.other",
  "辦公用品": "products.categories.other",
  "寵物": "products.categories.other",
  "門禁設備": "products.categories.other",
  "汽車類": "products.categories.automotive",
  "機車": "products.categories.automotive",
  
  // Fallback Chinese names
  "電子產品": "products.categories.electronics",
  "服飾": "products.categories.clothing",
  "家居": "products.categories.houseRelated",
  
  // English names (fallback)
  "Electronics": "products.categories.electronics",
  "Clothing": "products.categories.clothing",
  "House Related": "products.categories.houseRelated",
};

/**
 * Get translation key for a category name
 * @param categoryName - The category name from database
 * @returns The i18n translation key
 */
export function getCategoryTranslationKey(categoryName: string): string {
  const key = categoryNameToKeyMap[categoryName];
  if (!key) {
    console.warn(`Category "${categoryName}" not found in translation map`);
  }
  return key || "products.categories.other";
}

/**
 * Get all category translation keys
 * @returns Array of all translation keys
 */
export function getAllCategoryKeys(): string[] {
  return Object.values(categoryNameToKeyMap);
}
