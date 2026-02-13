import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Product } from '../types';
import { CATEGORIES, CURRENCY } from '../constants';
import Rating from '../components/Rating';
import { Filter } from 'lucide-react';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES.find(c => c.id === Number(id));

  useEffect(() => {
    const load = async () => {
        try {
            const all = await db.getAllProducts();
            setProducts(all.filter(p => p.categoryId === Number(id)));
        } finally {
            setLoading(false);
        }
    };
    void load();
  }, [id]);

  if (!category) return <div>Category not found</div>;

  return (
    <Layout title={`${category.icon} ${category.name}`} showBack>
      {loading ? (
        <div className="text-center p-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
            <div className="text-6xl mb-4 grayscale opacity-30">{category.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No products yet</h3>
            <p className="text-gray-500 mt-2 mb-6">Start tracking prices and tastes for this category.</p>
            <Link to="/add" className="bg-primary/10 text-primary px-6 py-2 rounded-full font-semibold">
                Add first product
            </Link>
        </div>
      ) : (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <span className="text-sm text-gray-500">{products.length} Items</span>
                <button className="flex items-center gap-1 text-sm text-primary">
                    <Filter className="w-4 h-4" /> Filter
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {products.map(p => {
                    const record = p.records[0];
                    return (
                        <Link key={p.id} to={`/product/${p.id}`} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-3">
                             <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={p.photo} alt="" className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="font-medium line-clamp-1">{p.name}</h4>
                                    <div className="text-xs text-gray-400">{new Date(record.date).toLocaleDateString()}</div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-lg">{record.price.toFixed(2)}{CURRENCY}</span>
                                    <Rating value={record.rating} size="sm" showValue />
                                </div>
                             </div>
                        </Link>
                    )
                })}
            </div>
        </div>
      )}
    </Layout>
  );
}
