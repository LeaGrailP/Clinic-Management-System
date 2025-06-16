// types/electron.d.ts

export interface Transaction {
  date: string;
  total: number;
  items: any[]; // You can replace this with a stricter type
}

interface ElectronAPI {
  insertTransaction: (data: Transaction) => Promise<boolean>;
  getTransactions: () => Promise<Transaction[]>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}