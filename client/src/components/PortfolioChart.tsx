import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../context/PortfolioContext';

const PortfolioChart: React.FC = () => {
    const { totalCost, totalValue } = usePortfolio();

    const data = [
        {
            name: 'Portfolio',
            Invested: totalCost,
            Current: totalValue,
        },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 h-96">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Investment Overview</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                        formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(2)}`, '']}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Legend />
                    <Bar dataKey="Invested" fill="#cbd5e1" name="Invested Amount" radius={[4, 4, 0, 0]} barSize={80} />
                    <Bar dataKey="Current" fill={totalValue >= totalCost ? '#10b981' : '#ef4444'} name="Current Value" radius={[4, 4, 0, 0]} barSize={80} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioChart;
