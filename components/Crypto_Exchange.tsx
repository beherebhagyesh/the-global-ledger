
import React, { useState } from 'react';
import { Bitcoin, Zap, Lock, Search, Filter, ArrowUp, ArrowDown, Activity, Fuel, Bell, Clock, AlertTriangle, Info, HelpCircle, RefreshCw, Wallet, BarChart3, Globe, Shield, Terminal, Skull } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { CryptoAsset, Blockchain, CryptoSector, WhaleAlert } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { SmartTooltip, PortalTooltip } from './SmartTooltip';

interface CryptoExchangeProps {
    assets: CryptoAsset[];
    whaleAlerts?: WhaleAlert[];
    onTrade: (symbol: string, action: 'BUY' | 'SELL', amount: number) => void;
    onStake: (symbol: string) => void;
    onWalletToggle: (symbol: string) => void;
    onScanContract?: (symbol: string) => void;
}

export const Crypto_Exchange: React.FC<CryptoExchangeProps> = ({ assets, whaleAlerts = [], onTrade, onStake, onWalletToggle, onScanContract }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'PRICE' | 'CHANGE' | 'HOLDINGS'>('HOLDINGS');
    const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D'>('24H');
    const [alerts, setAlerts] = useState<Record<string, boolean>>({});

    // Filter Logic
    const filteredAssets = assets.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort Logic
    const sortedAssets = [...filteredAssets].sort((a, b) => {
        if (sortBy === 'PRICE') return b.price - a.price;
        if (sortBy === 'CHANGE') return b.change24h - a.change24h;
        if (sortBy === 'HOLDINGS') return (b.holdings * b.price) - (a.holdings * a.price);
        return 0;
    });

    const getChainColor = (chain: Blockchain) => {
        switch(chain) {
            case 'ETHEREUM': return 'text-purple-400 border-purple-500/30';
            case 'SOLANA': return 'text-emerald-400 border-emerald-500/30';
            case 'BITCOIN': return 'text-orange-400 border-orange-500/30';
            case 'POLYGON': return 'text-violet-400 border-violet-500/30';
            case 'BASE': return 'text-blue-400 border-blue-500/30';
            case 'ARBITRUM': return 'text-cyan-400 border-cyan-500/30';
            default: return 'text-slate-400 border-slate-700';
        }
    };

    const getSectorBadge = (sector: CryptoSector) => {
        const styles: Record<CryptoSector, string> = {
            'L1': 'text-slate-300',
            'L2': 'text-cyan-300',
            'DEFI': 'text-indigo-300',
            'MEME': 'text-pink-300',
            'STABLE': 'text-emerald-300',
            'ORACLE': 'text-blue-300',
            'RWA': 'text-yellow-300',
            'INFRA': 'text-gray-300'
        };
        return <span className={`text-[9px] font-bold uppercase tracking-wider ${styles[sector] || 'text-slate-400'}`}>{sector}</span>;
    };

    const getGasFee = (chain: Blockchain): number => {
        if (chain === 'ETHEREUM') return 15;
        if (chain === 'BITCOIN') return 5;
        return 0.01; 
    };

    const toggleAlert = (symbol: string) => {
        setAlerts(prev => ({ ...prev, [symbol]: !prev[symbol] }));
    };

    // Calculate Portfolio Total for Weights
    const totalPortfolioValue = assets.reduce((acc, a) => acc + (a.holdings * a.price), 0) || 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            
            {/* LEFT: MARKET GRID */}
            <div className="lg:col-span-3 flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex gap-2 mb-4 bg-slate-900 p-2 rounded-lg border border-slate-700 items-center shrink-0">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search coins..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded pl-9 pr-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    
                    <div className="flex gap-1 bg-slate-800 p-1 rounded">
                        {(['1H', '24H', '7D'] as const).map(tf => (
                            <button 
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2 py-1 rounded text-[10px] font-bold ${timeframe === tf ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1 bg-slate-800 p-1 rounded">
                        <button onClick={() => setSortBy('HOLDINGS')} className={`px-2 py-1 rounded text-[10px] ${sortBy === 'HOLDINGS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Holdings</button>
                        <button onClick={() => setSortBy('CHANGE')} className={`px-2 py-1 rounded text-[10px] ${sortBy === 'CHANGE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>% Change</button>
                        <button onClick={() => setSortBy('PRICE')} className={`px-2 py-1 rounded text-[10px] ${sortBy === 'PRICE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Price</button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pb-4 pr-1">
                    {sortedAssets.map(c => {
                        const value = c.holdings * c.price;
                        const weight = (value / totalPortfolioValue) * 100;
                        const gasFee = getGasFee(c.chain);
                        
                        const changeVal = timeframe === '1H' ? c.change1h : timeframe === '7D' ? c.change7d : c.change24h;
                        
                        return (
                            <div key={c.symbol} className={`bg-slate-900/90 border p-3 rounded-xl flex flex-col relative group hover:border-slate-500 transition-all ${getChainColor(c.chain).split(' ')[1]}`}>
                                
                                {/* --- ROW 1: HEADER & PRICE --- */}
                                <div className="flex items-center justify-between mb-2 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="relative shrink-0">
                                            {c.symbol === 'BTC' ? <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20"><Bitcoin size={16} className="text-orange-500"/></div> :
                                            c.symbol === 'ETH' ? <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20"><Activity size={16} className="text-purple-500"/></div> :
                                            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700 text-slate-300 font-bold text-[10px] w-8 h-8 flex items-center justify-center">{c.symbol.substring(0,2)}</div>}
                                            <div className="absolute -top-1.5 -left-1.5 bg-slate-950 border border-slate-800 text-[8px] font-bold px-1.5 rounded-full text-slate-400 shadow-sm z-20">
                                                #{c.rank}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1.5">
                                                <h4 className="font-bold text-white text-sm leading-none">{c.symbol}</h4>
                                                <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{c.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`text-[8px] uppercase font-bold ${getChainColor(c.chain).split(' ')[0]}`}>{c.chain}</span>
                                                <span className="text-[8px] text-slate-600">•</span>
                                                {getSectorBadge(c.sector)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-white text-sm leading-none tracking-tight">${c.price.toLocaleString(undefined, {maximumFractionDigits: c.price < 1 ? 5 : 2})}</div>
                                        <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${changeVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {changeVal > 0 ? <ArrowUp size={8}/> : <ArrowDown size={8}/>} {Math.abs(changeVal).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* --- ROW 2: ADVANCED STATS GRID --- */}
                                <div className="grid grid-cols-4 gap-1 mb-2 relative z-10 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/50">
                                    <div className="flex flex-col items-center border-r border-slate-800/50">
                                        <span className="text-[8px] text-slate-500 uppercase">Cap</span>
                                        <span className="text-[9px] font-bold text-slate-300">${c.marketCap}B</span>
                                    </div>
                                    <div className="flex flex-col items-center border-r border-slate-800/50">
                                        <span className="text-[8px] text-slate-500 uppercase">Vol</span>
                                        <span className="text-[9px] font-bold text-slate-300">${(c.volume24h/1000).toFixed(1)}B</span>
                                    </div>
                                    <div className="flex flex-col items-center border-r border-slate-800/50">
                                        <span className="text-[8px] text-slate-500 uppercase">Dom</span>
                                        <span className="text-[9px] font-bold text-slate-300">{c.dominance}%</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[8px] text-slate-500 uppercase">Risk</span>
                                        <span className={`text-[9px] font-bold ${c.riskScore > 7 ? 'text-red-400' : c.riskScore > 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>{c.riskScore}/10</span>
                                    </div>
                                </div>

                                {/* --- SCANNER MODULE (RISK DEFENSE) --- */}
                                {c.riskScore > 7 && !c.isScanned && (
                                    <div className="mb-2 relative z-10">
                                        <ActionTooltip title="Rug Defense" desc="High Risk detected! Pay $200 to scan the contract for Honeypot logic.">
                                            <button 
                                                onClick={() => onScanContract && onScanContract(c.symbol)} 
                                                className="w-full py-1.5 bg-red-900/20 border border-red-500/50 text-red-400 text-[10px] font-bold rounded flex items-center justify-center gap-1 hover:bg-red-900/40"
                                            >
                                                <Skull size={10}/> Scan Contract ($200)
                                            </button>
                                        </ActionTooltip>
                                    </div>
                                )}
                                {c.isScanned && (
                                    <div className={`mb-2 text-[10px] text-center font-bold border py-1 rounded ${c.isHoneypot ? 'bg-red-600 text-white border-red-500' : 'bg-green-900/30 text-green-400 border-green-500/50'}`}>
                                        {c.isHoneypot ? "⚠️ HONEYPOT DETECTED" : "✅ CONTRACT SAFE"}
                                    </div>
                                )}

                                {/* --- ROW 3: SPARKLINE & SENTIMENT --- */}
                                <div className="relative h-8 w-full mb-2">
                                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={c.history}>
                                                <defs>
                                                    <linearGradient id={`grad_${c.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={changeVal >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor={changeVal >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <Area type="monotone" dataKey="price" stroke={changeVal >= 0 ? "#10b981" : "#ef4444"} fill={`url(#grad_${c.symbol})`} strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full flex items-end gap-1">
                                        <div className="text-[8px] font-bold text-slate-500 uppercase whitespace-nowrap">Sentiment</div>
                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-1">
                                            <div className={`h-full ${c.sentiment > 60 ? 'bg-emerald-500' : c.sentiment < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{width: `${c.sentiment}%`}}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- ROW 4: HOLDINGS STRIP --- */}
                                <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 mb-2 flex justify-between items-center text-[10px] relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 uppercase font-bold text-[9px]">Held</span>
                                        <span className={`font-mono ${c.holdings > 0 ? 'text-white font-bold' : 'text-slate-600'}`}>
                                            {c.holdings > 0 ? c.holdings.toLocaleString() : '0.00'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.holdings > 0 && (
                                            <>
                                                <span className="text-emerald-400 font-mono">${value.toLocaleString()}</span>
                                                <span className="text-blue-400 font-bold">{weight.toFixed(1)}%</span>
                                            </>
                                        )}
                                        <button onClick={() => toggleAlert(c.symbol)} className={`transition-colors ${alerts[c.symbol] ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-400'}`}>
                                            <Bell size={10} fill={alerts[c.symbol] ? "currentColor" : "none"}/>
                                        </button>
                                    </div>
                                </div>

                                {/* --- ROW 5: ACTIONS --- */}
                                <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
                                    <ActionTooltip title={`Buy ${c.symbol}`} desc={`Fee: $${gasFee}. Uses Cash.`}>
                                        <button onClick={() => onTrade(c.symbol, 'BUY', 1000)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded py-1.5 text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                                            Buy $1k
                                        </button>
                                    </ActionTooltip>
                                    <ActionTooltip title={`Sell ${c.symbol}`} desc="Convert to Cash.">
                                        <button onClick={() => onTrade(c.symbol, 'SELL', 1000)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded py-1.5 text-xs font-bold shadow-sm">
                                            Sell $1k
                                        </button>
                                    </ActionTooltip>
                                </div>

                                {/* --- ROW 6: FOOTER --- */}
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50 relative z-10">
                                    <button onClick={() => onWalletToggle(c.symbol)} className="text-[9px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                        {c.walletType === 'HOT' ? <Zap size={8} className="text-orange-400"/> : <Lock size={8} className="text-blue-400"/>}
                                        {c.walletType} Wallet
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        <button className="text-[9px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                            <RefreshCw size={8}/> Swap
                                        </button>
                                        <button onClick={() => onStake(c.symbol)} className={`text-[9px] font-bold transition-colors flex items-center gap-1 ${c.staked > 0 ? 'text-purple-400 hover:text-purple-300' : 'text-slate-500 hover:text-purple-400'}`}>
                                            {c.staked > 0 ? <Lock size={8}/> : null}
                                            {c.staked > 0 ? 'Unstake' : 'Stake'}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: WHALE WATCHER (NEW) */}
            <div className="bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                    <Terminal size={16} className="text-emerald-400" />
                    <h3 className="font-bold text-white text-xs uppercase">Whale Watcher</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {whaleAlerts.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Scanning Chain...</p>}
                    {whaleAlerts.map(alert => (
                        <div key={alert.id} className="bg-slate-950 p-2 rounded border border-slate-800 animate-in slide-in-from-right">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-white text-xs">{alert.symbol}</span>
                                <span className="text-[10px] text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${alert.type === 'INFLOW' ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                                    {alert.type === 'INFLOW' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                                </div>
                                <div>
                                    <p className={`text-xs font-mono font-bold ${alert.type === 'INFLOW' ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {alert.amount.toLocaleString()} {alert.symbol}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {alert.type === 'INFLOW' ? 'Moved to Exchange (Dump Risk)' : 'Moved to Cold Wallet (HODL)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
