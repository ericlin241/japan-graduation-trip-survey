import React, { useState, useMemo } from 'react';
import { SurveyResponse, SurveyStats } from '../types';
import { generateItineraries } from '../utils/itineraryAlgorithm';
import { downloadResponsesCsv } from '../utils/exportCsv';
import { RegionsBarChart } from './Charts/RegionsBarChart';
import { DaysDoughnutChart } from './Charts/DaysDoughnutChart';
import { StylePieChart } from './Charts/StylePieChart';
import { TransportBarChart } from './Charts/TransportBarChart';
import { ItineraryRecommendations } from './ItineraryRecommendations';
import { ResponsesTable } from './ResponsesTable';
import { AdminModal } from './AdminModal';
import { Download, RefreshCw, BarChart2 } from 'lucide-react';

interface Props {
  responses: SurveyResponse[];
  stats: SurveyStats;
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteResponse: (id: string, adminKey: string) => Promise<{ success: boolean; error?: string }>;
  onNavigateToForm: () => void;
}

export const StatsTab: React.FC<Props> = ({
  responses,
  stats,
  isLoading,
  onRefresh,
  onDeleteResponse,
  onNavigateToForm,
}) => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Compute proposals dynamically from real responses
  const proposals = useMemo(() => {
    return generateItineraries(responses);
  }, [responses]);

  const handleExportCsv = () => {
    try {
      window.open('/api/export', '_blank');
    } catch {
      downloadResponsesCsv(responses);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">即時調查統計總覽</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-light text-primary font-bold">
              全體共 {stats.totalCount} 筆填答
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            資料儲存於 Cloudflare D1 雲端資料庫，跨裝置即時同步更新
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-page hover:bg-stone-100 text-ink transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : 'text-stone-500'}`} />
            <span>重新整理</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={responses.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出 CSV 報表</span>
          </button>
        </div>
      </div>

      {/* 1. Dynamic Itinerary Recommendations (Top 3) */}
      <section>
        <ItineraryRecommendations
          proposals={proposals}
          totalCount={stats.totalCount}
          onNavigateToForm={onNavigateToForm}
        />
      </section>

      {/* 2. Four Statistical Charts */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-ink">詳細意向統計圖表</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Regions horizontal bar chart */}
          <RegionsBarChart
            regionVotes={stats.regionVotes}
            totalCount={stats.totalCount}
            totalRegionVotes={stats.totalRegionVotes}
          />

          {/* Chart 2: Days doughnut chart */}
          <DaysDoughnutChart
            daysVotes={stats.daysVotes}
            totalCount={stats.totalCount}
          />

          {/* Chart 3: Travel style pie chart */}
          <StylePieChart
            styleVotes={stats.styleVotes}
            totalCount={stats.totalCount}
          />

          {/* Chart 4: Transport & Driver volunteers bar chart */}
          <TransportBarChart
            transportVotes={stats.transportVotes}
            totalCount={stats.totalCount}
          />
        </div>
      </section>

      {/* 3. Member Responses Table */}
      <section className="space-y-4 pt-4">
        <ResponsesTable
          responses={responses}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
        />
      </section>

      {/* Admin Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        responses={responses}
        onDelete={onDeleteResponse}
      />
    </div>
  );
};
