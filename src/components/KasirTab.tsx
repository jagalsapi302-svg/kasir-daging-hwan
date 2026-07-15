import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Trash2, Edit2, Plus, Minus, Search, User, CreditCard, X } from 'lucide-react';
import { Product, CartItem, Transaction } from '../types';
import { DB } from '../db';
import KeypadModal from './KeypadModal';
import ReceiptView from './ReceiptView';

interface KasirTabProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export default function KasirTab({ products, onRefreshProducts }: KasirTabProps) {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [activeCartItemIndex, setActiveCartItemIndex] = useState<number | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Cashier Details & Checkout State
  const [cashierName, setCashierName] = useState('Petugas Kasir');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Transfer'>('Tunai');
  const [paidAmountStr, setPaidAmountStr] = useState('');
  const [suggestedCash, setSuggestedCash] = useState<number[]>([]);
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Helpers
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatWeight = (kg: number) => {
    return kg.toString().replace('.', ',');
  };

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Totals calculations
  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const paidAmount = parseFloat(paidAmountStr) || 0;
  const changeAmount = Math.max(0, paidAmount - totalAmount);

  // Suggested Cash buttons based on Total Amount
  useEffect(() => {
    if (totalAmount <= 0) {
      setSuggestedCash([]);
      return;
    }
    const suggestions = new Set<number>();
    
    // Exact cash
    suggestions.add(totalAmount);
    
    // Standard denominations greater than total
    const denominations = [
      10000, 20000, 50000, 100000, 150000, 200000, 300000, 500000
    ];
    
    denominations.forEach(den => {
      if (den > totalAmount) {
        suggestions.add(den);
      }
    });

    // Smart compound additions (nearest 50k / 100k)
    const next50k = Math.ceil(totalAmount / 50000) * 50000;
    const next100k = Math.ceil(totalAmount / 100000) * 100000;
    suggestions.add(next50k);
    suggestions.add(next100k);

    // Filter, sort ascending and take top 4 unique values
    const sorted = Array.from(suggestions)
      .filter(val => val >= totalAmount)
      .sort((a, b) => a - b)
      .slice(0, 4);

    setSuggestedCash(sorted);
    setPaidAmountStr(totalAmount.toString()); // default to exact payment
  }, [totalAmount]);

  // Handle Add to Cart from Keypad Modal
  const handleAddToCart = (product: Product, weightKg: number) => {
    const totalPrice = Math.round(weightKg * product.pricePerKg);
    
    if (activeCartItemIndex !== null) {
      // Edit mode
      const updatedCart = [...cart];
      updatedCart[activeCartItemIndex] = {
        product,
        weightKg,
        totalPrice
      };
      setCart(updatedCart);
      setActiveCartItemIndex(null);
    } else {
      // Add new item mode. If product already exists in cart, let's add the weight together!
      const existingIndex = cart.findIndex(item => item.product.id === product.id);
      if (existingIndex !== -1) {
        const updatedCart = [...cart];
        const combinedWeight = updatedCart[existingIndex].weightKg + weightKg;
        updatedCart[existingIndex] = {
          product,
          weightKg: combinedWeight,
          totalPrice: Math.round(combinedWeight * product.pricePerKg)
        };
        setCart(updatedCart);
      } else {
        setCart([...cart, { product, weightKg, totalPrice }]);
      }
    }
    setSelectedProduct(null);
  };

