import { useState } from 'react';
import Header from '../../components/Header';
import Catalog from './components/Catalog';
import InstructionsModal from './components/InstructionsModal';
import ReadingScreen from './components/ReadingScreen';
import WritingScreen from './components/WritingScreen';
import ResultsScreen from './components/ResultsScreen';
import { readingRecallTexts } from '../../data/reading-recall/texts';

const STEPS = { CATALOG: 'catalog', READING: 'reading', WRITING: 'writing', RESULTS: 'results' };

export default function ReadingRecallPage() {
  const [step, setStep] = useState(STEPS.CATALOG);
  const [selectedText, setSelectedText] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [userRecall, setUserRecall] = useState('');

  const handleSelectText = (text) => {
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
