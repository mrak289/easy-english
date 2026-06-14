import { useState } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function ResultsScreen({ text, userRecall, onRetry, onBackToCatalog }) {
  const [showFullText, setShowFullText] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const getAIFeedback = async () => {
    setAiLoading(true);
    setAiError(null);

    const systemPrompt = "You are a friendly, encouraging English teacher assessing an adult student practicing speed reading. The student was reading a simple textbook story (level A2) and has written a quick summary from memory. Evaluate their summary in clear, easy-to-read English appropriate for an A2 learner. Check if they captured the major details of the story (specified in the prompt). Correct any spelling or grammar mistakes gently. Then, rewrite their summary in simple, perfectly natural English. Be highly encouraging!";
    const userQuery = `Text Title: "${text.title}"\nTarget Concepts the student should recall: ${text.focusPoints}\n\nStudent's Written Summary from Memory:\n"${userRecall}"`;

    let delay = 1000;
    for (let retry = 0; retry < 5; retry++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userQuery }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] }
            })
          }
        );
        if (response.ok) {
          const data = await response.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            setAiFeedback(responseText);
            setAiLoading(false);
            return;
          }
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }

    setAiError("Could not connect to AI teacher. Please check your internet connection or API key.");
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
              <span>Results Comparison</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                  Your Active Recall Text
                </span>
                <p className="text-slate-800 text-sm mt-3 leading-relaxed italic">"{userRecall}"</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Original Highlights
                </span>
                <div className="text-xs text-slate-700 mt-3 space-y-2 leading-relaxed">
                  {text.highlights.map((h, i) => (
                    <p key={i}>⭐ {h}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide mb-2">🔍 Self-Assessment Checklist:</h4>
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
                <h3 className="font-bold text-base">Gemini AI Teacher Analysis</h3>
                <p className="text-xs text-indigo-300">Get an automated grade, grammar review and suggestions!</p>
              </div>
            </div>

            {aiLoading && (
              <div className="flex flex-col items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                <span className="text-xs text-indigo-200">Gemini is carefully checking your English...</span>
              </div>
            )}

            {!aiLoading && !aiFeedback && !aiError && (
              <>
                <p className="text-sm text-indigo-200 mb-4">Click the button below to get professional feedback from your personal AI teacher.</p>
                {!GEMINI_API_KEY && (
                  <p className="text-xs text-amber-300 mb-3">⚠️ Set VITE_GEMINI_API_KEY in .env to enable AI feedback.</p>
                )}
                <button
                  onClick={getAIFeedback}
                  disabled={!GEMINI_API_KEY}
                  className="w-full py-3 bg-white text-indigo-950 font-bold rounded-xl hover:bg-indigo-50 transition duration-200 text-sm shadow-sm flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-robot"></i>
                  <span>Analyze with Gemini AI</span>
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
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Controls</h3>
            <div className="space-y-3">
              <button
                onClick={onBackToCatalog}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2 shadow-md shadow-indigo-100"
              >
                <i className="fa-solid fa-house"></i>
                <span>Back to Catalog</span>
              </button>
              <button
                onClick={onRetry}
                className="w-full py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span>Try This Text Again</span>
              </button>
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition duration-200 text-sm flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-book-open"></i>
                <span>{showFullText ? 'Hide' : 'Show'} Full Original Text</span>
              </button>
            </div>
          </div>

          {showFullText && (
            <div className="bg-[#faf8f5] border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 title-font text-sm border-b border-stone-200 pb-2 mb-3">
                Original: {text.title}
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
