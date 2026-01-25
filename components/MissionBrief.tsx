import React, { useState } from 'react';
import { BookOpen, Sword, Lightbulb, X, Play } from 'lucide-react';
import { explainConcept } from '../services/geminiService';
import { MentorPersona } from '../types';

interface MissionBriefProps {
  title: string;
  rpgAnalogy: string;
  realWorldLesson: string;
  missionGoal: string;
  conceptTerm?: string;
  mentorPersona: MentorPersona;
}

export const MissionBrief: React.FC<MissionBriefProps> = ({ 
    title, rpgAnalogy, realWorldLesson, missionGoal, conceptTerm, mentorPersona 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAiExplain = async () => {
    if (conceptTerm) {
        setLoading(true);
        const text = await explainConcept(conceptTerm, mentorPersona);
        setAiExplanation(text);
        setLoading(false);
    }
  };

  if (!isOpen) return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 bg-slate-800 text-emerald-400 p-2 rounded-full border border-emerald-500/50 shadow-lg hover:scale-110 transition-transform"
        title="Open Mission Brief"
      >
          <BookOpen size={20} />
      </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col max-h-[85vh] md:max-h-[90vh]">
        
        {/* Header - Fixed */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center shrink-0 rounded-t-2xl">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Sword className="fill-emerald-400/20" size={24} /> 
                <span className="truncate">{title}</span>
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                <X />
            </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 flex-1">
            
            {/* Analogy Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-purple-500/30">
                    <h3 className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> RPG Logic
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{rpgAnalogy}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-blue-500/30">
                    <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Real World Logic
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{realWorldLesson}</p>
                </div>
            </div>

            {/* Mission Goal */}
            <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/30 text-center">
                <h3 className="text-emerald-400 font-bold text-sm uppercase mb-1">Current Objective</h3>
                <p className="text-xl font-bold text-white">{missionGoal}</p>
            </div>

            {/* AI Assist */}
            {conceptTerm && (
                <div className="text-center">
                    {!aiExplanation ? (
                        <button 
                            onClick={handleAiExplain}
                            disabled={loading}
                            className="text-xs text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                            <Lightbulb size={12} /> {loading ? 'Mentor is thinking...' : `Ask Mentor to explain "${conceptTerm}"`}
                        </button>
                    ) : (
                        <div className="bg-yellow-900/10 border border-yellow-500/20 p-3 rounded-lg">
                            <p className="text-xs text-yellow-300 animate-in fade-in italic">" {aiExplanation} "</p>
                        </div>
                    )}
                </div>
            )}

        </div>

        {/* Footer - Fixed */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-center shrink-0 rounded-b-2xl">
            <button 
                onClick={() => setIsOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-12 rounded-full shadow-lg shadow-emerald-900/50 transition-all transform hover:scale-105 flex items-center gap-2"
            >
                Start Mission <Play size={18} fill="currentColor" />
            </button>
        </div>

      </div>
    </div>
  );
};