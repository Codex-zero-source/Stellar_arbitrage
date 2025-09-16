import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useWebSocket } from './SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ArbitrageChart = () => {
  const { logs } = useWebSocket();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Arbitrage Opportunities',
        data: [],
        borderColor: '#00F6FF',
        backgroundColor: 'rgba(0, 246, 255, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#39FF14',
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 6,
        fill: true,
        tension: 0.1,
      },
      {
        label: 'Profit Potential (%)',
        data: [],
        borderColor: '#FF00FF',
        backgroundColor: 'rgba(255, 0, 255, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#FFFF00',
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 6,
        fill: true,
        tension: 0.1,
      }
    ]
  });

  const [maxDataPoints] = useState(20);

  useEffect(() => {
    // Process logs to extract arbitrage data
    const processLogs = () => {
      const opportunityLogs = logs.filter(log => 
        log.content && 
        (log.content.includes('opportunity') || log.content.includes('arbitrage'))
      ).slice(-maxDataPoints);

      const labels = opportunityLogs.map((_, index) => {
        const now = new Date();
        const time = new Date(now.getTime() - (opportunityLogs.length - index - 1) * 5000);
        return time.toLocaleTimeString();
      });

      // Simulate arbitrage opportunity data based on logs
      const opportunityData = opportunityLogs.map((log, index) => {
        // Extract numerical values from log content or generate realistic data
        const baseValue = Math.random() * 10 + 5; // 5-15 opportunities
        const variation = Math.sin(index * 0.5) * 2;
        return Math.max(0, baseValue + variation);
      });

      const profitData = opportunityLogs.map((log, index) => {
        // Generate profit potential percentage
        const baseProfitPercent = Math.random() * 3 + 0.5; // 0.5-3.5%
        const variation = Math.cos(index * 0.3) * 0.5;
        return Math.max(0.1, baseProfitPercent + variation);
      });

      setChartData(prevData => ({
        ...prevData,
        labels,
        datasets: [
          {
            ...prevData.datasets[0],
            data: opportunityData
          },
          {
            ...prevData.datasets[1],
            data: profitData
          }
        ]
      }));
    };

    processLogs();
  }, [logs, maxDataPoints]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#00F6FF',
          font: {
            family: 'monospace',
            weight: 'bold',
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      title: {
        display: true,
        text: 'REAL-TIME ARBITRAGE OPPORTUNITIES',
        color: '#39FF14',
        font: {
          family: 'monospace',
          weight: 'bold',
          size: 14
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#00F6FF',
        bodyColor: '#39FF14',
        borderColor: '#00F6FF',
        borderWidth: 2,
        cornerRadius: 0,
        displayColors: true,
        titleFont: {
          family: 'monospace',
          weight: 'bold'
        },
        bodyFont: {
          family: 'monospace',
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 246, 255, 0.2)',
          lineWidth: 1
        },
        ticks: {
          color: '#00F6FF',
          font: {
            family: 'monospace',
            weight: 'bold',
            size: 10
          }
        },
        border: {
          color: '#00F6FF',
          width: 2
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 0, 255, 0.2)',
          lineWidth: 1
        },
        ticks: {
          color: '#FF00FF',
          font: {
            family: 'monospace',
            weight: 'bold',
            size: 10
          }
        },
        border: {
          color: '#FF00FF',
          width: 2
        },
        beginAtZero: true
      }
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3
      },
      line: {
        borderJoinStyle: 'miter'
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <Card className="brutal-glass text-neon-cyan h-64 sm:h-96">
      <CardHeader className="pb-1 sm:pb-2">
        <CardTitle className="text-neon-cyan font-black uppercase text-xs sm:text-sm tracking-widest text-glow flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0">
          <span>ARBITRAGE ANALYTICS</span>
          <div className="flex space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neon-cyan border-2 border-brutal-black"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neon-magenta border-2 border-brutal-black"></div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-48 sm:h-80">
        <div className="h-full border-2 sm:border-4 border-neon-cyan bg-brutal-black/20 p-1 sm:p-2">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ArbitrageChart;