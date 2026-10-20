import React from 'react';
import { ConnectionStatus } from '../types';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface Props {
  status: ConnectionStatus;
  onReconnect?: () => void;
}

export const ConnectionBadge: React.FC<Props> = ({ status, onReconnect }) => {
  if (status === 'connected') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200" title="即時同步連線正常，任何新填答將立即更新">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        <span>即時同步中</span>
      </div>
    );
  }

  if (status === 'reconnecting' || status === 'connecting') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200" title="連線中或重新連線中，系統會持續嘗試">
        <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        <span>重新連線中...</span>
      </div>
    );
  }

  return (
    <button
      onClick={onReconnect}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200 transition-colors"
      title="連線中斷，已啟動定時輪詢備援機制。點擊手動重新連線"
    >
      <WifiOff className="w-3.5 h-3.5 text-stone-500" />
      <span>輪詢備援模式</span>
    </button>
  );
};
