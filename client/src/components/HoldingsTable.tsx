import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Trash2, RefreshCw, Edit2, X, Check } from 'lucide-react';
import { Holding } from '../types';

const HoldingsTable: React.FC = () => {
    const { holdings, removeHolding, editHolding, refreshPrices, loading } = usePortfolio();

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ qty: string, avgCost: string, purchaseDate: string, owner: string }>({
        qty: '', avgCost: '', purchaseDate: '', owner: ''
    });

    const startEditing = (holding: Holding) => {
        setEditingId(holding._id || null);
        setEditForm({
            qty: holding.qty.toString(),
            avgCost: holding.avgCost.toString(),
            purchaseDate: holding.purchaseDate ? holding.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0],
            owner: holding.owner
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleSave = async (id: string) => {
        if (!id) return;
        const success = await editHolding(id, Number(editForm.qty), Number(editForm.avgCost), editForm.purchaseDate, editForm.owner);
        if (success) {
            setEditingId(null);
        }
    };

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

                                const isEditing = editingId === holding._id;

                                return (
                                    <tr key={holding._id || `${holding.ticker}-${index}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-800">{holding.ticker}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{holding.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 font-medium">
                                            {isEditing ? (
                                                <input type="text" value={editForm.owner} onChange={e => setEditForm({ ...editForm, owner: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
                                            ) : holding.owner}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {isEditing ? (
                                                <input type="date" value={editForm.purchaseDate} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
                                            ) : holding.purchaseDate ? new Date(holding.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {isEditing ? (
                                                <input type="number" min="1" value={editForm.qty} onChange={e => setEditForm({ ...editForm, qty: e.target.value })} className="w-16 px-2 py-1 border rounded text-sm" />
                                            ) : holding.qty}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {isEditing ? (
                                                <input type="number" min="0" step="0.01" value={editForm.avgCost} onChange={e => setEditForm({ ...editForm, avgCost: e.target.value })} className="w-20 px-2 py-1 border rounded text-sm" />
                                            ) : `₹${holding.avgCost.toFixed(2)}`}
                                        </td>
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
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => holding._id && handleSave(holding._id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors" title="Save">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Cancel">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => startEditing(holding)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => holding._id && removeHolding(holding._id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
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

                        const isEditing = editingId === holding._id;

                        if (isEditing) {
                            return (
                                <div key={holding._id || `${holding.ticker}-${index}`} className="p-4 bg-white border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{holding.ticker} <span className="text-xs font-normal text-slate-500">(Editing)</span></h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Owner</label>
                                            <input type="text" value={editForm.owner} onChange={e => setEditForm({ ...editForm, owner: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-500 block mb-1">Quantity</label>
                                                <input type="number" min="1" value={editForm.qty} onChange={e => setEditForm({ ...editForm, qty: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-500 block mb-1">Buy Price</label>
                                                <input type="number" min="0" step="0.01" value={editForm.avgCost} onChange={e => setEditForm({ ...editForm, avgCost: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Date</label>
                                            <input type="date" value={editForm.purchaseDate} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-2">
                                        <button onClick={() => holding._id && handleSave(holding._id)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex justify-center items-center">
                                            <Check size={16} className="mr-1" /> Save
                                        </button>
                                        <button onClick={cancelEditing} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-200 transition flex justify-center items-center">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={holding._id || `${holding.ticker}-${index}`} className="p-4 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{holding.ticker}</h3>
                                        <p className="text-xs text-slate-500 leading-tight">{holding.name}</p>
                                    </div>
                                    <div className="text-right flex space-x-2">
                                        <button
                                            onClick={() => startEditing(holding)}
                                            className="text-blue-400 hover:text-blue-600 transition-colors p-1"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => holding._id && removeHolding(holding._id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                        >
                                            <Trash2 size={18} />
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
