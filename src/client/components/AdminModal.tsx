import React, { useState } from 'react';
import { SurveyResponse } from '../types';
import { Shield, Trash2, X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  responses: SurveyResponse[];
  onDelete: (id: string, adminKey: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  responses,
  onDelete,
}) => {
  const [adminKey, setAdminKey] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (id: string, name: string) => {
    if (!adminKey) {
      setErrorMsg('請先輸入管理員授權金鑰');
      return;
    }
    if (!confirm(`確定要刪除「${name}」的填答紀錄嗎？此操作無法還原。`)) {
      return;
    }

    setIsDeleting(id);
    setErrorMsg(null);
    const res = await onDelete(id, adminKey);
    setIsDeleting(null);

    if (!res.success) {
      setErrorMsg(res.error || '刪除失敗，請檢查金鑰');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border shadow-soft-lg w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-page/50">
          <div className="flex items-center gap-2 text-ink font-bold">
            <Shield className="w-5 h-5 text-primary" />
            <span>管理員填答資料維護</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-ink hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Key input */}
        <div className="p-5 border-b border-border-subtle bg-page/30 space-y-2">
          <label className="block text-xs font-bold text-ink">
            管理員授權密碼（防止誤刪）
          </label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => {
              setAdminKey(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="預設密碼：survey2026admin"
            className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* List of responses to delete */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2">
          {responses.length === 0 ? (
            <p className="text-center text-xs text-ink-muted py-6">無任何資料可供管理</p>
          ) : (
            responses.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-page/50 hover:bg-stone-50 text-xs"
              >
                <div>
                  <div className="font-bold text-ink">{r.name}</div>
                  <div className="text-[11px] text-ink-muted">
                    {r.intent}・{r.days}・{r.style}・{new Date(r.created_at).toLocaleString('zh-TW')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(r.id, r.name)}
                  disabled={isDeleting === r.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting === r.id ? '刪除中...' : '刪除'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-page/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-stone-100 text-ink transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
