import { relations } from "drizzle-orm/relations";
import { products, productImages, users, categories, userProfiles } from "./schema";

export const productImagesRelations = relations(productImages, ({one}) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	productImages: many(productImages),
	user: one(users, {
		fields: [products.userId],
		references: [users.id]
	}),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	products: many(products),
	userProfiles: many(userProfiles),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const userProfilesRelations = relations(userProfiles, ({one}) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id]
	}),
}));