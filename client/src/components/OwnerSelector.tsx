import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Users } from 'lucide-react';

const OwnerSelector: React.FC = () => {
    const { owners, selectedOwner, setSelectedOwner } = usePortfolio();

    if (owners.length <= 1) return null; // Only show if more than 1 owner exists

    return (
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm ml-auto">
            <Users size={16} className="text-slate-500" />
            <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none focus:ring-0 cursor-pointer"
            >
                <option value="All">All Portfolios</option>
                {owners.map(owner => (
                    <option key={owner} value={owner}>{owner}'s Portfolio</option>
                ))}
            </select>
        </div>
    );
};

export default OwnerSelector;
