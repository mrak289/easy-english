import { useState, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function WritingScreen({ onSubmit }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const { t } = useLanguage();
  const uploadRef = useRef(null);
  const cameraRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  const handleSubmit = () => {
    if (!text.trim()) {
      setError(true);
      return;
    }
    onSubmit(text.trim());
  };

  async function handleImageFile(file) {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const { base64, mimeType } = await compressImage(file);
      const r = await fetch('/api/ai/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to extract text');
      setText(data.text);
      setError(false);
    } catch (err) {
      setExtractError(err.message);
    } finally {
      setExtracting(false);
    }
  }

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

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.yourSummary}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                disabled={extracting}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40"
                title="Upload a photo of your handwritten notes"
              >
                <i className="fa-solid fa-image text-[11px]"></i>
                Upload
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={extracting}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40"
                title="Take a photo of your handwritten notes"
              >
                <i className="fa-solid fa-camera text-[11px]"></i>
                Camera
              </button>
            </div>
          </div>

          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={e => { handleImageFile(e.target.files[0]); e.target.value = ''; }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { handleImageFile(e.target.files[0]); e.target.value = ''; }} />

          {extracting && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 mb-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
              <i className="fa-solid fa-spinner animate-spin"></i>
              Extracting text from image...
            </div>
          )}

          {extractError && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>{extractError}
            </div>
          )}

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
