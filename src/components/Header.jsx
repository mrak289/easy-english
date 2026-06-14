import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Header({ subtitle, showBack = false }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();

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
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">{t.brandName}</h1>
            <p className="text-xs text-slate-500 font-medium">{t.brandTagline}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
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
              <span>{t.back}</span>
            </button>
          )}

          <button
            onClick={toggleLang}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition-all"
            title="Switch language / Змінити мову"
          >
            {lang === 'en' ? '🇺🇦 UA' : '🇬🇧 EN'}
          </button>

          {user === undefined ? null : user ? (
            <div className="flex items-center space-x-2">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
              )}
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name}</span>
              <button
                onClick={logout}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium ml-1"
              >
                {t.signOut}
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 transition-all"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4"
              />
              <span>{t.signIn}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
