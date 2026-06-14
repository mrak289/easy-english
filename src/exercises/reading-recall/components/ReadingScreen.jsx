import { useState, useEffect, useRef } from 'react';

export default function ReadingScreen({ text, onFinish }) {
  const [timeLeft, setTimeLeft] = useState(40);
  const intervalRef = useRef(null);
  const beepRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          try { beepRef.current?.play(); } catch (_) {}
          setTimeout(onFinish, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onFinish]);

  const handleFinishEarly = () => {
    clearInterval(intervalRef.current);
    onFinish();
  };

  const timerClass = timeLeft <= 10
    ? "relative w-12 h-12 flex items-center justify-center rounded-full bg-red-50 text-red-600 font-extrabold text-lg border-2 border-red-500 animate-pulse"
    : timeLeft <= 20
    ? "relative w-12 h-12 flex items-center justify-center rounded-full bg-amber-50 text-amber-600 font-extrabold text-lg border-2 border-amber-300"
    : "relative w-12 h-12 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-lg border-2 border-indigo-200";

  return (
    <div className="w-full">
      <audio ref={beepRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav" preload="auto" />

      <div className="max-w-4xl mx-auto mb-6 bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={timerClass}>{timeLeft}</div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Time is running out! Read carefully</h3>
            <p className="text-xs text-slate-500">The textbook page will close automatically.</p>
          </div>
        </div>
        <button
          onClick={handleFinishEarly}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition duration-200"
        >
          Finished Early <i className="fa-solid fa-forward ml-1"></i>
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-[#faf8f5] border border-stone-200 shadow-xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative">
        {/* Left Page */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <span className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg title-font border-2 border-white shadow-md">
                {text.id}
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-indigo-900 title-font">{text.title}</h2>
            </div>
            <div className="book-font text-stone-800 text-base leading-relaxed space-y-4">
              <p>{text.leftPage}</p>
            </div>
          </div>
          <div className="mt-8 border-t border-stone-200/60 pt-4">
            <div className="bg-amber-100/50 border border-amber-200/60 rounded-xl p-3 flex items-center space-x-3">
              <div
                className="text-amber-600"
                dangerouslySetInnerHTML={{ __html: text.leftIllust }}
              />
              <div>
                <span className="block text-xs font-bold text-amber-800 uppercase tracking-wide">{text.leftIllustTitle}</span>
                <p className="text-xs text-stone-600 mt-0.5">{text.leftIllustDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Page */}
        <div className="p-6 md:p-8 bg-[#faf8f5] flex flex-col justify-between">
          <div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-6 flex items-center space-x-3">
              <div
                className="text-indigo-500"
                dangerouslySetInnerHTML={{ __html: text.rightIllust }}
              />
              <div>
                <span className="block text-xs font-bold text-indigo-800 uppercase tracking-wide">{text.rightIllustTitle}</span>
                <p className="text-xs text-stone-600 mt-0.5">{text.rightIllustDesc}</p>
              </div>
            </div>
            <div className="book-font text-stone-800 text-base leading-relaxed space-y-4">
              <p>{text.rightPage}</p>
            </div>
          </div>
          <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start space-x-3">
            <div className="bg-emerald-500 text-white rounded-full p-2 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-earth-americas text-sm"></i>
            </div>
            <div>
              <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider block">Discover!</span>
              <p className="text-xs text-emerald-800 mt-1 leading-snug">{text.trivia}</p>
            </div>
          </div>
        </div>

        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-r from-stone-300/40 via-stone-400/20 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}
