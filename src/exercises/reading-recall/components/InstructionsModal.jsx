export default function InstructionsModal({ onStart, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl mb-3">
            <i className="fa-solid fa-circle-info"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900 title-font">Are you ready to start?</h3>
          <p className="text-sm text-slate-500 mt-1">Keep these simple guidelines in mind:</p>
        </div>

        <div className="space-y-4 mb-6">
          {[
            "The 40-second timer starts immediately after clicking the button.",
            "Skim the textbook pages. Don't worry about every tiny word, capture the general story.",
            "When the time finishes, the book disappears automatically. You MUST stop reading.",
            "Write down the main ideas in English from your memory."
          ].map((tip, i) => (
            <div key={i} className="flex items-start space-x-3 text-sm">
              <span className="bg-indigo-100 text-indigo-700 font-bold rounded-lg w-6 h-6 flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-slate-600">{tip}</p>
            </div>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-100"
          >
            Start Reading
          </button>
        </div>
      </div>
    </div>
  );
}
