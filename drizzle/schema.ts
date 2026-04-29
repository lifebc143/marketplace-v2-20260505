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
