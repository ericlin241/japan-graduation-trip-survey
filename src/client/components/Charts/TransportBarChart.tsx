import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PALETTE } from '../../utils/constants';
import { Train, Car, UserCheck } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  transportVotes: {
    publicTransport: number;
    rentalCar: number;
    willingDrivers: number;
  };
  totalCount: number;
}

export const TransportBarChart: React.FC<Props> = ({
  transportVotes,
  totalCount,
}) => {
  const { publicTransport, rentalCar, willingDrivers } = transportVotes;

  const data = {
    labels: ['大眾運輸偏好', '租車自駕偏好', '願意擔任駕駛者'],
    datasets: [
      {
        label: '人數',
        data: [publicTransport, rentalCar, willingDrivers],
        backgroundColor: [
          '#68745D', // Public transport - primary sage
          '#B87956', // Rental car - warm terra
          '#4A6B82', // Willing drivers - distinct blue
        ],
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  };

  const maxVal = Math.max(publicTransport, rentalCar, willingDrivers, 1);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${val} 人`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(maxVal + 1, 4),
        ticks: {
          stepSize: 1,
          font: { family: 'Noto Sans TC', size: 11 },
          color: PALETTE.muted,
        },
        grid: {
          color: '#F0ECE4',
        },
      },
      x: {
        ticks: {
          font: { family: 'Noto Sans TC', size: 11, weight: '500' },
          color: PALETTE.ink,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft flex flex-col justify-between">
      <div>
        <div className="mb-1">
          <h3 className="font-bold text-base text-ink">交通方式與駕駛志願者</h3>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          明確區分「想搭車自駕」與「具備意願親自駕駛」人數
        </p>
      </div>

      <div className="h-52 w-full">
        {totalCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-muted text-xs border border-dashed border-border rounded-xl bg-page/50">
            <span className="text-stone-400 mb-1 text-2xl">🚗</span>
            <span>尚無交通偏好資料</span>
          </div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>

      {/* Numerical Badge Breakdown */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border-subtle">
        <div className="bg-page/70 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-ink-muted mb-0.5">
            <Train className="w-3.5 h-3.5 text-primary" />
            <span>大眾運輸</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-ink">{publicTransport} <span className="text-xs font-normal">人</span></div>
        </div>

        <div className="bg-page/70 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-ink-muted mb-0.5">
            <Car className="w-3.5 h-3.5 text-secondary" />
            <span>自駕偏好</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-ink">{rentalCar} <span className="text-xs font-normal">人</span></div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-blue-800 mb-0.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>駕駛志願</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-900">{willingDrivers} <span className="text-xs font-normal">人</span></div>
        </div>
      </div>
    </div>
  );
};
