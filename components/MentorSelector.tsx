import React from 'react';
import { MentorPersona } from '../types';
import { Briefcase, Flower, Gamepad2 } from 'lucide-react';

interface MentorSelectorProps {
  onSelect: (p: MentorPersona) => void;
}

export const MentorSelector: React.FC<MentorSelectorProps> = ({ onSelect }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto text-center pt-12">
      
      <div>
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
            SELECT YOUR MENTOR
        </h2>
        <p className="text-slate-400">Who will guide you through the financial jungle? This affects your game feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Wall St */}
          <button 
            onClick={() => onSelect('WALL_ST')}
            className="group relative bg-slate-900 border-2 border-slate-700 hover:border-blue-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden"
          >
             <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center text-blue-400 mb-4">
                 <Briefcase size={24} />
             </div>
             <h3 className="text-xl font-bold text-white mb-1">The Broker</h3>
             <p className="text-xs text-blue-300 mb-4 uppercase tracking-widest">"Greed is Good"</p>
             <p className="text-sm text-slate-400 mb-6">Aggressive. Focuses on pure profit and ruthless efficiency. No mercy.</p>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-blue-500"></div>
             </div>
             <span className="text-[10px] text-slate-500 mt-1 block">Difficulty: Hard</span>
          </button>

           {/* Zen Monk */}
           <button 
            onClick={() => onSelect('ZEN_MONK')}
            className="group relative bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden"
          >
             <div className="w-12 h-12 bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-400 mb-4">
                 <Flower size={24} />
             </div>
             <h3 className="text-xl font-bold text-white mb-1">The Monk</h3>
             <p className="text-xs text-emerald-300 mb-4 uppercase tracking-widest">"Flow like Cash"</p>
             <p className="text-sm text-slate-400 mb-6">Patient. Focuses on sustainability, mental health, and long-term assets.</p>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-emerald-500"></div>
             </div>
             <span className="text-[10px] text-slate-500 mt-1 block">Difficulty: Balanced</span>
          </button>

           {/* Gamer Bro */}
           <button 
            onClick={() => onSelect('GAMER_BRO')}
            className="group relative bg-slate-900 border-2 border-slate-700 hover:border-purple-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden"
          >
             <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center text-purple-400 mb-4">
                 <Gamepad2 size={24} />
             </div>
             <h3 className="text-xl font-bold text-white mb-1">The Pro Gamer</h3>
             <p className="text-xs text-purple-300 mb-4 uppercase tracking-widest">"Min/Max Your Stats"</p>
             <p className="text-sm text-slate-400 mb-6">Meta. Explains everything in game terms (DPS, Tanking, Nerfs). Fun & Relatable.</p>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-purple-500"></div>
             </div>
             <span className="text-[10px] text-slate-500 mt-1 block">Difficulty: Easy</span>
          </button>

      </div>
    </div>
  );
};