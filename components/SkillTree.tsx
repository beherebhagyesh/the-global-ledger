
import React from 'react';
import { PlayerState, Skill } from '../types';
import { Zap, Shield, TrendingUp, X, Check } from 'lucide-react';

interface SkillTreeProps {
  player: PlayerState;
  onClose: () => void;
  onUnlock: (skillId: string) => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({ player, onClose, onUnlock }) => {
  
  const handleUnlock = (skill: Skill) => {
      if (player.xp >= skill.cost && !skill.unlocked) {
          onUnlock(skill.id);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
       <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-indigo-500/50 shadow-2xl relative flex flex-col max-h-[90vh]">
          
          <div className="bg-indigo-900/30 p-6 border-b border-indigo-500/30 flex justify-between items-center shrink-0 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-black text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                    <Zap className="fill-indigo-400" /> Skill Matrix
                </h2>
                <p className="text-slate-400 text-sm">Available XP: <span className="text-emerald-400 font-mono font-bold">{player.xp}</span></p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X size={20}/></button>
          </div>

          <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-900 flex-1 relative">
             {/* Background Grid */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {player.skills.map((skill) => (
                     <div 
                        key={skill.id}
                        className={`relative p-6 rounded-xl border-2 transition-all flex flex-col group
                            ${skill.unlocked 
                                ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                                : 'bg-slate-800 border-slate-700 opacity-80 hover:opacity-100 hover:border-slate-500'}
                        `}
                     >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg ${skill.unlocked ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                {skill.icon === 'Zap' && <Zap size={24} />}
                                {skill.icon === 'Shield' && <Shield size={24} />}
                                {skill.icon === 'TrendingUp' && <TrendingUp size={24} />}
                            </div>
                            {skill.unlocked && <Check className="text-indigo-400" />}
                        </div>
                        
                        <h3 className="font-bold text-lg text-white mb-1">{skill.name}</h3>
                        <p className="text-sm text-slate-400 mb-4 flex-1">{skill.description}</p>
                        
                        <div className="mt-auto">
                            {skill.unlocked ? (
                                <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest bg-indigo-900/50 py-2 text-center rounded">
                                    Active
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleUnlock(skill)}
                                    disabled={player.xp < skill.cost}
                                    className={`w-full py-2 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2
                                        ${player.xp >= skill.cost 
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg' 
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                    `}
                                >
                                    Unlock ({skill.cost} XP)
                                </button>
                            )}
                        </div>
                     </div>
                 ))}
             </div>
          </div>
          
       </div>
    </div>
  );
};
