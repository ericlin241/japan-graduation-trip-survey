import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { PALETTE } from '../../utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  styleVotes: Record<string, number>;
  totalCount: number;
}

export const StylePieChart: React.FC<Props> = ({ styleVotes, totalCount }) => {
  const labels = ['都市繁華', '慢生活風景', '城鄉各半'];
  const values = labels.map((l) => styleVotes[l] || 0);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#68745D', // 都市繁華
          '#5B7B88', // 慢生活風景
          '#B87956', // 城鄉各半 (保留獨立完整類別)
        ],
        borderWidth: 2,
        borderColor: '#FFFEFA',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
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
            return ` ${context.label}: ${val} 票 (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft flex flex-col justify-between">
      <div>
        <div className="mb-1">
          <h3 className="font-bold text-base text-ink">旅行風格比例</h3>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          單選統計・「城鄉各半」獨立完整統計，未合併分類
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full flex items-center justify-center">
        {totalCount === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-ink-muted text-xs border border-dashed border-border rounded-xl bg-page/50">
            <span className="text-stone-400 mb-1 text-2xl">🌿</span>
            <span>尚無風格統計</span>
          </div>
        ) : (
          <Pie data={data} options={options} />
        )}
      </div>
    </div>
  );
};
