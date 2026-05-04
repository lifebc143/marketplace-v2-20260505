import { eq, or, and, like, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, userProfiles, products, productImages, InsertUserProfile, InsertProduct, InsertProductImage, orders, orderItems, InsertOrder, InsertOrderItem, reviews, InsertReview, Review, conversations, InsertConversation, Conversation, messages, InsertMessage, Message, notifications, InsertNotification, Notification } from "../drizzle/schema";
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
      { id: 3, name: "家居", description: null, createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  return db.select().from(categories);
}

/**
 * Product queries
 */
export async function getActiveProducts(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const productList = await db
    .select()
    .from(products)
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
  
  const userProducts = await db.select().from(products).where(eq(products.userId, userId));
  
  // Add images to each product
  const productsWithImages = await Promise.all(
    userProducts.map(async (product) => {
      const images = await getProductImages(product.id);
      return { ...product, images };
    })
  );
  
  return productsWithImages;
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
 * Increment product view count
 */
export async function incrementProductViews(productId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  try {
    await db.update(products)
      .set({ views: sql`views + 1` })
      .where(eq(products.id, productId));
  } catch (error) {
    console.error('[DB] incrementProductViews error:', error);
    // Don't throw - view count increment is not critical
  }
}

/**
 * Product Image queries
 */
export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.displayOrder);
}

export async function addProductImage(data: InsertProductImage) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  return db.insert(productImages).values(data);
}

/**
 * Order queries
 */
export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(orders).values(data);
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;

    if (!insertedId) {
      const inserted = await db.select().from(orders)
        .where(eq(orders.buyerId, data.buyerId))
        .orderBy(desc(orders.createdAt))
        .limit(1);

      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted order');
      }
      return inserted[0];
    }

    const order = await db.select().from(orders)
      .where(eq(orders.id, insertedId))
      .limit(1);

    if (order.length === 0) {
      throw new Error('Failed to retrieve inserted order');
    }

    return order[0];
  } catch (error) {
    console.error('[DB] createOrder error:', error);
    throw error;
  }
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return order[0];
}

export async function getOrdersByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).where(eq(orders.buyerId, buyerId));
}

export async function getOrdersBySellerId(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).where(eq(orders.sellerId, sellerId));
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(orders).set({ status: status as any }).where(eq(orders.id, orderId));
}

/**
 * Order Item queries
 */
export async function addOrderItem(data: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(orderItems).values(data);
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;

    if (!insertedId) {
      const inserted = await db.select().from(orderItems)
        .where(eq(orderItems.orderId, data.orderId))
        .orderBy(desc(orderItems.createdAt))
        .limit(1);

      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted order item');
      }
      return inserted[0];
    }

    const item = await db.select().from(orderItems)
      .where(eq(orderItems.id, insertedId))
      .limit(1);

    if (item.length === 0) {
      throw new Error('Failed to retrieve inserted order item');
    }

    return item[0];
  } catch (error) {
    console.error('[DB] addOrderItem error:', error);
    throw error;
  }
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/**
 * Review queries
 */
export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(reviews).values(data);
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;

    if (!insertedId) {
      const inserted = await db.select().from(reviews)
        .where(eq(reviews.buyerId, data.buyerId))
        .orderBy(desc(reviews.createdAt))
        .limit(1);

      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted review');
      }
      return inserted[0];
    }

    const review = await db.select().from(reviews)
      .where(eq(reviews.id, insertedId))
      .limit(1);

    if (review.length === 0) {
      throw new Error('Failed to retrieve inserted review');
    }

    return review[0];
  } catch (error) {
    console.error('[DB] createReview error:', error);
    throw error;
  }
}

export async function getReviewsByProductId(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews).where(eq(reviews.productId, productId));
}

export async function getReviewById(reviewId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const review = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return review[0];
}

export async function updateReview(reviewId: number, data: Partial<InsertReview>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(reviews).set(data).where(eq(reviews.id, reviewId));
}

export async function deleteReview(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(reviews).where(eq(reviews.id, reviewId));
}

export async function getAverageRating(productId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    avgRating: sql<number>`AVG(rating)`
  }).from(reviews).where(eq(reviews.productId, productId));

  return result[0]?.avgRating || 0;
}

