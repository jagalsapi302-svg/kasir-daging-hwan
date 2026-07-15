import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, BarChart2, Beef, Award } from 'lucide-react';
import { Product, Transaction } from './types';
import { DB } from './db';
import KasirTab from './components/KasirTab';
import ProdukTab from './components/ProdukTab';
import RiwayatTab from './components/RiwayatTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'kasir' | 'produk' | 'riwayat'>('kasir');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Initial DB loading
  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = () => {
    setProducts(DB.getProducts());
    setTransactions(DB.getTransactions());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* HEADER SECTION - High-contrast Professional Polish Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-4 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-md shadow-red-900/20">
              🥩
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                Jagal Sapi Shofwan Hadi (H.Wan)
                <span className="text-red-500 font-light text-xs bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">POS v2.0</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Kasir Pasar Digital • Bojonegoro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Database Lokal Terhubung</span>
            </div>
            
            <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2.5 rounded-xl max-w-sm flex items-start gap-2.5">
              <Award className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-0.5">
                <h5 className="font-bold text-[11px] text-slate-200">Dinas Peternakan & Perikanan</h5>
                <p className="text-[9px] text-slate-400 leading-tight font-medium">
                  Kios daging binaan resmi Pemerintah Kabupaten Bojonegoro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PRIMARY TAB CONTENT CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-32">
        {activeTab === 'kasir' && (
          <KasirTab
            products={products}
            onRefreshProducts={refreshAllData}
          />
        )}
        
        {activeTab === 'produk' && (
          <ProdukTab
            products={products}
            onRefreshProducts={refreshAllData}
          />
        )}

        {activeTab === 'riwayat' && (
          <RiwayatTab
            transactions={transactions}
            onRefreshTransactions={refreshAllData}
          />
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR - Sleek, floating bar on mobile & wide styled bar on desktop */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 bg-white border border-slate-200/80 p-2 shadow-xl max-w-md mx-auto rounded-2xl">
        <div className="grid grid-cols-3 gap-1 text-center">
          
          {/* Tab 1: Kasir */}
          <button
            id="nav-tab-kasir"
            onClick={() => setActiveTab('kasir')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'kasir'
                ? 'text-red-600 font-bold bg-red-50'
                : 'text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-50'
            }`}
          >
            <ShoppingCart size={20} className={activeTab === 'kasir' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[11px] mt-1 font-bold tracking-wide">Kasir</span>
          </button>

          {/* Tab 2: Produk */}
          <button
            id="nav-tab-produk"
            onClick={() => setActiveTab('produk')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'produk'
                ? 'text-red-600 font-bold bg-red-50'
                : 'text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-50'
            }`}
          >
            <Package size={20} className={activeTab === 'produk' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[11px] mt-1 font-bold tracking-wide">Produk</span>
          </button>

          {/* Tab 3: Riwayat */}
          <button
            id="nav-tab-riwayat"
            onClick={() => setActiveTab('riwayat')}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'text-red-600 font-bold bg-red-50'
                : 'text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-50'
            }`}
          >
            <BarChart2 size={20} className={activeTab === 'riwayat' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[11px] mt-1 font-bold tracking-wide">Riwayat</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
