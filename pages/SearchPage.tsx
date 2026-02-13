import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Product } from '../types';
import { CURRENCY } from '../constants';
import { Search, X } from 'lucide-react';
import Rating from '../components/Rating';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
        try {
            if (query.length > 1) {
                const res = await db.searchProducts(query);
                setResults(res);
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Layout>
      <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 pt-2 pb-4 z-10">
        <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white dark:bg-gray-800 pl-10 pr-10 py-3 rounded-xl shadow-sm border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary outline-none"
            />
            {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-3.5 text-gray-400">
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      <div className="space-y-3">
        {results.map(p => (
             <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden">
                    <img src={p.photo} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.records[0].price}{CURRENCY}</div>
                </div>
                <Rating value={p.records[0].rating} size="sm" />
             </Link>
        ))}
        {query.length > 1 && results.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
                No products found
            </div>
        )}
      </div>
    </Layout>
  );
}
