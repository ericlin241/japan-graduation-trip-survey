import React, { useState, useMemo } from 'react';
import { SurveyResponse } from '../types';
import { ArrowUpDown, ChevronLeft, ChevronRight, Car, Clock, Shield, ShieldCheck, LogOut, Edit3, Trash2 } from 'lucide-react';

interface Props {
  responses: SurveyResponse[];
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onLogoutAdmin?: () => void;
  onEditResponse?: (response: SurveyResponse) => void;
  onDeleteResponse?: (id: string, name: string) => void;
}

export const ResponsesTable: React.FC<Props> = ({
  responses,
  isAdmin = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  onEditResponse,
  onDeleteResponse,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [responses, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedResponses.length / pageSize));
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResponses.slice(start, start + pageSize);
  }, [sortedResponses, currentPage, pageSize]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const formatLocalTime = (utcStr: string) => {
    try {
      const date = new Date(utcStr);
      return date.toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return utcStr;
    }
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case '一定參加':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '高機率參加':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-ink">填答成員名單與詳細紀錄</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            共 {responses.length} 位同學填答・支援手機左右滑動檢視完整欄位
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={toggleSortOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-page border border-border hover:bg-stone-100 transition text-ink"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
            <span>時間排序：{sortOrder === 'desc' ? '新到舊' : '舊到新'}</span>
          </button>

          {isAdmin ? (
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>管理員模式已啟用</span>
              </span>
              {onLogoutAdmin && (
                <button
                  onClick={onLogoutAdmin}
                  title="登出管理員身分"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-stone-100 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出</span>
                </button>
              )}
            </div>
          ) : (
            onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                title="管理員登入（可編輯或刪除填答）"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 bg-page border border-border hover:bg-stone-100 hover:text-ink transition"
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>管理員登入</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Table Body / Responsive container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-page/70 border-b border-border-subtle text-ink-muted uppercase font-bold text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-4">填答者姓名</th>
              <th className="py-3 px-4">參團意願</th>
              <th className="py-3 px-4">行程天數</th>
              <th className="py-3 px-4">旅行風格</th>
              <th className="py-3 px-4">交通方式</th>
              <th className="py-3 px-4">駕駛志願</th>
              <th className="py-3 px-4 min-w-[160px]">想去地區</th>
              <th className="py-3 px-4 min-w-[200px] whitespace-normal">私心許願／備註</th>
              <th className="py-3 px-4 text-right">填答時間</th>
              {isAdmin && <th className="py-3 px-4 text-center min-w-[120px]">管理操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {responses.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center text-ink-muted">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">📋</span>
                    <span className="text-sm font-semibold text-ink">目前尚無任何填答資料</span>
                    <span className="text-xs text-ink-muted mt-1">
                      初始資料庫為空，邀請大家填寫後將即時呈現在此
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedResponses.map((r) => (
                <tr key={r.id} className="hover:bg-page/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-ink">
                    {r.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getIntentBadge(r.intent)}`}>
                      {r.intent}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-ink font-medium">
                    {r.days}
                  </td>
                  <td className="py-3.5 px-4 text-ink-muted">
                    {r.style}
                  </td>
                  <td className="py-3.5 px-4 text-ink-muted">
                    {r.transport}
                  </td>
                  <td className="py-3.5 px-4">
                    {r.driver === 1 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        <Car className="w-3 h-3" />
                        願意開車
                      </span>
                    ) : (
                      <span className="text-stone-400">－</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(r.regions) && r.regions.map((reg) => (
                        <span key={reg} className="px-2 py-0.5 rounded bg-page border border-border text-[11px] text-ink font-medium">
                          {reg}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-ink-muted" title={r.notes}>
                    {r.notes ? (
                      <span className="text-ink">{r.notes}</span>
                    ) : (
                      <span className="text-stone-300">無特殊備註</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right text-stone-500 font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatLocalTime(r.created_at)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditResponse?.(r)}
                          title="修改此筆資料"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>修改</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteResponse?.(r.id, r.name)}
                          title="刪除此筆資料"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>刪除</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border-subtle bg-page/40 flex items-center justify-between text-xs text-ink-muted">
          <span>
            第 {currentPage} 頁 / 共 {totalPages} 頁（共 {responses.length} 筆）
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
