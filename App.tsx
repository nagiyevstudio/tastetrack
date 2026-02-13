import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { auth } from './services/auth';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AddProduct = lazy(() => import('./pages/AddProduct'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthed = await auth.status();
        setAuthenticated(isAuthed);
      } finally {
        setAuthChecked(true);
      }
    };

    const onAuthRequired = () => {
      setAuthenticated(false);
      setAuthChecked(true);
    };

    void checkAuth();
    window.addEventListener('auth:required', onAuthRequired);
    return () => window.removeEventListener('auth:required', onAuthRequired);
  }, []);

  if (!authChecked) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <HashRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        {authenticated ? (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/add" element={<AddProduct />} />
            <Route path="/add/:productId" element={<AddProduct />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:id" element={<CategoryPage />} />
          </Routes>
        ) : (
          <Login onSuccess={() => setAuthenticated(true)} />
        )}
      </Suspense>
    </HashRouter>
  );
}
