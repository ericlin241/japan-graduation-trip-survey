import React, { useState } from 'react';
import { ItineraryProposal } from '../types';
import { Copy, Check, AlertTriangle, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';

interface Props {
  proposals: ItineraryProposal[];
  totalCount: number;
  onNavigateToForm?: () => void;
}

export const ItineraryRecommendations: React.FC<Props> = ({
  proposals,
  totalCount,
  onNavigateToForm,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLine = async (prop: ItineraryProposal) => {
    const textToCopy = `【日本畢業旅行提案｜${prop.title}】
📍 推薦地區：${prop.region}
⏱️ 建議天數：${prop.days}
🌿 旅行風格：${prop.style}
🚗 交通建議：${prop.transport}

✨ 亮點路線安排：
${prop.routeHighlights.map((r) => `  ${r}`).join('\n')}

📊 推薦依據：${prop.reason}
👥 目前統計樣本數：${prop.sampleSize} 筆填答
${prop.warnings && prop.warnings.length > 0 ? `⚠️ 注意事項：\n${prop.warnings.map((w) => `  ※ ${w}`).join('\n')}\n` : ''}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(prop.id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.error('Copy failed', err);
      alert('複製失敗，請手動選取文字複製');
    }
  };

  if (totalCount === 0 || proposals.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 shadow-soft text-center max-w-xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-ink">目前尚無足夠填答資料</h3>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          智慧行程提案演算法將在大家送出問卷後，根據全體得票最高的地區、天數、風格及自駕人力條件，自動計算出三套最佳畢旅提案。
        </p>
        {onNavigateToForm && (
          <button
            onClick={onNavigateToForm}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary-hover transition shadow-sm"
          >
            搶先成為第一位填答者 →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            動態智慧行程提案（Top 3）
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted">
            根據目前全體 {totalCount} 筆真實填答，即時演算推薦的三套完整行程方案與路線亮點
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {proposals.map((prop) => {
          const isCopied = copiedId === prop.id;

          const badgeStyles =
            prop.badgeColor === 'emerald'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : prop.badgeColor === 'blue'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-amber-50 text-amber-800 border-amber-200';

          return (
            <div
              key={prop.id}
              className="bg-card rounded-2xl border border-border shadow-soft flex flex-col justify-between overflow-hidden hover:shadow-soft-lg transition-all"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 border-b border-border-subtle bg-gradient-to-b from-page/50 to-transparent">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    提案 {prop.id}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${badgeStyles}`}>
                    {prop.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink">{prop.title}</h3>
                <p className="text-xs text-ink-muted mt-1">{prop.subtitle}</p>

                {/* Key Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-page border border-border text-ink font-medium">
                    <MapPin className="w-3 h-3 text-primary" />
                    {prop.region}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-page border border-border text-ink font-medium">
                    <Calendar className="w-3 h-3 text-secondary" />
                    {prop.days}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-page border border-border text-ink font-medium">
                    <Clock className="w-3 h-3 text-ink-muted" />
                    {prop.style}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 space-y-5 flex-1">
                {/* Warnings / Disclaimer if unstable or low sample */}
                {prop.warnings && prop.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                    {prop.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Route highlights */}
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span>亮點行程走訪</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {prop.routeHighlights.map((hl, idx) => (
                      <li key={idx} className="text-xs text-ink-muted flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                        <span className="leading-relaxed">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reason */}
                <div className="text-xs text-ink-muted bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                  <strong className="text-ink">推薦依據：</strong>{prop.reason}
                </div>
              </div>

              {/* Card Footer: Action */}
              <div className="p-5 sm:p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleCopyLine(prop)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary text-white hover:bg-primary-hover active:scale-[0.99]'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>已複製提案到剪貼簿！可直接貼至 LINE</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>複製方案到 LINE 大群組</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
