import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { REGIONS, PALETTE } from '../../utils/constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  regionVotes: Record<string, number>;
  totalCount: number;
  totalRegionVotes: number;
}

export const RegionsBarChart: React.FC<Props> = ({
  regionVotes,
  totalCount,
  totalRegionVotes,
}) => {
  // Sort descending, stable tie-break by original REGIONS order
  const sortedRegions = [...REGIONS].sort((a, b) => {
    const diff = (regionVotes[b] || 0) - (regionVotes[a] || 0);
    if (diff !== 0) return diff;
    return REGIONS.indexOf(a) - REGIONS.indexOf(b);
  });

  const votesData = sortedRegions.map((reg) => regionVotes[reg] || 0);
  const maxVote = Math.max(...votesData, 1);

  const data = {
    labels: sortedRegions,
    datasets: [
      {
        label: '得票數',
        data: votesData,
        backgroundColor: [
          '#68745D',
          '#7E8B71',
          '#B87956',
          '#C88E6E',
          '#5B7B88',
          '#8A9A86'
        ],
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const count = context.parsed.x || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return ` ${count} 票 (${pct}% 的填答者推薦)`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: Math.max(maxVote + 1, 5),
        ticks: {
          stepSize: 1,
          font: { family: 'Noto Sans TC', size: 11 },
          color: PALETTE.muted,
        },
        grid: {
          color: '#F0ECE4',
        },
      },
      y: {
        ticks: {
          font: { family: 'Noto Sans TC', size: 12, weight: '500' },
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
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base text-ink">地區偏好票數排行</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
            橫向長條圖
          </span>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          每人最多選三處・總有效票數：<strong>{totalRegionVotes}</strong> 票 / 填答總人數：<strong>{totalCount}</strong> 人
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {totalCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-muted text-xs border border-dashed border-border rounded-xl bg-page/50">
            <span className="text-stone-400 mb-1 text-2xl">🗾</span>
            <span>尚無填答資料，等待第一位同學投票</span>
          </div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </div>
  );
};
