import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { exerciseTypes } from '../data/exerciseTypes';
import { useLanguage } from '../contexts/LanguageContext';

const colorMap = {
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700',
    icon: 'bg-indigo-100 text-indigo-600',
    btn: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-400'
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700',
    icon: 'bg-emerald-100 text-emerald-600',
    btn: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400'
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700',
    icon: 'bg-amber-100 text-amber-600',
    btn: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
    dot: 'bg-amber-400'
  }
};

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col text-slate-800">
      <Header />
      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-8">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase">
            {t.chooseExerciseType}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 title-font">
            {t.whatToPractice}
          </h2>
          <p className="text-slate-600 mt-2">
            {t.selectExerciseDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exerciseTypes.map((type) => {
            const colors = colorMap[type.color] || colorMap.indigo;
            return (
              <div
                key={type.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors.badge}`}>
                      {t.level}: {type.level}
                    </span>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.icon}`}>
                      <i className={`fa-solid ${type.icon}`}></i>
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg title-font mb-2">{t.exerciseTitle}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-2">{t.exerciseDescription}</p>
                  <div className="flex items-center space-x-1.5 mt-3 mb-6">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                    <span className="text-xs text-slate-500 font-medium">{type.count} {t.exercisesAvailable}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(type.path)}
                  className={`w-full py-2.5 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 ${colors.btn}`}
                >
                  <span>{t.startPracticing}</span>
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto">
          <span>{t.footerHome}</span>
        </div>
      </footer>
    </div>
  );
}
