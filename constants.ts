import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 1, name: "Dairy", icon: "🥛" },
  { id: 2, name: "Meat & Sausage", icon: "🥩" },
  { id: 3, name: "Seafood", icon: "🐟" },
  { id: 4, name: "Bakery", icon: "🍞" },
  { id: 5, name: "Fruits & Veg", icon: "🥗" },
  { id: 6, name: "Grains & Pasta", icon: "🌾" },
  { id: 7, name: "Sweets & Snacks", icon: "🍫" },
  { id: 8, name: "Drinks", icon: "🥤" },
  { id: 9, name: "Ready Meals", icon: "🍱" },
];

export const CURRENCY = "₼";

// Initial Seed Data for Demo Purposes
export const INITIAL_PRODUCTS = [
  {
    id: "1",
    barcode: "4760055123",
    name: "Premium Milk 3.2%",
    categoryId: 1,
    createdAt: new Date().toISOString(),
    photo: "https://picsum.photos/400/400?random=1",
    records: [
      { id: "r1", productId: "1", rating: 9, price: 2.50, date: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "Very fresh" },
      { id: "r2", productId: "1", rating: 8, price: 2.70, date: new Date().toISOString(), notes: "Price increased a bit" }
    ]
  },
  {
    id: "2",
    barcode: "4760055124",
    name: "Chocolate Bar Dark",
    categoryId: 7,
    createdAt: new Date().toISOString(),
    photo: "https://picsum.photos/400/400?random=2",
    records: [
      { id: "r3", productId: "2", rating: 4, price: 1.20, date: new Date().toISOString(), notes: "Too bitter today" }
    ]
  },
  {
    id: "3",
    barcode: "4760055125",
    name: "Fresh Salmon",
    categoryId: 3,
    createdAt: new Date().toISOString(),
    photo: "https://picsum.photos/400/400?random=3",
    records: [
      { id: "r4", productId: "3", rating: 10, price: 25.00, date: new Date().toISOString(), notes: "Excellent quality" }
    ]
  }
];