// pages/TablePage.tsx
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

interface TableData {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

export default function TablePage() {
  const [location] = useLocation();
  const tableName = location.split('/').pop();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: tableData, isLoading, error } = useQuery({
    queryKey: [`/api/tables/${tableName}`, { page, limit }],
    queryFn: async () => {
      console.log('Fetching table data for:', tableName); // Debug log
      
      // Handle the trading_competitions route specifically
      if (tableName === 'trading_competitions') {
        const response = await apiRequest('GET', `/api/tables/trading_competitions`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }
      
       // Handle the users1 route specifically
      if (tableName === 'users1') {
        const response = await apiRequest('GET', `/api/tables/users1`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

        
       // Handle the sectors route specifically
      if (tableName === 'sectors') {
        const response = await apiRequest('GET', `/api/tables/sectors`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }
      
      // Handle the competition_participants route specifically
      if (tableName === 'competition_participants') {
        const response = await apiRequest('GET', `/api/tables/competition_participants`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

      // Handle the stocks route specifically
      if (tableName === 'stocks') {
        const response = await apiRequest('GET', `/api/tables/stocks`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

       // Handle the stocks route specifically
      if (tableName === 'portfolio') {
        const response = await apiRequest('GET', `/api/tables/portfolio`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

      // Handle the recommendations route specifically
      if (tableName === 'recommendations') {
        const response = await apiRequest('GET', `/api/tables/recommendations`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

       // Handle the orders route specifically
      if (tableName === 'orders') {
        const response = await apiRequest('GET', `/api/tables/orders`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

        // Handle the transactions route specifically
      if (tableName === 'transactions') {
        const response = await apiRequest('GET', `/api/tables/transactions`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

         // Handle the transactions route specifically
      if (tableName === 'watchlists') {
        const response = await apiRequest('GET', `/api/tables/watchlists`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

          // Handle the transactions route specifically
      if (tableName === 'stock_alerts') {
        const response = await apiRequest('GET', `/api/tables/stock_alerts`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

            // Handle the transactions route specifically
      if (tableName === 'user_subscriptions') {
        const response = await apiRequest('GET', `/api/tables/user_subscriptions`);
        const competitions = await response.json();
        
        // Transform the response to match expected format
        return {
          data: competitions,
          total: competitions.length,
          page: 1,
          limit: competitions.length
        };
      }

      // For other tables, use the original pagination approach
      const response = await apiRequest(
        'GET',
        `/api/tables/${tableName}?page=${page}&limit=${limit}`
      );
      return await response.json();
    },
    enabled: !!tableName
  });

  if (!tableName) {
    return (
      <div className="p-6">
        <div className="trading-card">
          <h2 className="text-xl font-semibold mb-4">No Table Selected</h2>
          <p className="text-muted-foreground">Please select a table to view its data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="trading-card">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading {tableName.replace(/_/g, ' ')} data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="trading-card">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-danger-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-danger-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
            <p className="text-danger-red mb-4">Failed to load table data: {error.message}</p>
            <p className="text-sm text-muted-foreground">Table: {tableName}</p>
          </div>
        </div>
      </div>
    );
  }

  const columns = tableData?.data?.length > 0 ? Object.keys(tableData.data[0]) : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground capitalize">
          {tableName.replace(/_/g, ' ')}
        </h1>
        <p className="text-muted-foreground">
          {tableData?.total || 0} entries in this table
        </p>
      </div>

      {tableData?.data?.length > 0 ? (
        <div className="trading-card">
          <div className="overflow-x-auto mb-6">
            <table className="trading-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>
                      {col.replace(/_/g, ' ').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.data.map((row: any, index: number) => (
                  <tr key={index}>
                    {columns.map((col) => (
                      <td key={col}>
                        {formatCellValue(row[col], col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - only show if we have pagination data */}
          {tableData.total > limit && (
            <div className="flex justify-between items-center">
              <div>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="trading-button-secondary px-4 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(tableData.total / limit)}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(tableData.total / limit), p + 1))}
                  disabled={page >= Math.ceil(tableData.total / limit)}
                  className="trading-button-secondary px-4 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="trading-card">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground">No data found in the {tableName.replace(/_/g, ' ')} table</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format cell values
function formatCellValue(value: any, columnName: string): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Format dates
  if (columnName.includes('date') || columnName.includes('created') || columnName.includes('updated')) {
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(value);
    }
  }
  
  // Format currency/money fields
  if (columnName.includes('price') || columnName.includes('amount') || columnName.includes('value')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(num);
    }
  }
  
  // Format percentages
  if (columnName.includes('percent') || columnName.includes('rate')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `${num.toFixed(2)}%`;
    }
  }
  
  return String(value);
}