import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Briefcase, Flag, Loader2, ArrowLeft } from 'lucide-react';
import { generateGigOffer } from '../services/geminiService';
import { GigOffer } from '../types';

interface GigSimulatorProps {
  onBack: () => void;
}

export const GigSimulator: React.FC<GigSimulatorProps> = ({ onBack }) => {
  const [offer, setOffer] = useState<GigOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{correct: boolean, msg: string} | null>(null);

  const fetchOffer = async () => {
      setLoading(true);
      setFeedback(null);
      const data = await generateGigOffer();
      setOffer(data);
      setLoading(false);
  };

  useEffect(() => {
      fetchOffer();
  }, []);

  const handleDecision = (accepted: boolean) => {
      if (!offer) return;
      
      // Good Deal + Accept = Correct
      // Bad Deal + Reject = Correct
      const isCorrect = (offer.isGoodDeal && accepted) || (!offer.isGoodDeal && !accepted);
      
      if (isCorrect) {
          setScore(s => s + 100);
          setStreak(s => s + 1);
          setFeedback({
              correct: true, 
              msg: accepted ? "Good eye! This is a solid contract." : "Dodged a bullet! That client was trouble."
          });
      } else {
          setStreak(0);
          setFeedback({
              correct: false,
              msg: accepted ? "Trap triggered! Never work for exposure." : "Missed opportunity! That was a legit offer."
          });
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
       
       <div className="flex items-center justify-between">
           <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2">
               <ArrowLeft size={16} /> Exit Sandbox
           </button>
           <div className="flex gap-4 text-sm font-mono">
               <span className="text-emerald-400">SCORE: {score}</span>
               <span className="text-orange-400">STREAK: {streak}</span>
           </div>
       </div>

       <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl relative min-h-[400px] flex flex-col">
           {loading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                   <Loader2 className="animate-spin text-emerald-500" size={48} />
               </div>
           ) : offer ? (
               <>
                   <div className="flex justify-between items-start mb-6">
                       <div>
                           <h2 className="text-2xl font-bold text-white">{offer.clientName}</h2>
                           <p className="text-slate-400 text-sm">{offer.projectTitle}</p>
                       </div>
                       <div className="bg-slate-900 px-3 py-1 rounded text-emerald-400 font-mono font-bold">
                           {offer.budget}
                       </div>
                   </div>

                   <div className="flex-1 bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-8">
                       <p className="text-slate-200 leading-relaxed italic">"{offer.description}"</p>
                   </div>

                   {feedback ? (
                       <div className={`p-4 rounded-xl text-center mb-4 animate-in zoom-in ${feedback.correct ? 'bg-green-900/20 text-green-400 border border-green-500/50' : 'bg-red-900/20 text-red-400 border border-red-500/50'}`}>
                           <p className="font-bold text-lg mb-1">{feedback.correct ? 'WISE CHOICE' : 'BAD CALL'}</p>
                           <p className="text-sm">{feedback.msg}</p>
                           
                           <div className="mt-3 text-xs text-slate-500">
                               ANALYSIS: {offer.flags.join(", ")}
                           </div>

                           <button onClick={fetchOffer} className="mt-4 bg-slate-200 text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform">
                               Next Offer
                           </button>
                       </div>
                   ) : (
                       <div className="grid grid-cols-2 gap-4">
                           <button 
                                onClick={() => handleDecision(false)}
                                className="bg-red-900/20 hover:bg-red-900/50 border border-red-800 text-red-400 font-bold py-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95"
                           >
                               <ThumbsDown size={24} /> REJECT
                           </button>
                           <button 
                                onClick={() => handleDecision(true)}
                                className="bg-emerald-900/20 hover:bg-emerald-900/50 border border-emerald-800 text-emerald-400 font-bold py-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95"
                           >
                               <ThumbsUp size={24} /> ACCEPT
                           </button>
                       </div>
                   )}
               </>
           ) : null}
       </div>

       <div className="text-center text-xs text-slate-500">
           Sandbox Mode: Infinite generated scenarios to practice Red Flag detection.
       </div>

    </div>
  );
};