import { useLanguage } from '../../../contexts/LanguageContext';

function scoreColor(s) {
  if (s >= 8) return { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300', bar: 'bg-emerald-500' };
  if (s >= 6) return { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300', bar: 'bg-amber-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-300', bar: 'bg-red-400' };
}

function scoreEmoji(s) {
  if (s >= 9) return '🏆';
  if (s >= 7) return '⭐';
  if (s >= 5) return '👍';
  return '💪';
}

function CriterionBar({ label, value }) {
  const c = scoreColor(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className={`font-bold ${c.text}`}>{value}/10</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export default function ScoreCard({ score, criteria, pending }) {
  const { t } = useLanguage();

  if (pending) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
        <div className="text-3xl mb-2">🎯</div>
        <p className="text-xs text-slate-400">{t.scoreAwait}</p>
      </div>
    );
  }

  const c = scoreColor(score);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Overall score circle */}
      <div className="flex items-center space-x-4">
        <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ring-2 ${c.ring} ${c.bg} shrink-0`}>
          <span className={`text-xl font-extrabold leading-none ${c.text}`}>{score}</span>
          <span className={`text-[10px] font-bold ${c.text}`}>/10</span>
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">{t.scoreOverall}</p>
          <p className="text-lg">{scoreEmoji(score)}</p>
        </div>
      </div>

      {/* Criteria bars */}
      {criteria && (
        <div className="space-y-3">
          <CriterionBar label={t.scoreAccuracy} value={criteria.accuracy} />
          <CriterionBar label={t.scoreGrammar} value={criteria.grammar} />
          <CriterionBar label={t.scoreDetail} value={criteria.detail} />
        </div>
      )}
    </div>
  );
}
