import { Product, ProductRecord } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { apiFetch, buildApiUrl, AuthRequiredError } from './api';

// --- Types for PHP API Response Mapping ---
// PHP returns snake_case, frontend uses camelCase
interface APIProduct {
  id: string;
  barcode: string;
  name: string;
  category_id: number;
  photo: string | null;
  created_at: string;
  records: APIRecord[];
}

interface APIRecord {
  id: string;
  product_id: string;
  rating: number;
  price: number;
  notes: string | null;
  record_date: string;
}

export const isBackendAvailable = async () => {
    try {
        const res = await fetch(buildApiUrl('check'), { credentials: 'include' });
        const json = await res.json();
        return json.status === 'ok';
    } catch (e) {
        return false;
    }
};

class DatabaseService {
  
  // --- Mappers ---
  private mapProduct(p: APIProduct): Product {
    return {
      id: String(p.id),
      barcode: p.barcode,
      name: p.name,
      categoryId: Number(p.category_id),
      photo: p.photo || undefined,
      createdAt: p.created_at,
      records: (p.records || [])
        .map(this.mapRecord)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }

  private mapRecord(r: APIRecord): ProductRecord {
    return {
      id: String(r.id),
      productId: String(r.product_id),
      rating: Number(r.rating),
      price: Number(r.price),
      notes: r.notes || undefined,
      date: r.record_date
    };
  }

  // --- API Methods ---

  async getAllProducts(): Promise<Product[]> {
    try {
      const res = await apiFetch('get_all_products');
      if (!res.ok) throw new Error('API Error');
      const data: APIProduct[] = await res.json();
      return data.map(p => this.mapProduct(p));
    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      console.warn("PHP API failed, using fallback logic", e);
      return this.fallbackGetAll();
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const res = await apiFetch('get_product', {}, { id });
      if (!res.ok) return undefined;
      const data: APIProduct = await res.json();
      if (!data) return undefined;
      return this.mapProduct(data);
    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      return this.fallbackGetById(id);
    }
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    try {
      const res = await apiFetch('get_product_by_barcode', {}, { barcode });
      if (!res.ok) return undefined;
      const data: APIProduct = await res.json();
      if (!data) return undefined;
      return this.mapProduct(data);
    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      return this.fallbackGetByBarcode(barcode);
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const res = await apiFetch('search', {}, { query });
      if (!res.ok) return [];
      const data: APIProduct[] = await res.json();
      return data.map(p => this.mapProduct(p));
    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      return this.fallbackSearch(query);
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'records'>, initialRecord: Omit<ProductRecord, 'id' | 'productId'>): Promise<Product> {
    try {
      const payload = {
        barcode: product.barcode,
        name: product.name,
        category_id: product.categoryId,
        photo: product.photo,
        rating: initialRecord.rating,
        price: initialRecord.price,
        notes: initialRecord.notes
      };

      const res = await apiFetch('create_product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create');
      const newProduct: APIProduct = await res.json();
      return this.mapProduct(newProduct);
    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      return this.fallbackCreate(product, initialRecord);
    }
  }

  async addRecord(productId: string, record: Omit<ProductRecord, 'id' | 'productId' | 'date'>): Promise<ProductRecord> {
    try {
      const payload = {
        product_id: productId,
        rating: record.rating,
        price: record.price,
        notes: record.notes
      };

      const res = await apiFetch('add_record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to add record');
      const newRecord: APIRecord = await res.json();
      return this.mapRecord(newRecord);

    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      return this.fallbackAddRecord(productId, record);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await apiFetch('delete_product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      if (e instanceof AuthRequiredError) throw e;
      return this.fallbackDelete(id);
    }
  }
  
  async nuke(): Promise<void> {
     // Cannot nuke SQL database from client easily/safely without auth
     if (confirm("This will only clear local fallback data. To clear the MySQL database, please use phpMyAdmin.")) {
        localStorage.removeItem('tastetrack_db_v1');
        window.location.reload();
     }
  }


  // --- Fallback (LocalStorage) Implementation ---
  // Works if PHP server is down or not configured
  private fallbackData: Product[] = [];
  constructor() {
    const stored = localStorage.getItem('tastetrack_db_v1');
    this.fallbackData = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  }
  private saveFallback() { localStorage.setItem('tastetrack_db_v1', JSON.stringify(this.fallbackData)); }
  
  private async fallbackGetAll() { return [...this.fallbackData]; }
  private async fallbackGetById(id: string) { return this.fallbackData.find(p => p.id === id); }
  private async fallbackGetByBarcode(code: string) { return this.fallbackData.find(p => p.barcode === code); }
  private async fallbackSearch(q: string) { return this.fallbackData.filter(p => p.name.toLowerCase().includes(q.toLowerCase())); }
  private async fallbackDelete(id: string) { 
      this.fallbackData = this.fallbackData.filter(p => p.id !== id); 
      this.saveFallback(); 
  }
  private async fallbackCreate(p: any, r: any): Promise<Product> {
      const newId = Date.now().toString();
      const newP: Product = { ...p, id: newId, records: [{...r, id: `${newId}_r`, productId: newId, date: new Date().toISOString()}] };
      this.fallbackData.unshift(newP);
      this.saveFallback();
      return newP;
  }
  private async fallbackAddRecord(pId: string, r: any): Promise<ProductRecord> {
      const p = this.fallbackData.find(x => x.id === pId);
      if(!p) throw new Error("Not found");
      const newR = { ...r, id: Date.now().toString(), productId: pId, date: new Date().toISOString() };
      p.records.unshift(newR);
      this.saveFallback();
      return newR;
  }
}

export const db = new DatabaseService();
