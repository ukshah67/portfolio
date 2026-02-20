import { PortfolioProvider } from './context/PortfolioContext';
import Dashboard from './components/Dashboard';
import AddHoldingForm from './components/AddHoldingForm';
import HoldingsTable from './components/HoldingsTable';
import PortfolioChart from './components/PortfolioChart';
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
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard />
          <PortfolioChart />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <HoldingsTable />
            </div>
            <div>
              <AddHoldingForm />
            </div>
          </div>
        </main>
      </div>
    </PortfolioProvider>
  );
}

export default App;
