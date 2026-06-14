import { useState } from 'react';
import Header from '../../components/Header';
import Catalog from './components/Catalog';
import InstructionsModal from './components/InstructionsModal';
import ReadingScreen from './components/ReadingScreen';
import WritingScreen from './components/WritingScreen';
import ResultsScreen from './components/ResultsScreen';
import { readingRecallTexts } from '../../data/reading-recall/texts';
import { useAuth } from '../../contexts/AuthContext';

const STEPS = { CATALOG: 'catalog', READING: 'reading', WRITING: 'writing', RESULTS: 'results' };

export default function ReadingRecallPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(STEPS.CATALOG);
  const [selectedText, setSelectedText] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [userRecall, setUserRecall] = useState('');

  const handleSelectText = (text) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedText(text);
    setShowInstructions(true);
  };

  const handleStartExercise = () => {
    setShowInstructions(false);
    setUserRecall('');
    setStep(STEPS.READING);
  };

  const handleReadingFinish = () => {
    setStep(STEPS.WRITING);
  };

  const handleWritingSubmit = (recall) => {
    setUserRecall(recall);
    setStep(STEPS.RESULTS);
  };

  const handleRetry = () => {
    setUserRecall('');
    setStep(STEPS.READING);
  };

  const handleBackToCatalog = () => {
    setStep(STEPS.CATALOG);
    setSelectedText(null);
    setUserRecall('');
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-800">
      <Header subtitle={step === STEPS.READING ? "40-Sec Skimming Mode" : null} />

      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-lock text-indigo-600 text-xl"></i>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Потрібна авторизація</h2>
            <p className="text-slate-500 text-sm mb-6">
              Щоб виконувати вправи, увійдіть за допомогою Google акаунту.
            </p>
            <a
              href="/api/auth/google"
              className="flex items-center justify-center space-x-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition mb-3"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 bg-white rounded-full p-0.5"
              />
              <span>Увійти через Google</span>
            </a>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {showInstructions && (
        <InstructionsModal
          onStart={handleStartExercise}
          onClose={() => { setShowInstructions(false); setSelectedText(null); }}
        />
      )}

      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {step === STEPS.CATALOG && (
          <Catalog texts={readingRecallTexts} onSelect={handleSelectText} />
        )}
        {step === STEPS.READING && selectedText && (
          <ReadingScreen text={selectedText} onFinish={handleReadingFinish} />
        )}
        {step === STEPS.WRITING && (
          <WritingScreen onSubmit={handleWritingSubmit} />
        )}
        {step === STEPS.RESULTS && selectedText && (
          <ResultsScreen
            text={selectedText}
            userRecall={userRecall}
            onRetry={handleRetry}
            onBackToCatalog={handleBackToCatalog}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto">
          <span>© 2026 English Active Recall Practice Hub. Modeled for A2 Skimming Mastery.</span>
        </div>
      </footer>
    </div>
  );
}
