import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function QuickLookupWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [level, setLevel] = useState('A2');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function reset() {
    setWord('');
    setResult(null);
    setError(null);
    setAdded(false);
  }

  async function lookup(e) {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setAdded(false);
    try {
      const r = await fetch('/api/vocabulary/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ word: word.trim(), level }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToVocabulary() {
    if (!result) return;
    setAdding(true);
    try {
      await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ word: result.word }),
      });
      setAdded(true);
    } catch {
      // silent fail
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Quick Lookup (Ctrl+K)"
      >
        <i className="fa-solid fa-book-open text-xl"></i>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[10vh] px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <i className="fa-solid fa-book-open-reader"></i>
                <span className="font-bold text-slate-800">Quick Word Lookup</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={lookup} className="p-5 space-y-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={word}
                  onChange={e => { setWord(e.target.value); setResult(null); setError(null); setAdded(false); }}
                  placeholder="Type a word or phrase..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                />
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={loading || !word.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Explain'}
                </button>
              </div>
              <p className="text-xs text-slate-400">Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+K</kbd> to open/close anytime</p>
            </form>

            {/* Error */}
            {error && (
              <div className="mx-5 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mx-5 mb-5 space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">{result.word}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.explanation}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Examples</p>
                  {result.examples?.map((ex, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-indigo-400 font-bold text-sm mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-slate-700 italic">{ex}</p>
                    </div>
                  ))}
                </div>

                {user ? (
                  <button
                    onClick={addToVocabulary}
                    disabled={adding || added}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      added
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    {added ? (
                      <><i className="fa-solid fa-check"></i> Added to My Vocabulary</>
                    ) : adding ? (
                      <><i className="fa-solid fa-spinner animate-spin"></i> Adding...</>
                    ) : (
                      <><i className="fa-solid fa-bookmark"></i> Add to My Vocabulary</>
                    )}
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                  >
                    <i className="fa-solid fa-right-to-bracket"></i> Sign in to save to vocabulary
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
