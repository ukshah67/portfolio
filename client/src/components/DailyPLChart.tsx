import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { Holding } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartDataPoint {
    date: string;
    displayDate?: string;
    totalValue: number;
    [key: string]: any; // Allow dynamic ticker keys
}

const DailyPLChart: React.FC = () => {
    const { holdings, loading: contextLoading } = usePortfolio();
    const { token, logout } = useAuth();

    // Create a map of purchase events by date string (YYYY-MM-DD)
    const purchaseEvents = holdings.reduce((acc, holding) => {
        if (!holding.purchaseDate) return acc;
        const dateStr = new Date(holding.purchaseDate).toISOString().split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(holding);
        return acc;
    }, {} as Record<string, Holding[]>);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState<'7d' | '30d' | '120d' | '180d'>('30d');
    const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

    const API_URL = import.meta.env.VITE_API_URL || 'https://portfolio-backend-6tqz.onrender.com';

    // Initialize hidden lines (hide all individual stocks by default)
    useEffect(() => {
        const initialHiddenState: Record<string, boolean> = {};
        const uniqueTickers = Array.from(new Set(holdings.map(h => h.ticker)));
        uniqueTickers.forEach(ticker => {
            initialHiddenState[ticker] = true;
        });
        setHiddenLines(initialHiddenState);
    }, [holdings]);

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
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ tickers, range })
                });

                if (response.status === 401 || response.status === 403) logout();
                if (!response.ok) throw new Error('Failed to fetch history');

                const data: any[] = await response.json();

                // Aggregate data by date
                const dateMap = new Map<string, ChartDataPoint>();

                data.forEach(stockData => {
                    const ticker = stockData.ticker;
                    // Find all holdings for this ticker (to sum quantities)
                    const relevantHoldings = holdings.filter(h => h.ticker === ticker);
                    const totalQty = relevantHoldings.reduce((sum, h) => sum + h.qty, 0);

                    if (stockData.data && Array.isArray(stockData.data)) {
                        stockData.data.forEach((day: any) => {
                            if (!day.date || !day.close) return;
                            const dateObj = new Date(day.date);
                            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                            const displayDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

                            const dayValue = day.close * totalQty;

                            if (!dateMap.has(dateKey)) {
                                dateMap.set(dateKey, { date: dateKey, displayDate, totalValue: 0 });
                            }

                            const existing = dateMap.get(dateKey)!;
                            // Prevent double-counting if API returns multiple intraday points for the same date
                            if (existing[ticker] !== undefined) {
                                existing.totalValue -= existing[ticker];
                            }
                            existing.totalValue += dayValue;
                            existing[ticker] = dayValue; // Save individual stock value
                        });
                    }
                });

                // Convert map to sorted array
                const finalData: ChartDataPoint[] = Array.from(dateMap.values())
                    .sort((a, b) => a.date.localeCompare(b.date));

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
    }, [holdings, contextLoading, API_URL, range]);



    // Modified click handler for legend (we do it inside the custom legend instead, but need to attach onClick manually if not using wrapper)
    // Actually the <label> with onClick handles it best. Let's update renderLegend to use onClick
    const renderInteractiveLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-slate-100">
                {payload.map((entry: any, index: number) => {
                    const dataKey = entry.dataKey;
                    const currentlyHidden = hiddenLines[dataKey] ?? (dataKey === 'totalValue' ? false : true);

                    return (
                        <div key={`item-${index}`} className="flex items-center space-x-2 cursor-pointer group" onClick={() => {
                            setHiddenLines(prev => ({
                                ...prev,
                                [dataKey]: !currentlyHidden
                            }));
                        }}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${!currentlyHidden ? 'border-transparent' : 'border-slate-300 bg-white'}`} style={{ backgroundColor: !currentlyHidden ? entry.color : undefined }}>
                                {!currentlyHidden && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-sm font-medium transition-colors ${!currentlyHidden ? 'text-slate-800' : 'text-slate-400'}`}>
                                {entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (holdings.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Portfolio Performance</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                    {(['7d', '30d', '120d', '180d'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            disabled={loading}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${range === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading historical data...</div>
            ) : chartData.length > 0 ? (
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="displayDate"
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
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        // Find original date key from payload
                                        const dataPoint = payload[0].payload;
                                        const rawDate = dataPoint.date; // YYYY-MM-DD
                                        const events = purchaseEvents[rawDate];

                                        return (
                                            <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                                                <p className="font-semibold text-slate-800 mb-2">{label}</p>
                                                {payload.map((entry: any, index: number) => {
                                                    const name = entry.name === 'totalValue' ? 'Total Portfolio' : entry.name;
                                                    const color = entry.color;
                                                    return (
                                                        <div key={`item-${index}`} className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                                                            <span className="font-medium">{name}:</span>
                                                            <span>₹{Number(entry.value).toFixed(2)}</span>
                                                        </div>
                                                    );
                                                })}
                                                {events && events.length > 0 && (
                                                    <div className="mt-3 pt-2 border-t border-slate-100">
                                                        <p className="text-xs font-bold text-blue-600 mb-1">Purchase Events</p>
                                                        {events.map((ev, i) => (
                                                            <div key={i} className="text-xs text-slate-700 bg-blue-50 p-1.5 rounded mb-1">
                                                                <span className="font-semibold">{ev.ticker}</span> - Bought {ev.qty} @ ₹{ev.avgCost.toFixed(2)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                content={renderInteractiveLegend}
                            />
                            <Line
                                type="monotone"
                                dataKey="totalValue"
                                name="Total Portfolio"
                                stroke="#2563EB"
                                strokeWidth={3}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const events = purchaseEvents[payload.date];
                                    if (events && events.length > 0) {
                                        return (
                                            <circle cx={cx} cy={cy} r={5} stroke="#fff" strokeWidth={2} fill="#2563EB" key={`dot-${payload.date}`} />
                                        );
                                    }
                                    return <svg key={`blank-${payload.date}`}></svg>;
                                }}
                                activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                                hide={hiddenLines['totalValue'] === true}
                            />
                            {/* Dynamically render a line for each ticker */}
                            {Array.from(new Set(holdings.map(h => h.ticker))).map((ticker, index) => {
                                // Generate a color based on index
                                const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
                                const color = colors[index % colors.length];

                                return (
                                    <Line
                                        key={ticker}
                                        type="monotone"
                                        dataKey={ticker}
                                        name={ticker}
                                        stroke={color}
                                        strokeWidth={1.5}
                                        dot={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            const events = purchaseEvents[payload.date]?.filter(e => e.ticker === ticker);
                                            if (events && events.length > 0) {
                                                return (
                                                    <circle cx={cx} cy={cy} r={4} stroke="#fff" strokeWidth={1.5} fill={color} key={`dot-${ticker}-${payload.date}`} />
                                                );
                                            }
                                            return <svg key={`blank-${ticker}-${payload.date}`}></svg>;
                                        }}
                                        activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
                                        hide={hiddenLines[ticker] ?? true} // Default hide, check state
                                    />
                                );
                            })}
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
