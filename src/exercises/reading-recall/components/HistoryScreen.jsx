import { useEffect, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import CorrectionsPanel from './CorrectionsPanel';

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SessionDetail({ sessionId, onBack }) {
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCorrections, setShowCorrections] = useState(false);

  useEffect(() => {
    fetch(`/api/history/${sessionId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setSession(data); setLoading(false); });
  }, [sessionId]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>{t.backToHistory}</span>
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-xs text-slate-500">{formatDate(session.created_at)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 text-lg mb-1">{session.text_title}</h2>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.yourRecall}</p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-slate-800 leading-relaxed italic">
            "{session.user_recall}"
          </div>
        </div>
      </div>

      {/* Grammar corrections */}
      <CorrectionsPanel userRecall={session.user_recall} />

      {/* Saved AI feedback */}
      {session.ai_feedback && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-indigo-500/20 text-indigo-300 p-2 rounded-lg">
              <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
            </div>
            <h3 className="font-bold text-base">{t.aiTeacherTitle}</h3>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 text-xs md:text-sm text-slate-100 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: session.ai_feedback.replace(/\n/g, '<br>') }}
          />
        </div>
      )}

      {!session.ai_feedback && (
        <p className="text-xs text-slate-400 text-center">{t.noFeedback}</p>
      )}
    </div>
  );
}

export default function HistoryScreen({ onBack }) {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState(null);

  useEffect(() => {
    fetch('/api/history', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  if (viewId) return <SessionDetail sessionId={viewId} onBack={() => setViewId(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <i className="fa-solid fa-clock-rotate-left text-indigo-600"></i>
            <span>{t.myHistory}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t.historyDesc}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 font-medium border border-slate-200 rounded-xl px-4 py-2 bg-white"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>{t.back}</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-slate-500 text-sm">{t.historyEmpty}</p>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start justify-between gap-4 hover:border-indigo-200 transition">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{s.text_title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(s.created_at)}</p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">"{s.recall_preview}{s.recall_preview?.length >= 120 ? '...' : ''}"</p>
                {s.has_feedback && (
                  <span className="inline-flex items-center space-x-1 text-[10px] bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5 mt-2 font-medium">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>AI</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewId(s.id)}
                className="shrink-0 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
              >
                {t.viewResult}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
