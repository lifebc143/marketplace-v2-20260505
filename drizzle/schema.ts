import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, int, varchar, text, timestamp, foreignKey, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const categories = mysqlTable("categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("categories_name_unique").on(table.name),
	index("categories_slug_unique").on(table.slug),
]);

export const productImages = mysqlTable("productImages", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => products.id, { onDelete: "cascade" } ),
	imageUrl: varchar({ length: 500 }).notNull(),
	imageKey: varchar({ length: 500 }).notNull(),
	displayOrder: int().default(0).notNull(),
	isAiGenerated: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const products = mysqlTable("products", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	categoryId: int().notNull().references(() => categories.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	price: int().notNull(),
	status: mysqlEnum(['active','sold','removed','pending_review']).default('pending_review').notNull(),
	condition: mysqlEnum(['like_new','good','fair','poor']).default('good').notNull(),
	views: int().default(0).notNull(),
	isAiGenerated: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userProfiles = mysqlTable("userProfiles", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	bio: text(),
	avatar: varchar({ length: 500 }),
	phone: varchar({ length: 20 }),
	address: text(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userProfiles_userId_unique").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	buyerId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	sellerId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	productId: int().notNull().references(() => products.id, { onDelete: "cascade" } ),
	totalPrice: int().notNull(),
	status: mysqlEnum(['pending','completed','cancelled','disputed','delivered','shipped','confirmed']).default('pending').notNull(),
	shippingAddress: text(),
	trackingNumber: varchar({ length: 100 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull().references(() => orders.id, { onDelete: "cascade" } ),
	productId: int().notNull().references(() => products.id, { onDelete: "cascade" } ),
	quantity: int().notNull(),
	price: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const reviews = mysqlTable("reviews", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => products.id, { onDelete: "cascade" } ),
	buyerId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	sellerId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	rating: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	orderId: int().references(() => orders.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const reviewReplies = mysqlTable("reviewReplies", {
	id: int().autoincrement().notNull(),
	reviewId: int().notNull().references(() => reviews.id, { onDelete: "cascade" } ),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const conversations = mysqlTable("conversations", {
	id: int().autoincrement().notNull(),
	buyerId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	sellerId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	productId: int().references(() => products.id, { onDelete: "cascade" } ),
	orderId: int().references(() => orders.id, { onDelete: "set null" } ),
	lastMessageAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const messages = mysqlTable("messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	senderId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	isRead: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	relatedId: int(),
	isRead: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// Type exports for insert operations
export type InsertOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReviewReply = typeof reviewReplies.$inferInsert;
export type ReviewReply = typeof reviewReplies.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
