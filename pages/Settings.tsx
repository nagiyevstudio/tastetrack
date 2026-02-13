import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Moon, Database, Server, Wifi, WifiOff, LogOut } from 'lucide-react';
import { db, isBackendAvailable } from '../services/db';
import { auth } from '../services/auth';

export default function Settings() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    isBackendAvailable().then(setIsOnline);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const logout = async () => {
    await auth.logout();
  };

  return (
    <Layout title="Settings">
        <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                <h3 className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-bold uppercase text-gray-500">Appearance</h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    <button onClick={toggleTheme} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                            <Moon className="w-5 h-5 text-gray-500" />
                            <span>Toggle Dark Mode</span>
                        </div>
                    </button>
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                <h3 className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-bold uppercase text-gray-500">Security</h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    <button onClick={logout} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5" />
                            <span>Log out</span>
                        </div>
                    </button>
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                <h3 className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-bold uppercase text-gray-500">Data & Backend</h3>
                
                {/* Status Indicator */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-3">
                        <Server className={`w-5 h-5 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="text-left">
                            <div className="text-sm font-medium">PHP Backend Status</div>
                            <div className="text-xs text-gray-400">
                                {isOnline ? 'Connected to MySQL' : 'Offline / Local Demo Mode'}
                            </div>
                        </div>
                     </div>
                     {isOnline ? <Wifi className="w-4 h-4 text-green-500"/> : <WifiOff className="w-4 h-4 text-gray-400"/>}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    <button onClick={() => { if(confirm('Reset local fallback data?')) db.nuke(); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5" />
                            <span>Reset Local Data</span>
                        </div>
                    </button>
                </div>
            </section>

             <div className="text-center text-xs text-gray-400 mt-10">
                <p>Taste Track v1.0.0 (PHP Edition)</p>
            </div>
        </div>
    </Layout>
  );
}
