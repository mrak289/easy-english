import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

function highlightErrors(text, errors) {
  if (!errors || errors.length === 0) return [{ type: 'text', value: text }];

  // Sort errors by position in text
  const parts = [];
  let remaining = text;
  let offset = 0;

  const sorted = [...errors].sort((a, b) => {
    const ia = text.toLowerCase().indexOf(a.original.toLowerCase());
    const ib = text.toLowerCase().indexOf(b.original.toLowerCase());
    return ia - ib;
  });

  for (const err of sorted) {
    const idx = remaining.toLowerCase().indexOf(err.original.toLowerCase());
    if (idx === -1) continue;
    if (idx > 0) parts.push({ type: 'text', value: remaining.slice(0, idx) });
    parts.push({ type: 'error', value: remaining.slice(idx, idx + err.original.length), error: err });
    remaining = remaining.slice(idx + err.original.length);
  }
  if (remaining) parts.push({ type: 'text', value: remaining });
  return parts;
}

export default function CorrectionsPanel({ userRecall }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeError, setActiveError] = useState(null);

  const checkGrammar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userRecall }),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError(t.aiConnectError);
      }
    } catch (_) {
      setError(t.aiConnectError);
    }
    setLoading(false);
  };

  const parts = data ? highlightErrors(userRecall, data.errors) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center space-x-3">
        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
          <i className="fa-solid fa-spell-check text-lg"></i>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{t.grammarTitle}</h3>
          <p className="text-xs text-slate-500">{t.grammarSubtitle}</p>
        </div>
      </div>

      {!data && !loading && (
        <button
          onClick={checkGrammar}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2 shadow-sm"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>{t.checkGrammar}</span>
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6 space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="text-sm text-slate-500">{t.checkingGrammar}</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg">
          {error}
          <button onClick={checkGrammar} className="ml-2 underline">{t.tryAgain}</button>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Original text with highlighted errors */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.yourOriginalText}</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed">
              {parts.map((part, i) =>
                part.type === 'text' ? (
                  <span key={i}>{part.value}</span>
                ) : (
                  <span
                    key={i}
                    className="relative cursor-pointer"
                    onClick={() => setActiveError(activeError === i ? null : i)}
                  >
                    <span className="bg-red-100 text-red-700 border-b-2 border-red-400 rounded px-0.5 font-medium">
                      {part.value}
                    </span>
                    {activeError === i && (
                      <span className="absolute left-0 top-6 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56 text-xs text-slate-700 space-y-1">
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-xmark text-red-500"></i>
                          <span className="line-through text-red-500">{part.error.original}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <i className="fa-solid fa-check text-emerald-500"></i>
                          <span className="font-bold text-emerald-700">{part.error.corrected}</span>
                        </span>
                        <span className="text-slate-500 border-t border-slate-100 pt-1">{part.error.explanation}</span>
                      </span>
                    )}
                  </span>
                )
              )}
            </div>
            {data.errors.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                <i className="fa-solid fa-circle-info mr-1"></i>
                {t.errorsFound && `${data.errors.length} ${t.errorsFound}`} — натисніть на червоне слово для деталей
              </p>
            )}
          </div>

          {/* No errors */}
          {data.errors.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-sm font-bold text-emerald-700">
              {t.noErrors}
            </div>
          )}

          {/* Errors list */}
          {data.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.errorsFound && `${data.errors.length} ${t.errorsFound}`}</p>
              {data.errors.map((err, i) => (
                <div key={i} className="flex items-start space-x-3 bg-red-50 border border-red-100 rounded-xl p-3">
                  <span className="shrink-0 w-5 h-5 bg-red-200 text-red-700 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div className="text-xs space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="line-through text-red-600 font-medium">{err.original}</span>
                      <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
                      <span className="text-emerald-700 font-bold">{err.corrected}</span>
                    </div>
                    <p className="text-slate-500">{err.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Corrected full text */}
          {data.errors.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">{t.correctedVersion}</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 leading-relaxed italic">
                "{data.correctedText}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
