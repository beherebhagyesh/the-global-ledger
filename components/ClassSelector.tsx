import React from 'react';
import { Laptop, PenTool, CheckCircle2, Server, Headphones } from 'lucide-react';
import { CharacterClass } from '../types';

interface ClassSelectorProps {
    onSelect: (c: CharacterClass) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({ onSelect }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-6xl mx-auto text-center pb-12">

            <div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
                    CHOOSE YOUR CLASS
                </h2>
                <p className="text-slate-400">Your choice determines your income potential, expense types, and gameplay difficulty.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Tech Nomad */}
                <button
                    onClick={() => onSelect('TECH_NOMAD')}
                    className="group relative bg-slate-900 border-2 border-slate-700 hover:border-cyan-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden flex flex-col"
                >
                    <div className="relative z-10 flex-1">
                        <div className="w-12 h-12 bg-cyan-900/50 rounded-full flex items-center justify-center text-cyan-400 mb-4">
                            <Laptop size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Tech Nomad</h3>
                        <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest">Balanced</p>
                        <p className="text-sm text-slate-400 mb-4">High hourly rate. Low overhead. The standard path.</p>

                        <div className="space-y-1 mb-6">
                            <div className="flex items-center gap-2 text-[10px] text-cyan-200">
                                <CheckCircle2 size={12} /> <span>Income: $60-$100/hr</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-cyan-200">
                                <CheckCircle2 size={12} /> <span>Risk: Medium</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-cyan-600 text-white font-bold py-2 rounded text-sm text-center group-hover:bg-cyan-500 mt-auto">Select</div>
                </button>

                {/* Creative Agency */}
                <button
                    onClick={() => onSelect('CREATIVE_AGENCY')}
                    className="group relative bg-slate-900 border-2 border-slate-700 hover:border-purple-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden flex flex-col"
                >
                    <div className="relative z-10 flex-1">
                        <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center text-purple-400 mb-4">
                            <PenTool size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Creative Agency</h3>
                        <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest">High Variance</p>
                        <p className="text-sm text-slate-400 mb-4">Project-based. High reward but "Feast or Famine" cycles.</p>

                        <div className="space-y-1 mb-6">
                            <div className="flex items-center gap-2 text-[10px] text-purple-200">
                                <CheckCircle2 size={12} /> <span>Income: $5k - $15k / project</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-purple-200">
                                <CheckCircle2 size={12} /> <span>Risk: High</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-purple-600 text-white font-bold py-2 rounded text-sm text-center group-hover:bg-purple-500 mt-auto">Select</div>
                </button>

                {/* SaaS Founder (Hard) */}
                <button
                    onClick={() => onSelect('SAAS_FOUNDER')}
                    className="group relative bg-slate-900 border-2 border-red-900/50 hover:border-red-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden flex flex-col"
                >
                    <div className="relative z-10 flex-1">
                        <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center text-red-400 mb-4">
                            <Server size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">SaaS Founder</h3>
                        <p className="text-xs text-red-400 mb-4 uppercase tracking-widest font-bold">HARD MODE</p>
                        <p className="text-sm text-slate-400 mb-4">High initial burn. No revenue at start. Exponential growth later.</p>

                        <div className="space-y-1 mb-6">
                            <div className="flex items-center gap-2 text-[10px] text-red-200">
                                <CheckCircle2 size={12} /> <span>Income: $0 {'->'} Infinite</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-red-200">
                                <CheckCircle2 size={12} /> <span>Expense: Very High</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-red-600 text-white font-bold py-2 rounded text-sm text-center group-hover:bg-red-500 mt-auto">Select</div>
                </button>

                {/* Virtual Assistant (Easy/Grind) */}
                <button
                    onClick={() => onSelect('VIRTUAL_ASSISTANT')}
                    className="group relative bg-slate-900 border-2 border-slate-700 hover:border-yellow-500 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left overflow-hidden flex flex-col"
                >
                    <div className="relative z-10 flex-1">
                        <div className="w-12 h-12 bg-yellow-900/50 rounded-full flex items-center justify-center text-yellow-400 mb-4">
                            <Headphones size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Virtual Assistant</h3>
                        <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest">Easy / Grind</p>
                        <p className="text-sm text-slate-400 mb-4">Low entry barrier. Steady tasks. Hard to scale income.</p>

                        <div className="space-y-1 mb-6">
                            <div className="flex items-center gap-2 text-[10px] text-yellow-200">
                                <CheckCircle2 size={12} /> <span>Income: $15 - $30/hr</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-yellow-200">
                                <CheckCircle2 size={12} /> <span>Risk: Low</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-yellow-600 text-black font-bold py-2 rounded text-sm text-center group-hover:bg-yellow-500 mt-auto">Select</div>
                </button>

            </div>
        </div>
    );
};