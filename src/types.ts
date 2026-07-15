export interface Product {
  id: string;
  name: string;
  pricePerKg: number;
  emoji: string;
  createdAt: number;
}

export interface CartItem {
  product: Product;
  weightKg: number; // e.g. 0.25, 1.5, 2
  totalPrice: number; // weightKg * pricePerKg
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: 'Tunai' | 'QRIS' | 'Transfer' | 'E-Wallet'| 'E-Wallet';
  createdAt: number; // Timestamp
  cashierName?: string;
}

export interface DailySummary {
  dateString: string; // YYYY-MM-DD
  totalTransactions: number;
  totalRevenue: number;
  totalWeightSold: number;
  itemBreakdown: { [productId: string]: { name: string; weight: number; revenue: number } };
}
