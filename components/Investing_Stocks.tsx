
import React, { useState } from 'react';
import { Bell, Bot, ShieldCheck, TrendingUp, X, Scale, ArrowUp, ArrowDown, Activity, Users, Layers, Info, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Stock, LimitOrder, ActiveOption, AlgoBot, OptionType } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { SmartTooltip, PortalTooltip } from './SmartTooltip';

// Helper for the scrolling list (Side Pop)
const ListTooltip = ({ children, title, desc }: { children: React.ReactNode, title: string, desc: string }) => (
    <PortalTooltip title={title} desc={desc} position="right" className="w-full block">
        {children}
    </PortalTooltip>
);

interface InvestingStocksProps {
    stocks: Stock[];
    holdings: Record<string, number>;
    bankBalance: number;
    marginUsed: number;
    marginLimit: number;
    limitOrders: LimitOrder[];
    activeOptions: ActiveOption[];
    marketNews: string[];
    algoBot: AlgoBot | null;
    dcaEnabled: boolean;
    dripEnabled: boolean;
    onTrade: (ticker: string, mode: 'BUY'|'SELL'|'SHORT'|'LIMIT_BUY'|'LIMIT_SELL', amount: number, limitPrice?: number) => void;
    onBuyOption: (ticker: string, type: OptionType, amount: number) => void;
    onHarvestTaxLoss: (ticker: string) => void;
    onCancelLimitOrder: (id: string) => void;
    onToggleDCA: () => void;
    onToggleDRIP: () => void;
    onBuyAlgoBot: () => void;
    onBuyBond: (amount: number) => void;
}

