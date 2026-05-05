/**
 * Category translation mapping utility
 * Maps category names to display names for i18n support
 */

// Map of category names to their display names (supports both Chinese and English)
export const categoryDisplayNameMap: Record<string, string> = {
  // Electronics
  "Electronics -電子產品": "電子產品",
  "Electronics": "電子產品",
  
  // House Related
  "House Related 房屋用品": "家居",
  "House Related": "家居",
  "房屋用品": "家居",
  
  // Clothing
  "服飾": "服飾",
  "Clothing": "服飾",
  
  // Sports
  "運動用品": "運動用品",
  "Sports": "運動用品",
  
  // Free Items
  "免費商品": "免費商品",
  "Free Items": "免費商品",
  
  // Automotive
  "汽車類": "汽車相關",
  "汽車相關": "汽車相關",
  "Automotive": "汽車相關",
  "機車": "機車",
  
  // Accessories
  "飾品": "飾品",
  "Accessories": "飾品",
  
  // House Rental
  "房屋租賃": "房屋租賃",
  "House Rental": "房屋租賃",
  
  // Others - keep original names
  "分類廣告": "分類廣告",
  "找工作": "找工作",
  "相親-男女": "相親-男女",
  "其他類別": "其他類別",
  "辦公用品": "辦公用品",
  "寵物": "寵物",
  "門禁設備": "門禁設備",
};

/**
 * Get display name for a category
 * If no mapping exists, return the original name
 * @param categoryName - The category name from database
 * @returns The display name
 */
export function getCategoryDisplayName(categoryName: string): string {
  return categoryDisplayNameMap[categoryName] || categoryName;
}

/**
 * Get translation key for a category name (for backward compatibility)
 * @param categoryName - The category name from database
 * @returns The i18n translation key
 */
export function getCategoryTranslationKey(categoryName: string): string {
  // Return the display name directly - it will be shown as-is
  // This allows all categories to display properly without needing translation keys
  return getCategoryDisplayName(categoryName);
}

/**
 * Get all category translation keys
 * @returns Array of all translation keys
 */
export function getAllCategoryKeys(): string[] {
  return Object.values(categoryDisplayNameMap);
}
