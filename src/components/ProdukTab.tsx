import React, { useState } from 'react';
import { Plus, Edit, Trash2, RotateCcw, Save, Check, X, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { DB } from '../db';

interface ProdukTabProps {
  products: Product[];
  onRefreshProducts: () => void;
}

// Popular Meat-related emojis
const EMOJI_PRESETS = [
  '🥩', '🍗', '🍖', '🦴', '🐐', '🐓', '🐟', '🦐', '🦀', '🍔', '🌭', '🥓', '🍳', '🧂', '🔪', '🦆', '🐮', '🐷'
];

export default function ProdukTab({ products, onRefreshProducts }: ProdukTabProps) {
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pricePerKg, setPricePerKg] = useState<number | ''>('');
  const [selectedEmoji, setSelectedEmoji] = useState('🥩');

  // Helpers
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleEditClick = (product: Product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setName(product.name);
    setPricePerKg(product.pricePerKg);
    setSelectedEmoji(product.emoji);
    
    // Scroll form into view if on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setPricePerKg('');
    setSelectedEmoji('🥩');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pricePerKg === '') return;

    const priceNum = Number(pricePerKg);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Harga harus berupa angka positif!');
      return;
    }

    if (isEditing && editingId) {
      DB.updateProduct(editingId, {
        name: name.trim(),
        pricePerKg: priceNum,
        emoji: selectedEmoji,
      });
      alert('Produk berhasil diperbarui!');
    } else {
      DB.addProduct({
        name: name.trim(),
        pricePerKg: priceNum,
        emoji: selectedEmoji,
      });
      alert('Produk baru berhasil ditambahkan!');
    }

    handleCancel();
    onRefreshProducts();
  };

  const handleDeleteClick = (id: string, productName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"? Transaksi yang sudah ada tidak akan terpengaruh.`)) {
      DB.deleteProduct(id);
      onRefreshProducts();
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan daftar produk standar Dinas Peternakan Bojonegoro? Produk custom Anda akan terhapus.')) {
      DB.resetProductsToDefault();
      onRefreshProducts();
      handleCancel();
    }
  };

  return (
    <div id="produk-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-10rem)]">
      
      {/* LEFT: Product Editor Form (col-span-4 / 5) */}
      <div id="product-form-section" className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-2">
              <span className="bg-red-50 text-red-600 p-2 rounded-xl text-sm border border-red-200/50">🥩</span>
              {isEditing ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h3>
            {isEditing && (
              <button
                id="cancel-edit-btn"
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg"
                title="Batal Edit"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 font-bold uppercase tracking-wider">
                Nama Barang / Jenis Daging
              </label>
              <input
                id="product-name-form"
                type="text"
                placeholder="Contoh: Daging Sirloin Premium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-red-600 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600/10"
                required
              />
            </div>

            {/* Price input */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 font-bold uppercase tracking-wider">
                Harga per kilogram (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <input
                  id="product-price-form"
                  type="number"
                  placeholder="Contoh: 130000"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-red-600 rounded-xl font-bold text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-red-600/10"
                  required
                  min={1}
                />
              </div>
            </div>

            {/* Emoji preset picker */}
            <div className="space-y-2">
              <label className="block text-slate-500 font-bold uppercase tracking-wider">
                Pilih Icon / Emoji ({selectedEmoji})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-[140px] overflow-y-auto">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    id={`emoji-picker-${emoji}`}
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all hover:bg-slate-100 cursor-pointer ${
                      selectedEmoji === emoji ? 'bg-white border-2 border-red-600 scale-110 shadow-sm' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action buttons */}
            <div className="pt-2">
              <button
                id="submit-product-btn"
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan ke Daftar'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Restore defaults card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-slate-600">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={16} />
            <div className="space-y-1">
              <h5 className="font-bold text-xs text-slate-800">Dinas Standardisasi</h5>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Anda dapat memulihkan produk bawaan Dinas Peternakan Bojonegoro (Daging Sapi, Ayam, Kambing, dll) kapan saja dengan tombol di bawah.
              </p>
            </div>
          </div>
          <button
            id="restore-defaults-btn"
            onClick={handleRestoreDefaults}
            className="w-full mt-1.5 py-2 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Kembalikan Produk Standar</span>
          </button>
        </div>
      </div>

      {/* RIGHT: Current Registered Products Grid (col-span-8) */}
      <div id="product-list-section" className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Katalog Daging Aktif</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-semibold">Total terdaftar: {products.length} jenis barang</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
              <span className="text-4xl">🫙</span>
              <p className="text-slate-500 font-bold">Katalog kosong.</p>
              <button
                id="restore-standard-btn-empty"
                onClick={handleRestoreDefaults}
                className="text-xs font-bold text-red-600 underline"
              >
                Muat Produk Bawaan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  id={`product-catalogue-item-${product.id}`}
                  key={product.id}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                      {product.emoji}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
                      <p className="font-mono text-xs font-bold text-red-600">
                        {formatRupiah(product.pricePerKg)}<span className="text-slate-400 font-normal"> / kg</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`edit-prod-btn-${product.id}`}
                      onClick={() => handleEditClick(product)}
                      className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Ubah Produk"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      id={`delete-prod-btn-${product.id}`}
                      onClick={() => handleDeleteClick(product.id, product.name)}
                      className="p-2 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
