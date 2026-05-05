/**
 * Category translation mapping utility
 * Maps category names to display names for i18n support
 */

// Map of category names to their Chinese display names
export const categoryDisplayNameMapZh: Record<string, string> = {
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
  "香水": "香水",
  "男女服飾": "男女服飾",
};

// Map of category names to their English display names
export const categoryDisplayNameMapEn: Record<string, string> = {
  // Electronics
  "Electronics -電子產品": "Electronics",
  "Electronics": "Electronics",
  
  // House Related
  "House Related 房屋用品": "House Related",
  "House Related": "House Related",
  "房屋用品": "House Related",
  
  // Clothing
  "服飾": "Clothing",
  "Clothing": "Clothing",
  
  // Sports
  "運動用品": "Sports",
  "Sports": "Sports",
  
  // Free Items
  "免費商品": "Free Items",
  "Free Items": "Free Items",
  
  // Automotive
  "汽車類": "Automotive",
  "汽車相關": "Automotive",
  "Automotive": "Automotive",
  "機車": "Motorcycles",
  
  // Accessories
  "飾品": "Accessories",
  "Accessories": "Accessories",
  
  // House Rental
  "房屋租賃": "House Rental",
  "House Rental": "House Rental",
  
  // Others - keep original names in English
  "分類廣告": "Classified Ads",
  "找工作": "Jobs",
  "相親-男女": "Dating",
  "其他類別": "Other",
  "辦公用品": "Office Supplies",
  "寵物": "Pets",
  "門禁設備": "Access Control",
  "香水": "Perfume",
  "男女服飾": "Men & Women Fashion",
};

/**
 * Get display name for a category based on current language
 * @param categoryName - The category name from database
 * @param language - The language code ('zh' or 'en')
 * @returns The display name
 */
export function getCategoryDisplayName(categoryName: string, language: string = 'zh'): string {
  const map = language === 'en' ? categoryDisplayNameMapEn : categoryDisplayNameMapZh;
  return map[categoryName] || categoryName;
}

/**
 * Get translation key for a category name
 * @param categoryName - The category name from database
 * @param language - The language code ('zh' or 'en')
 * @returns The i18n translation key or display name
 */
export function getCategoryTranslationKey(categoryName: string, language: string = 'zh'): string {
  return getCategoryDisplayName(categoryName, language);
}

/**
 * Get all category translation keys
 * @returns Array of all translation keys
 */
export function getAllCategoryKeys(): string[] {
  return Object.values(categoryDisplayNameMapZh);
}
