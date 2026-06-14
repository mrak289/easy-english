import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function WritingScreen({ onSubmit }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const { t } = useLanguage();

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  const handleSubmit = () => {
    if (!text.trim()) {
      setError(true);
      return;
    }
    onSubmit(text.trim());
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="bg-red-50 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
            <i className="fa-solid fa-bell"></i>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 title-font">{t.timesUp}</h2>
          <p className="text-slate-500 text-sm mt-1">{t.writingDesc}</p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t.yourSummary}
          </label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(false); }}
            className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400 font-medium ${error ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
            placeholder={t.placeholder}
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">{t.words} {wordCount}</span>
            <span className="text-xs text-indigo-500 italic">{t.writeSentencesHint}</span>
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1 font-medium">{t.writeAtLeastWords}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md"
        >
          <span>{t.compareKeyPoints}</span>
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
