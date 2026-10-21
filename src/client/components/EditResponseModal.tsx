import React, { useState, useEffect } from 'react';
import { SurveyResponse } from '../types';
import { REGIONS, INTENTS, DAYS_OPTIONS, STYLES, TRANSPORTS } from '../utils/constants';
import { Edit3, X, AlertCircle, Loader2, Car, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  response: SurveyResponse | null;
  onSave: (id: string, formData: any) => Promise<{ success: boolean; error?: string }>;
}

export const EditResponseModal: React.FC<Props> = ({ isOpen, onClose, response, onSave }) => {
  const [name, setName] = useState('');
  const [intent, setIntent] = useState<'一定參加' | '高機率參加' | '觀望中'>('一定參加');
  const [days, setDays] = useState<'5 天' | '7 天' | '9 天'>('7 天');
  const [style, setStyle] = useState<'都市繁華' | '慢生活風景' | '城鄉各半'>('城鄉各半');
  const [transport, setTransport] = useState<'大眾運輸為主' | '租車自駕'>('大眾運輸為主');
  const [driver, setDriver] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when response changes
  useEffect(() => {
    if (response) {
      setName(response.name || '');
      setIntent(response.intent || '一定參加');
      setDays(response.days || '7 天');
      setStyle(response.style || '城鄉各半');
      setTransport(response.transport || '大眾運輸為主');
      setDriver(response.driver === 1);
      setSelectedRegions(Array.isArray(response.regions) ? [...response.regions] : []);
      setNotes(response.notes || '');
      setErrorMsg(null);
    }
  }, [response]);

  if (!isOpen || !response) return null;

  const handleRegionToggle = (reg: string) => {
    if (selectedRegions.includes(reg)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== reg));
    } else {
      if (selectedRegions.length >= 3) {
        setErrorMsg('想去的日本地區最多只能選擇三個');
        return;
      }
      setErrorMsg(null);
      setSelectedRegions([...selectedRegions, reg]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('姓名不能為空白');
      return;
    }
    if (cleanName.length > 40) {
      setErrorMsg('姓名長度最多 40 字');
      return;
    }
    if (selectedRegions.length === 0) {
      setErrorMsg('請至少選擇一個想去的日本地區');
      return;
    }
    if (selectedRegions.length > 3) {
      setErrorMsg('想去的日本地區最多只能選擇三個');
      return;
    }
    if (notes.trim().length > 500) {
      setErrorMsg('私心許願／備註最多 500 字');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const formData = {
      name: cleanName,
      intent,
      days,
      style,
      transport,
      driver,
      regions: selectedRegions,
      notes: notes.trim(),
    };

    const res = await onSave(response.id, formData);
    setIsLoading(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || '儲存修改失敗');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border shadow-soft-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-page/50">
          <div className="flex items-center gap-2 text-ink font-bold">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold">修改成員填答資料</div>
              <div className="text-[11px] text-ink-muted font-normal">
                正在修改「{response.name}」的紀錄
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-ink hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-response-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className="block font-bold text-ink mb-1.5">
              填答者姓名／暱稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full px-3 py-2 rounded-xl border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          {/* 2. Intent */}
          <div>
            <label className="block font-bold text-ink mb-1.5">
              參團意願 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTENTS.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setIntent(item.label as any)}
                  className={`p-2 rounded-xl border text-center transition font-semibold ${
                    intent === item.label
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white text-ink hover:bg-stone-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Days & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-ink mb-1.5">
                行程天數 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDays(d)}
                    className={`py-2 px-1 rounded-xl border text-center transition font-semibold ${
                      days === d
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-white text-ink hover:bg-stone-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1.5">
                旅行風格 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {STYLES.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => setStyle(s.label as any)}
                    className={`py-2 px-1 rounded-xl border text-center transition font-semibold ${
                      style === s.label
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-white text-ink hover:bg-stone-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Transport & Driver */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-ink mb-1.5">
                偏好交通方式 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TRANSPORTS.map((t) => (
                  <button
                    type="button"
                    key={t.label}
                    onClick={() => setTransport(t.label as any)}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                      transport === t.label
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-white text-ink hover:bg-stone-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-page/50 hover:bg-page cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={driver}
                onChange={(e) => setDriver(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-stone-300"
              />
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <Car className="w-4 h-4 text-primary" />
                <span>具備駕照並願意於自駕路線時擔任駕駛</span>
              </div>
            </label>
          </div>

          {/* 5. Regions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-ink">
                想去的日本地區 <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-ink-muted">
                已選 {selectedRegions.length} / 3
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REGIONS.map((reg) => {
                const isSelected = selectedRegions.includes(reg);
                return (
                  <button
                    type="button"
                    key={reg}
                    onClick={() => handleRegionToggle(reg)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-white text-ink hover:bg-stone-50'
                    }`}
                  >
                    <span>{reg}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block font-bold text-ink mb-1.5">
              私心許願／備註
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="例如：必吃一蘭或和牛、想泡露天溫泉等..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-page/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-white hover:bg-stone-100 text-ink transition"
          >
            取消
          </button>
          <button
            type="submit"
            form="edit-response-form"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>儲存中...</span>
              </>
            ) : (
              <span>儲存修改</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
