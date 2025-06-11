// pages/TablesOverview.tsx
import { useLocation } from 'wouter';

const tables = [
  { name: 'users1', display: 'Users' },
  { name: 'sectors', display: 'Sectors' },
  { name: 'stocks', display: 'Stocks' },
  { name: 'portfolio', display: 'Portfolio' },
  { name: 'orders', display: 'Orders' },
  { name: 'transactions', display: 'Transactions' },
  { name: 'watchlists', display: 'Watchlists' },
  { name: 'stock_alerts', display: 'Stock Alerts' },
  { name: 'trading_competitions', display: 'Competitions' },
  { name: 'competition_participants', display: 'Participants' },
  { name: 'recommendations', display: 'Recommendations' },
  { name: 'user_subscriptions', display: 'Subscriptions' }
];

export default function TablesOverview() {
  const [, navigate] = useLocation();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Database Tables</h1>
        <p className="text-muted-foreground">
          Click on a table to view and manage its data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div
            key={table.name}
            className="table-card group relative p-6 rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden min-h-[120px] flex flex-col justify-between"
            onClick={() => navigate(`/tables/${table.name}`)}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-foreground">
                {table.display}
              </h3>
              <p className="text-muted-foreground text-sm mt-1 capitalize">
                {table.name.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="relative z-10 mt-4 flex justify-end">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                View
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}