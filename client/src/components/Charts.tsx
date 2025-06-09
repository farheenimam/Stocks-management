import { useEffect, useRef } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface SectorAllocation {
  sector_name: string;
  sector_value: number;
  stock_count: number;
}

export function Charts() {
  const { portfolio } = usePortfolio();
  const portfolioChartRef = useRef<HTMLCanvasElement>(null);
  const performanceChartRef = useRef<HTMLCanvasElement>(null);
  const portfolioChartInstance = useRef<Chart | null>(null);
  const performanceChartInstance = useRef<Chart | null>(null);

  const { data: sectorAllocation } = useQuery<SectorAllocation[]>({
    queryKey: ['/api/portfolio/sector-allocation']
  });

  // Portfolio Allocation Chart
  useEffect(() => {
    if (!portfolioChartRef.current || !portfolio || portfolio.length === 0) return;

    // Destroy existing chart
    if (portfolioChartInstance.current) {
      portfolioChartInstance.current.destroy();
    }

    const ctx = portfolioChartRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate portfolio allocation
    const totalValue = portfolio.reduce((sum, holding) => {
      return sum + (holding.quantity_owned * holding.current_price);
    }, 0);

    const portfolioData = portfolio.map(holding => ({
      label: holding.symbol,
      value: holding.quantity_owned * holding.current_price,
      percentage: ((holding.quantity_owned * holding.current_price) / totalValue) * 100
    })).sort((a, b) => b.value - a.value);

    // Take top 5 holdings and group others
    const topHoldings = portfolioData.slice(0, 5);
    const otherHoldings = portfolioData.slice(5);
    const otherValue = otherHoldings.reduce((sum, holding) => sum + holding.value, 0);

    const chartData = [...topHoldings];
    if (otherValue > 0) {
      chartData.push({
        label: 'Others',
        value: otherValue,
        percentage: (otherValue / totalValue) * 100
      });
    }

    const colors = [
      'hsl(214, 90%, 17%)',  // primary-blue
      'hsl(138, 62%, 47%)',  // success-green
      'hsl(207, 70%, 59%)',  // sky-blue
      'hsl(45, 87%, 55%)',   // accent-gold
      'hsl(0, 73%, 41%)',    // danger-red
      'hsl(210, 22%, 22%)'   // charcoal-gray
    ];

    portfolioChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.map(item => item.label),
        datasets: [{
          data: chartData.map(item => item.value),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const item = chartData[context.dataIndex];
                return `${context.label}: $${item.value.toLocaleString()} (${item.percentage.toFixed(1)}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }, [portfolio]);

  // Performance Chart
  useEffect(() => {
    if (!performanceChartRef.current) return;

    // Destroy existing chart
    if (performanceChartInstance.current) {
      performanceChartInstance.current.destroy();
    }

    const ctx = performanceChartRef.current.getContext('2d');
    if (!ctx) return;

    // Generate sample performance data for demonstration
    // In a real app, this would come from historical portfolio data
    const generatePerformanceData = () => {
      const data = [];
      const labels = [];
      const startValue = 10000;
      let currentValue = startValue;

      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Simulate some portfolio growth with volatility
        const dailyChange = (Math.random() - 0.45) * 100; // Slight upward bias
        currentValue += dailyChange;
        data.push(Math.max(currentValue, startValue * 0.8)); // Prevent going too low
      }

      return { labels, data };
    };

    const { labels, data } = generatePerformanceData();

    performanceChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Portfolio Value',
          data,
          borderColor: 'hsl(138, 62%, 47%)', // success-green
          backgroundColor: 'hsla(138, 62%, 47%, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(138, 62%, 47%)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'hsl(138, 62%, 47%)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `Portfolio: $${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 6,
              font: {
                size: 11
              },
              color: 'hsl(215, 13%, 48%)'
            }
          },
          y: {
            display: true,
            grid: {
              color: 'hsla(214, 32%, 91%, 0.5)'
            },
            ticks: {
              callback: function(value) {
                return '$' + (value as number).toLocaleString();
              },
              font: {
                size: 11
              },
              color: 'hsl(215, 13%, 48%)'
            }
          }
        }
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (portfolioChartInstance.current) {
        portfolioChartInstance.current.destroy();
      }
      if (performanceChartInstance.current) {
        performanceChartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <>
      <div className="trading-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Allocation</h3>
        <div className="relative h-64">
          {portfolio && portfolio.length > 0 ? (
            <canvas ref={portfolioChartRef}></canvas>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-muted-foreground">No portfolio data</p>
                <p className="text-sm text-muted-foreground">Start trading to see your allocation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="trading-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Overview</h3>
        <div className="relative h-64">
          <canvas ref={performanceChartRef}></canvas>
        </div>
      </div>
    </>
  );
}
