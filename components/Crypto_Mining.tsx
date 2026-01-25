

import React, { useState, useEffect } from 'react';
import { Server, Zap, Thermometer, Hammer, Fan, Gauge, Settings, PlayCircle, StopCircle, Box, Layers, Activity, Grid, Battery, Wind, Droplets, Flame, Cpu, Plus, ShoppingCart, X, AlertTriangle } from 'lucide-react';
import { MiningRig, PowerSource } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { playSound } from '../utils/sound';

// --- SHOP CONSTANTS (9 NEW ITEMS + CLASSICS) ---
const SHOP_ITEMS = {
    RIGS: [
        { id: 'gpu_starter', name: 'GTX 1660 Rig', hashrate: 25, powerUsage: 300, cost: 800, efficiency: 90, type: 'GPU' },
        { id: 'asic_s9', name: 'AntMiner S9', hashrate: 14, powerUsage: 1300, cost: 400, efficiency: 70, type: 'ASIC' },
        { id: 'rtx_farm', name: 'RTX 4090 Farm', hashrate: 150, powerUsage: 900, cost: 4500, efficiency: 95, type: 'GPU' },
        { id: 'fpga_rack', name: 'FPGA Blackbox', hashrate: 400, powerUsage: 1200, cost: 12000, efficiency: 98, type: 'ASIC' },
        { id: 'quantum_rig', name: 'Quantum Core', hashrate: 2500, powerUsage: 5000, cost: 50000, efficiency: 99, type: 'ASIC' }, // Endgame
    ],
    POWER: [
        { id: 'diesel_gen', name: 'Diesel Gen', capacity: 2000, cost: 1500, weeklyCost: 200, type: 'GRID' },
        { id: 'solar_array', name: 'Solar Array', capacity: 3500, cost: 6000, weeklyCost: 0, type: 'SOLAR' },
        { id: 'wind_turbine', name: 'Wind Turbine', capacity: 8000, cost: 12000, weeklyCost: 50, type: 'WIND' },
        { id: 'hydro_dam', name: 'Hydro Link', capacity: 25000, cost: 40000, weeklyCost: 100, type: 'HYDRO' }, // Massive
        { id: 'fusion_cell', name: 'Fusion Cell', capacity: 100000, cost: 150000, weeklyCost: 500, type: 'NUCLEAR' }, // Endgame
    ],
    INFRA: [
        { id: 'ind_fan', name: 'Industrial Fan', capacity: 500, cost: 500, weeklyCost: 20, type: 'COOLING' },
        { id: 'ac_unit', name: 'CRAC Unit', capacity: 2000, cost: 2500, weeklyCost: 100, type: 'COOLING' },
        { id: 'immersion', name: 'Immersion Tank', capacity: 10000, cost: 15000, weeklyCost: 300, type: 'COOLING' },
    ]
};

interface CryptoMiningProps {
    rigs: MiningRig[];
    powerSources: PowerSource[];
    esgScore: number;
    onBuyRig: (rig: MiningRig) => void;
    onBuyPower: (power: PowerSource) => void;
}

