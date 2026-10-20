import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PALETTE } from '../../utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  daysVotes: Record<string, number>;
  totalCount: number;
}

export const DaysDoughnutChart: React.FC<Props> = ({ daysVotes, totalCount }) => {
  const labels = ['5 天', '7 天', '9 天'];
  const values = labels.map((l) => daysVotes[l] || 0);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#68745D', // Primary sage
          '#B87956', // Warm terra
          '#5B7B88', // Slate blue
        ],
        borderWidth: 2,
        borderColor: '#FFFEFA',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Noto Sans TC', size: 12 },
          color: PALETTE.ink,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            const pct = totalCount > 0 ? Math.round((val / totalCount) * 100) : 0;
            return ` ${context.label}: ${val} 人 (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft flex flex-col justify-between">
      <div>
        <div className="mb-1">
          <h3 className="font-bold text-base text-ink">行程天數比例</h3>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          單選統計・依有效填答人數為分母
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full flex items-center justify-center relative">
        {totalCount === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-ink-muted text-xs border border-dashed border-border rounded-xl bg-page/50">
            <span className="text-stone-400 mb-1 text-2xl">⏳</span>
            <span>尚無天數統計</span>
          </div>
        ) : (
          <>
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xs text-ink-muted">總人數</span>
              <span className="text-2xl font-bold text-ink">{totalCount}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
