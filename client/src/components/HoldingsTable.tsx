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

            <div className="overflow-x-auto">
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
        </div>
    );
};

export default HoldingsTable;
