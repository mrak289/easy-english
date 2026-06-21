import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

function highlightErrors(text, errors) {
  if (!errors || errors.length === 0) return [{ type: 'text', value: text }];
  const parts = [];
  let remaining = text;
  const sorted = [...errors].sort((a, b) => {
    const ia = text.toLowerCase().indexOf(a.original.toLowerCase());
    const ib = text.toLowerCase().indexOf(b.original.toLowerCase());
    return ia - ib;
  });
  for (const err of sorted) {
    const idx = remaining.toLowerCase().indexOf(err.original.toLowerCase());
    if (idx === -1) continue;
    if (idx > 0) parts.push({ type: 'text', value: remaining.slice(0, idx) });
    parts.push({ type: 'error', value: remaining.slice(idx, idx + err.original.length), error: err });
    remaining = remaining.slice(idx + err.original.length);
  }
  if (remaining) parts.push({ type: 'text', value: remaining });
  return parts;
}

export default function PhotoGrammarWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeError, setActiveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const uploadRef = useRef(null);
  const cameraRef = useRef(null);

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    setSaved(false);
    setActiveError(null);
  }

  function handleFile(file) {
    if (!file) return;
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
        const base64 = dataUrl.split(',')[1];
        setImage({ base64, mimeType: 'image/jpeg', previewUrl: dataUrl });
        setResult(null);
        setError(null);
        setSaved(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function checkGrammar() {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch('/api/ai/photo-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mimeType }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveToHistory() {
    if (!result || !user) return;
    setSaving(true);
    try {
      const resp = await fetch('/api/history/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          textId: 'photo-grammar',
          textTitle: 'Photo Grammar Check',
          userRecall: result.extractedText,
        }),
      });
      const { id } = await resp.json();
      if (id) {
        await fetch(`/api/history/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            corrections: { errors: result.errors, correctedText: result.correctedText },
          }),
        });
      }
      setSaved(true);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-6 left-6 z-40 bg-teal-600 hover:bg-teal-700 text-white w-14 h-14 rounded-full shadow-lg shadow-teal-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Photo Grammar Check"
      >
        <i className="fa-solid fa-camera text-xl"></i>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[5vh] px-4 pb-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <i className="fa-solid fa-camera"></i>
                <span className="font-bold text-slate-800">Photo Grammar Check</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!image ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Take a photo or upload an image with English text — AI will extract the text and check the grammar.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => uploadRef.current?.click()}
                      className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all text-slate-500 hover:text-teal-600"
                    >
                      <i className="fa-solid fa-image text-2xl"></i>
                      <span className="text-sm font-medium">Upload Photo</span>
                    </button>
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all text-slate-500 hover:text-teal-600"
                    >
                      <i className="fa-solid fa-camera text-2xl"></i>
                      <span className="text-sm font-medium">Take Photo</span>
                    </button>
                  </div>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100">
                    <img src={image.previewUrl} alt="Selected" className="w-full max-h-52 object-contain" />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-slate-600 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <button
                    onClick={checkGrammar}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><i className="fa-solid fa-spinner animate-spin"></i> Analyzing...</>
                    ) : (
                      <><i className="fa-solid fa-magnifying-glass"></i> Check Grammar</>
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Extracted text with inline highlights */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Extracted Text</p>
                    <div className="text-sm text-slate-700 leading-relaxed">
                      {highlightErrors(result.extractedText, result.errors).map((part, i) =>
                        part.type === 'text' ? (
                          <span key={i}>{part.value}</span>
                        ) : (
                          <span
                            key={i}
                            className="relative cursor-pointer"
                            onClick={() => setActiveError(activeError === i ? null : i)}
                          >
                            <span className="bg-red-100 text-red-700 border-b-2 border-red-400 rounded px-0.5 font-medium">
                              {part.value}
                            </span>
                            {activeError === i && (
                              <span className="absolute left-0 top-6 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56 text-xs text-slate-700 space-y-1">
                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-xmark text-red-500"></i>
                                  <span className="line-through text-red-500">{part.error.original}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-check text-teal-500"></i>
                                  <span className="font-bold text-teal-700">{part.error.corrected}</span>
                                </span>
                                <span className="text-slate-500 border-t border-slate-100 pt-1 block">{part.error.explanation}</span>
                              </span>
                            )}
                          </span>
                        )
                      )}
                    </div>
                    {result.errors?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-2">
                        <i className="fa-solid fa-circle-info mr-1"></i>
                        {result.errors.length} issue{result.errors.length !== 1 ? 's' : ''} found — tap a red word for details
                      </p>
                    )}
                  </div>

                  {result.errors?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {result.errors.length} issue{result.errors.length !== 1 ? 's' : ''} found
                      </p>
                      {result.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                          <span className="shrink-0 w-5 h-5 bg-red-200 text-red-700 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <div className="text-xs space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="line-through text-red-600 font-medium">{err.original}</span>
                              <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
                              <span className="text-teal-700 font-bold">{err.corrected}</span>
                            </div>
                            <p className="text-slate-500">{err.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center gap-3">
                      <i className="fa-solid fa-circle-check text-teal-500 text-lg"></i>
                      <p className="text-sm text-teal-700 font-medium">No grammar errors found!</p>
                    </div>
                  )}

                  {result.errors?.length > 0 && (
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Corrected Version</p>
                      <p className="text-sm text-slate-700 leading-relaxed italic">"{result.correctedText}"</p>
                    </div>
                  )}

                  {user ? (
                    <button
                      onClick={saveToHistory}
                      disabled={saving || saved}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        saved
                          ? 'bg-teal-50 text-teal-600 border border-teal-200 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-900 text-white'
                      }`}
                    >
                      {saved ? (
                        <><i className="fa-solid fa-check"></i> Saved to History</>
                      ) : saving ? (
                        <><i className="fa-solid fa-spinner animate-spin"></i> Saving...</>
                      ) : (
                        <><i className="fa-solid fa-floppy-disk"></i> Save to History</>
                      )}
                    </button>
                  ) : (
                    <a
                      href="/api/auth/google"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                    >
                      <i className="fa-solid fa-right-to-bracket"></i> Sign in to save to history
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
