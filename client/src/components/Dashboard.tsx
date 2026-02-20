import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { totalValue, totalCost, totalPL } = usePortfolio();
    const plPercentage = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const isProfit = totalPL >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Investment</p>
                        <h3 className="text-2xl font-bold text-slate-800">₹{totalCost.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Current Value</p>
                        <h3 className="text-2xl font-bold text-slate-800">₹{totalValue.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${isProfit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total P/L</p>
                        <h3 className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {isProfit ? '+' : ''}{totalPL.toFixed(2)} ({plPercentage.toFixed(2)}%)
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
