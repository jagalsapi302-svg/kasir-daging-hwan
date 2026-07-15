import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types';

interface ReceiptViewProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function ReceiptView({ isOpen, onClose, transaction }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

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

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  };

  const handlePrint = () => {
    // Print logic for thermal printer or browser
    const printContent = receiptRef.current?.innerHTML;
    if (!printContent) return;

    // Open a new printable window or trigger a clean print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Struk - ${transaction.invoiceNumber}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 58mm;
                margin: 0;
                padding: 5px;
                font-size: 11px;
                color: #000;
                background: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              .item-row { margin-bottom: 4px; }
              .flex-row { display: flex; justify-content: space-between; }
              .footer { margin-top: 12px; font-size: 10px; }
              @media print {
                @page { margin: 0; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback: If popup blocker prevents window.open, alert user or trigger regular printing
      alert("Popup terblokir! Silakan izinkan popup untuk mencetak langsung, atau gunakan tangkapan layar.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="receipt-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            id="receipt-modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-sm rounded-xl bg-slate-50 p-5 shadow-2xl border border-slate-200 flex flex-col my-8"
          >
            {/* Header Success Ring */}
            <div className="flex flex-col items-center justify-center mb-4 text-emerald-600">
              <CheckCircle2 size={48} className="animate-bounce" />
              <h4 className="font-bold text-lg text-slate-800 mt-2">Transaksi Sukses!</h4>
              <p className="text-xs text-slate-500">Struk siap dicetak atau disimpan.</p>
            </div>

            {/* Simulated Receipt Roll paper */}
            <div 
              ref={receiptRef}
              id="thermal-receipt-paper"
              className="bg-white rounded-xl shadow-inner border border-slate-200 p-5 font-mono text-xs text-slate-850 relative overflow-hidden"
            >
              {/* Receipt Jagged Edge Top style */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeat-x" 
                   style={{ backgroundImage: 'linear-gradient(-45deg, #f8fafc 4px, transparent 0), linear-gradient(45deg, #f8fafc 4px, transparent 0)', backgroundSize: '8px 8px' }} />

              {/* Receipt Content */}
              <div className="pt-2">
                <div className="text-center">
                  <h3 className="text-sm font-black tracking-wider text-slate-950">JAGAL SAPI SHOFWAN HADI (H.WAN)</h3>
                  <p className="text-[10px] leading-tight text-slate-500 font-sans font-medium mt-1">
                    Kios Pasar Bojonegoro
                  </p>
                  <p className="text-[9px] leading-tight text-slate-400 font-sans max-w-[220px] mx-auto mt-0.5">
                    Kios Daging Binaan Dinas Peternakan & Perikanan Kab. Bojonegoro
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans">HP/WA: 0812-3456-7890</p>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Meta details */}
                <div className="space-y-1 font-sans text-[10px] text-slate-600">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-mono font-bold text-slate-800">{transaction.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{formatDateTime(transaction.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{transaction.cashierName || 'Petugas Kasir'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold text-slate-700">{transaction.paymentMethod}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Items List */}
                <div className="space-y-2.5 font-sans">
                  {transaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900">{item.product.emoji} {item.product.name}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatWeight(item.weightKg)} kg x {formatRupiah(item.product.pricePerKg)}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 mt-0.5">
                        {formatRupiah(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Totals */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>TOTAL:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(transaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>BAYAR ({transaction.paymentMethod}):</span>
                    <span>{formatRupiah(transaction.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-dotted border-slate-200 pt-1 text-sm">
                    <span>KEMBALI:</span>
                    <span>{formatRupiah(transaction.changeAmount)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Footer Message */}
                <div className="text-center space-y-1 font-sans text-[10px] text-slate-400 font-medium">
                  <p>-- Terima Kasih Atas Kunjungan Anda --</p>
                  <p className="text-slate-500 italic">Daging Segar, Halal & Higienis!</p>
                  <p className="text-[8px] text-slate-300">Sistem Kasir v1.0 • Bojonegoro</p>
                </div>
              </div>

              {/* Receipt Jagged Edge Bottom style */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-repeat-x" 
                   style={{ backgroundImage: 'linear-gradient(135deg, #f8fafc 4px, transparent 0), linear-gradient(-135deg, #f8fafc 4px, transparent 0)', backgroundSize: '8px 8px' }} />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                id="receipt-print-btn"
                onClick={handlePrint}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Printer size={16} />
                <span>Cetak Struk</span>
              </button>
              <button
                id="receipt-close-btn"
                onClick={onClose}
                className="bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>Selesai</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
