import { eq, like, or, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, userProfiles, products, productImages, InsertUserProfile, InsertProduct, InsertProductImage, orders, orderItems, InsertOrder, InsertOrderItem } from "../drizzle/schema";
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
    // Return hardcoded categories as fallback
    return [
      { id: 1, name: "電子產品", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "服飾", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: "家具", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: "交通工具", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: "書籍", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: "運動器材", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: "美妝", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: "玩具", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: "其他", description: null, createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  try {
    return await db.select().from(categories);
  } catch {
    // Return hardcoded categories as fallback
    return [
      { id: 1, name: "電子產品", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "服飾", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: "家具", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: "交通工具", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: "書籍", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: "運動器材", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: "美妝", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: "玩具", description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: "其他", description: null, createdAt: new Date(), updatedAt: new Date() },
    ];
  }
}

export async function createCategory(name: string, description?: string | null) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Generate slug from name
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  const result = await db.insert(categories).values({
    name,
    slug,
    description: description || null,
  });
  
  const insertedId = (result as any)?.insertId;
  if (!insertedId) {
    const inserted = await db.select().from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    return inserted[0];
  }
  
  const category = await db.select().from(categories)
    .where(eq(categories.id, insertedId))
    .limit(1);
  return category[0];
}

export async function updateCategory(id: number, name?: string, description?: string | null) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updateData: any = {};
  if (name !== undefined) {
    updateData.name = name;
    // Generate slug from name
    updateData.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  if (description !== undefined) updateData.description = description;
  
  await db.update(categories).set(updateData).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(categories).where(eq(categories.id, id));
}

/**
 * Product queries
 */
export async function getActiveProducts(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const productList = await db.select().from(products)
    .where(eq(products.status, 'active'))
    .limit(limit)
    .offset(offset);
  
  // Get images for each product
  const productsWithImages = await Promise.all(
    productList.map(async (product) => {
      const images = await getProductImages(product.id);
      return { ...product, images };
    })
  );
  
  return productsWithImages;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const product = result[0];
  
  if (!product) return undefined;
  
  const images = await getProductImages(product.id);
  return { ...product, images };
}

export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products).where(eq(products.userId, userId));
}

export async function searchProducts(query: string, categoryId?: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(products.status, 'active')];
  
  if (query) {
    conditions.push(
      or(
        like(products.title, `%${query}%`),
        like(products.description, `%${query}%`)
      ) as any
    );
  }
  
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  
  const whereCondition = conditions.length === 1 ? conditions[0] : and(...(conditions as any[]));
  const productList = await db.select().from(products).where(whereCondition as any).limit(limit).offset(offset);
  
  // Get images for each product
  const productsWithImages = await Promise.all(
    productList.map(async (product) => {
      const images = await getProductImages(product.id);
      return { ...product, images };
    })
  );
  
  return productsWithImages;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  try {
    // Insert the product and get the result
    const result = await db.insert(products).values(data);
    
    // Extract the insert ID from the result
    // In MySQL/TiDB, the result contains insertId
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;
    
    if (!insertedId) {
      // If we can't get the ID from the result, query by the unique fields
      const inserted = await db.select().from(products)
        .where(eq(products.userId, data.userId))
        .orderBy(desc(products.createdAt))
        .limit(1);
      
      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted product');
      }
      return inserted[0];
    }
    
    // Retrieve the newly inserted product by ID
    const product = await db.select().from(products)
      .where(eq(products.id, insertedId))
      .limit(1);
    
    if (product.length === 0) {
      throw new Error('Failed to retrieve inserted product');
    }
    
    return product[0];
  } catch (error) {
    console.error('[DB] createProduct error:', error);
    throw error;
  }
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

/**
 * User Profile queries
 */
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existing = await getUserProfile(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
  }
}

/**
 * Admin queries
 */
export async function getAllUsers(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(users).limit(limit).offset(offset);
}

export async function getPendingProducts(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products)
    .where(eq(products.status, 'pending_review'))
    .limit(limit)
    .offset(offset);
}

export async function getStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0,
      activeProducts: 0,
      pendingReviewProducts: 0,
      totalCategories: 9,
    };
  }
  
  try {
    // Get total users count
    const userCount = await db.select().from(users);
    const totalUsers = userCount.length;
    
    // Get active products count
    const activeCount = await db.select().from(products)
      .where(eq(products.status, 'active'));
    const activeProducts = activeCount.length;
    
    // Get pending products count
    const pendingCount = await db.select().from(products)
      .where(eq(products.status, 'pending_review'));
    const pendingReviewProducts = pendingCount.length;
    
    // Get total categories count
    const categoryCount = await db.select().from(categories);
    const totalCategories = categoryCount.length;
    
    return {
      totalUsers,
      activeProducts,
      pendingReviewProducts,
      totalCategories,
    };
  } catch (error) {
    console.error('[DB] getStats error:', error);
    return {
      totalUsers: 0,
      activeProducts: 0,
      pendingReviewProducts: 0,
      totalCategories: 9,
    };
  }
}

export async function disableUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Update user role to 'disabled' or delete
  await db.update(users).set({ role: 'user' as any }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(users).where(eq(users.id, userId));
}

export async function approveProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(products).set({ status: 'active' }).where(eq(products.id, productId));
}

export async function rejectProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(products).set({ status: 'removed' }).where(eq(products.id, productId));
}

export async function deleteProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(products).where(eq(products.id, productId));
}


// ===== Orders =====

export async function createOrder(data: InsertOrder): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orders).values(data);
  return result[0].insertId;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orders).where(eq(orders.buyerId, buyerId));
}

export async function getOrdersBySellerId(sellerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orders).where(eq(orders.sellerId, sellerId));
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(orders).set({ status: status as any }).where(eq(orders.id, id));
}

// ===== Order Items =====

export async function addOrderItem(data: InsertOrderItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orderItems).values(data);
  return result[0].insertId;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}
