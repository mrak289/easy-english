import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_CONFIG = {
  new:      { label: 'New',      labelUk: 'Нове',      icon: 'fa-circle',      color: 'text-slate-400 bg-slate-100' },
  learning: { label: 'Learning', labelUk: 'Вивчається', icon: 'fa-rotate',      color: 'text-amber-600 bg-amber-50' },
  learned:  { label: 'Learned',  labelUk: 'Вивчено',   icon: 'fa-check-circle', color: 'text-emerald-600 bg-emerald-50' },
};

function StatusBadge({ status, onClick }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <button
      onClick={onClick}
      title="Змінити статус"
      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition hover:opacity-80 ${cfg.color}`}
    >
      <i className={`fa-solid ${cfg.icon} text-[10px]`}></i>
      {cfg.label}
    </button>
  );
}

function WordCard({ word, onStatusChange, onDelete }) {
  const [imgError, setImgError] = useState(false);

  const nextStatus = { new: 'learning', learning: 'learned', learned: 'new' };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {!imgError && word.image_url ? (
          <img
            src={word.image_url}
            alt={word.word}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-extrabold text-slate-200 uppercase select-none">
              {word.word[0]}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={word.status} onClick={() => onStatusChange(word.id, nextStatus[word.status])} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-extrabold text-slate-900 text-lg capitalize">{word.word}</h3>
        {word.definition ? (
          <p className="text-slate-500 text-sm leading-relaxed flex-1">{word.definition}</p>
        ) : (
          <p className="text-slate-300 text-sm italic flex-1">No definition available</p>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {new Date(word.created_at).toLocaleDateString('uk')}
          </span>
          <button
            onClick={() => onDelete(word.id)}
            className="text-xs text-red-400 hover:text-red-600 transition"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

function WordRow({ word, onStatusChange, onDelete }) {
  const nextStatus = { new: 'learning', learning: 'learned', learned: 'new' };

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-4 hover:shadow-sm transition">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <span className="text-indigo-600 font-extrabold text-base uppercase">{word.word[0]}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 capitalize">{word.word}</p>
        {word.definition && (
          <p className="text-slate-500 text-xs truncate">{word.definition}</p>
        )}
      </div>

      <StatusBadge status={word.status} onClick={() => onStatusChange(word.id, nextStatus[word.status])} />

      <button
        onClick={() => onDelete(word.id)}
        className="text-slate-300 hover:text-red-400 transition"
      >
        <i className="fa-solid fa-trash text-xs"></i>
      </button>
    </div>
  );
}

export default function VocabularyPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('cards'); // 'cards' | 'list'
  const [filter, setFilter] = useState('all'); // 'all' | 'new' | 'learning' | 'learned'
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch('/api/vocabulary', { credentials: 'include' });
      if (r.ok) setWords(await r.json());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addWord = async () => {
    if (!user) { setShowAuth(true); return; }
    const w = input.trim();
    if (!w) return;
    setAdding(true);
    try {
      const r = await fetch('/api/vocabulary', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w }),
      });
      if (r.ok) {
        const newWord = await r.json();
        setWords(prev => [newWord, ...prev]);
        setInput('');
      }
    } finally {
      setAdding(false);
    }
  };

  const changeStatus = async (id, status) => {
    const r = await fetch(`/api/vocabulary/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const updated = await r.json();
      setWords(prev => prev.map(w => w.id === id ? updated : w));
    }
  };

  const deleteWord = async (id) => {
    await fetch(`/api/vocabulary/${id}`, { method: 'DELETE', credentials: 'include' });
    setWords(prev => prev.filter(w => w.id !== id));
  };

  const filtered = filter === 'all' ? words : words.filter(w => w.status === filter);

  const counts = {
    all: words.length,
    new: words.filter(w => w.status === 'new').length,
    learning: words.filter(w => w.status === 'learning').length,
    learned: words.filter(w => w.status === 'learned').length,
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-800">
      <Header />

      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <span className="text-xs font-bold tracking-wider text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full uppercase">
            {t.vocabularyBadge}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 title-font">
            {t.vocabularyTitle}
          </h2>
          <p className="text-slate-600 mt-2">{t.vocabularyDesc}</p>
        </div>

        {/* Add Word */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <p className="text-sm font-bold text-slate-700 mb-3">{t.addWord}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !adding && addWord()}
              placeholder={t.addWordPlaceholder}
              disabled={adding}
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
            />
            <button
              onClick={addWord}
              disabled={adding || !input.trim()}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition flex items-center gap-2"
            >
              {adding ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  {t.addWordLoading}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus text-xs"></i>
                  {t.addWordBtn}
                </>
              )}
            </button>
          </div>
          {adding && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <i className="fa-solid fa-wand-magic-sparkles text-violet-400"></i>
              {t.addWordAiHint}
            </p>
          )}
        </div>

        {/* Auth required modal */}
        {showAuth && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-lock text-violet-600 text-xl"></i>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">{t.authRequired}</h3>
              <p className="text-slate-500 text-sm mb-5">{t.authDesc}</p>
              <button
                onClick={() => setShowAuth(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Filters + View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'new', 'learning', 'learned'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  filter === f
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t[`filter_${f}`]} <span className="opacity-70">({counts[f]})</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'cards' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              <i className="fa-solid fa-grip mr-1"></i>{t.viewCards}
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              <i className="fa-solid fa-list mr-1"></i>{t.viewList}
            </button>
          </div>
        </div>

        {/* Content */}
        {!user ? (
          <div className="text-center py-20 text-slate-400">
            <i className="fa-solid fa-book-open text-4xl mb-4"></i>
            <p className="font-semibold">{t.vocabSignInPrompt}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-400">
            <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <i className="fa-solid fa-book text-4xl mb-4"></i>
            <p className="font-semibold">{words.length === 0 ? t.vocabEmpty : t.vocabFilterEmpty}</p>
          </div>
        ) : view === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(w => (
              <WordCard key={w.id} word={w} onStatusChange={changeStatus} onDelete={deleteWord} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(w => (
              <WordRow key={w.id} word={w} onStatusChange={changeStatus} onDelete={deleteWord} />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto">
          <span>{t.footerHome}</span>
        </div>
      </footer>
    </div>
  );
}
