export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface ProductRecord {
  id: string;
  productId: string;
  rating: number;
  price: number;
  notes?: string;
  date: string; // ISO string
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  categoryId: number;
  photo?: string;
  createdAt: string;
  records: ProductRecord[];
}

export type SortOption = 'rating_desc' | 'price_asc' | 'price_desc' | 'date_desc';

export interface DashboardStats {
  totalProducts: number;
  avgRating: number;
  avgPrice: number;
}
