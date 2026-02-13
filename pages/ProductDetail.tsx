import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Product, ProductRecord } from '../types';
import { CURRENCY, CATEGORIES } from '../constants';
import Rating from '../components/Rating';
import { Edit2, Trash2, ShoppingBag, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      db.getProductById(id)
        .then(p => {
          setProduct(p);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <Layout title="Details" showBack><div className="p-8 text-center">Loading...</div></Layout>;
  if (!product) return <Layout title="Error" showBack><div className="p-8 text-center">Product not found</div></Layout>;

  const latest = product.records[0];
  const previous = product.records[1];
  const category = CATEGORIES.find(c => c.id === product.categoryId);

  // Price Trend
  let priceDiff = 0;
  if (previous) {
      priceDiff = latest.price - previous.price;
  }

  const handleDelete = async () => {
    if (window.confirm("Delete this product and all history?")) {
        try {
          await db.deleteProduct(product.id);
          navigate('/');
        } catch {
          // App-level auth handler will redirect when needed.
        }
    }
  };

  const chartData = [...product.records].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    price: r.price,
    rating: r.rating
  }));

  return (
    <Layout title={product.name} showBack>
      {/* Header Image */}
      <div className="w-full h-64 bg-gray-200 -mt-4 mb-4 relative">
        <img src={product.photo || "https://picsum.photos/400/300"} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-md text-xs backdrop-blur-md">
            {product.barcode}
        </div>
        <div className="absolute bottom-4 left-4">
            <span className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                {category?.icon} {category?.name}
            </span>
        </div>
      </div>

      {/* Main Info */}
      <div className="px-2 space-y-6">
        
        {/* Stats Row */}
        <div className="flex gap-4">
            <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-gray-500 text-xs mb-1">Current Rating</div>
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{latest.rating}</span>
                    <Rating value={latest.rating} size="sm" />
                </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-gray-500 text-xs mb-1">Current Price</div>
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{latest.price}{CURRENCY}</span>
                    {previous && (
                        <span className={`text-xs font-bold flex items-center ${priceDiff > 0 ? 'text-red-500' : priceDiff < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                            {priceDiff > 0 ? <ArrowUpRight className="w-3 h-3"/> : priceDiff < 0 ? <ArrowDownRight className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Action Button */}
        <Link 
            to={`/add/${product.id}`}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
            <ShoppingBag className="w-5 h-5" />
            I Bought This Again
        </Link>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-4">Price & Rating History</h3>
            <div className="h-48 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{fontSize: 10}} />
                        <YAxis yAxisId="left" domain={[0, 10]} stroke="#F59E0B" hide />
                        <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" tick={{fontSize: 10}} unit={CURRENCY} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={2} dot={{r: 3}} />
                        <Line yAxisId="right" type="stepAfter" dataKey="price" stroke="#3B82F6" strokeWidth={2} dot={{r: 3}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* History List */}
        <div>
            <h3 className="font-semibold mb-3">History ({product.records.length})</h3>
            <div className="space-y-3">
                {product.records.map((rec) => (
                    <div key={rec.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-start">
                        <div>
                            <div className="text-xs text-gray-400 mb-1">{new Date(rec.date).toLocaleDateString()}</div>
                            <div className="text-sm">{rec.notes || <span className="italic text-gray-300">No notes</span>}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold">{rec.price.toFixed(2)}{CURRENCY}</div>
                            <Rating value={rec.rating} size="sm" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Danger Zone */}
        <div className="pt-4 pb-8 flex justify-center gap-4">
            <button onClick={() => alert("Edit not implemented in demo")} className="text-gray-400 p-2 flex items-center gap-2 text-sm"><Edit2 className="w-4 h-4"/> Edit Product</button>
            <button onClick={handleDelete} className="text-red-500 p-2 flex items-center gap-2 text-sm"><Trash2 className="w-4 h-4"/> Delete Product</button>
        </div>

      </div>
    </Layout>
  );
}
