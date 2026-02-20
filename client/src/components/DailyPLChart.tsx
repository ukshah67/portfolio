import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
    date: string;
    totalValue: number;
}

const DailyPLChart: React.FC = () => {
    const { holdings, loading: contextLoading } = usePortfolio();
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

    useEffect(() => {
        const fetchHistory = async () => {
            if (holdings.length === 0) {
                setChartData([]);
                return;
            }

            setLoading(true);
            try {
                // Get unique tickers from the filtered holdings
                const tickers = Array.from(new Set(holdings.map(h => h.ticker)));

                const response = await fetch(`${API_URL}/api/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tickers, range: '1mo' })
                });

                if (!response.ok) throw new Error('Failed to fetch history');

                const data: any[] = await response.json();

                // Aggregate data by date
                const dateMap = new Map<string, number>();

                data.forEach(stockData => {
                    const ticker = stockData.ticker;
                    // Find all holdings for this ticker (to sum quantities)
                    const relevantHoldings = holdings.filter(h => h.ticker === ticker);
                    const totalQty = relevantHoldings.reduce((sum, h) => sum + h.qty, 0);

                    if (stockData.data && Array.isArray(stockData.data)) {
                        stockData.data.forEach((day: any) => {
                            if (!day.date || !day.close) return;
                            const dateStr = new Date(day.date).toLocaleDateString();

                            const dayValue = day.close * totalQty;

                            if (dateMap.has(dateStr)) {
                                dateMap.set(dateStr, dateMap.get(dateStr)! + dayValue);
                            } else {
                                dateMap.set(dateStr, dayValue);
                            }
                        });
                    }
                });

                // Convert map to sorted array
                const finalData: ChartDataPoint[] = Array.from(dateMap.entries())
                    .map(([date, totalValue]) => ({ date, totalValue }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setChartData(finalData);

            } catch (error) {
                console.error("Error building historical chart:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!contextLoading) {
            fetchHistory();
        }
    }, [holdings, contextLoading, API_URL]);

    if (holdings.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">30-Day Portfolio Value</h3>
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading historical data...</div>
            ) : chartData.length > 0 ? (
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                minTickGap={30}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                domain={['auto', 'auto']}
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Value']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="totalValue"
                                stroke="#2563EB"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">Not enough historical data.</div>
            )}
        </div>
    );
};

export default DailyPLChart;
