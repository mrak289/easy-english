import { useNavigate } from 'react-router-dom';

export default function Header({ subtitle, showBack = false }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
            <i className="fa-solid fa-graduation-cap text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">Easy English</h1>
            <p className="text-xs text-slate-500 font-medium">Interactive Learning Hub</p>
          </div>
        </div>
        {subtitle && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-700 text-sm font-semibold">
            <i className="fa-solid fa-stopwatch text-amber-500 animate-pulse"></i>
            <span>{subtitle}</span>
          </div>
        )}
        {showBack && !subtitle && (
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-800 font-semibold flex items-center space-x-1"
          >
            <i className="fa-solid fa-chevron-left text-xs"></i>
            <span>Back</span>
          </button>
        )}
      </div>
    </header>
  );
}
