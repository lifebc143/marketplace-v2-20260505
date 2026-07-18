export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  imageKey: string;
  displayOrder: number;
  isAiGenerated: number;
  createdAt: string;
}

export interface Product {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  description: string | null;
  price: number;
  status: 'active' | 'sold' | 'removed' | 'pending_review';
  condition: 'like_new' | 'good' | 'fair' | 'poor';
  views: number;
  isAiGenerated: number;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
}
