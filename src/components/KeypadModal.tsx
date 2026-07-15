import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CornerDownLeft, Delete } from 'lucide-react';
import { Product } from '../types';

interface KeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, weightKg: number) => void;
  initialWeight?: number;
}

export default function KeypadModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  initialWeight = 0,
}: KeypadModalProps) {
  const [weightStr, setWeightStr] = useState<string>('0');

  useEffect(() => {
    if (isOpen) {
      if (initialWeight > 0) {
        setWeightStr(initialWeight.toString().replace('.', ','));
      } else {
        setWeightStr('0');
      }
    }
  }, [isOpen, initialWeight]);

  if (!product) return null;

  const currentWeightKg = parseFloat(weightStr.replace(',', '.')) || 0;
  const currentTotalPrice = Math.round(currentWeightKg * product.pricePerKg);

  const handleNumClick = (val: string) => {
    if (weightStr === '0') {
      if (val === ',') {
        setWeightStr('0,');
      } else {
        setWeightStr(val);
      }
    } else {
      // Prevent multiple commas
      if (val === ',' && weightStr.includes(',')) return;
      // Prevent typing more than 3 decimal places (e.g., grams precision)
      const parts = weightStr.split(',');
      if (parts[1] && parts[1].length >= 3) return;
      
      setWeightStr(weightStr + val);
    }
  };

  const handleBackspace = () => {
    if (weightStr.length <= 1) {
      setWeightStr('0');
    } else {
      setWeightStr(weightStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    setWeightStr('0');
  };

  const handleAddPreset = (grams: number) => {
    const currentVal = parseFloat(weightStr.replace(',', '.')) || 0;
    const addedVal = grams / 1000;
    const newVal = currentVal + addedVal;
    
    // Format to max 3 decimal places
    const formatted = parseFloat(newVal.toFixed(3));
    setWeightStr(formatted.toString().replace('.', ','));
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="keypad-modal-overlay" className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Card - Slide up */}
          <motion.div
            id="keypad-modal-content"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md rounded-t-3xl bg-slate-50 p-6 pb-8 shadow-2xl border-t border-slate-200"
          >
            {/* Drag/Swipe Indicator Line */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{product.emoji}</span>
                <h3 className="text-2xl font-bold text-slate-800">{product.name}</h3>
              </div>
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Price Rate Info */}
            <div className="text-center mb-1 text-xs font-bold text-slate-500 tracking-wider uppercase">
              Harga Satuan: {formatRupiah(product.pricePerKg)} / kg
            </div>

            {/* Display Screen */}
            <div className="bg-white rounded-xl p-5 mb-5 border border-slate-200 shadow-sm text-center relative group">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-extrabold text-slate-800 tracking-tight select-none">
                  {weightStr}
                </span>
                <span className="text-2xl font-semibold text-slate-500">kg</span>
              </div>
              <div className="text-xl font-bold text-red-600 mt-1.5 transition-colors">
                {formatRupiah(currentTotalPrice)}
              </div>
              {weightStr !== '0' && (
                <button
                  id="clear-weight-btn"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-full px-2.5 py-1 transition-all cursor-pointer"
                >
                  RESET
                </button>
              )}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                id="preset-250g"
                onClick={() => handleAddPreset(250)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                +250g
              </button>
              <button
                id="preset-500g"
                onClick={() => handleAddPreset(500)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                +500g
              </button>
              <button
                id="preset-750g"
                onClick={() => handleAddPreset(750)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                +750g
              </button>
              <button
                id="preset-1kg"
                onClick={() => handleAddPreset(1000)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                +1kg
              </button>
              <button
                id="preset-1.5kg"
                onClick={() => handleAddPreset(1500)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                +1.5kg
              </button>
              <button
                id="preset-2kg"
                onClick={() => handleAddPreset(2000)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                +2kg
              </button>
            </div>

            {/* Custom Keypad */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  id={`keypad-${num}`}
                  key={num}
                  onClick={() => handleNumClick(num)}
                  className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-850 text-2xl font-bold py-4 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                id="keypad-comma"
                onClick={() => handleNumClick(',')}
                className="bg-white hover:bg-slate-50 text-slate-850 text-2xl font-bold py-4 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                ,
              </button>
              <button
                id="keypad-0"
                onClick={() => handleNumClick('0')}
                className="bg-white hover:bg-slate-50 text-slate-850 text-2xl font-bold py-4 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                id="keypad-backspace"
                onClick={handleBackspace}
                className="bg-white hover:bg-slate-100 text-slate-600 text-xl font-bold py-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Delete size={24} />
              </button>
            </div>

            {/* Action Button */}
            <button
              id="add-to-cart-action"
              onClick={() => {
                if (currentWeightKg <= 0) return;
                onAddToCart(product, currentWeightKg);
                onClose();
              }}
              disabled={currentWeightKg <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                currentWeightKg > 0
                  ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
                  : 'bg-slate-450 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Tambahkan ke Keranjang</span>
              {currentWeightKg > 0 && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm">
                  {formatRupiah(currentTotalPrice)}
                </span>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
