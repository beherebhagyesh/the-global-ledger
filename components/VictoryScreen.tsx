
import React, { useState, useEffect } from 'react';
import { RotateCcw, Download, Share2, FileText, Layout, Award, Crown, Shield, Zap, TrendingUp, Hexagon } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PlayerState, FinalStats } from '../types';
import { playSound } from '../utils/sound';
import { Web3Mint } from './Web3Mint';

interface VictoryScreenProps {
  player: PlayerState;
  onReset: () => void;
  onSandbox: () => void;
}

const GoldenBadge = () => (
    <svg viewBox="0 0 200 200" className="w-32 h-32 animate-[spin_10s_linear_infinite]">
        <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="none" stroke="url(#goldGrad)" strokeWidth="4" strokeDasharray="10 5" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="url(#goldGrad)" strokeWidth="2" />
        <path d="M100 20 L120 80 L180 80 L130 120 L150 180 L100 140 L50 180 L70 120 L20 80 L80 80 Z" fill="url(#goldGrad)" opacity="0.8" />
    </svg>
);

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ player, onReset, onSandbox }) => {
  const [showShareToast, setShowShareToast] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);

  // Mock Stats for Visualizer based on gameplay
  const stats = [
      { subject: 'Alpha', A: player.bankBalance > 20000 ? 100 : player.bankBalance / 200, fullMark: 100 },
      { subject: 'Risk', A: player.stress < 30 ? 90 : 100 - player.stress, fullMark: 100 },
      { subject: 'Compliance', A: player.inventory.some(i => i.id === 'w8ben_guide') ? 100 : 50, fullMark: 100 },
      { subject: 'Liquidity', A: player.creditScore > 750 ? 95 : 60, fullMark: 100 },
      { subject: 'Influence', A: player.reputation, fullMark: 100 },
  ];

  const handleShare = () => {
      navigator.clipboard.writeText(`I just became a Global Financial Architect in 'The Global Ledger'. Net Worth: $${player.bankBalance.toLocaleString()}. Beat my score!`);
      setShowShareToast(true);
      playSound('COIN');
      setTimeout(() => setShowShareToast(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pb-20 pt-10">
        
        {showMintModal && <Web3Mint player={player} onClose={() => setShowMintModal(false)} />}

        {/* HEADER */}
        <div className="text-center mb-12 space-y-2 animate-in slide-in-from-top duration-700">
            <div className="inline-block bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black px-6 py-2 rounded-full uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4">
                Game Complete
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase">
                Global Financial<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Architect</span>
            </h1>
        </div>

        {/* THE BLACK CARD (Credential) */}
        <div className="w-full max-w-5xl bg-slate-950 rounded-3xl border-4 border-slate-800 relative overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in duration-500 group hover:border-emerald-500/50 transition-all">
            
            {/* Background FX */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* LEFT: IDENTITY & BADGES */}
            <div className="p-8 md:p-12 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-800 relative z-10 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-full border-2 border-yellow-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                        <Crown size={32} className="text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                        <p className="text-emerald-400 font-mono text-sm uppercase tracking-widest">Certified Grandmaster</p>
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Final Net Worth</p>
                        <p className="text-4xl font-mono font-black text-white tracking-tight">${player.bankBalance.toLocaleString()}</p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold mb-3">Badge Collection</p>
                        <div className="flex flex-wrap gap-2">
                            {player.achievements.slice(0, 8).map((ach) => (
                                <div key={ach} className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center border border-slate-700 text-yellow-500" title={ach}>
                                    <Award size={20} />
                                </div>
                            ))}
                            {player.achievements.length > 8 && (
                                <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500 border border-slate-700">
                                    +{player.achievements.length - 8}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Issued By</p>
                        <p className="text-slate-400 font-bold">The Global Ledger</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Date</p>
                        <p className="text-slate-400 font-mono">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* RIGHT: RADAR STATS & GOLDEN BADGE */}
            <div className="p-8 md:p-12 md:w-1/2 relative z-10 flex flex-col items-center justify-center bg-slate-900/30">
                
                <div className="absolute top-4 right-4">
                    <GoldenBadge />
                </div>

                <h3 className="text-slate-500 uppercase text-xs font-bold tracking-[0.3em] mb-6">Competency Matrix</h3>
                
                <div className="w-full h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Player"
                                dataKey="A"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="#10b981"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                    <button onClick={handleShare} className="bg-white text-black font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg">
                        <Share2 size={18} /> Share Credential
                    </button>
                    <button onClick={onSandbox} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all flex items-center justify-center gap-2">
                        <Layout size={18} /> Endless Mode
                    </button>
                </div>
                
                <button 
                    onClick={() => setShowMintModal(true)} 
                    className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                    <Hexagon size={18} /> Mint On-Chain NFT
                </button>
                
                {showShareToast && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-4 py-2 rounded-full animate-bounce">
                        Copied to Clipboard!
                    </div>
                )}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex gap-6 text-slate-500 text-sm">
            <button onClick={onReset} className="hover:text-white flex items-center gap-2 transition-colors">
                <RotateCcw size={16} /> Reset Simulation
            </button>
            <button onClick={() => alert("Downloading PDF Plan...")} className="hover:text-white flex items-center gap-2 transition-colors">
                <FileText size={16} /> Download Strategy
            </button>
        </div>

    </div>
  );
};
