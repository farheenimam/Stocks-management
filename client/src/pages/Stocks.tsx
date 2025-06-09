import { useState } from "react";
import { useStocks } from "@/hooks/useStocks";
import { useQuery } from "@tanstack/react-query";
import StockCard from "@/components/StockCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Sector {
  sector_id: number;
  sector_name: string;
  sector_description?: string;
  performance_ytd?: string;
}

export default function Stocks() {
  const { stocks, isLoading } = useStocks();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("");

  const { data: sectors, isLoading: sectorsLoading } = useQuery<Sector[]>({
    queryKey: ['/api/sectors'],
    staleTime: 0 // Force fresh data
  });

  console.log('Sectors loaded:', sectors);

  const filteredStocks = stocks?.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === "all" || !selectedSector || stock.sector_id?.toString() === selectedSector;
    return matchesSearch && matchesSector;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Stock Market</h1>
        <p className="text-muted-foreground">
          Discover and trade stocks across different sectors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search stocks by symbol or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="trading-input"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="trading-input">
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectors?.map((sector) => (
                <SelectItem key={sector.sector_id} value={sector.sector_id.toString()}>
                  {sector.sector_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sector Performance Overview */}
      {sectorsLoading ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Sector Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="trading-card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded mb-1"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : sectors && sectors.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Sector Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {sectors.map((sector) => (
              <div key={sector.sector_id} className="trading-card p-4">
                <h4 className="font-medium text-foreground text-sm mb-1">{sector.sector_name}</h4>
                <p className={`text-lg font-bold ${
                  parseFloat(sector.performance_ytd || '0') >= 0 
                    ? 'price-positive' 
                    : 'price-negative'
                }`}>
                  {sector.performance_ytd ? `${parseFloat(sector.performance_ytd) >= 0 ? '+' : ''}${sector.performance_ytd}%` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">YTD</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Sector Performance</h3>
          <div className="trading-card p-4 text-center">
            <p className="text-muted-foreground">No sector data available</p>
          </div>
        </div>
      )}

      {/* Stock Results */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {filteredStocks.length} Stock{filteredStocks.length !== 1 ? 's' : ''} Found
        </h3>
        <div className="text-sm text-muted-foreground">
          {searchTerm && `Showing results for "${searchTerm}"`}
          {selectedSector && sectors && ` in ${sectors.find(s => s.sector_id.toString() === selectedSector)?.sector_name}`}
        </div>
      </div>

      {/* Stock Grid */}
      {filteredStocks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-muted-foreground">No stocks found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria or sector filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStocks.map((stock) => (
            <StockCard key={stock.stock_id} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
