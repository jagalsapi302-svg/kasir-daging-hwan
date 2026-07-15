import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, ShoppingBag, Award, Clock, Printer, Trash2, ArrowUpDown, ChevronDown, CheckCircle, Database } from 'lucide-react';
import { Transaction, DailySummary } from '../types';
import { DB } from '../db';
import ReceiptView from './ReceiptView';

interface RiwayatTabProps {
  transactions: Transaction[];
  onRefreshTransactions: () => void;
}

export default function RiwayatTab({ transactions, onRefreshTransactions }: RiwayatTabProps) {
  // Report selections
  const [reports, setReports] = useState<DailySummary[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  
  // Modal for review receipt
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Search/Filters for Sales list
  const [filterMethod, setFilterMethod] = useState<'Semua' | 'Tunai' | 'QRIS' | 'Transfer'| 'E-Wallet'>('Semua');

  useEffect(() => {
    const dailyReports = DB.getDailyReports();
    setReports(dailyReports);
    
    // Default to the latest date report if available
    if (dailyReports.length > 0 && !selectedDateStr) {
      setSelectedDateStr(dailyReports[0].dateString);
    }
  }, [transactions, selectedDateStr]);

  // Selected Day's report object
  const activeReport = reports.find((r) => r.dateString === selectedDateStr);

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
    return kg.toFixed(2).replace('.', ',') + ' kg';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDateHuman = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleSeedMockData = () => {
    if (confirm('Apakah Anda ingin memuat beberapa data transaksi simulasi (3 hari terakhir) untuk melihat visualisasi laporan penjualan harian?')) {
      DB.seedMockTransactions();
      onRefreshTransactions();
      // Reset selected date to force update to latest mock
      setSelectedDateStr('');
    }
  };

  const handleClearHistory = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin menghapus seluruh riwayat transaksi penjualan? Tindakan ini tidak bisa dibatalkan.')) {
      DB.clearTransactions();
      onRefreshTransactions();
      setSelectedDateStr('');
    }
  };

  const handleDeleteTx = (id: string, invoiceNumber: string) => {
    if (confirm(`Apakah Anda yakin ingin membatalkan (void) transaksi ${invoiceNumber}?`)) {
      DB.deleteTransaction(id);
      onRefreshTransactions();
    }
  };

  // Filter Transactions for general list view
  const filteredTxs = transactions.filter((tx) => {
    if (filterMethod === 'Semua') return true;
    return tx.paymentMethod === filterMethod;
  });

  // Calculate high-level total statistics (All Time / Total in DB)
  const totalOmsetAllTime = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalWeightAllTime = transactions.reduce((sum, tx) => {
    return sum + tx.items.reduce((itemSum, item) => itemSum + item.weightKg, 0);
  }, 0);

  // Dynamic values for SVG Charting based on active report's items breakdown
  const chartItems = activeReport ? Object.values(activeReport.itemBreakdown) as { name: string; weight: number; revenue: number }[] : [];
  const maxRevenueInChart = chartItems.length > 0 ? Math.max(...chartItems.map(item => item.revenue)) : 100000;

  return (
    <div id="riwayat-tab-container" className="space-y-6">
      
      {/* SECTION 1: Summary Statistics Cards & Quick mock triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📊</span> Laporan Penjualan & Riwayat Kasir
          </h2>
          <p className="text-xs text-slate-500 font-medium">Pantau omset harian, volume penjualan daging, dan riwayat cetak struk.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {transactions.length === 0 && (
            <button
              id="seed-data-btn"
              onClick={handleSeedMockData}
              className="bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database size={13} />
              <span>Simulasi Data Penjualan</span>
            </button>
          )}
          {transactions.length > 0 && (
            <button
              id="clear-history-btn"
              onClick={handleClearHistory}
              className="border border-slate-300 hover:border-red-200 hover:text-red-600 text-slate-500 bg-white font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
            >
              Kosongkan Riwayat
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 text-2xl">💰</div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Omset Kumulatif</p>
            <p className="text-lg font-black text-slate-800 font-mono">{formatRupiah(totalOmsetAllTime)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 text-2xl">⚖️</div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Berat Terjual</p>
            <p className="text-lg font-black text-slate-800 font-mono">{formatWeight(totalWeightAllTime)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-2xl text-red-600 text-2xl">📦</div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaksi Terkunci</p>
            <p className="text-lg font-black text-slate-800 font-mono">{transactions.length} Nota</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Split layout - Left (Daily Report & Charts) vs Right (Transaction log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Detailed Daily Report Dashboard (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Header with Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-red-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-base tracking-tight">Laporan Harian</h3>
              </div>
              
              {reports.length > 0 ? (
                <div className="relative inline-block">
                  <select
                    id="date-report-select"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 cursor-pointer"
                  >
                    {reports.map((report) => (
                      <option key={report.dateString} value={report.dateString}>
                        {formatDateHuman(report.dateString)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium italic">Belum ada data laporan</span>
              )}
            </div>

            {/* Display Active Day's Metrics */}
            {activeReport ? (
              <div className="space-y-6">
                
                {/* 3 Metrics Row */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-center border-r border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Omset Hari Ini</p>
                    <p className="text-sm font-black text-slate-800 font-mono mt-1">{formatRupiah(activeReport.totalRevenue)}</p>
                  </div>
                  <div className="text-center border-r border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Nota</p>
                    <p className="text-sm font-black text-red-600 font-mono mt-1">{activeReport.totalTransactions} Nota</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Berat Terjual</p>
                    <p className="text-sm font-black text-slate-800 font-mono mt-1">{formatWeight(activeReport.totalWeightSold)}</p>
                  </div>
                </div>

                {/* SVG Revenue Bar Chart */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                    <TrendingUp size={13} className="text-emerald-500" />
                    <span>Visualisasi Omset per Jenis Daging</span>
                  </h4>

                  {chartItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Data grafik tidak tersedia.</p>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {/* Interactive Custom SVG Chart */}
                      <svg viewBox="0 0 400 180" className="w-full">
                        {/* Grid lines */}
                        <line x1="40" y1="20" x2="380" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="40" y1="75" x2="380" y2="75" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="40" y1="130" x2="380" y2="130" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* Axes */}
                        <line x1="40" y1="10" x2="40" y2="140" stroke="#CBD5E1" strokeWidth="1.5" />
                        <line x1="40" y1="140" x2="380" y2="140" stroke="#CBD5E1" strokeWidth="1.5" />
                        
                        {/* Y-Axis Labels */}
                        <text x="35" y="24" textAnchor="end" fontSize="8" fill="#888" fontFamily="sans-serif">{formatRupiah(maxRevenueInChart)}</text>
                        <text x="35" y="79" textAnchor="end" fontSize="8" fill="#888" fontFamily="sans-serif">{formatRupiah(Math.round(maxRevenueInChart / 2))}</text>
                        <text x="35" y="134" textAnchor="end" fontSize="8" fill="#888" fontFamily="sans-serif">Rp0</text>

                        {/* Rendering Bars */}
                        {chartItems.map((item, index) => {
                          const numItems = chartItems.length;
                          const barSpacing = (340 - 40) / numItems;
                          const x = 40 + (index * barSpacing) + (barSpacing / 4);
                          const barWidth = barSpacing / 2;
                          const barHeight = (item.revenue / maxRevenueInChart) * 110; // scale up to max height 110px
                          const y = 140 - barHeight;

                          return (
                            <g key={index} className="group cursor-pointer">
                              {/* Backdrop bar hover highlight */}
                              <rect x={x - 2} y="15" width={barWidth + 4} height="125" fill="#F1F5F9" opacity="0" className="hover:opacity-100 transition-opacity" />
                              
                              {/* Actual revenue bar */}
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill="#DC2626"
                                rx="4"
                                className="transition-all duration-500 hover:fill-[#B91C1C]"
                              />
                              
                              {/* Bar Label (Item Emoji) */}
                              <text
                                x={x + (barWidth / 2)}
                                y="152"
                                textAnchor="middle"
                                fontSize="9"
                                fill="#444"
                                fontWeight="bold"
                                fontFamily="sans-serif"
                              >
                                {item.name.substring(0, 10)}
                              </text>
                              
                              {/* Bar Value Tooltip-style label */}
                              <text
                                x={x + (barWidth / 2)}
                                y={y - 6}
                                textAnchor="middle"
                                fontSize="7.5"
                                fill="#DC2626"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {item.weight.toFixed(1).replace('.', ',')} kg
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>

                {/* Table Breakdown per item */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Award size={13} className="text-amber-500" />
                    <span>Rincian Penjualan Daging Hari Ini</span>
                  </h4>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden font-sans text-xs">
                    <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-bold text-slate-600 border-b border-slate-200">
                      <div className="col-span-5">Jenis Daging</div>
                      <div className="col-span-3 text-right">Berat Terjual</div>
                      <div className="col-span-4 text-right">Total Pendapatan</div>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      {(Object.values(activeReport.itemBreakdown) as { name: string; weight: number; revenue: number }[]).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 p-2.5 font-medium text-slate-750">
                          <div className="col-span-5 font-bold text-slate-800">{item.name}</div>
                          <div className="col-span-3 text-right font-mono text-slate-600">{formatWeight(item.weight)}</div>
                          <div className="col-span-4 text-right font-mono font-bold text-red-600">{formatRupiah(item.revenue)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <p className="text-sm font-semibold">Belum ada rekapan penjualan untuk hari ini.</p>
                <p className="text-[10px] text-slate-400 mt-1">Lakukan transaksi di Kasir terlebih dahulu!</p>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT PANEL: Log of Transactions (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full justify-between space-y-4">
            
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="text-slate-700" size={18} />
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight">Log Transaksi Masuk</h3>
                </div>
                
                {/* Payment Method filter select */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Filter:</span>
                  <select
                    id="filter-payment-method-select"
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold px-2 py-1 text-slate-600 cursor-pointer focus:outline-none"
                  >
                    <option value="Semua">Semua</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              {/* Transactions List */}
              {filteredTxs.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl text-slate-300">📦📭</span>
                  <p className="text-slate-400 text-xs font-semibold">Tidak ada transaksi yang cocok.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 py-3">
                  {filteredTxs.map((tx) => (
                    <div
                      id={`tx-log-${tx.id}`}
                      key={tx.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 transition-all flex flex-col justify-between space-y-3 text-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-800 tracking-tight">{tx.invoiceNumber}</span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <span>{formatTime(tx.createdAt)}</span>
                            <span>•</span>
                            <span>{tx.cashierName || 'Kasir'}</span>
                          </div>
                        </div>
                        
                        <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border border-red-200/50">
                          {tx.paymentMethod}
                        </span>
                      </div>

                      {/* Brief preview of items */}
                      <div className="text-[10px] text-slate-500 leading-normal max-w-[280px] font-medium">
                        {tx.items.map((it, idx) => (
                          <span key={idx}>
                            {it.product.emoji} {it.product.name} ({it.weightKg.toString().replace('.', ',')} kg)
                            {idx < tx.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>

                      {/* Bottom row actions & pricing */}
                      <div className="flex items-center justify-between border-t border-slate-200/40 pt-2.5 mt-1">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatRupiah(tx.totalAmount)}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            id={`tx-print-btn-${tx.id}`}
                            onClick={() => {
                              setSelectedTx(tx);
                              setIsReceiptOpen(true);
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 py-1.5 px-3 rounded-lg border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Tinjau & Cetak Struk"
                          >
                            <Printer size={11} />
                            <span>Struk</span>
                          </button>
                          <button
                            id={`tx-delete-btn-${tx.id}`}
                            onClick={() => handleDeleteTx(tx.id, tx.invoiceNumber)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Batalkan Nota"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* DETAILED RECEIPT DIALOG VIEW */}
      <ReceiptView
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedTx(null);
        }}
        transaction={selectedTx}
      />

    </div>
  );
}
