/**
 * Category translation mapping utility
 * Maps category names from database to i18n translation keys
 * Each database category name maps to a unique translation key
 */

// Map of category names (from database) to i18n translation keys
// IMPORTANT: Each database category should map to exactly ONE translation key to avoid duplicates
export const categoryToTranslationKeyMap: Record<string, string> = {
  // Electronics
  "電子產品": "products.categories.electronics",
  
  // House Related
  "房屋用品": "products.categories.houseRelated",
  
  // Clothing
  "男女服飾": "products.categories.clothing",
  "飾品": "products.categories.accessories",
  
  // Sports
  "運動用品": "products.categories.sports",
  
  // Free Items
  "免費商品": "products.categories.freeItems",
  
  // Automotive
  "汽車類": "products.categories.automotive",
  "機車": "products.categories.motorcycles",
  
  // Toys
  "玩具": "products.categories.toys",
  
  // Anime Figures
  "動漫公仔": "products.categories.animeFigures",
  
  // House Rental
  "房屋租賃": "products.categories.houseRental",
  
  // Pets
  "寵物": "products.categories.pets",
  
  // Office Supplies
  "辦公用品": "products.categories.officeSupplies",
  
  // Perfume
  "香水": "products.categories.perfume",
  
  // Security Equipment
  "門禁設備": "products.categories.securityEquipment",
  
  // Classified Ads
  "分類廣告": "products.categories.classifiedAds",
  
  // Jobs
  "找工作": "products.categories.jobs",
  
  // Dating
  "相親-男女": "products.categories.dating",
  
  // Other
  "其他類別": "products.categories.other",
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
    "products.categories.clothing": "男女服飾",
    "products.categories.accessories": "飾品",
    "products.categories.houseRelated": "房屋用品",
    "products.categories.automotive": "汽車類",
    "products.categories.motorcycles": "機車",
    "products.categories.machinery": "機械",
    "products.categories.sports": "運動用品",
    "products.categories.furniture": "家具",
    "products.categories.toys": "玩具",
    "products.categories.animeFigures": "動漫公仔",
    "products.categories.freeItems": "免費商品",
    "products.categories.houseRental": "房屋租賃",
    "products.categories.pets": "寵物",
    "products.categories.officeSupplies": "辦公用品",
    "products.categories.perfume": "香水",
    "products.categories.securityEquipment": "門禁設備",
    "products.categories.classifiedAds": "分類廣告",
    "products.categories.jobs": "找工作",
    "products.categories.dating": "相親-男女",
    "products.categories.other": "其他",
  };
  
  const displayNamesEn: Record<string, string> = {
    "products.categories.electronics": "Electronics",
    "products.categories.clothing": "Clothing",
    "products.categories.accessories": "Accessories",
    "products.categories.houseRelated": "House Related",
    "products.categories.automotive": "Automotive",
    "products.categories.motorcycles": "Motorcycles",
    "products.categories.machinery": "Machinery",
    "products.categories.sports": "Sports",
    "products.categories.furniture": "Furniture",
    "products.categories.toys": "Toys",
    "products.categories.animeFigures": "Anime Figures",
    "products.categories.freeItems": "Free Items",
    "products.categories.houseRental": "House Rental",
    "products.categories.pets": "Pets",
    "products.categories.officeSupplies": "Office Supplies",
    "products.categories.perfume": "Perfume",
    "products.categories.securityEquipment": "Security Equipment",
    "products.categories.classifiedAds": "Classified Ads",
    "products.categories.jobs": "Jobs",
    "products.categories.dating": "Dating",
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
