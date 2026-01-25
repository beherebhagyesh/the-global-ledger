
import React, { useState, useEffect } from 'react';
import { Zap, Scale, Layers, Wheat, RotateCcw, AlertTriangle, ShieldCheck, TrendingUp, Wallet, ArrowRight, CheckCircle2, Lock, Landmark, Skull, Vote, Fuel, Gift, Repeat } from 'lucide-react';
import { LiquidityPool } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { SmartTooltip } from './SmartTooltip';
import { playSound } from '../utils/sound';

interface CryptoDeFiProps {
    pools: LiquidityPool[];
    bankBalance: number;
    gasPrice: number; // Prop passed from parent
    onJoinPool: (poolId: string, amount: number, isZap: boolean) => void;
    onFlashLoan: () => void;
    onToggleInsurance: (poolId: string) => void;
    onToggleAutoCompound: (poolId: string) => void;
    onBorrow: (poolId: string, amount: number) => void;
    onRepay: (poolId: string, amount: number) => void;
    onVote: (poolId: string) => void;
}

export const Crypto_DeFi: React.FC<CryptoDeFiProps> = ({ pools, bankBalance, gasPrice = 20, onJoinPool, onFlashLoan, onToggleInsurance, onToggleAutoCompound, onBorrow, onRepay, onVote }) => {
    // Local state for interactive IL simulation
    const [simPriceChange, setSimPriceChange] = useState(0); 
    const [view, setView] = useState<'FARM' | 'LEND' | 'GOV'>('FARM');
    const [degenMode, setDegenMode] = useState(false);
    
    // Flash Loan Visualizer State
    const [loanState, setLoanState] = useState<'IDLE' | 'BORROW' | 'SWAP' | 'ARB' | 'REPAY' | 'PROFIT' | 'FAIL'>('IDLE');

    const handleHarvest = (poolId: string) => {
        // Harvesting cost simulated here
        if (gasPrice > 50) {
            if(!confirm(`Gas is extremely high (${gasPrice} gwei). Harvest anyway?`)) return;
        }
        playSound('COIN');
    };

    const runFlashLoanSim = () => {
        if (loanState !== 'IDLE') return;
        setLoanState('BORROW');
        playSound('CLICK');

        setTimeout(() => { setLoanState('SWAP'); playSound('CLICK'); }, 800);
        setTimeout(() => { setLoanState('ARB'); playSound('COIN'); }, 1600);
        setTimeout(() => { setLoanState('REPAY'); playSound('CLICK'); }, 2400);
        setTimeout(() => { 
            const success = Math.random() > 0.3; // 70% success rate visually
            setLoanState(success ? 'PROFIT' : 'FAIL'); 
            if(success) playSound('VICTORY'); else playSound('ERROR');
            if(success) onFlashLoan(); // Trigger actual logic
            setTimeout(() => setLoanState('IDLE'), 2000);
        }, 3200);
    };

    // Calculate aggregate stats
    const totalTVL = pools.reduce((acc, p) => acc + (p.tvl * p.myShare), 0);
    const totalBorrowed = pools.reduce((acc, p) => acc + (p.borrowedAmount || 0), 0);
    const totalPoints = pools.reduce((acc, p) => acc + (p.airdropPoints || 0), 0);

    const getProtocolIcon = (proto: string) => {
        switch(proto) {
            case 'UNISWAP': return <span className="text-pink-500 font-bold">🦄 UNI</span>;
            case 'AAVE': return <span className="text-purple-400 font-bold">👻 AAVE</span>;
            case 'CURVE': return <span className="text-blue-400 font-bold">🌈 CRV</span>;
            case 'PEPE': return <span className="text-green-500 font-bold">🐸 PEPE</span>;
            default: return <span>UNKNOWN</span>;
        }
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 h-full ${degenMode ? 'theme-degen' : ''}`}>
            {degenMode && <div className="fixed inset-0 pointer-events-none bg-red-900/10 z-0 animate-pulse"></div>}
            
            {/* LEFT: DASHBOARD */}
            <div className="lg:col-span-2 space-y-4 flex flex-col h-full overflow-hidden relative z-10">
                
                {/* HUD */}
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-900/20 p-3 rounded-full text-indigo-400">
                            <Layers size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Net Worth (DeFi)</p>
                            <p className="text-2xl font-mono font-bold text-white">${(totalTVL - totalBorrowed).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    {/* Gas Tracker */}
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                        <Fuel size={14} className={gasPrice > 50 ? 'text-red-500' : 'text-slate-400'} />
                        <span className={`font-mono text-sm font-bold ${gasPrice > 50 ? 'text-red-400' : 'text-slate-200'}`}>
                            {gasPrice} gwei
                        </span>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold flex items-center justify-end gap-1"><Gift size={12}/> Airdrop Points</p>
                        <p className="text-xl font-mono font-bold text-yellow-400 animate-pulse">{totalPoints.toLocaleString()} PTS</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-2 shrink-0">
                    <button onClick={() => setView('FARM')} className={`flex-1 py-2 font-bold rounded text-xs transition-colors ${view === 'FARM' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Yield Farms</button>
                    <button onClick={() => setView('LEND')} className={`flex-1 py-2 font-bold rounded text-xs transition-colors ${view === 'LEND' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Lending & Borrowing</button>
                    <button onClick={() => setView('GOV')} className={`flex-1 py-2 font-bold rounded text-xs transition-colors ${view === 'GOV' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Governance Wars</button>
                </div>

                {/* POOLS LIST */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {pools.filter(p => view === 'GOV' ? true : view === 'LEND' ? p.type === 'LENDING' : p.type === 'FARM').map(pool => (
                        <div key={pool.id} className={`bg-slate-900 border p-4 rounded-xl relative overflow-hidden group transition-all ${degenMode && pool.riskScore > 80 ? 'border-red-500 animate-shake' : 'border-slate-700 hover:border-indigo-500'}`}>
                            
                            {/* Degen Banner */}
                            {degenMode && pool.riskScore > 80 && (
                                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-bl">RUG RISK: HIGH</div>
                            )}

                            {/* GOVERNANCE VIEW */}
                            {view === 'GOV' && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {getProtocolIcon(pool.protocol)}
                                        <div>
                                            <h4 className="font-bold text-white">{pool.name}</h4>
                                            <p className="text-xs text-slate-500">Current APY: {pool.apy}%</p>
                                        </div>
                                    </div>
                                    <ActionTooltip title="Bribe Protocol" desc="Use Vote Escrow tokens to boost this pool's rewards next week.">
                                        <button onClick={() => onVote(pool.id)} className="bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-500/30 px-4 py-2 rounded font-bold text-xs flex items-center gap-2">
                                            <Vote size={14}/> Vote (+10% APY)
                                        </button>
                                    </ActionTooltip>
                                </div>
                            )}

                            {/* FARMING & LENDING VIEW */}
                            {view !== 'GOV' && (
                                <>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {getProtocolIcon(pool.protocol)}
                                                <span className="text-slate-600">|</span>
                                                <h4 className="font-bold text-white">{pool.name}</h4>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">TVL: ${(pool.tvl/1000000).toFixed(1)}M</span>
                                                {pool.riskScore > 80 ? <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded font-bold">DEGEN</span> : 
                                                pool.riskScore < 30 ? <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded font-bold">BLUECHIP</span> :
                                                <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded font-bold">STABLE</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-emerald-400 font-black text-2xl">{pool.apy}%</div>
                                            <div className="text-[10px] text-slate-500 uppercase">APY</div>
                                        </div>
                                    </div>

                                    {/* LENDING HEALTH FACTOR */}
                                    {view === 'LEND' && (pool.borrowedAmount || 0) > 0 && (
                                        <div className="mb-4 bg-slate-950 p-2 rounded border border-slate-800">
                                            <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
                                                <span>Health Factor</span>
                                                <span className={(pool.healthFactor || 2) < 1.1 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}>{(pool.healthFactor || 2).toFixed(2)}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
                                                <div className="absolute left-[33%] w-0.5 h-full bg-red-500 z-10" title="Liquidation Line"></div>
                                                <div 
                                                    className={`h-full transition-all duration-500 ${(pool.healthFactor||2) < 1.2 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                                    style={{width: `${Math.min(100, ((pool.healthFactor||0) / 3) * 100)}%`}}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                                                <span>Collateral: ${pool.collateralAmount?.toLocaleString()}</span>
                                                <span>Debt: ${pool.borrowedAmount?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* STAKED STATS */}
                                    {pool.myShare > 0 && (
                                        <div className="bg-slate-950 p-3 rounded-lg mb-4 flex justify-between items-center relative z-10 border border-slate-800">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase">Staked</p>
                                                <p className="font-mono text-white text-sm">${(pool.tvl * pool.myShare).toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase">Rewards</p>
                                                <p className="font-mono text-emerald-400 text-sm font-bold flex items-center justify-end gap-1">
                                                    +${(pool.pendingRewards || 0).toFixed(4)}
                                                    <Wheat size={12} className="text-emerald-600"/>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CONTROLS */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {view === 'LEND' ? (
                                            <>
                                                <button onClick={() => onJoinPool(pool.id, 1000, false)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold">Deposit Collat</button>
                                                <button onClick={() => onBorrow(pool.id, 500)} className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded font-bold">Borrow USDC</button>
                                            </>
                                        ) : (
                                            <>
                                                <ActionTooltip title="Zap In" desc="One-click entry. Auto-swaps assets to match pool ratio. Saves gas.">
                                                    <button onClick={() => onJoinPool(pool.id, 1000, true)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold flex items-center justify-center gap-1">
                                                        <Zap size={12} fill="currentColor"/> Zap $1k
                                                    </button>
                                                </ActionTooltip>
                                                <button onClick={() => handleHarvest(pool.id)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded font-bold border border-slate-600">Harvest</button>
                                            </>
                                        )}
                                    </div>

                                    {/* ADVANCED TOGGLES */}
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                                        <ActionTooltip title="Nexus Cover" desc="Buy Insurance (Cost: 10% of Yield). Protects against Rug Pulls/Hacks.">
                                            <button onClick={() => onToggleInsurance(pool.id)} className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border ${pool.hasInsurance ? 'bg-blue-900/30 text-blue-400 border-blue-500' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                                                <ShieldCheck size={10}/> {pool.hasInsurance ? 'Covered' : 'Insure'}
                                            </button>
                                        </ActionTooltip>
                                        <ActionTooltip title="Auto-Compound" desc="Beefy-style vault. Automatically reinvests rewards. 2-week lockup.">
                                            <button onClick={() => onToggleAutoCompound(pool.id)} className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border ${pool.isAutoCompounding ? 'bg-purple-900/30 text-purple-400 border-purple-500' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                                                <Repeat size={10}/> {pool.isAutoCompounding ? 'Compounding' : 'Auto-Inv'}
                                            </button>
                                        </ActionTooltip>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: TOOLS & SIMULATORS */}
            <div className="space-y-6 flex flex-col relative z-10">
                
                {/* DEGEN TOGGLE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Skull size={20} className={degenMode ? 'text-red-500' : 'text-slate-500'} />
                        <div>
                            <h3 className={`font-black uppercase text-sm ${degenMode ? 'text-red-500' : 'text-white'}`}>Degen Mode</h3>
                            <p className="text-[10px] text-slate-500">Unlocks 10,000% APY Pools (High Risk)</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={degenMode} onChange={() => setDegenMode(!degenMode)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>

                {/* FLASH LOAN VISUALIZER */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden relative">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><Zap size={16} className="text-yellow-400"/> Flash Loan</h3>
                        <span className="text-[10px] bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded">Arbitrage</span>
                    </div>
                    
                    <div className="p-6 flex flex-col items-center justify-center min-h-[150px] relative">
                        {/* Connection Lines */}
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -z-0"></div>

                        <div className="flex justify-between w-full relative z-10">
                            {/* Step 1: Borrow */}
                            <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${['BORROW', 'SWAP', 'ARB', 'REPAY', 'PROFIT'].includes(loanState) ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-white font-bold text-xs">1</div>
                                <span className="text-[10px] font-bold">Borrow</span>
                            </div>
                            {/* Step 2: Swap */}
                            <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${['SWAP', 'ARB', 'REPAY', 'PROFIT'].includes(loanState) ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-white font-bold text-xs">2</div>
                                <span className="text-[10px] font-bold">Swap</span>
                            </div>
                            {/* Step 3: Repay */}
                            <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${['REPAY', 'PROFIT'].includes(loanState) ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-white font-bold text-xs">3</div>
                                <span className="text-[10px] font-bold">Repay</span>
                            </div>
                        </div>

                        {/* Status Text */}
                        <div className="mt-6 font-mono text-xs font-bold h-6 text-center">
                            {loanState === 'IDLE' && <span className="text-slate-500">Ready to execute.</span>}
                            {loanState === 'BORROW' && <span className="text-blue-400">Borrowing 10,000 ETH...</span>}
                            {loanState === 'SWAP' && <span className="text-purple-400">Swapping on Uniswap...</span>}
                            {loanState === 'ARB' && <span className="text-orange-400">Arbitraging on Sushi...</span>}
                            {loanState === 'REPAY' && <span className="text-blue-400">Repaying Loan + 0.09% Fee...</span>}
                            {loanState === 'PROFIT' && <span className="text-emerald-400">SUCCESS! Profit Secured.</span>}
                            {loanState === 'FAIL' && <span className="text-red-500">REVERTED! Slippage too high.</span>}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950 border-t border-slate-800">
                        <button 
                            onClick={runFlashLoanSim}
                            disabled={loanState !== 'IDLE'}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 text-xs"
                        >
                            <Zap size={14} fill="currentColor"/> Execute Strategy
                        </button>
                    </div>
                </div>

                {/* IMPERMANENT LOSS SIMULATOR */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4 text-sm"><Scale size={16}/> IL Simulator</h3>
                    
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="mb-6 relative w-48 h-24">
                            {/* Visual representation of pool balance shifting */}
                            <div className="absolute inset-0 border-b-2 border-l-2 border-slate-600"></div>
                            <div 
                                className="absolute bottom-0 left-0 bg-blue-500/50 border-t-2 border-blue-400 transition-all duration-300"
                                style={{
                                    width: `${50 - (simPriceChange/4)}%`, 
                                    height: `${50 + (simPriceChange/4)}%`
                                }}
                            ></div>
                            <div 
                                className="absolute bottom-0 right-0 bg-purple-500/50 border-t-2 border-purple-400 transition-all duration-300"
                                style={{
                                    width: `${50 + (simPriceChange/4)}%`, 
                                    height: `${50 - (simPriceChange/4)}%`
                                }}
                            ></div>
                        </div>

                        <div className="w-full space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-400">Price Change</span>
                                    <span className={simPriceChange === 0 ? 'text-white' : simPriceChange > 0 ? 'text-emerald-400' : 'text-red-400'}>{simPriceChange > 0 ? '+' : ''}{simPriceChange}%</span>
                                </div>
                                <input 
                                    type="range" min="-90" max="200" step="10" 
                                    value={simPriceChange} onChange={(e) => setSimPriceChange(Number(e.target.value))}
                                    className="w-full accent-blue-500"
                                />
                            </div>
                            
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold uppercase">Est. IL</span>
                                {/* Simplified IL Formula Approx for Game */}
                                <span className="text-red-500 font-mono font-bold text-sm">
                                    {simPriceChange === 0 ? '0.00%' : `-${(Math.abs(simPriceChange) * 0.05).toFixed(2)}%`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