  const handleEditCartItem = (index: number) => {
    const item = cart[index];
    setSelectedProduct(item.product);
    setActiveCartItemIndex(index);
    setIsKeypadOpen(true);
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  const handleClearCart = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
      setCart([]);
    }
  };

  // Submit checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (paymentMethod === 'Tunai' && paidAmount < totalAmount) {
      alert('Jumlah uang pembayaran tidak mencukupi!');
      return;
    }

    const transaction = DB.saveTransaction({
      items: cart,
      totalAmount,
      paidAmount: paymentMethod === 'Tunai' ? paidAmount : totalAmount,
      changeAmount: paymentMethod === 'Tunai' ? changeAmount : 0,
      paymentMethod,
      cashierName,
    });

    setLatestTransaction(transaction);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    setCart([]); // Clear cart after transaction complete
    setPaidAmountStr('');
  };

  return (
    <div id="kasir-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-10rem)]">
      
      {/* LEFT: Product catalog (col-span-8) */}
      <div id="catalog-section" className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
        
        {/* Search & Header banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-red-600 tracking-wider uppercase bg-red-50 px-3 py-1 rounded-full border border-red-200/50">Kios Resmi Pasar Bojonegoro</span>
              <p className="text-slate-500 text-xs mt-1.5 font-medium">Binaan Dinas Peternakan dan Perikanan Kabupaten Bojonegoro</p>
            </div>
            {/* Cashier profile simple display */}
            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
              <User size={16} className="text-slate-400" />
              <input
                id="cashier-name-input"
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="bg-transparent text-xs font-bold w-24 focus:outline-none border-b border-dashed border-slate-300 focus:border-red-600 pb-0.5"
                title="Nama Kasir"
              />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="search-products"
              type="text"
              placeholder="Cari daging, ayam, kambing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-red-600 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-600/20 transition-all font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Instruction Info banner */}
        <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <span className="text-xl">⚖️</span>
          <p className="text-xs font-medium text-slate-600">
            <strong>Cara Belanja:</strong> Pilih produk di bawah ini, masukkan berat timbangan (kg) lewat tombol keypad yang muncul, lalu tambahkan ke keranjang.
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
            <span className="text-4xl">🥩🔍</span>
            <p className="text-slate-500 font-medium">Tidak ada produk daging yang cocok dengan pencarian Anda.</p>
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="text-red-600 text-xs font-bold underline hover:text-red-700"
            >
              Hapus Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <motion.button
                id={`product-card-${product.id}`}
                key={product.id}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedProduct(product);
                  setActiveCartItemIndex(null);
                  setIsKeypadOpen(true);
                }}
                className="bg-white rounded-xl p-5 text-left border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all flex flex-col justify-between items-start space-y-4 cursor-pointer group"
              >
                <div className="bg-slate-50 group-hover:bg-red-50 transition-colors p-3.5 rounded-lg text-3xl">
                  {product.emoji}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 tracking-tight text-base leading-tight">
                    {product.name}
                  </h4>
                  <p className="text-xs font-bold text-red-600 mt-1 tracking-wide">
                    {formatRupiah(product.pricePerKg)}<span className="text-slate-400 font-normal">/kg</span>
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Cart and Payment details (col-span-4) */}
      <div id="cart-section" className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full justify-between space-y-4">
          
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-red-600" size={20} />
                <h3 className="font-black text-slate-800 text-lg tracking-tight">Keranjang Belanja</h3>
                {cart.length > 0 && (
                  <span className="bg-red-600 text-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cart.length}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  id="clear-cart-btn"
                  onClick={handleClearCart}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  title="Kosongkan Keranjang"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div> velvet

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                  <ShoppingCart size={36} />
                </div>
                <p className="text-slate-400 text-xs font-semibold max-w-[180px]">
                  Keranjang kosong. Klik produk di sebelah kiri untuk menambah timbangan belanja.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 py-3">
                {cart.map((item, index) => (
                  <div
                    id={`cart-item-${index}`}
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/50 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.product.emoji}</span>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-slate-800">{item.product.name}</h5>
                        <p className="text-[10px] font-mono text-slate-500">
                          {formatWeight(item.weightKg)} kg x {formatRupiah(item.product.pricePerKg)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 mr-1">
                        {formatRupiah(item.totalPrice)}
                      </span>
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                        <button
                          id={`edit-cart-item-${index}`}
                          onClick={() => handleEditCartItem(index)}
                          className="p-1 hover:bg-slate-100 text-slate-500"
                          title="Ubah Berat"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          id={`remove-cart-item-${index}`}
                          onClick={() => handleRemoveCartItem(index)}
                          className="p-1 hover:bg-red-50 text-red-500 border-l border-slate-200"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Pricing Summary */}
          {cart.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-baseline font-sans">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Subtotal</span>
                <span className="font-mono font-bold text-lg text-slate-800">{formatRupiah(totalAmount)}</span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Belanja</p>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatRupiah(totalAmount)}</p>
                </div>
                <button
                  id="checkout-trigger-btn"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Bayar</span>
                  <CreditCard size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KEYPAD MODAL (FOR SELECTING WEIGHT OF AN ITEM) */}
      <KeypadModal
        isOpen={isKeypadOpen}
        onClose={() => {
          setIsKeypadOpen(false);
          setSelectedProduct(null);
          setActiveCartItemIndex(null);
        }}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
        initialWeight={activeCartItemIndex !== null ? cart[activeCartItemIndex].weightKg : 0}
      />

      {/* CHECKOUT & PAYMENT METHOD DIALOG */}
      {isCheckoutOpen && (
        <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsCheckoutOpen(false)} />
          
          <motion.div
            id="checkout-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative z-10"
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Proses Pembayaran</h3>
              <button
                id="close-checkout-btn"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'QRIS', 'Transfer'] as const).map((method) => (
                    <button
                      id={`pay-method-${method}`}
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method !== 'Tunai') {
                          setPaidAmountStr(totalAmount.toString()); // QRIS & Transfer always exact
                        }
                      }}
                      className={`py-3 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-red-600 text-white border-red-600 shadow-sm font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Cash Payment Inputs */}
              {paymentMethod === 'Tunai' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Uang Diterima (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                      <input
                        id="paid-amount-input"
                        type="number"
                        placeholder="0"
                        value={paidAmountStr}
                        onChange={(e) => setPaidAmountStr(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/10"
                        required
                        min={totalAmount}
                      />
                    </div>
                  </div>

                  {/* Smart Suggested Denomination buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {suggestedCash.map((cash, index) => (
                      <button
                        id={`cash-suggestion-${index}`}
                        key={index}
                        type="button"
                        onClick={() => setPaidAmountStr(cash.toString())}
                        className={`py-1.5 px-2 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 font-mono transition-colors cursor-pointer ${
                          paidAmount === cash ? 'bg-slate-100 text-slate-900 border-slate-400' : ''
                        }`}
                      >
                        {formatRupiah(cash)}
                      </button>
                    ))}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 font-sans text-xs">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Total Belanja:</span>
                      <span className="font-mono font-bold text-slate-800">{formatRupiah(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Bayar:</span>
                      <span className="font-mono font-bold text-slate-800">{formatRupiah(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold text-slate-900 border-t border-dotted border-slate-200 pt-2 text-sm">
                      <span>Uang Kembali:</span>
                      <span className="font-mono text-base text-emerald-600 font-extrabold">{formatRupiah(changeAmount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50/40 rounded-xl border border-red-100/60 text-center space-y-3">
                  <span className="text-3xl">📱</span>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-red-600">Bayar Otomatis Non-Tunai</p>
                    <p className="text-[10px] text-slate-500 leading-tight max-w-[240px] mx-auto">
                      Silakan tunjukkan QRIS atau selesaikan transfer bank senilai <strong className="text-slate-800 font-mono text-xs">{formatRupiah(totalAmount)}</strong> ke rekening merchant.
                    </p>
                  </div>
                  <div className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-600">
                    Sistem akan memvalidasi transaksi secara otomatis
                  </div>
                </div>
              )}

              {/* Submit Payment button */}
              <button
                id="submit-payment-btn"
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Selesaikan Pembayaran & Cetak Struk
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* THERMAL STRUK RECEIPT VIEW COMPONENT */}
      <ReceiptView
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setLatestTransaction(null);
        }}
        transaction={latestTransaction}
      />

    </div>
  );
}
