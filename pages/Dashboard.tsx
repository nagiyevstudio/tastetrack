import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { CATEGORIES, CURRENCY } from '../constants';
import { db } from '../services/db';
import { Product } from '../types';
import Rating from '../components/Rating';
import { ChevronRight, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await db.getAllProducts();
        setProducts(data);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const getLatestRecord = (p: Product) => p.records[0];

  const topRated = [...products]
    .sort((a, b) => getLatestRecord(b).rating - getLatestRecord(a).rating)
    .slice(0, 5);

  const recent = [...products]
    .sort((a, b) => new Date(b.records[0].date).getTime() - new Date(a.records[0].date).getTime())
    .slice(0, 5);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold">Good Morning!</h2>
            <p className="text-gray-500 text-sm">What did you eat today?</p>
          </div>
          <div className="text-right">
             <div className="text-xs text-gray-400">Total Products</div>
             <div className="text-xl font-bold">{products.length}</div>
          </div>
        </div>

        {/* Categories Grid */}
        <section>
          <h3 className="font-semibold mb-3 text-lg">Categories</h3>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.id}`}
                className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform"
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-medium text-center line-clamp-1">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Rated Horizontal Scroll */}
        <section>
          <div className="flex items-center justify-between mb-3">
             <h3 className="font-semibold text-lg flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-primary" /> Top Rated
             </h3>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {topRated.map(p => {
              const record = getLatestRecord(p);
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="h-32 bg-gray-200 w-full relative">
                    {p.photo && <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />}
                    <div className="absolute bottom-2 right-2">
                        <Rating value={record.rating} showValue size="sm" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate">{p.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{record.price.toFixed(2)}{CURRENCY}</p>
                  </div>
                </Link>
              );
            })}
            {topRated.length === 0 && <div className="text-gray-400 text-sm">No ratings yet</div>}
          </div>
        </section>

        {/* Recent List */}
        <section>
          <h3 className="font-semibold mb-3 text-lg">Recently Added</h3>
          <div className="space-y-3">
            {recent.map(p => {
              const record = getLatestRecord(p);
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {p.photo && <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{p.name}</h4>
                    <p className="text-xs text-gray-400">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{record.price.toFixed(2)}{CURRENCY}</div>
                    <Rating value={record.rating} size="sm" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
