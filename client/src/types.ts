export interface Holding {
    _id?: string; // MongoDB ID
    ticker: string;
    qty: number;
    avgCost: number;
    currentPrice: number;
    name: string;
    purchaseDate: string; // ISO date string
    owner: string;
    previousClose: number; // For Today's P/L
}

export interface PortfolioContextType {
    holdings: Holding[];
    addHolding: (ticker: string, qty: number, price: number, date: string, owner: string) => Promise<boolean>; // Returns success status
    editHolding: (id: string, qty: number, price: number, date: string, owner: string) => Promise<boolean>;
    searchTicker: (query: string) => Promise<any[]>;
    removeHolding: (id: string) => void;
    refreshPrices: () => Promise<void>;
    loading: boolean;
    totalValue: number;
    totalCost: number;
    totalPL: number;
    todaysPL: number;
    selectedOwner: string;
    setSelectedOwner: (owner: string) => void;
    owners: string[];
    lastUpdated: string | null;
}
