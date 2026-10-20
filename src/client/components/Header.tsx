import React from 'react';
import { ConnectionStatus } from '../types';
import { ConnectionBadge } from './ConnectionBadge';
import { Compass, BarChart3, Edit3, Users } from 'lucide-react';

interface Props {
  activeTab: 'form' | 'stats';
  onTabChange: (tab: 'form' | 'stats') => void;
  connectionStatus: ConnectionStatus;
  totalResponses: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  connectionStatus,
  totalResponses,
}) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-soft backdrop-blur-sm bg-opacity-95">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title Area */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                  日本畢業旅行意向調查
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-primary-light text-primary font-medium">
                  2026 畢業季
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted">
                共同決定屬於我們的日本畢旅・即時統計與智慧行程提案
              </p>
            </div>
          </div>

          {/* Status & Counter */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <ConnectionBadge status={connectionStatus} />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <span>已填答：<strong>{totalResponses}</strong> 人</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mt-4 border-b border-border-subtle -mb-px">
          <button
            onClick={() => onTabChange('form')}
            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'form'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-stone-300'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>填寫問卷</span>
          </button>

          <button
            onClick={() => onTabChange('stats')}
            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-semibold border-b-2 transition-all relative ${
              activeTab === 'stats'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-stone-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>統計與提案</span>
            {totalResponses > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-secondary-light text-secondary font-bold">
                {totalResponses}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
