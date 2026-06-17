import { useLanguage } from '../../../contexts/LanguageContext';

export default function Catalog({ texts, onSelect, onHistory }) {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase">
          {t.chooseChallenge}
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 title-font">
          {t.improveSpeed}
        </h2>
        <p className="text-slate-600 mt-2">{t.catalogDesc}</p>
        {onHistory && (
          <button
            onClick={onHistory}
            className="mt-4 inline-flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-4 py-2 transition"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>{t.history}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.map((text) => (
          <div
            key={text.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {text.category}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  <i className={`fa-solid ${text.icon} mr-1`}></i> {t.topic} {String(text.id).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg title-font mb-2">{text.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">{text.shortDesc}</p>
            </div>
            <button
              onClick={() => onSelect(text)}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1"
            >
              <span>{t.selectStory}</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
