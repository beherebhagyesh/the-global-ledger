
import React, { useState, useEffect } from 'react';
import { Rocket, Skull, Shield, Lock, Activity, Users, Globe, TrendingUp, AlertTriangle, Zap, DollarSign, BarChart3, Search, CheckCircle2, X } from 'lucide-react';
import { TokenProject } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { playSound } from '../utils/sound';

interface CryptoLaunchpadProps {
    myToken: TokenProject | null;
    bankBalance: number;
    onCreateToken: (project: TokenProject, cost: number) => void;
    onTokenAction: (action: string, cost: number) => void;
}

const INFLUENCERS = [
    { id: 'MICRO', name: 'Alpha Callers', cost: 500, hype: 10, risk: 2, desc: 'Telegram groups.' },
    { id: 'MACRO', name: 'Crypto Twitter', cost: 2000, hype: 25, risk: 5, desc: 'Viral tweets.' },
    { id: 'CELEB', name: 'Celebrity Shill', cost: 10000, hype: 60, risk: 20, desc: 'Massive pump. SEC magnet.' },
];

const EXCHANGES = [
    { id: 'TIER_3', name: 'MemeSwap', reqMcap: 100000, cost: 1000, hype: 5 },
    { id: 'TIER_2', name: 'KuCoin-ish', reqMcap: 1000000, cost: 5000, hype: 20 },
    { id: 'TIER_1', name: 'Binance-ish', reqMcap: 10000000, cost: 50000, hype: 50 },
];

