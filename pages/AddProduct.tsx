import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Scanner from '../components/Scanner';
import { db } from '../services/db';
import { CATEGORIES } from '../constants';
import { Camera, Check, Search } from 'lucide-react';
import { Product } from '../types';

export default function AddProduct() {
  const { productId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();
  
  // States
  const [step, setStep] = useState<'scan' | 'form' | 'existing_confirm'>('scan');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [price, setPrice] = useState('');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // For "Buy Again" flow
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);

  // If accessed via /add/:productId, we skip scanning
  useEffect(() => {
    if (productId) {
      db.getProductById(productId)
        .then(p => {
          if (p) {
            setExistingProduct(p);
            setBarcode(p.barcode);
            setName(p.name);
            setCategoryId(p.categoryId);
            setPhoto(p.photo || null);
            // Pre-fill last price/rating
            if (p.records.length > 0) {
              setPrice(p.records[0].price.toString());
              setRating(p.records[0].rating);
            }
            setStep('form');
          }
        })
        .catch(() => {
          // App-level auth handler will redirect when needed.
        });
    }
  }, [productId]);

  const handleScan = async (code: string) => {
    setIsScannerOpen(false);
    setLoading(true);
    setBarcode(code);
    
    try {
      const found = await db.getProductByBarcode(code);
      if (found) {
        setExistingProduct(found);
        setStep('existing_confirm');
      } else {
        setStep('form');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !price) return alert("Name and price are required");
    
    setLoading(true);
    
    try {
      if (existingProduct) {
          // Add record to existing
          await db.addRecord(existingProduct.id, {
              rating,
              price: parseFloat(price),
              notes
          });
          navigate(`/product/${existingProduct.id}`);
      } else {
          // Create new
          const newP = await db.createProduct({
              barcode,
              name,
              categoryId,
              photo: photo || undefined,
              createdAt: new Date().toISOString()
          }, {
              rating,
              price: parseFloat(price),
              notes,
              date: new Date().toISOString()
          });
          navigate(`/product/${newP.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isScannerOpen) {
    return <Scanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />;
  }

  // Confirm "Buy Again" screen
  if (step === 'existing_confirm' && existingProduct) {
      return (
        <Layout title="Product Found" showBack>
            <div className="p-6 flex flex-col items-center justify-center h-full space-y-6">
                <img src={existingProduct.photo} className="w-32 h-32 rounded-xl object-cover" alt="" />
                <div className="text-center">
                    <h2 className="text-xl font-bold">{existingProduct.name}</h2>
                    <p className="text-gray-500">{barcode}</p>
                </div>
                <button 
                    onClick={() => { setStep('form'); }}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold"
                >
                    Yes, I bought this again
                </button>
                <button onClick={() => setStep('form')} className="text-gray-500">
                    No, edit details manually
                </button>
            </div>
        </Layout>
      );
  }

  if (step === 'scan' && !productId) {
      return (
        <Layout title="Add Product" showBack>
            <div className="p-6 flex flex-col items-center justify-center h-[80vh] space-y-8">
                <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer shadow-inner hover:bg-gray-200 transition-colors" onClick={() => setIsScannerOpen(true)}>
                    <Camera className="w-16 h-16 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Scan Barcode</h2>
                    <p className="text-gray-500">Point your camera at the product package</p>
                </div>
                <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30"
                >
                    Open Scanner
                </button>
                <button onClick={() => setStep('form')} className="text-primary font-medium">
                    Enter Manually
                </button>
            </div>
        </Layout>
      );
  }

  // Form Step
  return (
    <Layout title={existingProduct ? "Buy Again" : "New Product"} showBack>
      <div className="space-y-6 pb-8">
        
        {/* Photo Upload (Simulated) */}
        <div className="flex justify-center">
            <div className="relative w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group">
                {photo ? (
                    <img src={photo} className="w-full h-full object-cover" alt="Product" />
                ) : (
                    <Camera className="text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white text-xs text-center p-2"
                    onClick={() => setPhoto(`https://picsum.photos/400/400?random=${Date.now()}`)}
                >
                    Tap to mock upload
                </div>
            </div>
        </div>

        {/* Basic Fields */}
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Barcode</label>
                <input 
                    type="text" 
                    value={barcode} 
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="E.g. 48200..."
                    disabled={!!existingProduct}
                    className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Product Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Product name"
                    disabled={!!existingProduct} // Usually name doesn't change on buy again, but let's lock it for simplicity or unlock if strict editing needed
                    className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-lg"
                />
            </div>

            {!existingProduct && (
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Category</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                        {CATEGORIES.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => setCategoryId(c.id)}
                                className={`p-2 rounded-xl min-h-[88px] flex flex-col items-center justify-center gap-1 text-center transition-colors ${categoryId === c.id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border border-gray-200'}`}
                            >
                                <span className="text-2xl leading-none">{c.icon}</span>
                                <span className="text-[11px] leading-tight text-gray-700">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Record Fields */}
        <div className="space-y-6">
            <div>
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Rating</label>
                    <span className={`font-bold ${rating >= 8 ? 'text-green-500' : rating >= 5 ? 'text-amber-500' : 'text-red-500'}`}>{rating}/10</span>
                </div>
                <input 
                    type="range" 
                    min="1" max="10" step="1" 
                    value={rating} 
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Terrible</span>
                    <span>Excellent</span>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price</label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 font-mono text-xl"
                    />
                    <span className="absolute right-4 top-3 text-gray-500 font-bold">₼</span>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Notes (Optional)</label>
                <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Where did you buy it? How did it taste?"
                    className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 h-24 resize-none"
                />
            </div>
        </div>

        <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
        >
            {loading ? "Saving..." : <><Check className="w-5 h-5" /> Save Record</>}
        </button>

      </div>
    </Layout>
  );
}
