
import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Target, Shield, Settings, Crosshair, BarChart2, Info, X, Wallet } from 'lucide-react';
import { CryptoAsset, LeveragePosition } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { ActionTooltip } from './Level1_Foundations';
import { SmartTooltip } from './SmartTooltip';

interface CryptoFuturesProps {
    assets: CryptoAsset[];
    positions: LeveragePosition[];
    bankBalance: number;
    onOpenLeverage: (symbol: string, amount: number, leverage: number, type: 'LONG' | 'SHORT', tp?: number, sl?: number) => void;
    onCloseLeverage: (id: string) => void;
}

export const Crypto_Futures: React.FC<CryptoFuturesProps> = ({ assets, positions, bankBalance, onOpenLeverage, onCloseLeverage }) => {
    const [leverageAsset, setLeverageAsset] = useState('BTC');
    const [leverageAmount, setLeverageAmount] = useState(1000);
    const [leverageMult, setLeverageMult] = useState(10);
    const [marginMode, setMarginMode] = useState<'CROSS' | 'ISOLATED'>('ISOLATED');
    
    // New Order State
    const [tpPct, setTpPct] = useState<number>(0); // 0 = None
    const [slPct, setSlPct] = useState<number>(0); // 0 = None

    const assetData = assets.find(a => a.symbol === leverageAsset);
    const assetPrice = assetData?.price || 0;
    
    // Mock Funding Rate & Sentiment based on price action
    const fundingRate = (Math.random() * 0.02 - 0.005).toFixed(4); // -0.005% to +0.015%
    const sentiment = assetData ? assetData.sentiment : 50;

    // Helper to calc liquidation price for UI preview
    const getLiqPrice = (type: 'LONG' | 'SHORT') => {
        return type === 'LONG' 
            ? assetPrice * (1 - (1/leverageMult)) 
            : assetPrice * (1 + (1/leverageMult));
    }

    const handleMax = () => {
        setLeverageAmount(Math.floor(bankBalance));
    }

    const handleCloseAll = () => {
        positions.forEach(p => onCloseLeverage(p.id));
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* LEFT: CHART & POSITIONS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* MARKET HEADER */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2">{leverageAsset} <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">PERP</span></h3>
                            <p className="text-2xl font-mono font-bold text-emerald-400">${assetPrice.toFixed(2)}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-700"></div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">24h Change</p>
                            <p className={`text-sm font-bold ${assetData?.change24h && assetData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {assetData?.change24h?.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6 text-right">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-end gap-1">Funding / 8h <Info size={10}/></p>
                            <p className={`text-sm font-mono font-bold ${Number(fundingRate) > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>{fundingRate}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">24h Vol</p>
                            <p className="text-sm font-mono font-bold text-white">${(assetData?.volume24h || 0).toLocaleString()}M</p>
                        </div>
                    </div>
                </div>

                {/* CHART */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 h-80 relative overflow-hidden">
                    <div className="absolute top-2 left-4 z-10 flex gap-2">
                        {assets.slice(0, 5).map(a => (
                            <button key={a.symbol} onClick={() => setLeverageAsset(a.symbol)} className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${leverageAsset === a.symbol ? 'bg-slate-700 text-white border-slate-500' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                                {a.symbol}
                            </button>
                        ))}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={assetData?.history || []}>
                            <defs>
                                <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={assetData?.change24h && assetData.change24h >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={assetData?.change24h && assetData.change24h >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px'}} />
                            <XAxis dataKey="week" hide />
                            <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <Area type="monotone" dataKey="price" stroke={assetData?.change24h && assetData.change24h >= 0 ? '#10b981' : '#ef4444'} fill="url(#chartColor)" strokeWidth={2} />
                            {/* Current Price Line */}
                            <ReferenceLine y={assetPrice} stroke="white" strokeDasharray="3 3" opacity={0.5} label={{ value: "Current", position: "left", fill: "white", fontSize: 10 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* POSITIONS TABLE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Activity size={14}/> Open Positions ({positions.length})</h3>
                        {positions.length > 0 && (
                            <button onClick={handleCloseAll} className="text-[10px] bg-red-900/30 text-red-400 px-3 py-1 rounded border border-red-500/30 hover:bg-red-900/50 transition-colors">
                                Close All
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {positions.length === 0 && <p className="text-center text-slate-600 text-xs py-10">No active positions.</p>}
                        {positions.map(p => {
                            const currPrice = assets.find(a => a.symbol === p.symbol)?.price || 0;
                            const pnlPct = p.type === 'LONG' 
                                ? ((currPrice - p.entryPrice) / p.entryPrice) * p.leverage * 100
                                : ((p.entryPrice - currPrice) / p.entryPrice) * p.leverage * 100;
                            const pnlUsd = (p.amount * pnlPct) / 100;

                            return (
                                <div key={p.id} className="bg-slate-950 p-3 rounded border border-slate-800 relative overflow-hidden group hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-center mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${p.type === 'LONG' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-black'}`}>
                                                {p.type} {p.leverage}x
                                            </span>
                                            <span className="font-bold text-white text-sm">{p.symbol}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-mono font-bold text-sm ${pnlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] ml-2 ${pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                ({pnlPct.toFixed(2)}%)
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between text-[10px] text-slate-500 relative z-10">
                                        <div className="flex gap-3">
                                            <span>Entry: <span className="text-slate-300">${p.entryPrice.toFixed(1)}</span></span>
                                            <span>Liq: <span className="text-orange-400">${p.liquidationPrice.toFixed(1)}</span></span>
                                        </div>
                                        <div className="flex gap-2">
                                            {p.tpPrice && <span className="text-emerald-600">TP: ${p.tpPrice.toFixed(1)}</span>}
                                            {p.slPrice && <span className="text-red-600">SL: ${p.slPrice.toFixed(1)}</span>}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => onCloseLeverage(p.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg border border-slate-600"
                                    >
                                        Close
                                    </button>
                                    
                                    {/* PnL Background Bar */}
                                    <div className={`absolute bottom-0 left-0 h-0.5 w-full ${pnlPct >= 0 ? 'bg-emerald-500' : 'bg-red-500'} opacity-50`}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT: ORDER FORM */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col h-full overflow-y-auto">
                {/* Margin Mode */}
                <div className="flex bg-slate-950 p-1 rounded-lg mb-6">
                    <button onClick={() => setMarginMode('CROSS')} className={`flex-1 py-2 text-[10px] font-bold rounded ${marginMode === 'CROSS' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Cross</button>
                    <button onClick={() => setMarginMode('ISOLATED')} className={`flex-1 py-2 text-[10px] font-bold rounded ${marginMode === 'ISOLATED' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Isolated</button>
                </div>

                {/* Leverage Slider */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-400">Leverage</span>
                        <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{leverageMult}x</span>
                    </div>
                    <input 
                        type="range" min="1" max="50" step="1" 
                        value={leverageMult} onChange={(e) => setLeverageMult(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                        <span>1x</span>
                        <span>25x</span>
                        <span>50x</span>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span className="uppercase font-bold">Collateral (Margin)</span>
                        <span className="flex items-center gap-1"><Wallet size={10}/> ${bankBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 font-mono">$</span>
                        <input 
                            type="number" 
                            value={leverageAmount} 
                            onChange={(e) => setLeverageAmount(Number(e.target.value))} 
                            className="bg-transparent text-xl font-bold text-white w-full outline-none font-mono"
                        />
                        <button onClick={handleMax} className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded hover:bg-blue-900/50">MAX</button>
                    </div>
                    <div className="h-px bg-slate-800 mb-2"></div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Buying Power</span>
                        <span className="text-white font-mono">${(leverageAmount * leverageMult).toLocaleString()}</span>
                    </div>
                </div>

                {/* TP / SL Advanced */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1"><Target size={10}/> TP %</span>
                            <span className="text-xs text-white">{tpPct}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="5" value={tpPct} onChange={(e) => setTpPct(Number(e.target.value))} className="w-full accent-emerald-500 h-1 bg-slate-800 rounded appearance-none"/>
                    </div>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><Shield size={10}/> SL %</span>
                            <span className="text-xs text-white">{slPct}%</span>
                        </div>
                        <input type="range" min="0" max="50" step="5" value={slPct} onChange={(e) => setSlPct(Number(e.target.value))} className="w-full accent-red-500 h-1 bg-slate-800 rounded appearance-none"/>
                    </div>
                </div>

                {/* Long/Short Ratio (Sentiment) */}
                <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1">
                        <span className="text-emerald-500">Longs</span>
                        <span className="text-red-500">Shorts</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full flex overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{width: `${sentiment}%`}}></div>
                        <div className="h-full bg-red-500 transition-all duration-500" style={{width: `${100-sentiment}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>{sentiment}%</span>
                        <span>{100-sentiment}%</span>
                    </div>
                </div>

                {/* Execute Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                        onClick={() => onOpenLeverage(leverageAsset, leverageAmount, leverageMult, 'LONG', tpPct > 0 ? tpPct : undefined, slPct > 0 ? slPct : undefined)}
                        className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg flex flex-col items-center shadow-lg active:scale-95 transition-transform group"
                    >
                        <span className="text-sm flex items-center gap-1"><TrendingUp size={16}/> LONG</span>
                        <span className="text-[10px] opacity-70 group-hover:opacity-100">Est. Liq: ${(getLiqPrice('LONG')).toFixed(0)}</span>
                    </button>
                    <button 
                        onClick={() => onOpenLeverage(leverageAsset, leverageAmount, leverageMult, 'SHORT', tpPct > 0 ? tpPct : undefined, slPct > 0 ? slPct : undefined)}
                        className="py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg flex flex-col items-center shadow-lg active:scale-95 transition-transform group"
                    >
                        <span className="text-sm flex items-center gap-1"><TrendingDown size={16}/> SHORT</span>
                        <span className="text-[10px] opacity-70 group-hover:opacity-100">Est. Liq: ${(getLiqPrice('SHORT')).toFixed(0)}</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