export const Investing_Stocks: React.FC<InvestingStocksProps> = (props) => {
    const [selectedTicker, setSelectedTicker] = useState<string | null>(props.stocks[0]?.ticker || null);
    const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL' | 'SHORT' | 'LIMIT_BUY' | 'LIMIT_SELL'>('BUY');
    const [tradeSlider, setTradeSlider] = useState<number>(0);
    const [limitPrice, setLimitPrice] = useState<number>(0);
    const [optionType, setOptionType] = useState<OptionType>('CALL');
    const [sortBy, setSortBy] = useState<'PRICE'|'CHANGE'|'SENTIMENT'>('PRICE');

    const selectedStockData = props.stocks.find(s => s.ticker === selectedTicker);
    const selectedShares = props.holdings[selectedTicker || ''] || 0;
    const unrealizedPL = selectedTicker && selectedShares !== 0 && selectedStockData?.avgBuyPrice 
        ? (selectedStockData.price - selectedStockData.avgBuyPrice) * selectedShares
        : 0;

    const handleTradeSubmit = () => {
        if (!selectedTicker || !selectedStockData) return;
        
        let amount = 0;
        let price = selectedStockData.price;

        if (tradeMode.includes('LIMIT')) {
            const target = limitPrice || price;
            amount = Math.floor(props.bankBalance * (tradeSlider/100));
        } else if (tradeMode === 'SELL') {
            const sharesToSell = selectedShares * (tradeSlider/100);
            amount = sharesToSell * price;
        } else {
            let buyingPower = props.bankBalance + (props.marginLimit - props.marginUsed);
            amount = Math.floor(buyingPower * (tradeSlider/100));
        }

        props.onTrade(selectedTicker, tradeMode, amount, limitPrice);
        setTradeSlider(0);
    };

    const sortedStocks = [...props.stocks].sort((a, b) => {
        if (sortBy === 'PRICE') return b.price - a.price;
        if (sortBy === 'CHANGE') {
            const changeA = ((a.price - a.history[a.history.length-2].price) / a.history[a.history.length-2].price);
            const changeB = ((b.price - b.history[b.history.length-2].price) / b.history[b.history.length-2].price);
            return changeB - changeA;
        }
        if (sortBy === 'SENTIMENT') return b.sentiment - a.sentiment;
        return 0;
    });

    const getSectorDesc = (sector: string) => {
        switch(sector) {
            case 'TECH': return "High growth, high volatility. Driven by innovation cycles.";
            case 'AUTO': return "Cyclical. Depends on consumer spending and rates.";
            case 'ETF': return "Diversified basket. Lower risk, stable returns.";
            case 'HEALTH': return "Defensive. People need meds even in recessions.";
            case 'FINANCE': return "Interest rate sensitive. Profitable when rates rise.";
            case 'CONSUMER': return "Reliable cash flow. Low volatility.";
            default: return "General stock.";
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* LEFT: TICKER LIST */}
            <div className="space-y-2 flex flex-col h-full overflow-hidden">
                {/* Sort Controls */}
                <div className="flex justify-between bg-slate-900 p-2 rounded border border-slate-800 shrink-0">
                    <ActionTooltip title="Sort by Price" desc="Highest priced stocks first. Doesn't mean 'expensive' valuation-wise, just per share.">
                        <button onClick={() => setSortBy('PRICE')} className={`text-[10px] px-2 py-1 rounded ${sortBy === 'PRICE' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Price</button>
                    </ActionTooltip>
                    <ActionTooltip title="Top Gainers" desc="Stocks moving up the fastest today. Momentum strategy.">
                        <button onClick={() => setSortBy('CHANGE')} className={`text-[10px] px-2 py-1 rounded ${sortBy === 'CHANGE' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Gainers</button>
                    </ActionTooltip>
                    <ActionTooltip title="Social Hype" desc="Most discussed on social media. High hype = High volatility.">
                        <button onClick={() => setSortBy('SENTIMENT')} className={`text-[10px] px-2 py-1 rounded ${sortBy === 'SENTIMENT' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Hype</button>
                    </ActionTooltip>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 pr-2 pb-20">
                    {sortedStocks.map(s => {
                        const owned = props.holdings[s.ticker] || 0;
                        const dayChange = ((s.price - (s.history[s.history.length-2]?.price || s.price)) / s.price) * 100;
                        
                        return (
                            <ListTooltip key={s.ticker} title={`${s.name} (${s.sector})`} desc={`${getSectorDesc(s.sector)} Click to trade.`}>
                                <button onClick={() => setSelectedTicker(s.ticker)} className={`w-full p-3 rounded border flex justify-between items-center group transition-colors ${selectedTicker === s.ticker ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}>
                                    <div className="text-left">
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {s.ticker} 
                                            <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase border border-slate-700">{s.sector}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500">{s.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-sm text-white">${s.price.toFixed(2)}</div>
                                        <div className={`text-[10px] font-bold ${dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {dayChange > 0 ? '+' : ''}{dayChange.toFixed(2)}%
                                        </div>
                                        {owned !== 0 && <div className={`text-[10px] font-mono ${owned > 0 ? 'text-blue-300' : 'text-orange-300'}`}>{owned.toFixed(1)} sh</div>}
                                    </div>
                                </button>
                            </ListTooltip>
                        );
                    })}
                </div>
                
                {/* News Feed */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 shrink-0">
                    <h3 className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1"><Bell size={10}/> Market Wire</h3>
                    <div className="h-16 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 text-[10px] text-slate-400">
                        {props.marketNews.length === 0 ? <span className="text-slate-600">No news yet.</span> : props.marketNews.map((n, i) => (
                            <div key={i} className="border-l-2 border-blue-500 pl-2">{n}</div>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-700 grid grid-cols-2 gap-2 shrink-0">
                    <ActionTooltip title="Dollar Cost Averaging" desc="Robotically invest $500/week into VOO (Index Fund). Removes emotion and timing risk. Best long term strategy.">
                        <button onClick={props.onToggleDCA} className={`w-full py-2 rounded border text-[10px] font-bold ${props.dcaEnabled ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-600 text-slate-500'}`}>
                            DCA Bot: {props.dcaEnabled ? 'ON' : 'OFF'}
                        </button>
                    </ActionTooltip>
                    <ActionTooltip title="Dividend Reinvestment Plan" desc="Automatically use dividends to buy more shares instead of taking cash. Compounding interest on steroids.">
                        <button onClick={props.onToggleDRIP} className={`w-full py-2 rounded border text-[10px] font-bold ${props.dripEnabled ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-600 text-slate-500'}`}>
                            DRIP: {props.dripEnabled ? 'ON' : 'OFF'}
                        </button>
                    </ActionTooltip>
                </div>
                
                {/* ALGO BOT & BONDS */}
                <div className="pt-2 grid grid-cols-2 gap-2 shrink-0">
                    <ActionTooltip title="Algorithmic Trading Bot" desc="Automated high-frequency trader. Generates passive income ($0-$300/wk) but carries a 1% risk of a 'Flash Crash' wiping $2k.">
                        <button onClick={props.onBuyAlgoBot} disabled={!!props.algoBot} className={`w-full text-[10px] py-2 rounded border flex flex-col items-center gap-1 ${props.algoBot ? 'bg-purple-900/20 text-purple-400 border-purple-500' : 'bg-slate-800 text-slate-400 border-slate-600'}`}>
                            <Bot size={14} /> {props.algoBot ? 'BOT ACTIVE' : 'Buy Algo Bot ($5k)'}
                        </button>
                    </ActionTooltip>
                    <ActionTooltip title="Inflation Protected Bond" desc="The safest asset. Pays 4% fixed yield. Cannot lose value. Use this to park cash you can't afford to lose.">
                        <button onClick={() => props.onBuyBond(1000)} className="w-full text-[10px] py-2 rounded border bg-slate-800 text-slate-400 border-slate-600 flex flex-col items-center gap-1">
                            <ShieldCheck size={14} /> Buy Bond ($1k)
                        </button>
                    </ActionTooltip>
                </div>
            </div>
            
            {/* RIGHT: PRO CHART & TRADE DESK */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                {selectedTicker && selectedStockData ? (
                    <>
                        {/* CHART SECTION */}
                        <div className="h-72 bg-slate-900 rounded border border-slate-700 p-2 relative flex flex-col">
                            <div className="flex justify-between items-center px-2 mb-2">
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-xl font-black text-white">{selectedTicker}</h2>
                                    <span className="text-sm text-slate-400">{selectedStockData.name}</span>
                                    <SmartTooltip term="RSI" definition="Relative Strength Index. >70 is Overbought (Expensve), <30 is Oversold (Cheap). Use this to time your entries.">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold cursor-help ${selectedStockData.rsi > 70 ? 'bg-red-900 text-red-400' : selectedStockData.rsi < 30 ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                            RSI: {selectedStockData.rsi.toFixed(0)}
                                        </span>
                                    </SmartTooltip>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono font-bold text-white">${selectedStockData.price.toFixed(2)}</div>
                                    {unrealizedPL !== 0 && (
                                        <ActionTooltip title="Unrealized P&L" desc="Profit/Loss you would make if you sold right now.">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${unrealizedPL > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                                {unrealizedPL > 0 ? '+' : ''}{unrealizedPL.toFixed(0)} P&L
                                            </span>
                                        </ActionTooltip>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={selectedStockData.history}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="day" hide />
                                        <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: '#475569', fontSize: 10}} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="volume" domain={[0, 'dataMax']} orientation="left" hide />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px'}}
                                            labelStyle={{color: '#94a3b8'}}
                                            itemStyle={{padding: 0}}
                                            formatter={(value: number, name: string) => [
                                                name === 'price' ? `$${value.toFixed(2)}` : name === 'volume' ? value.toLocaleString() : value,
                                                name === 'price' ? 'Price' : name === 'volume' ? 'Volume' : name
                                            ]}
                                        />
                                        <Bar yAxisId="volume" dataKey="volume" fill="#1e293b" barSize={20} />
                                        <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                        <Line type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="5 5" name="SMA (5)" />
                                        
                                        {/* Reference Lines */}
                                        {selectedShares !== 0 && selectedStockData.avgBuyPrice && (
                                            <ReferenceLine y={selectedStockData.avgBuyPrice} stroke="orange" strokeDasharray="3 3" label={{ value: "Avg Cost", fill: "orange", fontSize: 10, position: 'insideLeft' }} />
                                        )}
                                        {selectedStockData.stopLoss ? (
                                            <ReferenceLine y={selectedStockData.stopLoss} stroke="red" strokeDasharray="3 3" label={{ value: "Stop", fill: "red", fontSize: 10, position: 'insideLeft' }} />
                                        ) : null}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* KEY STATS GRID (Expanded Fundamentals) */}
                        <div className="grid grid-cols-4 gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                            <div className="text-center p-1 border-r border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                                    Mkt Cap <SmartTooltip term="Cap" definition="Total value of company shares. Large Cap = Stable. Small Cap = Risky."><Info size={8}/></SmartTooltip>
                                </p>
                                <p className="text-sm font-bold text-white">${selectedStockData.marketCap}B</p>
                            </div>
                            <div className="text-center p-1 border-r border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase">52W High</p>
                                <p className="text-sm font-bold text-white">${selectedStockData.weekHigh}</p>
                            </div>
                            <div className="text-center p-1 border-r border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase">52W Low</p>
                                <p className="text-sm font-bold text-white">${selectedStockData.weekLow}</p>
                            </div>
                            <div className="text-center p-1">
                                <p className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                                    Beta <SmartTooltip term="Beta" definition="Volatility relative to market. 1.0 = Market. >1.0 = More Volatile. <1.0 = Stable."><Info size={8}/></SmartTooltip>
                                </p>
                                <p className="text-sm font-bold text-white">{selectedStockData.beta}</p>
                            </div>
                        </div>

                        {/* SENTIMENT & DEPTH */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-3 rounded border border-slate-700 relative group">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={10}/> Social Sentiment</span>
                                    <span className={`text-[10px] font-bold ${selectedStockData.sentiment > 60 ? 'text-emerald-400' : 'text-red-400'}`}>{selectedStockData.sentiment}% Bullish</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500" style={{width: '100%'}}></div>
                                    <div className="w-1 h-2 bg-white -mt-2 relative transform -translate-y-1/2" style={{left: `${selectedStockData.sentiment}%`, position: 'relative', top: '-4px'}}></div>
                                </div>
                                {/* Hover info using Portal */}
                                <div className="absolute top-full left-0 w-full z-20 hidden group-hover:block">
                                    <PortalTooltip title="Sentiment" desc="High sentiment (>80%) often signals a top. Low sentiment (<20%) can be a buying opportunity." position="bottom">
                                        <div className="w-full h-full absolute inset-0"></div>
                                    </PortalTooltip>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 p-3 rounded border border-slate-700 flex items-center justify-between relative group">
                                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Layers size={10}/> Order Book</div>
                                <div className="flex gap-1">
                                    <div className="h-4 w-1 bg-red-900"></div><div className="h-6 w-1 bg-red-800"></div><div className="h-3 w-1 bg-red-700"></div>
                                    <div className="h-8 w-1 bg-emerald-700"></div><div className="h-5 w-1 bg-emerald-800"></div><div className="h-2 w-1 bg-emerald-900"></div>
                                </div>
                                <div className="absolute top-full left-0 w-full z-20 hidden group-hover:block">
                                     <PortalTooltip title="Market Depth" desc="Visual representation of Buy Orders (Green) vs Sell Orders (Red). A 'Sell Wall' means price struggle." position="bottom">
                                        <div className="w-full h-full absolute inset-0"></div>
                                    </PortalTooltip>
                                </div>
                            </div>
                        </div>

                        {/* TRADE CONTROLS */}
                        <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col gap-3">
                            <div className="flex gap-2 bg-slate-800 p-1 rounded overflow-x-auto">
                                <ActionTooltip title="Buy" desc="Purchase shares. Uses cash or margin.">
                                    <button onClick={() => setTradeMode('BUY')} className={`flex-1 min-w-[50px] py-2 text-[10px] font-bold rounded transition-colors ${tradeMode === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>BUY</button>
                                </ActionTooltip>
                                <ActionTooltip title="Sell" desc="Sell owned shares to cash.">
                                    <button onClick={() => setTradeMode('SELL')} className={`flex-1 min-w-[50px] py-2 text-[10px] font-bold rounded transition-colors ${tradeMode === 'SELL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>SELL</button>
                                </ActionTooltip>
                                <ActionTooltip title="Short Sell" desc="Sell shares you don't own. Profit if price drops. Unlimited risk if price rises.">
                                    <button onClick={() => setTradeMode('SHORT')} className={`flex-1 min-w-[50px] py-2 text-[10px] font-bold rounded transition-colors ${tradeMode === 'SHORT' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>SHORT</button>
                                </ActionTooltip>
                                <div className="w-px bg-slate-700 mx-1"></div>
                                <ActionTooltip title="Limit Buy" desc="Buy only if price drops to target.">
                                    <button onClick={() => setTradeMode('LIMIT_BUY')} className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold rounded transition-colors ${tradeMode === 'LIMIT_BUY' ? 'bg-emerald-900 text-emerald-400 border border-emerald-500' : 'text-slate-400 hover:text-white'}`}>LMT BUY</button>
                                </ActionTooltip>
                                <ActionTooltip title="Limit Sell" desc="Sell only if price rises to target.">
                                    <button onClick={() => setTradeMode('LIMIT_SELL')} className={`flex-1 min-w-[60px] py-2 text-[10px] font-bold rounded transition-colors ${tradeMode === 'LIMIT_SELL' ? 'bg-blue-900 text-blue-400 border border-blue-500' : 'text-slate-400 hover:text-white'}`}>LMT SELL</button>
                                </ActionTooltip>
                            </div>

                            {/* Dynamic Input based on Mode */}
                            {(tradeMode === 'LIMIT_BUY' || tradeMode === 'LIMIT_SELL') ? (
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Target Price</span>
                                        <input 
                                            type="number" 
                                            value={limitPrice} 
                                            onChange={(e) => setLimitPrice(Number(e.target.value))} 
                                            className="bg-slate-800 border border-slate-700 rounded text-right text-white font-mono w-24 text-sm px-1"
                                            placeholder={selectedStockData.price.toString()}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>Allocation</span>
                                        <span>{tradeSlider}% of Cash</span>
                                    </div>
                                    <input type="range" value={tradeSlider} onChange={(e) => setTradeSlider(Number(e.target.value))} className="w-full accent-blue-500 mt-1" />
                                    <div className="text-right text-xs text-white mt-1 font-bold">Est. Shares: {Math.floor((props.bankBalance * (tradeSlider/100)) / (limitPrice || 1))}</div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>Amount</span>
                                        <span>Cash Avail: <span className="text-white">${props.bankBalance.toLocaleString()}</span></span>
                                    </div>

                                    {/* Quick Amount Buttons */}
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            const amt = 1000;
                                            const pct = Math.min(100, (amt / props.bankBalance) * 100);
                                            setTradeSlider(pct);
                                        }} className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-xs hover:border-slate-400">$1k</button>
                                        <button onClick={() => {
                                            const amt = 5000;
                                            const pct = Math.min(100, (amt / props.bankBalance) * 100);
                                            setTradeSlider(pct);
                                        }} className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-xs hover:border-slate-400">$5k</button>
                                        <button onClick={() => setTradeSlider(100)} className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-xs hover:border-slate-400">MAX</button>
                                    </div>

                                    <input type="range" value={tradeSlider} onChange={(e) => setTradeSlider(Number(e.target.value))} className="w-full accent-blue-500" />
                                    
                                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Est. Order</span>
                                        <span className="font-mono font-bold text-white text-lg">
                                            ${tradeMode === 'SELL' 
                                                ? Math.floor(selectedShares * (tradeSlider/100) * selectedStockData.price).toLocaleString() 
                                                : Math.floor(props.bankBalance * (tradeSlider/100)).toLocaleString()
                                            } 
                                            <span className="text-xs text-slate-500 ml-1">
                                                ({(tradeMode === 'SELL' ? selectedShares * (tradeSlider/100) : Math.floor(props.bankBalance * (tradeSlider/100)) / selectedStockData.price).toFixed(1)} sh)
                                            </span>
                                        </span>
                                    </div>
                                </>
                            )}

                            {tradeMode === 'BUY' && (props.holdings[selectedTicker]||0) > 0 && selectedStockData.price < (selectedStockData.avgBuyPrice||0) ? (
                                <ActionTooltip title="Tax Loss Harvesting" desc="Sell at a loss to get a tax credit. Ticker LOCKED for 4 weeks (Wash Sale Rule).">
                                    <button onClick={() => props.onHarvestTaxLoss(selectedTicker)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                                        <Scale size={16}/> HARVEST TAX LOSS
                                    </button>
                                </ActionTooltip>
                            ) : (
                                <button onClick={handleTradeSubmit} className={`w-full font-bold py-3 rounded transition-colors ${tradeMode.includes('BUY') ? 'bg-emerald-600 hover:bg-emerald-500' : tradeMode.includes('SELL') ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'}`}>
                                    CONFIRM {tradeMode.replace('_', ' ')}
                                </button>
                            )}
                            
                            {/* Active Limit Orders */}
                            {props.limitOrders.filter(o => o.ticker === selectedTicker).length > 0 && (
                                <div className="mt-2">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pending Orders</p>
                                    {props.limitOrders.filter(o => o.ticker === selectedTicker).map(o => (
                                        <div key={o.id} className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs border border-slate-800">
                                            <span className={o.type === 'BUY' ? 'text-emerald-400' : 'text-blue-400'}>{o.type} {o.shares} @ ${o.targetPrice}</span>
                                            <button onClick={() => props.onCancelLimitOrder(o.id)} className="text-slate-500 hover:text-white"><X size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : <div className="flex items-center justify-center h-full text-slate-500">Select a stock to trade</div>}
            </div>
        </div>
    );
};
