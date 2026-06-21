import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function PhotoGrammarWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const uploadRef = useRef(null);
  const cameraRef = useRef(null);

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    setSaved(false);
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)[1];
      setImage({ base64, mimeType, previewUrl: dataUrl });
      setResult(null);
      setError(null);
      setSaved(false);
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
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Extracted Text</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.extractedText}</p>
                  </div>

                  {result.errors?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {result.errors.length} issue{result.errors.length !== 1 ? 's' : ''} found
                      </p>
                      {result.errors.map((err, i) => (
                        <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
                          <div className="flex items-start gap-2 flex-wrap">
                            <i className="fa-solid fa-circle-xmark text-red-400 text-xs mt-1"></i>
                            <span className="line-through text-red-500 text-sm">{err.original}</span>
                            <span className="text-slate-400 text-sm">→</span>
                            <span className="text-teal-600 font-medium text-sm">{err.corrected}</span>
                          </div>
                          <p className="text-xs text-slate-500 pl-5">{err.explanation}</p>
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
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.correctedText}</p>
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
