import React, { useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Trash2, RefreshCw } from 'lucide-react';

const HoldingsTable: React.FC = () => {
    const { holdings, removeHolding, refreshPrices, loading } = usePortfolio();

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshPrices();
        }, 60000);
        return () => clearInterval(interval);
    }, [refreshPrices]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Your Holdings</h2>
                <button
                    onClick={() => refreshPrices()}
                    disabled={loading}
                    className="text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-slate-50"
                    title="Refresh Prices"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-4">Symbol</th>
                            <th className="px-6 py-4">Owner</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Buy Price</th>
                            <th className="px-6 py-4">LTP</th>
                            <th className="px-6 py-4">Current Value</th>
                            <th className="px-6 py-4">P/L</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {holdings.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                                    No holdings found. Add some to get started!
                                </td>
                            </tr>
                        ) : (
                            holdings.map((holding, index) => {
                                const currentValue = holding.qty * holding.currentPrice;
                                const investment = holding.qty * holding.avgCost;
                                const pl = currentValue - investment;
                                const plPercent = investment > 0 ? (pl / investment) * 100 : 0;
                                const isProfit = pl >= 0;

                                return (
                                    <tr key={holding._id || `${holding.ticker}-${index}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-800">{holding.ticker}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{holding.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 font-medium">
                                            {holding.owner}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {holding.purchaseDate ? new Date(holding.purchaseDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{holding.qty}</td>
                                        <td className="px-6 py-4 text-slate-600">₹{holding.avgCost.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">₹{holding.currentPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">₹{currentValue.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <div className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                {isProfit ? '+' : ''}{pl.toFixed(2)}
                                            </div>
                                            <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                ({plPercent.toFixed(2)}%)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => holding._id && removeHolding(holding._id)}
                                                className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
                {holdings.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No holdings found. Add some to get started!
                    </div>
                ) : (
                    holdings.map((holding, index) => {
                        const currentValue = holding.qty * holding.currentPrice;
                        const investment = holding.qty * holding.avgCost;
                        const pl = currentValue - investment;
                        const plPercent = investment > 0 ? (pl / investment) * 100 : 0;
                        const isProfit = pl >= 0;

                        return (
                            <div key={holding._id || `${holding.ticker}-${index}`} className="p-4 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{holding.ticker}</h3>
                                        <p className="text-xs text-slate-500 leading-tight">{holding.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <button
                                            onClick={() => holding._id && removeHolding(holding._id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
                                            {holding.owner}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {holding.qty} shares @ ₹{holding.avgCost.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-800">LTP: ₹{holding.currentPrice.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="mt-3 bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5">Current Value</p>
                                        <p className="font-semibold text-slate-800">₹{currentValue.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 mb-0.5">Total P/L</p>
                                        <p className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                            {isProfit ? '+' : ''}{pl.toFixed(2)} ({plPercent.toFixed(2)}%)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default HoldingsTable;
