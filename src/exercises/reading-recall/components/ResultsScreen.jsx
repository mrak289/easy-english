import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function ResultsScreen({ text, userRecall, onRetry, onBackToCatalog }) {
  const [showFullText, setShowFullText] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const { t } = useLanguage();

  const getAIFeedback = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: text.title,
          focusPoints: text.focusPoints,
          userRecall,
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.feedback) {
          setAiFeedback(data.feedback);
          setAiLoading(false);
          return;
        }
      }
    } catch (_) {}
    setAiError(t.aiConnectError);
    setAiLoading(false);
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-code-compare text-indigo-600"></i>
              <span>{t.resultsComparison}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                  {t.yourActiveRecall}
                </span>
                <p className="text-slate-800 text-sm mt-3 leading-relaxed italic">"{userRecall}"</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  {t.originalHighlights}
                </span>
                <div className="text-xs text-slate-700 mt-3 space-y-2 leading-relaxed">
                  {text.highlights.map((h, i) => (
                    <p key={i}>⭐ {h}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide mb-2">{t.selfAssessment}</h4>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                {text.checklist.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 text-white/5 text-9xl pointer-events-none">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-indigo-500/20 text-indigo-300 p-2 rounded-lg">
                <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-base">{t.aiTeacherTitle}</h3>
                <p className="text-xs text-indigo-300">{t.aiTeacherSubtitle}</p>
              </div>
            </div>

            {aiLoading && (
              <div className="flex flex-col items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                <span className="text-xs text-indigo-200">{t.aiChecking}</span>
              </div>
            )}

            {!aiLoading && !aiFeedback && !aiError && (
              <>
                <p className="text-sm text-indigo-200 mb-4">{t.aiClickBelow}</p>
                <button
                  onClick={getAIFeedback}
                  className="w-full py-3 bg-white text-indigo-950 font-bold rounded-xl hover:bg-indigo-50 transition duration-200 text-sm shadow-sm flex items-center justify-center space-x-2"
                >
                  <i className="fa-solid fa-robot"></i>
                  <span>{t.analyzeWithAI}</span>
                </button>
              </>
            )}

            {aiFeedback && (
              <div className="text-sm leading-relaxed space-y-3 bg-white/10 p-4 rounded-xl border border-white/10">
                <div
                  className="text-slate-100 text-xs md:text-sm"
                  dangerouslySetInnerHTML={{ __html: aiFeedback.replace(/\n/g, '<br>') }}
                />
              </div>
            )}

            {aiError && (
              <div className="text-sm bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="text-red-400 font-bold text-xs">{aiError}</p>
                <button
                  onClick={getAIFeedback}
                  className="mt-3 text-xs text-indigo-300 underline"
                >
                  {t.tryAgain}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">{t.controls}</h3>
            <div className="space-y-3">
              <button
                onClick={onBackToCatalog}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2 shadow-md shadow-indigo-100"
              >
                <i className="fa-solid fa-house"></i>
                <span>{t.backToCatalog}</span>
              </button>
              <button
                onClick={onRetry}
                className="w-full py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span>{t.tryTextAgain}</span>
              </button>
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-book-open"></i>
                <span>{showFullText ? t.hideFullText : t.showFullText}</span>
              </button>
            </div>
          </div>

          {showFullText && (
            <div className="bg-[#faf8f5] border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 title-font text-sm border-b border-stone-200 pb-2 mb-3">
                {t.original} {text.title}
              </h4>
              <div className="book-font text-xs text-stone-700 leading-relaxed space-y-3">
                <p>{text.leftPage}</p>
                <p>{text.rightPage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
