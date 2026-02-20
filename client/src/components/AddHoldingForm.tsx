import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { PlusCircle, Search } from 'lucide-react';

const AddHoldingForm: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { addHolding, searchTicker, loading } = usePortfolio();
    const [ticker, setTicker] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [owner, setOwner] = useState('');

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            console.log('Debounce triggered for:', ticker);
            if (ticker.length > 1) { // lowered from 2 to 1 for faster feedback
                console.log('Calling searchTicker...');
                const results = await searchTicker(ticker);
                console.log('Search results:', results);
                setSuggestions(results);
                if (results.length > 0) {
                    setShowDropdown(true);
                }
            } else {
                setSuggestions([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [ticker, searchTicker]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // We can check if click is inside the form or specific container, 
            // but for simplicity, if we click anywhere outside the suggestion box and input, close it.
            // Actually, simplest is to delay close on blur is okay, but user said it's not showing.
            // Let's remove the onBlur and use this.
            const target = event.target as HTMLElement;
            if (!target.closest('.search-container')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker || !qty || !price || !date || !owner.trim()) return;
        setError(null);
        setShowDropdown(false);

        const success = await addHolding(ticker.toUpperCase(), Number(qty), Number(price), date, owner);

        if (success) {
            setTicker('');
            setQty('');
            setPrice('');
            setDate(new Date().toISOString().split('T')[0]);
            setOwner('');
            setSuggestions([]);
            setSuggestions([]);
        } else {
            setError(`Invalid ticker "${ticker}". Please select a valid ticker from the suggestions.`);
        }
    };

    const handleSuggestionClick = (symbol: string) => {
        setTicker(symbol);
        setError(null);
        setShowDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        console.log('Key pressed:', e.key, 'Dropdown:', showDropdown, 'Suggestions:', suggestions.length);
        if (e.key === 'Tab' && showDropdown && suggestions.length > 0) {
            // e.preventDefault(); // Optional: uncomment if we want to prevent focus shift
            const firstSuggestion = suggestions[0];
            console.log('Auto-selecting:', firstSuggestion.symbol);
            setTicker(firstSuggestion.symbol);
            setError(null);
            setShowDropdown(false);
            // Default tab behavior will move focus to next input
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <PlusCircle className="mr-2" size={20} />
                Add New Holding
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <label className="block text-base font-semibold text-slate-700 mb-2">Ticker Symbol (NSE)</label>
                    <div className="relative search-container">
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. RELIANCE.NS"
                            className="w-full pl-12 pr-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold uppercase shadow-sm"
                            autoComplete="off"
                        />
                        <Search className="absolute left-4 top-5 text-slate-400" size={24} />

                        {showDropdown && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                                {suggestions.map((s) => (
                                    <button
                                        key={s.symbol}
                                        type="button"
                                        onClick={() => handleSuggestionClick(s.symbol)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                    >
                                        <div>
                                            <span className="font-bold text-slate-800">{s.symbol}</span>
                                            <span className="ml-2 text-sm text-slate-500">{s.shortname || s.longname}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-white">{s.exchange}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {error && (
                        <p className="mt-2 text-red-500 text-sm font-medium">{error}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Quantity</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="0"
                            min="1"
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Buy Price (₹)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Date of Purchase</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">Portfolio Owner</label>
                        <input
                            type="text"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium shadow-sm"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !ticker || !qty || !price}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2"
                >
                    {loading ? 'Adding to Portfolio...' : 'Add Holding'}
                </button>
            </form>
        </div>
    );
};

export default AddHoldingForm;
