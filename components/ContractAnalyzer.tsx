
import React, { useState, useEffect } from 'react';
import { generateContractScenarios } from '../services/geminiService';
import { ContractClause } from '../types';
import { Highlighter, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ContractAnalyzerProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

export const ContractAnalyzer: React.FC<ContractAnalyzerProps> = ({ onClose, onComplete }) => {
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
      const load = async () => {
          const data = await generateContractScenarios();
          setClauses(data);
          setLoading(false);
      };
      load();
  }, []);

  const toggleHighlight = (id: string) => {
      if (submitted) return;
      const next = new Set(highlightedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setHighlightedIds(next);
  };

  const calculateScore = () => {
      setSubmitted(true);
      let score = 0;
      clauses.forEach(c => {
          // Point if Dangerous AND Highlighted
          if (c.type === 'DANGEROUS' && highlightedIds.has(c.id)) score += 100;
          // Penalty if Safe AND Highlighted (False Positive)
          else if (c.type === 'SAFE' && highlightedIds.has(c.id)) score -= 50;
          // Penalty if Dangerous AND NOT Highlighted (Missed)
          else if (c.type === 'DANGEROUS' && !highlightedIds.has(c.id)) score -= 50;
      });
      // Min score 0
      setTimeout(() => onComplete(Math.max(0, score)), 3000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
       <div className="bg-slate-100 w-full max-w-2xl rounded-sm shadow-2xl relative flex flex-col max-h-[90vh] text-slate-900 font-serif">
          
          <div className="bg-slate-200 p-4 border-b border-slate-300 flex justify-between items-center shrink-0">
              <h2 className="font-bold flex items-center gap-2 text-slate-800 uppercase tracking-widest">
                  <Highlighter size={20} className="text-yellow-600" /> Contract Review Mode
              </h2>
              <button onClick={onClose} className="text-slate-500 hover:text-black"><X size={24}/></button>
          </div>

          <div className="p-8 overflow-y-auto flex-1">
             {loading ? (
                 <div className="flex justify-center items-center h-40">
                     <Loader2 className="animate-spin text-slate-400" size={32} />
                 </div>
             ) : (
                 <div className="space-y-6 max-w-xl mx-auto">
                     <div className="text-center mb-8">
                         <h1 className="text-2xl font-bold uppercase border-b-2 border-black inline-block pb-1">Master Services Agreement</h1>
                         <p className="text-xs text-slate-500 mt-2">INSTRUCTION: Click to highlight <span className="bg-yellow-200 px-1 font-bold">DANGEROUS</span> clauses.</p>
                     </div>

                     {clauses.map((clause) => {
                         const isHighlighted = highlightedIds.has(clause.id);
                         let statusClass = "";
                         if (submitted) {
                             if (clause.type === 'DANGEROUS') statusClass = "border-2 border-red-500 relative";
                             else if (clause.type === 'SAFE' && isHighlighted) statusClass = "border-2 border-orange-500 relative";
                         }

                         return (
                             <div 
                                key={clause.id}
                                onClick={() => toggleHighlight(clause.id)}
                                className={`p-4 cursor-pointer transition-all rounded hover:bg-yellow-50 text-sm leading-relaxed relative
                                    ${isHighlighted ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-white'}
                                    ${statusClass}
                                `}
                             >
                                 <p>{clause.text}</p>
                                 
                                 {submitted && clause.type === 'DANGEROUS' && (
                                     <div className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                                         <AlertTriangle size={12} /> RED FLAG: {clause.explanation}
                                     </div>
                                 )}
                                  {submitted && clause.type === 'SAFE' && isHighlighted && (
                                     <div className="mt-2 text-xs font-bold text-orange-600">
                                         FALSE POSITIVE: This is actually standard/safe.
                                     </div>
                                 )}
                             </div>
                         )
                     })}
                 </div>
             )}
          </div>

          {!submitted && !loading && (
              <div className="p-4 bg-slate-200 border-t border-slate-300 flex justify-center shrink-0">
                  <button 
                    onClick={calculateScore}
                    className="bg-slate-900 text-white font-sans font-bold py-3 px-12 rounded shadow-xl hover:scale-105 transition-transform"
                  >
                      Approve & Sign
                  </button>
              </div>
          )}
          
       </div>
    </div>
  );
};
