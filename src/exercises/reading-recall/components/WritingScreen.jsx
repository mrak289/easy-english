import { useState } from 'react';

export default function WritingScreen({ onSubmit }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

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
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 title-font">Time's Up! The book is closed</h2>
          <p className="text-slate-500 text-sm mt-1">Now, write down the main ideas of the text using your memory in English.</p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Your summary (in English):
          </label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(false); }}
            className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400 font-medium ${error ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
            placeholder="Start typing here... E.g., The text explains that..."
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">Words: {wordCount}</span>
            <span className="text-xs text-indigo-500 italic">Try to write 2-3 detailed sentences</span>
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1 font-medium">Please write at least a few words from memory!</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md"
        >
          <span>Compare with Original Key Points</span>
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