export const Crypto_Launchpad: React.FC<CryptoLaunchpadProps> = ({ myToken, bankBalance, onCreateToken, onTokenAction }) => {
    // WIZARD STATE
    const [step, setStep] = useState(1);
    const [draft, setDraft] = useState({
        name: '', ticker: '', supply: 1000000, 
        buyTax: 5, sellTax: 5, teamAllocation: 10, 
        initialLiquidity: 2000, isAudited: false, hasAntiBot: false
    });

    // DASHBOARD STATE
    const [activeTab, setActiveTab] = useState<'TERMINAL' | 'MARKETING' | 'ADMIN'>('TERMINAL');

    const handleDeploy = () => {
        const totalCost = draft.initialLiquidity + (draft.isAudited ? 1000 : 0) + (draft.hasAntiBot ? 500 : 0) + 200; // 200 deploy fee
        
        if (bankBalance < totalCost) {
            alert(`Insufficient funds. Need $${totalCost.toLocaleString()}.`);
            return;
        }

        const newToken: TokenProject = {
            id: Date.now().toString(),
            name: draft.name,
            ticker: draft.ticker.toUpperCase(),
            supply: draft.supply,
            buyTax: draft.buyTax,
            sellTax: draft.sellTax,
            teamAllocation: draft.teamAllocation,
            marketCap: draft.initialLiquidity * 2, // Simple starting val
            liquidity: draft.initialLiquidity,
            price: (draft.initialLiquidity * 2) / draft.supply,
            holders: 1,
            hype: 10,
            secRisk: 0,
            isRugged: false,
            isLpLocked: false,
            isAudited: draft.isAudited,
            listing: 'DEX',
            history: [{ time: 0, price: (draft.initialLiquidity * 2) / draft.supply }]
        };

        onCreateToken(newToken, totalCost);
        playSound('VICTORY');
    };

    if (!myToken) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 h-full flex flex-col items-center justify-center animate-in zoom-in">
                <div className="w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Rocket className="text-orange-500" size={32} /> Token Foundry
                        </h2>
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-3 h-3 rounded-full ${step >= i ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                        {/* BACKGROUND GLOW */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

                        {step === 1 && (
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-lg font-bold text-white mb-4">1. Identity & Supply</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase">Name</label>
                                        <input type="text" value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="MoonSafe"/>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase">Ticker</label>
                                        <input type="text" value={draft.ticker} onChange={e => setDraft({...draft, ticker: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="SAFE"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Total Supply</label>
                                    <select value={draft.supply} onChange={e => setDraft({...draft, supply: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                        <option value={1000000}>1 Million (Low Supply)</option>
                                        <option value={1000000000}>1 Billion (Standard)</option>
                                        <option value={1000000000000}>1 Trillion (Meme)</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button onClick={() => setStep(2)} disabled={!draft.name || !draft.ticker} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">Next</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-lg font-bold text-white mb-4">2. Tokenomics</h3>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Buy Tax</span>
                                        <span className="text-white">{draft.buyTax}%</span>
                                    </div>
                                    <input type="range" min="0" max="25" value={draft.buyTax} onChange={e => setDraft({...draft, buyTax: Number(e.target.value)})} className="w-full accent-orange-500"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Sell Tax</span>
                                        <span className="text-white">{draft.sellTax}%</span>
                                    </div>
                                    <input type="range" min="0" max="25" value={draft.sellTax} onChange={e => setDraft({...draft, sellTax: Number(e.target.value)})} className="w-full accent-orange-500"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                        <span>Team Allocation</span>
                                        <span className={draft.teamAllocation > 20 ? 'text-red-400' : 'text-white'}>{draft.teamAllocation}%</span>
                                    </div>
                                    <input type="range" min="0" max="50" value={draft.teamAllocation} onChange={e => setDraft({...draft, teamAllocation: Number(e.target.value)})} className="w-full accent-blue-500"/>
                                    {draft.teamAllocation > 20 && <p className="text-[10px] text-red-400 mt-1">High team allocation scares investors.</p>}
                                </div>
                                <div className="pt-4 flex justify-between">
                                    <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white font-bold">Back</button>
                                    <button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold">Next</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 relative z-10">
                                <h3 className="text-lg font-bold text-white mb-2">3. Launchpad Config</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border cursor-pointer transition-all ${draft.isAudited ? 'bg-emerald-900/20 border-emerald-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`} onClick={() => setDraft({...draft, isAudited: !draft.isAudited})}>
                                        <div className="flex justify-between mb-2">
                                            <Shield className={draft.isAudited ? 'text-emerald-400' : 'text-slate-500'} />
                                            <span className="text-xs font-bold text-white">$1,000</span>
                                        </div>
                                        <p className="font-bold text-sm text-white">Smart Contract Audit</p>
                                        <p className="text-[10px] text-slate-400">Boosts trust. Reduces regulatory heat.</p>
                                    </div>

                                    <div className={`p-4 rounded-xl border cursor-pointer transition-all ${draft.hasAntiBot ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`} onClick={() => setDraft({...draft, hasAntiBot: !draft.hasAntiBot})}>
                                        <div className="flex justify-between mb-2">
                                            <Zap className={draft.hasAntiBot ? 'text-blue-400' : 'text-slate-500'} />
                                            <span className="text-xs font-bold text-white">$500</span>
                                        </div>
                                        <p className="font-bold text-sm text-white">Anti-Snipe Shield</p>
                                        <p className="text-[10px] text-slate-400">Prevents bots from draining liquidity at launch.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Initial Liquidity (USD)</label>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="text-emerald-400" size={20}/>
                                        <input type="number" min="500" value={draft.initialLiquidity} onChange={e => setDraft({...draft, initialLiquidity: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-lg"/>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">You must fund this from your bank balance.</p>
                                </div>

                                <div className="pt-4 flex justify-between items-center border-t border-slate-800">
                                    <button onClick={() => setStep(2)} className="text-slate-500 hover:text-white font-bold">Back</button>
                                    <button onClick={handleDeploy} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-orange-900/50 flex items-center gap-2">
                                        <Rocket size={18} /> Launch Token
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- LIVE DASHBOARD ---
    const chartData = myToken.history;
    const isDump = myToken.price < (myToken.history[0]?.price || 0) * 0.5;

    return (
        <div className="h-full flex flex-col gap-4">
            
            {/* TOP BAR */}
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 font-black text-xs border border-orange-500/50">
                        {myToken.ticker}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-none">{myToken.name}</h2>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Rank #{420}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${myToken.isAudited ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                                {myToken.isAudited ? 'AUDITED' : 'HIGH RISK'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="md:col-span-2 grid grid-cols-3 gap-2 text-center bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Price</p>
                        <p className={`text-sm font-mono font-bold ${isDump ? 'text-red-500' : 'text-emerald-400'}`}>${myToken.price.toFixed(6)}</p>
                    </div>
                    <div className="border-x border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Mkt Cap</p>
                        <p className="text-sm font-mono font-bold text-white">${(myToken.marketCap / 1000).toFixed(1)}k</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Holders</p>
                        <p className="text-sm font-mono font-bold text-white">{myToken.holders}</p>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold">
                        <span className="text-slate-500">Hype</span>
                        <span className="text-orange-400">{myToken.hype}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-500" style={{width: `${myToken.hype}%`}}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] uppercase font-bold mt-1">
                        <span className="text-slate-500">SEC Heat</span>
                        <span className="text-red-400">{myToken.secRisk}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 transition-all duration-500" style={{width: `${myToken.secRisk}%`}}></div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                
                {/* LEFT: CHART & TERMINAL */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* CHART */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex-1 min-h-[300px] relative">
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <button className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded border border-slate-600">1M</button>
                            <button className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">15M</button>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={['auto', 'auto']} orientation="right" hide />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                                <Area type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ADMIN CONSOLE (ITEM 10 & 11) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ActionTooltip title="Lock Liquidity" desc="Locks LP tokens for 1 month. Increases Holder Confidence massively. Prevents Rug Pull.">
                            <button 
                                onClick={() => onTokenAction('LOCK_LP', 50)} 
                                disabled={myToken.isLpLocked || myToken.isRugged}
                                className={`w-full py-2 rounded text-xs font-bold border flex items-center justify-center gap-1 ${myToken.isLpLocked ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/50' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'}`}
                            >
                                <Lock size={12}/> {myToken.isLpLocked ? 'LP LOCKED' : 'Lock LP ($50)'}
                            </button>
                        </ActionTooltip>

                        <ActionTooltip title="Renounce Ownership" desc="Give up control of the contract. You can no longer change taxes. Trust +++.">
                            <button onClick={() => onTokenAction('RENOUNCE', 50)} disabled={myToken.isRugged} className="w-full py-2 bg-slate-900 text-slate-400 border border-slate-700 rounded text-xs font-bold hover:text-white hover:border-slate-500 flex items-center justify-center gap-1">
                                <CheckCircle2 size={12}/> Renounce
                            </button>
                        </ActionTooltip>

                        <div className="md:col-span-2">
                            <ActionTooltip title="RUG PULL" desc="Drain 100% of liquidity. Game Over for holders. High SEC Risk. You keep the ETH.">
                                <button 
                                    onClick={() => onTokenAction('RUG', 0)}
                                    disabled={myToken.isLpLocked || myToken.isRugged}
                                    className="w-full py-2 bg-red-900/20 text-red-500 border border-red-900 rounded text-xs font-black uppercase tracking-widest hover:bg-red-900/40 hover:border-red-500 flex items-center justify-center gap-2"
                                >
                                    <Skull size={14}/> {myToken.isRugged ? 'RUGGED' : 'EMERGENCY WITHDRAW (RUG)'}
                                </button>
                            </ActionTooltip>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTROL CENTER */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                    <div className="flex border-b border-slate-800">
                        <button onClick={() => setActiveTab('TERMINAL')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'TERMINAL' ? 'border-orange-500 text-white' : 'border-transparent text-slate-500'}`}>Terminal</button>
                        <button onClick={() => setActiveTab('MARKETING')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'MARKETING' ? 'border-orange-500 text-white' : 'border-transparent text-slate-500'}`}>Marketing</button>
                        <button onClick={() => setActiveTab('ADMIN')} className={`flex-1 py-3 text-xs font-bold border-b-2 ${activeTab === 'ADMIN' ? 'border-orange-500 text-white' : 'border-transparent text-slate-500'}`}>Listings</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                        
                        {/* ITEM 7: ORDER STREAM */}
                        {activeTab === 'TERMINAL' && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Live Transactions</h3>
                                {Array.from({length: 8}).map((_, i) => {
                                    const isBuy = Math.random() > 0.4;
                                    const amt = (Math.random() * 1000).toFixed(2);
                                    return (
                                        <div key={i} className="flex justify-between text-xs font-mono border-b border-slate-800 pb-1 mb-1">
                                            <span className={isBuy ? 'text-emerald-400' : 'text-red-400'}>{isBuy ? 'BUY' : 'SELL'}</span>
                                            <span className="text-slate-300">${amt}</span>
                                            <span className="text-slate-500 text-[10px]">{Math.floor(Math.random()*59)}s ago</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* ITEM 5: INFLUENCER HUB */}
                        {activeTab === 'MARKETING' && (
                            <div className="space-y-3">
                                {INFLUENCERS.map(inf => (
                                    <div key={inf.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => onTokenAction('MARKETING', inf.cost)}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-white text-sm">{inf.name}</span>
                                            <span className="text-emerald-400 text-xs font-mono">${inf.cost}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mb-2">{inf.desc}</p>
                                        <div className="flex gap-2 text-[9px] font-bold uppercase">
                                            <span className="text-blue-400">Hype +{inf.hype}</span>
                                            <span className="text-red-400">Risk +{inf.risk}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ITEM 8: EXCHANGE LISTINGS */}
                        {activeTab === 'ADMIN' && (
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg border bg-slate-950 border-emerald-900/50">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white text-sm">Uniswap (DEX)</span>
                                        <CheckCircle2 size={16} className="text-emerald-500"/>
                                    </div>
                                    <p className="text-[10px] text-emerald-400 mt-1">Active Trading Pair</p>
                                </div>

                                {EXCHANGES.map(ex => {
                                    const isListed = myToken.listing === ex.id || (ex.id === 'TIER_3' && ['TIER_2', 'TIER_1'].includes(myToken.listing)) || (ex.id === 'TIER_2' && myToken.listing === 'TIER_1');
                                    const canList = myToken.marketCap >= ex.reqMcap && bankBalance >= ex.cost;

                                    return (
                                        <div key={ex.id} className={`p-3 rounded-lg border ${isListed ? 'bg-slate-950 border-emerald-900/50' : canList ? 'bg-slate-950 border-slate-600 hover:border-yellow-500 cursor-pointer' : 'bg-slate-950 border-slate-800 opacity-50'}`} 
                                            onClick={() => canList && !isListed && onTokenAction('LISTING', ex.cost)}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-white text-sm">{ex.name}</span>
                                                {isListed ? <CheckCircle2 size={16} className="text-emerald-500"/> : <span className="text-xs font-mono text-slate-400">${ex.cost.toLocaleString()}</span>}
                                            </div>
                                            <p className="text-[10px] text-slate-500">Req: ${ex.reqMcap.toLocaleString()} MCap</p>
                                            {!isListed && <p className="text-[10px] text-yellow-500 mt-1">Boosts Hype +{ex.hype}</p>}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};
