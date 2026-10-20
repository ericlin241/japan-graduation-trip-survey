import { useState } from 'react';
import { useSurveyData } from './hooks/useSurveyData';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { StatsTab } from './components/StatsTab';
import { Compass, ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'stats'>('form');
  const {
    responses,
    stats,
    isLoading,
    wsStatus,
    refresh,
    submitResponse,
    deleteResponse,
  } = useSurveyData();

  const volunteerDrivers = responses
    .filter((r) => r.driver === 1)
    .map((r) => r.name);

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink selection:bg-primary-light selection:text-primary">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connectionStatus={wsStatus}
        totalResponses={stats.totalCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'form' ? (
          <SurveyForm
            onSubmit={submitResponse}
            onSuccessNavigate={() => setActiveTab('stats')}
            volunteerDrivers={volunteerDrivers}
          />
        ) : (
          <StatsTab
            responses={responses}
            stats={stats}
            isLoading={isLoading}
            onRefresh={refresh}
            onDeleteResponse={deleteResponse}
            onNavigateToForm={() => setActiveTab('form')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-card/80 py-8 text-xs text-ink-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-semibold text-ink">日本畢業旅行意向調查系統</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>僅供本次畢業旅行討論與成團決策使用</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
