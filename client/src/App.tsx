import { PortfolioProvider } from './context/PortfolioContext';
import Dashboard from './components/Dashboard';
import AddHoldingForm from './components/AddHoldingForm';
import HoldingsTable from './components/HoldingsTable';
import PortfolioChart from './components/PortfolioChart';
import DailyPLChart from './components/DailyPLChart';
import OwnerSelector from './components/OwnerSelector';
import { LineChart } from 'lucide-react';

function App() {
  return (
    <PortfolioProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <LineChart size={24} />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                Portfolio Manager
              </h1>
            </div>
            {/* The new owner selector that uses Context (must be inside Provider ideally, so moved down) */}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Owner selector right above dashboard */}
          <div className="mb-4 flex justify-end">
            <OwnerSelector />
          </div>

          <Dashboard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <PortfolioChart />
            <DailyPLChart />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3 order-1 lg:order-1">
              <HoldingsTable />
            </div>
            {/* Placing it last in the DOM means on mobile flex-col it appears at the bottom! */}
            <div className="w-full lg:w-1/3 order-2 lg:order-2">
              <AddHoldingForm />
            </div>
          </div>
        </main>
      </div>
    </PortfolioProvider>
  );
}

export default App;
