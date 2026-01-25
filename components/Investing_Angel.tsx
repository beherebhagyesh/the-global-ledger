
import React, { useState, useEffect } from 'react';
import { Rocket, Globe, MapPin, Search, Eye, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Briefcase, Zap, Shield, Skull, X, Terminal } from 'lucide-react';
import { StartupOpportunity, StartupRegion, StartupSector, SectorTrend, RegionStats } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { generateGlobalStartup } from '../services/geminiService';
import { playSound } from '../utils/sound';
import { SmartTooltip } from './SmartTooltip';

interface InvestingAngelProps {
    startups: StartupOpportunity[]; // Legacy prop, we'll manage internal state mostly
    portfolio: StartupOpportunity[];
    bankBalance: number;
    onInvest: (startup: StartupOpportunity) => void;
    onMentor: (id: string) => void;
}

// --- CONSTANTS ---
const REGIONS: RegionStats[] = [
    { id: 'SILICON_VALLEY', name: 'Silicon Valley', valuationMod: 2.0, talentPool: 95, riskFactor: 0.4 },
    { id: 'BANGALORE', name: 'Bangalore', valuationMod: 0.6, talentPool: 90, riskFactor: 0.5 },
    { id: 'TEL_AVIV', name: 'Tel Aviv', valuationMod: 1.2, talentPool: 92, riskFactor: 0.3 },
    { id: 'BERLIN', name: 'Berlin', valuationMod: 1.0, talentPool: 85, riskFactor: 0.2 },
    { id: 'LAGOS', name: 'Lagos', valuationMod: 0.4, talentPool: 80, riskFactor: 0.7 },
    { id: 'SINGAPORE', name: 'Singapore', valuationMod: 1.1, talentPool: 88, riskFactor: 0.1 },
];

const SECTORS: SectorTrend[] = [
    { id: 'AI_INFRA', name: 'AI Infrastructure', hype: 95, exitMultiple: 50, volatility: 0.8 },
    { id: 'FINTECH', name: 'Fintech', hype: 60, exitMultiple: 20, volatility: 0.4 },
    { id: 'CLIMATE', name: 'Climate Tech', hype: 80, exitMultiple: 30, volatility: 0.5 },
    { id: 'WEB3', name: 'Web3 / Crypto', hype: 40, exitMultiple: 100, volatility: 0.9 },
    { id: 'BIOTECH', name: 'BioTech', hype: 70, exitMultiple: 40, volatility: 0.3 },
];

