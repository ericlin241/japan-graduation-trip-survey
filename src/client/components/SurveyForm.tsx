import React, { useState } from 'react';
import { REGIONS, INTENTS, DAYS_OPTIONS, STYLES, TRANSPORTS } from '../utils/constants';
import { Send, CheckCircle2, AlertCircle, Car, MapPin, User, Calendar, Compass } from 'lucide-react';

interface Props {
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onSuccessNavigate?: () => void;
}

export const SurveyForm: React.FC<Props> = ({ onSubmit, onSuccessNavigate }) => {
  // Form State
  const [name, setName] = useState('');
  const [intent, setIntent] = useState<'一定參加' | '高機率參加' | '觀望中'>('一定參加');
  const [days, setDays] = useState<'5 天' | '7 天' | '9 天'>('7 天');
  const [style, setStyle] = useState<'都市繁華' | '慢生活風景' | '城鄉各半'>('城鄉各半');
  const [transport, setTransport] = useState<'大眾運輸為主' | '租車自駕'>('大眾運輸為主');
  const [driver, setDriver] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegionToggle = (reg: string) => {
    if (selectedRegions.includes(reg)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== reg));
    } else {
      if (selectedRegions.length >= 3) {
        setErrorMessage('想去的日本地區最多只能選擇三個喔！');
        return;
      }
      setErrorMessage(null);
      setSelectedRegions([...selectedRegions, reg]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Front-end validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('請填寫您的姓名或稱呼');
      return;
    }
    if (trimmedName.length > 40) {
      setErrorMessage('姓名最多 40 個字元');
      return;
    }
    if (selectedRegions.length === 0) {
      setErrorMessage('請至少選擇一個想去的日本地區（最多三個）');
      return;
    }
    if (selectedRegions.length > 3) {
      setErrorMessage('想去的日本地區最多只能選擇三個');
      return;
    }
    if (notes.trim().length > 500) {
      setErrorMessage('備註與許願景點字數請勿超過 500 字');
      return;
    }

    setIsSubmitting(true);

    const submissionData = {
      name: trimmedName,
      intent,
      days,
      style,
      transport,
      driver,
      regions: selectedRegions,
      notes: notes.trim()
    };

    const res = await onSubmit(submissionData);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('🎉 填答成功！感謝你的寶貴意見，統計圖表與行程提案已即時更新。');
      // Reset form
      setName('');
      setIntent('一定參加');
      setDays('7 天');
      setStyle('城鄉各半');
      setTransport('大眾運輸為主');
      setDriver(false);
      setSelectedRegions([]);
      setNotes('');
    } else {
      setErrorMessage(res.error || '提交失敗，請檢查網路連線或稍候重試');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4">
      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-soft animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{successMessage}</p>
              {onSuccessNavigate && (
                <button
                  type="button"
                  onClick={onSuccessNavigate}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  前往查看統計圖表與提案 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 shadow-soft">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Survey Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Name */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft">
          <label htmlFor="name-input" className="block text-sm font-bold text-ink mb-1.5">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary" />
              1. 您的姓名或稱呼 <span className="text-secondary font-bold">*</span>
            </span>
          </label>
          <p className="text-xs text-ink-muted mb-3">請填寫同學能認出你的稱呼，最多 40 字。</p>
          <input
            id="name-input"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：王小明 / Alex"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-page focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-ink placeholder:text-stone-400"
          />
        </div>

        {/* 2. Intent */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft">
          <label className="block text-sm font-bold text-ink mb-1.5">
            2. 參團意願 <span className="text-secondary font-bold">*</span>
          </label>
          <p className="text-xs text-ink-muted mb-3">預設為「一定參加」，可依您的狀況調整。</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {INTENTS.map((item) => {
              const isSelected = intent === item.label;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setIntent(item.label as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary-light/50 ring-2 ring-primary text-ink'
                      : 'border-border bg-page hover:bg-stone-100 text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{item.label}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-stone-400'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted leading-tight">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Days */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft">
          <label className="block text-sm font-bold text-ink mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              3. 期望行程天數 <span className="text-secondary font-bold">*</span>
            </span>
          </label>
          <p className="text-xs text-ink-muted mb-3">單選：建議考量體力、打工/休假與預算。</p>
          <div className="grid grid-cols-3 gap-3">
            {DAYS_OPTIONS.map((d) => {
              const isSelected = days === d;
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDays(d)}
                  className={`py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-border bg-page hover:bg-stone-100 text-ink'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Travel Style */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft">
          <label className="block text-sm font-bold text-ink mb-1.5">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-primary" />
              4. 偏好旅行風格 <span className="text-secondary font-bold">*</span>
            </span>
          </label>
          <p className="text-xs text-ink-muted mb-3">單選：決定路線重心與景點節奏。</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STYLES.map((st) => {
              const isSelected = style === st.label;
              return (
                <button
                  type="button"
                  key={st.label}
                  onClick={() => setStyle(st.label as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-light/50 ring-2 ring-primary text-ink'
                      : 'border-border bg-page hover:bg-stone-100 text-ink'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{st.label}</div>
                  <div className="text-xs text-ink-muted leading-tight">{st.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Transport & Driver Volunteer */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft space-y-4">
          <div>
            <label className="block text-sm font-bold text-ink mb-1.5">
              5. 交通方式偏好 <span className="text-secondary font-bold">*</span>
            </label>
            <p className="text-xs text-ink-muted mb-3">單選：大眾運輸（鐵路/地鐵）或租車自駕。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRANSPORTS.map((tp) => {
                const isSelected = transport === tp.label;
                return (
                  <button
                    type="button"
                    key={tp.label}
                    onClick={() => setTransport(tp.label as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-light/50 ring-2 ring-primary text-ink'
                        : 'border-border bg-page hover:bg-stone-100 text-ink'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{tp.label}</div>
                    <div className="text-xs text-ink-muted leading-tight">{tp.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Driver volunteer checkbox */}
          <div className="pt-3 border-t border-border-subtle">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 bg-stone-50/70 cursor-pointer transition">
              <input
                type="checkbox"
                checked={driver}
                onChange={(e) => setDriver(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-stone-300"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-secondary" />
                  我願意在日本擔任駕駛／換手開車
                </span>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  ※ 駕駛須具備中華民國有效駕照及合法效期內日文譯本
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 6. Regions (Max 3) */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-ink">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                6. 想去的日本地區（複選，最多三個） <span className="text-secondary font-bold">*</span>
              </span>
            </label>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                selectedRegions.length === 3
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              已選 {selectedRegions.length} / 3 個
            </span>
          </div>
          <p className="text-xs text-ink-muted mb-3">請選擇您最心動的地區，最多選取三個。</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {REGIONS.map((reg) => {
              const isSelected = selectedRegions.includes(reg);
              const isDisabled = !isSelected && selectedRegions.length >= 3;
              return (
                <button
                  type="button"
                  key={reg}
                  disabled={isDisabled}
                  onClick={() => handleRegionToggle(reg)}
                  className={`py-3 px-3.5 rounded-xl border text-sm font-medium transition-all text-center flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary text-white font-bold shadow-sm'
                      : isDisabled
                      ? 'border-border bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'border-border bg-page hover:bg-stone-100 text-ink'
                  }`}
                >
                  <span>{reg}</span>
                  <span
                    className={`w-4 h-4 rounded text-xs flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'text-stone-400'
                    }`}
                  >
                    {isSelected ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Notes / Wishes */}
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="notes-input" className="block text-sm font-bold text-ink">
              7. 私心許願／備註景點（非必填）
            </label>
            <span className="text-xs text-ink-muted">{notes.length} / 500 字</span>
          </div>
          <p className="text-xs text-ink-muted mb-3">
            例如：「超想去秋葉原夾娃娃」、「一定要泡露天溫泉」、「想吃道地牛舌料理」等。支援中文、日文與 Emoji！
          </p>
          <textarea
            id="notes-input"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="寫下你的私房清單或期待..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-page focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm text-ink placeholder:text-stone-400"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base text-white shadow-soft-lg flex items-center justify-center gap-2 transition-all ${
              isSubmitting
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>資料寫入雲端中...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>送出畢旅意向調查</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-ink-muted mt-3">
            送出後可隨時至「統計與提案」頁籤查看即時更新的圖表與方案
          </p>
        </div>
      </form>
    </div>
  );
};