/**
 * Conversation queries
 */
export async function createConversation(data: InsertConversation) {
    // 將 productId 為 0 的轉換為 NULL
    const normalizedData = {
      ...data,
      productId: (data.productId === 0 || data.productId === null) ? null : data.productId,
    };
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Check if conversation already exists
    const existing = await db.select().from(conversations)
      .where(
        and(
          eq(conversations.buyerId, data.buyerId),
          eq(conversations.sellerId, data.sellerId),
          eq(conversations.productId, data.productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(conversations).values(data);
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;

    if (!insertedId) {
      const inserted = await db.select().from(conversations)
        .where(
          and(
            eq(conversations.buyerId, data.buyerId),
            eq(conversations.sellerId, data.sellerId),
            eq(conversations.productId, data.productId)
          )
        )
        .limit(1);

      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted conversation');
      }
      return inserted[0];
    }

    const conversation = await db.select().from(conversations)
      .where(eq(conversations.id, insertedId))
      .limit(1);

    if (conversation.length === 0) {
      throw new Error('Failed to retrieve inserted conversation');
    }

    return conversation[0];
  } catch (error) {
    console.error('[DB] createConversation error:', error);
    throw error;
  }
}

export async function getConversationById(conversationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  return conversation[0];
}

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(conversations)
    .where(
      or(
        eq(conversations.buyerId, userId),
        eq(conversations.sellerId, userId)
      )
    );
}

/**
 * Message queries
 */
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(messages).values(data);
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;

    if (!insertedId) {
      const inserted = await db.select().from(messages)
        .where(eq(messages.conversationId, data.conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted message');
      }
      return inserted[0];
    }

    const message = await db.select().from(messages)
      .where(eq(messages.id, insertedId))
      .limit(1);

    if (message.length === 0) {
      throw new Error('Failed to retrieve inserted message');
    }

    return message[0];
  } catch (error) {
    console.error('[DB] createMessage error:', error);
    throw error;
  }
}

export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages).where(eq(messages.conversationId, conversationId));
}

export async function markMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(messages)
    .set({ isRead: 1 })
    .where(
      and(
        eq(messages.conversationId, conversationId)
      )
    );
}

/**
 * Notification queries
 */
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(notifications).values(data);
    const insertedId = (result as any)?.insertId || (result as any)?.[0]?.id;

    if (!insertedId) {
      const inserted = await db.select().from(notifications)
        .where(eq(notifications.userId, data.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(1);

      if (inserted.length === 0) {
        throw new Error('Failed to retrieve inserted notification');
      }
      return inserted[0];
    }

    const notification = await db.select().from(notifications)
      .where(eq(notifications.id, insertedId))
      .limit(1);

    if (notification.length === 0) {
      throw new Error('Failed to retrieve inserted notification');
    }

    return notification[0];
  } catch (error) {
    console.error('[DB] createNotification error:', error);
    throw error;
  }
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications).where(eq(notifications.userId, userId));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, notificationId));
}

/**
 * User Profile queries
 */
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return profile[0];
}

export async function updateUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if profile exists
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    // Update existing profile
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  } else {
    // Insert new profile if it doesn't exist
    await db.insert(userProfiles).values({
      userId,
      ...data,
    });
  }
}

/**
 * Additional notification queries
 */
export async function getUserNotifications(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, 0)
      )
    );

  return result[0]?.count || 0;
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.delete(notifications).where(eq(notifications.id, notificationId));
}

/**
 * Additional message queries
 */
export async function getOrCreateConversation(buyerId: number, sellerId: number, productId: number) {
  // This is already handled by createConversation
  return createConversation({ buyerId, sellerId, productId });
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(conversations)
    .where(
      or(
        eq(conversations.buyerId, userId),
        eq(conversations.sellerId, userId)
      )
    )
    .orderBy(desc(conversations.lastMessageAt));
}

export async function sendMessage(conversationId: number, senderId: number, content: string) {
  return createMessage({
    conversationId,
    senderId,
    content,
    isRead: 0,
  });
}

export async function getConversationMessages(conversationId: number) {
  return getMessagesByConversationId(conversationId);
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(messages)
    .where(
      eq(messages.isRead, 0)
    );

  return result[0]?.count || 0;
}