export const Investing_Angel: React.FC<InvestingAngelProps> = ({ portfolio, bankBalance, onInvest, onMentor }) => {
    const [view, setView] = useState<'MAP' | 'DEAL_ROOM' | 'PORTFOLIO'>('MAP');
    const [selectedRegion, setSelectedRegion] = useState<StartupRegion>('SILICON_VALLEY');
    const [dealFlow, setDealFlow] = useState<StartupOpportunity[]>([]);
    const [activeDeal, setActiveDeal] = useState<StartupOpportunity | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Due Diligence State
    const [ddRevealed, setDdRevealed] = useState<{
        financials: boolean;
        founder: boolean;
        risks: boolean;
    }>({ financials: false, founder: false, risks: false });

    // Initial Load
    useEffect(() => {
        if (dealFlow.length === 0) scoutDeals('SILICON_VALLEY');
    }, []);

    const scoutDeals = async (region: StartupRegion) => {
        setLoading(true);
        setSelectedRegion(region);
        
        // Generate 2 deals for the region
        const s1 = SECTORS[Math.floor(Math.random() * SECTORS.length)];
        const s2 = SECTORS[Math.floor(Math.random() * SECTORS.length)];
        
        const d1 = await generateGlobalStartup(region, s1.id);
        const d2 = await generateGlobalStartup(region, s2.id);
        
        setDealFlow([d1, d2]);
        setLoading(false);
        playSound('CLICK');
    };

    const openDeal = (deal: StartupOpportunity) => {
        setActiveDeal(deal);
        setView('DEAL_ROOM');
        setDdRevealed({ financials: false, founder: false, risks: false }); // Reset DD
    };

    const runDueDiligence = (type: 'financials' | 'founder' | 'risks', cost: number) => {
        if (bankBalance < cost) {
            alert("Insufficient funds for investigation.");
            return;
        }
        // In a real app we'd deduct cost via prop, assume free for UI demo or handle internally
        // updateBank(-cost); 
        setDdRevealed(prev => ({ ...prev, [type]: true }));
        playSound('CLICK');
    };

    const handleInvestment = () => {
        if (!activeDeal) return;
        
        // Final Fraud Check
        if (activeDeal.founder.archetype === 'FRAUDSTER' && Math.random() < 0.2) {
            alert(`🚨 SCAM ALERT! As you wired the funds, ${activeDeal.founder.name} deleted their LinkedIn and ghosted. You lost the money.`);
            // Logic to lose money but no equity
        } else {
            onInvest(activeDeal);
        }
        setView('PORTFOLIO');
        setActiveDeal(null);
    };

    // --- SUB-COMPONENTS ---

    const RenderMap = () => (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
            {/* LEFT: HUB SELECTOR */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-2 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Global Tech Hubs</h3>
                {REGIONS.map(r => (
                    <button 
                        key={r.id}
                        onClick={() => scoutDeals(r.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${selectedRegion === r.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm">{r.name}</span>
                            <Globe size={14} className={selectedRegion === r.id ? 'text-white' : 'text-slate-600'} />
                        </div>
                        <div className="flex gap-2 text-[10px]">
                            <span className="bg-black/20 px-1.5 rounded">Val: {r.valuationMod}x</span>
                            <span className="bg-black/20 px-1.5 rounded">Risk: {(r.riskFactor * 100).toFixed(0)}%</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* RIGHT: DEAL FEED */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-700 rounded-xl p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <MapPin className="text-emerald-400" /> {REGIONS.find(r => r.id === selectedRegion)?.name} Deal Flow
                        </h2>
                        <p className="text-slate-400 text-sm">Sourcing active rounds...</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView('PORTFOLIO')} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">My Portfolio</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64 text-emerald-400 animate-pulse">
                        <Terminal size={48} />
                        <span className="ml-4 font-mono">Scouting Ecosystem...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dealFlow.map(deal => (
                            <div key={deal.id} className="bg-slate-950 border border-slate-800 hover:border-indigo-500 p-5 rounded-xl group transition-all cursor-pointer relative overflow-hidden" onClick={() => openDeal(deal)}>
                                {/* Sector Badge */}
                                <div className="absolute top-0 right-0 bg-slate-900 px-3 py-1 rounded-bl-xl border-b border-l border-slate-800 text-[10px] font-bold text-slate-400 group-hover:text-white">
                                    {deal.sector.replace('_', ' ')}
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-white mb-1">{deal.name}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2">"{deal.pitch}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase">Valuation</p>
                                        <p className="text-sm font-mono text-white font-bold">${(deal.valuation / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase">Min Ticket</p>
                                        <p className="text-sm font-mono text-white font-bold">${deal.ask.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button className="w-full py-2 bg-indigo-900/30 text-indigo-400 font-bold rounded border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xs">
                                    View Data Room
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const RenderDealRoom = () => {
        if (!activeDeal) return null;
        
        const sectorTrend = SECTORS.find(s => s.id === activeDeal.sector);
        const hypeColor = (sectorTrend?.hype || 0) > 80 ? 'text-red-500' : (sectorTrend?.hype || 0) > 50 ? 'text-yellow-500' : 'text-blue-500';

        return (
            <div className="h-[600px] flex flex-col">
                <button onClick={() => setView('MAP')} className="self-start text-slate-400 hover:text-white mb-4 flex items-center gap-2 text-sm font-bold">
                    ← Back to Map
                </button>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    
                    {/* LEFT: PITCH & BASICS */}
                    <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {/* Header Card */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2">{activeDeal.name}</h1>
                                    <div className="flex gap-2">
                                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-600">{activeDeal.region}</span>
                                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-600">{activeDeal.sector}</span>
                                        <span className="bg-indigo-900 text-indigo-300 px-2 py-1 rounded text-xs border border-indigo-500">{activeDeal.round}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Sector Hype</div>
                                    <div className={`text-2xl font-black ${hypeColor}`}>{sectorTrend?.hype}/100</div>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800 italic text-slate-300 text-lg">
                                "{activeDeal.pitch}"
                            </div>
                        </div>

                        {/* FOUNDER PROFILE */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2"><Briefcase size={18}/> Founder Profile</h3>
                                {ddRevealed.founder ? (
                                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Verified</span>
                                ) : (
                                    <button onClick={() => runDueDiligence('founder', 200)} className="text-xs bg-slate-800 px-3 py-1 rounded border border-slate-600 hover:text-white">
                                        Background Check ($200)
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl border-2 border-slate-600">
                                    {activeDeal.founder.archetype === 'VISIONARY' ? '🦄' : 
                                     activeDeal.founder.archetype === 'HACKER' ? '💻' :
                                     activeDeal.founder.archetype === 'HUSTLER' ? '🤝' : 
                                     activeDeal.founder.archetype === 'FRAUDSTER' ? '🎭' : '🎓'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">{activeDeal.founder.name}</h4>
                                    <p className="text-sm text-slate-400">{activeDeal.founder.archetype} • Skill: {activeDeal.founder.skill}/100</p>
                                    {ddRevealed.founder && (
                                        <div className="mt-2 text-xs grid grid-cols-2 gap-4">
                                            <span className={activeDeal.founder.integrity < 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                                                Integrity: {activeDeal.founder.integrity}/100
                                            </span>
                                            <span className="text-slate-400">Style: {activeDeal.founder.pitchStyle}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* FINANCIALS & METRICS */}
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp size={18}/> Traction & Burn</h3>
                                {ddRevealed.financials ? (
                                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Audited</span>
                                ) : (
                                    <button onClick={() => runDueDiligence('financials', 500)} className="text-xs bg-slate-800 px-3 py-1 rounded border border-slate-600 hover:text-white">
                                        Audit Financials ($500)
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase">Valuation</p>
                                    <p className="font-mono text-white font-bold">${(activeDeal.valuation/1000000).toFixed(1)}M</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase">Ask</p>
                                    <p className="font-mono text-emerald-400 font-bold">${activeDeal.ask.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase">Equity</p>
                                    <p className="font-mono text-blue-400 font-bold">{(activeDeal.equityOffered * 100).toFixed(1)}%</p>
                                </div>
                            </div>

                            {ddRevealed.financials ? (
                                <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in">
                                    <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Monthly Burn</span>
                                        <span className="text-red-400 font-mono">-${activeDeal.burnRate.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Runway</span>
                                        <span className={`font-mono font-bold ${activeDeal.runwayMonths < 6 ? 'text-red-500' : 'text-white'}`}>{activeDeal.runwayMonths} Mo</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Traction</span>
                                        <span className="text-white font-mono">{activeDeal.traction.toLocaleString()} Users</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 text-center text-xs text-slate-600 py-4 italic border border-dashed border-slate-800 rounded">
                                    Financials locked. Perform Due Diligence.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: RED FLAGS & ACTION */}
                    <div className="space-y-6 flex flex-col">
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2"><Shield size={18}/> Risk Analysis</h3>
                                {ddRevealed.risks ? (
                                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Revealed</span>
                                ) : (
                                    <button onClick={() => runDueDiligence('risks', 300)} className="text-xs bg-slate-800 px-3 py-1 rounded border border-slate-600 hover:text-white">
                                        Legal Probe ($300)
                                    </button>
                                )}
                            </div>

                            {ddRevealed.risks ? (
                                <div className="space-y-3 animate-in fade-in">
                                    {activeDeal.redFlags.map((flag, i) => (
                                        <div key={i} className="bg-red-900/20 border border-red-500/50 p-3 rounded flex items-start gap-2">
                                            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                            <span className="text-xs text-red-200">{flag}</span>
                                        </div>
                                    ))}
                                    {activeDeal.greenFlags.map((flag, i) => (
                                        <div key={i} className="bg-emerald-900/20 border border-emerald-500/50 p-3 rounded flex items-start gap-2">
                                            <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-xs text-emerald-200">{flag}</span>
                                        </div>
                                    ))}
                                    {activeDeal.redFlags.length === 0 && activeDeal.greenFlags.length === 0 && <p className="text-xs text-slate-500">No major anomalies found.</p>}
                                </div>
                            ) : (
                                <div className="text-center text-xs text-slate-600 py-10 italic">
                                    <Skull size={32} className="mx-auto mb-2 opacity-20"/>
                                    Unknown Risks. Investigate to reveal.
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between mb-4 text-xs text-slate-400">
                                <span>Cash Available</span>
                                <span className="text-white font-bold">${bankBalance.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={handleInvestment}
                                disabled={bankBalance < activeDeal.ask}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                <Rocket size={20} /> Wire ${activeDeal.ask.toLocaleString()}
                            </button>
                            <button 
                                onClick={() => setActiveDeal(null)}
                                className="w-full py-3 mt-2 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                Pass on Deal
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    const RenderPortfolio = () => (
        <div className="h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => setView('MAP')} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2">← Back to Scouting</button>
                <h2 className="text-2xl font-black text-white">Your Portfolio</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto">
                {portfolio.length === 0 && (
                    <div className="col-span-2 text-center py-20 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                        No Investments Yet.
                    </div>
                )}
                {portfolio.map(co => (
                    <div key={co.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white text-lg">{co.name}</h3>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">{co.round}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${co.status === 'EXITED' ? 'bg-emerald-500 text-black' : co.status === 'BANKRUPT' ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'}`}>
                                    {co.status}
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase">Current Val</p>
                            <p className="font-mono text-white font-bold">${(co.valuation * 1.2 / 1000000).toFixed(1)}M</p>
                            {co.status === 'FUNDED' && (
                                <ActionTooltip title="Mentor" desc="Boost success chance.">
                                    <button onClick={() => onMentor(co.id)} className="mt-2 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded">
                                        Mentor
                                    </button>
                                </ActionTooltip>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            {view === 'MAP' && <RenderMap />}
            {view === 'DEAL_ROOM' && <RenderDealRoom />}
            {view === 'PORTFOLIO' && <RenderPortfolio />}
        </div>
    );
};
