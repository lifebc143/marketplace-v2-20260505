/**
 * Category translation mapping utility
 * Maps category names from database to i18n translation keys
 */

// Map of category names (from database) to i18n translation keys
export const categoryToTranslationKeyMap: Record<string, string> = {
  // Electronics
  "Electronics -電子產品": "products.categories.electronics",
  "Electronics": "products.categories.electronics",
  "電子產品": "products.categories.electronics",
  
  // House Related
  "House Related 房屋用品": "products.categories.houseRelated",
  "House Related": "products.categories.houseRelated",
  "房屋用品": "products.categories.houseRelated",
  "家居": "products.categories.houseRelated",
  
  // Clothing
  "服飾": "products.categories.clothing",
  "Clothing": "products.categories.clothing",
  
  // Sports
  "運動用品": "products.categories.sports",
  "Sports": "products.categories.sports",
  
  // Free Items
  "免費商品": "products.categories.houseRental",
  "Free Items": "products.categories.houseRental",
  
  // Automotive
  "汽車類": "products.categories.automotive",
  "汽車相關": "products.categories.automotive",
  "Automotive": "products.categories.automotive",
  "機車": "products.categories.automotive",
  
  // Accessories
  "飾品": "products.categories.clothing",
  "Accessories": "products.categories.clothing",
  
  // Toys
  "玩具": "products.categories.toys",
  "Toys": "products.categories.toys",
  
  // Anime Figures
  "動漫公仔": "products.categories.animeFigures",
  "Anime Figures": "products.categories.animeFigures",
  
  // Machinery
  "機械": "products.categories.machinery",
  "Machinery": "products.categories.machinery",
  
  // Furniture
  "家具": "products.categories.furniture",
  "Furniture": "products.categories.furniture",
  
  // House Rental
  "房屋租賃": "products.categories.houseRental",
  "House Rental": "products.categories.houseRental",
  
  // Other
  "其他": "products.categories.other",
  "Other": "products.categories.other",
};

/**
 * Get translation key for a category name
 * @param categoryName - The category name from database
 * @returns The i18n translation key
 */
export function getCategoryTranslationKey(categoryName: string): string {
  return categoryToTranslationKeyMap[categoryName] || "products.categories.other";
}

/**
 * Get display name for a category based on current language
 * @param categoryName - The category name from database
 * @param language - The language code ('zh' or 'en')
 * @returns The display name
 */
export function getCategoryDisplayName(categoryName: string, language: string = 'zh'): string {
  // This function is deprecated - use getCategoryTranslationKey with i18n instead
  const key = getCategoryTranslationKey(categoryName);
  
  // Fallback display names
  const displayNamesZh: Record<string, string> = {
    "products.categories.electronics": "電子產品",
    "products.categories.clothing": "服飾",
    "products.categories.houseRelated": "家居",
    "products.categories.automotive": "汽車相關",
    "products.categories.machinery": "機械",
    "products.categories.sports": "運動用品",
    "products.categories.furniture": "家具",
    "products.categories.toys": "玩具",
    "products.categories.animeFigures": "動漫公仔",
    "products.categories.houseRental": "免費商品",
    "products.categories.other": "其他",
  };
  
  const displayNamesEn: Record<string, string> = {
    "products.categories.electronics": "Electronics",
    "products.categories.clothing": "Clothing",
    "products.categories.houseRelated": "House Related",
    "products.categories.automotive": "Automotive",
    "products.categories.machinery": "Machinery",
    "products.categories.sports": "Sports",
    "products.categories.furniture": "Furniture",
    "products.categories.toys": "Toys",
    "products.categories.animeFigures": "Anime Figures",
    "products.categories.houseRental": "Free Items",
    "products.categories.other": "Other",
  };
  
  const displayNames = language === 'en' ? displayNamesEn : displayNamesZh;
  return displayNames[key] || categoryName;
}

/**
 * Get all category translation keys
 * @returns Array of all translation keys
 */
export function getAllCategoryKeys(): string[] {
  return Object.values(categoryToTranslationKeyMap);
}