export const Crypto_Mining: React.FC<CryptoMiningProps> = ({ rigs, powerSources, esgScore, onBuyRig, onBuyPower }) => {
    const [view, setView] = useState<'FLOOR' | 'GRID'>('FLOOR');
    const [activeRigs, setActiveRigs] = useState<MiningRig[]>(rigs);
    const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
    const [showShop, setShowShop] = useState(false);
    const [miningMode, setMiningMode] = useState<'POOL' | 'SOLO'>('POOL');
    const [pendingRewards, setPendingRewards] = useState(0);
    const [globalTemp, setGlobalTemp] = useState(22); // Room temp

    // Sync Props
    useEffect(() => {
        if (rigs.length !== activeRigs.length) setActiveRigs(rigs);
    }, [rigs]);

    // THE TICKER LOOP
    useEffect(() => {
        const timer = setInterval(() => {
            const totalPowerDraw = activeRigs.filter(r => r.isOnline).reduce((acc, r) => acc + (r.powerUsage * (r.overclock/100)), 0);
            const totalGridCap = powerSources.filter(p => p.type !== 'COOLING').reduce((acc, p) => acc + p.capacity, 0);
            const totalCooling = powerSources.filter(p => p.type === 'COOLING').reduce((acc, p) => acc + p.capacity, 0);
            
            // Grid Instability Check
            const isBrownout = totalPowerDraw > totalGridCap;

            setActiveRigs(currentRigs => {
                let currentTotalHeat = 0;

                const nextRigs = currentRigs.map(rig => {
                    // Brownout Logic: Random shutdown if over capacity
                    if (isBrownout && rig.isOnline && Math.random() < 0.1) {
                        return { ...rig, isOnline: false };
                    }

                    if (!rig.isOnline) return { ...rig, temp: Math.max(20, rig.temp - 3) };

                    // Heat Logic
                    let heatGen = (rig.powerUsage / 500) * (rig.overclock / 100); 
                    // Cooling Effect
                    const coolingFactor = Math.max(0.5, totalCooling / (currentRigs.length * 100)); // Distributed cooling
                    heatGen -= coolingFactor;

                    let newTemp = Math.max(20, Math.min(120, rig.temp + heatGen));
                    currentTotalHeat += newTemp;

                    // Condition Decay
                    let condLoss = 0.02 * (rig.overclock/100);
                    if (newTemp > 85) condLoss *= 3;
                    const newCond = Math.max(0, rig.condition - condLoss);

                    // Auto-shutdown
                    let online: boolean = rig.isOnline;
                    if (newTemp >= 100 || newCond <= 0) online = false;

                    // Rewards
                    if (online) {
                        setPendingRewards(p => p + (0.000001 * (rig.hashrate / 10)));
                    }

                    return { ...rig, temp: newTemp, condition: newCond, isOnline: online };
                });

                setGlobalTemp(20 + (currentTotalHeat / (currentRigs.length || 1) / 5)); // Room ambient rises
                return nextRigs;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [powerSources, activeRigs.length]); // Dep check optimized

    const handleBuyItem = (category: string, item: any) => {
        playSound('COIN');
        if (category === 'RIGS') {
            onBuyRig({
                id: Date.now().toString(),
                name: item.name,
                hashrate: item.hashrate,
                powerUsage: item.powerUsage,
                cost: item.cost,
                efficiency: item.efficiency,
                type: item.type,
                temp: 25,
                overclock: 100,
                condition: 100,
                isOnline: true
            });
        } else {
            onBuyPower({
                id: Date.now().toString(),
                name: item.name,
                capacity: item.capacity,
                cost: item.cost,
                weeklyCost: item.weeklyCost,
                type: item.type
            });
        }
    };

    const handleRepair = (id: string) => {
        setActiveRigs(prev => prev.map(r => r.id === id ? { ...r, condition: 100 } : r));
        playSound('HAMMER');
    };

    const handleToggle = (id: string) => {
        setActiveRigs(prev => prev.map(r => r.id === id ? { ...r, isOnline: !r.isOnline } : r));
        playSound('CLICK');
    };

    const handleOverclock = (id: string, val: number) => {
        setActiveRigs(prev => prev.map(r => r.id === id ? { ...r, overclock: val } : r));
    };

    // Stats
    const totalHash = activeRigs.filter(r => r.isOnline).reduce((acc, r) => acc + r.hashrate, 0);
    const totalPower = activeRigs.filter(r => r.isOnline).reduce((acc, r) => acc + (r.powerUsage * (r.overclock/100)), 0);
    const gridCapacity = powerSources.filter(p => p.type !== 'COOLING').reduce((acc, p) => acc + p.capacity, 0);
    const gridHealth = Math.min(100, (gridCapacity / (totalPower || 1)) * 100);

    return (
        <div className="h-full flex flex-col gap-4 relative">
            
            {/* --- TOP HUD --- */}
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between shrink-0 shadow-md">
                <div className="flex gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-900/30 p-2 rounded text-purple-400"><Activity size={20}/></div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Hashrate</p>
                            <p className="text-xl font-black text-white">{totalHash.toLocaleString()} <span className="text-sm font-medium text-slate-500">TH/s</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${totalPower > gridCapacity ? 'bg-red-900/30 text-red-400 animate-pulse' : 'bg-yellow-900/30 text-yellow-400'}`}><Zap size={20}/></div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Grid Load</p>
                            <p className="text-xl font-black text-white">{totalPower.toLocaleString()} <span className="text-sm font-medium text-slate-500">/ {gridCapacity.toLocaleString()} W</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${globalTemp > 40 ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'}`}><Thermometer size={20}/></div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Room Temp</p>
                            <p className="text-xl font-black text-white">{globalTemp.toFixed(1)}°C</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Unpaid Balance</p>
                        <p className="text-lg font-mono text-emerald-400 font-bold">{pendingRewards.toFixed(6)} BTC</p>
                    </div>
                    <button onClick={() => setShowShop(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:scale-105">
                        <ShoppingCart size={18}/> Procurement
                    </button>
                </div>
            </div>

            {/* --- MAIN AREA TABS --- */}
            <div className="flex gap-2 shrink-0">
                <button onClick={() => setView('FLOOR')} className={`px-6 py-2 rounded-t-lg font-bold text-sm flex items-center gap-2 ${view === 'FLOOR' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}>
                    <Server size={16}/> Mining Floor
                </button>
                <button onClick={() => setView('GRID')} className={`px-6 py-2 rounded-t-lg font-bold text-sm flex items-center gap-2 ${view === 'GRID' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}>
                    <Grid size={16}/> Infrastructure Grid
                </button>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-b-xl rounded-tr-xl p-4 overflow-hidden relative">
                
                {/* VIEW: MINING FLOOR */}
                {view === 'FLOOR' && (
                    <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600">
                        {activeRigs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <Server size={64} className="mb-4"/>
                                <p className="text-lg font-bold">Facility Empty</p>
                                <p className="text-sm">Visit Procurement to buy rigs.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {activeRigs.map(rig => (
                                    <div key={rig.id} className={`bg-slate-900 border rounded-xl p-3 relative group transition-all ${!rig.isOnline ? 'border-slate-700 opacity-60' : rig.temp > 90 ? 'border-red-500' : 'border-slate-600 hover:border-purple-500'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-1.5 rounded-md ${rig.type === 'ASIC' ? 'bg-slate-800 text-slate-400' : 'bg-purple-900/20 text-purple-400'}`}>
                                                {rig.type === 'ASIC' ? <Box size={14}/> : <Cpu size={14}/>}
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${rig.isOnline ? (rig.temp > 90 ? 'bg-red-500 animate-ping' : 'bg-emerald-500') : 'bg-slate-700'}`}></div>
                                        </div>
                                        
                                        <h4 className="font-bold text-white text-xs truncate mb-1">{rig.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono mb-2">{rig.hashrate} TH/s</p>
                                        
                                        {/* Status Bars */}
                                        <div className="space-y-1 mb-3">
                                            <div className="flex justify-between text-[8px] text-slate-400"><span>Temp</span><span>{rig.temp.toFixed(0)}°C</span></div>
                                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${rig.temp > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, rig.temp)}%`}}></div>
                                            </div>
                                            <div className="flex justify-between text-[8px] text-slate-400"><span>Health</span><span>{rig.condition.toFixed(0)}%</span></div>
                                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${rig.condition < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${rig.condition}%`}}></div>
                                            </div>
                                        </div>

                                        {/* Controls (Hover) */}
                                        <div className="absolute inset-0 bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 rounded-xl z-10">
                                            <button onClick={() => handleToggle(rig.id)} className="p-2 bg-slate-800 rounded-full hover:bg-white hover:text-black transition-colors">
                                                {rig.isOnline ? <StopCircle size={16}/> : <PlayCircle size={16}/>}
                                            </button>
                                            <div className="flex items-center gap-2 w-full px-2">
                                                <Gauge size={12} className="text-slate-500"/>
                                                <input 
                                                    type="range" min="50" max="150" step="10" 
                                                    value={rig.overclock} 
                                                    onChange={(e) => handleOverclock(rig.id, Number(e.target.value))}
                                                    className="w-full accent-purple-500 h-1"
                                                />
                                            </div>
                                            {rig.condition < 100 && (
                                                <button onClick={() => handleRepair(rig.id)} className="text-[10px] font-bold text-blue-400 flex items-center gap-1 hover:text-white">
                                                    <Hammer size={10}/> Repair
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW: INFRASTRUCTURE GRID */}
                {view === 'GRID' && (
                    <div className="h-full overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Power Sources */}
                            {powerSources.map((src, i) => (
                                <div key={i} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${src.type === 'SOLAR' ? 'bg-yellow-900/20 text-yellow-400' : src.type === 'NUCLEAR' ? 'bg-purple-900/20 text-purple-400 animate-pulse' : src.type === 'HYDRO' ? 'bg-blue-900/20 text-blue-400' : src.type === 'WIND' ? 'bg-cyan-900/20 text-cyan-400' : src.type === 'COOLING' ? 'bg-sky-900/20 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
                                        {src.type === 'SOLAR' ? <Flame size={24}/> : src.type === 'WIND' ? <Wind size={24}/> : src.type === 'HYDRO' ? <Droplets size={24}/> : src.type === 'COOLING' ? <Fan size={24}/> : <Zap size={24}/>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{src.name}</h4>
                                        <p className="text-xs text-slate-500">{src.type} INFRASTRUCTURE</p>
                                        <p className={`font-mono font-bold ${src.type === 'COOLING' ? 'text-sky-400' : 'text-emerald-400'}`}>
                                            {src.type === 'COOLING' ? `-${src.capacity} Heat` : `+${src.capacity}W Power`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setShowShop(true)} className="bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-emerald-500 p-4 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors gap-2 min-h-[100px]">
                                <Plus size={32}/>
                                <span className="font-bold text-sm">Expand Grid</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* --- SHOP MODAL --- */}
            {showShop && (
                <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm rounded-xl flex flex-col animate-in fade-in zoom-in">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                        <h2 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20}/> PROCUREMENT</h2>
                        <button onClick={() => setShowShop(false)} className="bg-slate-800 p-1 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* SECTION: RIGS */}
                        <div className="col-span-full text-xs font-bold text-slate-500 uppercase tracking-widest mb-[-10px]">Mining Hardware</div>
                        {SHOP_ITEMS.RIGS.map(item => (
                            <div key={item.id} onClick={() => handleBuyItem('RIGS', item)} className="bg-slate-900 border border-slate-700 hover:border-purple-500 p-4 rounded-xl cursor-pointer group transition-all hover:scale-[1.02]">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{item.name}</h4>
                                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">{item.type}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <div>Hash: <span className="text-white">{item.hashrate} TH/s</span></div>
                                        <div>Pwr: <span className="text-white">{item.powerUsage}W</span></div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-emerald-400 group-hover:text-emerald-300">${item.cost.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}

                        {/* SECTION: POWER */}
                        <div className="col-span-full text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-[-10px]">Power Grid</div>
                        {SHOP_ITEMS.POWER.map(item => (
                            <div key={item.id} onClick={() => handleBuyItem('POWER', item)} className="bg-slate-900 border border-slate-700 hover:border-yellow-500 p-4 rounded-xl cursor-pointer group transition-all hover:scale-[1.02]">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{item.name}</h4>
                                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">{item.type}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <div>Cap: <span className="text-yellow-400">+{item.capacity.toLocaleString()}W</span></div>
                                        <div>Run Cost: ${item.weeklyCost}/wk</div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-emerald-400 group-hover:text-emerald-300">${item.cost.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}

                        {/* SECTION: COOLING */}
                        <div className="col-span-full text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-[-10px]">Thermal Management</div>
                        {SHOP_ITEMS.INFRA.map(item => (
                            <div key={item.id} onClick={() => handleBuyItem('INFRA', item)} className="bg-slate-900 border border-slate-700 hover:border-blue-500 p-4 rounded-xl cursor-pointer group transition-all hover:scale-[1.02]">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{item.name}</h4>
                                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">{item.type}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <div>Cooling: <span className="text-blue-400">-{item.capacity} Heat</span></div>
                                        <div>Run Cost: ${item.weeklyCost}/wk</div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-emerald-400 group-hover:text-emerald-300">${item.cost.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            )}

        </div>
    );
};