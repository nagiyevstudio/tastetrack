import React from 'react';
import { Home, Search, Plus, Settings, ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  // Made children optional to fix TS errors in consuming components where children might be inferred as missing
  children?: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function Layout({ children, title, showBack = false }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path ? 'text-primary' : 'text-gray-400';

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden relative">
      {/* Header */}
      {title && (
        <header className="flex items-center px-4 py-3 bg-white dark:bg-gray-800 shadow-sm z-10">
          {showBack && (
            <button onClick={() => navigate(-1)} className="mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-bold truncate flex-1">{title}</h1>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-20 p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 flex items-center justify-around z-20 px-2 pb-safe">
        <Link to="/" className={`flex flex-col items-center p-2 ${isActive('/')}`}>
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/search" className={`flex flex-col items-center p-2 ${isActive('/search')}`}>
          <Search className="w-6 h-6" />
          <span className="text-xs mt-1">Search</span>
        </Link>

        <div className="relative -top-5">
            <Link to="/add" className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-8 h-8" />
            </Link>
        </div>

        <button className="flex flex-col items-center p-2 text-gray-400 opacity-50 cursor-not-allowed">
           {/* Placeholder for future features or just balancing */}
           <span className="w-6 h-6 block" />
           <span className="text-xs mt-1">&nbsp;</span>
        </button>

        <Link to="/settings" className={`flex flex-col items-center p-2 ${isActive('/settings')}`}>
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </nav>
    </div>
  );
}