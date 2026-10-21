import React, { useState, useMemo, useEffect } from 'react';
import { SurveyResponse, SurveyStats } from '../types';
import { generateItineraries } from '../utils/itineraryAlgorithm';
import { downloadResponsesCsv } from '../utils/exportCsv';
import { RegionsBarChart } from './Charts/RegionsBarChart';
import { DaysDoughnutChart } from './Charts/DaysDoughnutChart';
import { StylePieChart } from './Charts/StylePieChart';
import { TransportBarChart } from './Charts/TransportBarChart';
import { ItineraryRecommendations } from './ItineraryRecommendations';
import { ResponsesTable } from './ResponsesTable';
import { AdminLoginModal } from './AdminLoginModal';
import { EditResponseModal } from './EditResponseModal';
import { Download, RefreshCw, BarChart2 } from 'lucide-react';

interface Props {
  responses: SurveyResponse[];
  stats: SurveyStats;
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteResponse: (id: string, adminKey: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateResponse: (id: string, formData: any, adminKey: string) => Promise<{ success: boolean; error?: string }>;
  onVerifyAdminPassword: (password: string) => Promise<{ valid: boolean; error?: string }>;
  onNavigateToForm: () => void;
}

export const StatsTab: React.FC<Props> = ({
  responses,
  stats,
  isLoading,
  onRefresh,
  onDeleteResponse,
  onUpdateResponse,
  onVerifyAdminPassword,
  onNavigateToForm,
}) => {
  // Admin authentication state (persisted in sessionStorage)
  const [adminKey, setAdminKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem('japan_trip_admin_key') || '';
    } catch {
      return '';
    }
  });

  const isAdmin = Boolean(adminKey);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<SurveyResponse | null>(null);

  // Synchronize admin key in sessionStorage
  useEffect(() => {
    try {
      if (adminKey) {
        sessionStorage.setItem('japan_trip_admin_key', adminKey);
      } else {
        sessionStorage.removeItem('japan_trip_admin_key');
      }
    } catch {
      // ignore
    }
  }, [adminKey]);

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

  const handleAdminLogin = async (password: string) => {
    const res = await onVerifyAdminPassword(password);
    if (res.valid) {
      setAdminKey(password);
      return { success: true };
    }
    return { success: false, error: res.error || '密碼錯誤' };
  };

  const handleAdminLogout = () => {
    setAdminKey('');
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!adminKey) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!confirm(`確定要刪除「${name}」的填答紀錄嗎？此操作無法還原。`)) {
      return;
    }
    const res = await onDeleteResponse(id, adminKey);
    if (!res.success) {
      alert(res.error || '刪除失敗');
    }
  };

  const handleSaveEdit = async (id: string, formData: any) => {
    if (!adminKey) {
      setIsLoginModalOpen(true);
      return { success: false, error: '請先登入管理員' };
    }
    return await onUpdateResponse(id, formData, adminKey);
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
          isAdmin={isAdmin}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          onLogoutAdmin={handleAdminLogout}
          onEditResponse={(r) => setEditingResponse(r)}
          onDeleteResponse={handleDeleteItem}
        />
      </section>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleAdminLogin}
      />

      {/* Edit Response Modal */}
      <EditResponseModal
        isOpen={Boolean(editingResponse)}
        response={editingResponse}
        onClose={() => setEditingResponse(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
