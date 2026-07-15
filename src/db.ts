import { Product, Transaction, DailySummary, CartItem } from './types';

// Default seeded products matching the user's screenshot
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Daging Sapi',
    pricePerKg: 130000,
    emoji: '🥩',
    createdAt: Date.now() - 5000,
  },
  {
    id: 'prod-2',
    name: 'Ayam Potong',
    pricePerKg: 38000,
    emoji: '🍗',
    createdAt: Date.now() - 4000,
  },
  {
    id: 'prod-3',
    name: 'Daging Kambing',
    pricePerKg: 150000,
    emoji: '🐐',
    createdAt: Date.now() - 3000,
  },
  {
    id: 'prod-4',
    name: 'Jeroan Sapi',
    pricePerKg: 90000,
    emoji: '🍖',
    createdAt: Date.now() - 2000,
  },
  {
    id: 'prod-5',
    name: 'Tulang Sapi',
    pricePerKg: 60000,
    emoji: '🦴',
    createdAt: Date.now() - 1000,
  },
];

// LocalStorage Keys
const KEYS = {
  PRODUCTS: 'tokodaging_products',
  TRANSACTIONS: 'tokodaging_transactions',
};

export const DB = {
  // --- PRODUCTS MANAGEMENT ---
  getProducts(): Product[] {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: 'prod-' + Date.now() + Math.random().toString(36).substr(2, 4),
      createdAt: Date.now(),
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id: string, updated: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updated };
      this.saveProducts(products);
    }
  },

  deleteProduct(id: string): void {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    this.saveProducts(filtered);
  },

  resetProductsToDefault(): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  },

  // --- TRANSACTIONS MANAGEMENT ---
  getTransactions(): Transaction[] {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveTransaction(transaction: Omit<Transaction, 'id' | 'invoiceNumber' | 'createdAt'>): Transaction {
    const transactions = this.getTransactions();
    
    // Generate Invoice Number format: TGD-YYYYMMDD-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Count transactions of today to increment sequence
    const todayCount = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate.getFullYear() === year &&
             String(tDate.getMonth() + 1).padStart(2, '0') === month &&
             String(tDate.getDate()).padStart(2, '0') === day;
    }).length;

    const sequence = String(todayCount + 1).padStart(4, '0');
    const invoiceNumber = `TGD-${datePrefix}-${sequence}`;

    const newTransaction: Transaction = {
      ...transaction,
      id: 'tx-' + Date.now() + Math.random().toString(36).substr(2, 4),
      invoiceNumber,
      createdAt: Date.now(),
    };

    transactions.unshift(newTransaction); // Newest first
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  },

  deleteTransaction(id: string): void {
    const transactions = this.getTransactions();
    const filtered = transactions.filter((t) => t.id !== id);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
  },

  clearTransactions(): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
  },

  // --- STATISTICS & REPORTS ---
  getDailyReports(): DailySummary[] {
    const transactions = this.getTransactions();
    const reportsMap: { [dateStr: string]: DailySummary } = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (!reportsMap[dateStr]) {
        reportsMap[dateStr] = {
          dateString: dateStr,
          totalTransactions: 0,
          totalRevenue: 0,
          totalWeightSold: 0,
          itemBreakdown: {},
        };
      }

      const report = reportsMap[dateStr];
      report.totalTransactions += 1;
      report.totalRevenue += tx.totalAmount;

      tx.items.forEach((item) => {
        report.totalWeightSold += item.weightKg;

        const prodId = item.product.id;
        if (!report.itemBreakdown[prodId]) {
          report.itemBreakdown[prodId] = {
            name: item.product.name,
            weight: 0,
            revenue: 0,
          };
        }
        report.itemBreakdown[prodId].weight += item.weightKg;
        report.itemBreakdown[prodId].revenue += item.totalPrice;
      });
    });

    // Convert map to sorted array (latest date first)
    return Object.values(reportsMap).sort((a, b) => b.dateString.localeCompare(a.dateString));
  },

  // Seed some dummy transactions if DB is completely empty and user wants some data
  seedMockTransactions(): void {
    const products = this.getProducts();
    if (products.length === 0) return;

    const mockTxs: Transaction[] = [];
    const now = Date.now();
    
    // Generate 15 mock transactions spread over the last 3 days
    const days = [0, 1, 2]; // 0 is today, 1 is yesterday, 2 is day before
    let count = 1;

    days.forEach((dayOffset) => {
      const dayTimestamp = now - dayOffset * 24 * 60 * 60 * 1000;
      const numTx = 3 + Math.floor(Math.random() * 4); // 3 to 6 transactions per day

      for (let i = 0; i < numTx; i++) {
        const txTime = dayTimestamp - (i * 2 * 60 * 60 * 1000); // spread by 2 hours
        const itemsCount = 1 + Math.floor(Math.random() * 3); // 1 to 3 items
        const items: CartItem[] = [];
        let totalAmount = 0;

        // Pick unique random products
        const shuffledProds = [...products].sort(() => 0.5 - Math.random());
        for (let j = 0; j < Math.min(itemsCount, shuffledProds.length); j++) {
          const product = shuffledProds[j];
          // Random weight: 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, etc.
          const weights = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3];
          const weightKg = weights[Math.floor(Math.random() * weights.length)];
          const totalPrice = Math.round(weightKg * product.pricePerKg);
          items.push({
            product,
            weightKg,
            totalPrice,
          });
          totalAmount += totalPrice;
        }

        const paidAmount = Math.ceil(totalAmount / 50000) * 50000; // Round up to nearest 50k
        const changeAmount = paidAmount - totalAmount;

        const date = new Date(txTime);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const invoiceNumber = `TGD-${y}${m}${d}-${String(count).padStart(4, '0')}`;
        count++;

        mockTxs.push({
          id: `mock-tx-${count}`,
          invoiceNumber,
          items,
          totalAmount,
          paidAmount,
          changeAmount,
          paymentMethod: Math.random() > 0.4 ? 'Tunai' : 'QRIS',
          createdAt: txTime,
        });
      }
    });

    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(mockTxs));
  },
};
