import { eq, like, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, userProfiles, products, productImages, InsertUserProfile, InsertProduct, InsertProductImage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Category queries
 */
export async function getAllCategories() {
  const db = await getDb();
  if (!db) {
    // 返回硬編碼的分類列表作為臨時解決方案
    return [
      { id: 1, name: '電子產品', slug: 'electronics', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: '服飾', slug: 'clothing', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: '家具', slug: 'furniture', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: '交通工具', slug: 'vehicles', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: '書籍', slug: 'books', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: '運動器材', slug: 'sports', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: '美妝', slug: 'beauty', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: '玩具', slug: 'toys', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: '其他', slug: 'others', createdAt: new Date(), updatedAt: new Date() },
    ];
  }
  try {
    return await db.select().from(categories);
  } catch (error) {
    console.warn('[Database] Failed to fetch categories:', error);
    // 返回硬編碼的分類列表作為備用
    return [
      { id: 1, name: '電子產品', slug: 'electronics', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: '服飾', slug: 'clothing', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: '家具', slug: 'furniture', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: '交通工具', slug: 'vehicles', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: '書籍', slug: 'books', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: '運動器材', slug: 'sports', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: '美妝', slug: 'beauty', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: '玩具', slug: 'toys', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: '其他', slug: 'others', createdAt: new Date(), updatedAt: new Date() },
    ];
  }
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

/**
 * User Profile queries
 */
export async function getUserProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getUserProfileByUserId(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}

/**
 * Product queries
 */
export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId));
}

export async function getActiveProducts(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(eq(products.status, 'active'))
    .limit(limit)
    .offset(offset);
}

export async function searchProducts(searchTerm: string, categoryId?: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(products.status, 'active')];
  
  if (searchTerm) {
    conditions.push(
      or(
        like(products.title, `%${searchTerm}%`),
        like(products.description, `%${searchTerm}%`)
      )
    );
  }
  
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  
  const whereCondition = conditions.length === 1 ? conditions[0] : and(...(conditions as any[]));
  return db.select().from(products).where(whereCondition as any).limit(limit).offset(offset);
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(products).values(data);
  // Get the last inserted ID from the result
  const insertedId = (result as any).insertId || (result as any)[0];
  if (!insertedId) throw new Error('Failed to get inserted product ID');
  
  // Retrieve the newly inserted product
  const product = await db.select().from(products)
    .where(eq(products.id, insertedId))
    .limit(1);
  return product[0];
}

export async function updateProduct(productId: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(products).set(data).where(eq(products.id, productId));
}

/**
 * Product Image queries
 */
export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(productImages.displayOrder);
}

export async function addProductImage(data: InsertProductImage) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(productImages).values(data);
  return { success: true };
}


