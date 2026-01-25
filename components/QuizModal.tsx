
import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizModalProps {
  question: QuizQuestion;
  onPass: () => void;
  onFail: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ question, onPass, onFail }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    const isCorrect = question.options.find(o => o.id === selected)?.isCorrect;
    if (!isCorrect) {
        setTimeout(onFail, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-xl rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col max-h-[90vh]">
        
        {/* Header - Fixed */}
        <div className="bg-red-950/50 p-4 md:p-6 border-b border-red-900 flex items-center gap-3 shrink-0 rounded-t-2xl">
            <ShieldAlert className="text-red-500 animate-pulse shrink-0" size={24} />
            <div>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-red-500">Boss Battle Triggered</h2>
                <p className="text-xs text-red-300">Solve this scenario to proceed.</p>
            </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 flex-1">
            <p className="text-base md:text-lg font-bold text-white leading-relaxed">{question.question}</p>

            <div className="space-y-3">
                {question.options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => !submitted && setSelected(opt.id)}
                        disabled={submitted}
                        className={`w-full p-3 md:p-4 rounded-xl border text-left transition-all relative
                            ${selected === opt.id ? 'ring-2 ring-emerald-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}
                            ${submitted && opt.isCorrect ? 'bg-green-900/50 border-green-500' : ''}
                            ${submitted && selected === opt.id && !opt.isCorrect ? 'bg-red-900/50 border-red-500' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start gap-3">
                            <span className="font-mono font-bold text-slate-400 shrink-0 mt-0.5">{opt.id}.</span>
                            <span className="flex-1 text-sm md:text-base leading-snug">{opt.text}</span>
                            {submitted && opt.isCorrect && <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />}
                            {submitted && selected === opt.id && !opt.isCorrect && <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />}
                        </div>
                    </button>
                ))}
            </div>

            {submitted && (
                <div className={`p-4 rounded-lg border ${question.options.find(o => o.id === selected)?.isCorrect ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                    <p className="text-sm font-bold mb-1">{question.options.find(o => o.id === selected)?.isCorrect ? 'CORRECT MOVE' : 'CRITICAL FAILURE'}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{question.explanation}</p>
                </div>
            )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0 rounded-b-2xl">
            {!submitted ? (
                <button 
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="bg-slate-200 text-slate-900 font-bold py-2 px-6 rounded-lg disabled:opacity-50 hover:bg-white transition-colors text-sm md:text-base"
                >
                    Lock In Answer
                </button>
            ) : (
                <button 
                    onClick={() => {
                        const correct = question.options.find(o => o.id === selected)?.isCorrect;
                        if(correct) onPass();
                        else {
                            setSubmitted(false);
                            setSelected(null);
                        }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 animate-bounce-short text-sm md:text-base"
                >
                    {question.options.find(o => o.id === selected)?.isCorrect ? <>Continue <ArrowRight size={18}/></> : 'Retry Level'}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};
