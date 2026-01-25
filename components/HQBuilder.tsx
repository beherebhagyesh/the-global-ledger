
import React from 'react';
import { HQUpgrade, PlayerState } from '../types';
import { Coffee, Server, Library, Zap, Wind, Monitor, LayoutGrid, X, Check } from 'lucide-react';
import { playSound } from '../utils/sound';

interface HQBuilderProps {
    player: PlayerState;
    onClose: () => void;
    onPurchase: (upgrade: HQUpgrade) => void;
}

const UPGRADES: HQUpgrade[] = [
    { id: 'espresso', name: 'Pro Espresso Machine', icon: 'Coffee', cost: 2000, description: 'High-octane fuel for founders.', effectType: 'ENERGY_REGEN', value: 10, unlocked: false, benefit: '+10% Energy Regen Speed' },
    { id: 'server_rack', name: 'On-Prem Server Rack', icon: 'Server', cost: 5000, description: 'Self-hosted infrastructure.', effectType: 'BURN_REDUCTION', value: 20, unlocked: false, benefit: '-20% SaaS Burn Rate' },
    { id: 'ergonomic', name: 'Herman Miller Chairs', icon: 'Monitor', cost: 1500, description: 'Prevents back pain and burnout.', effectType: 'STRESS_RESISTANCE', value: 15, unlocked: false, benefit: '-15% Stress Accumulation' },
    { id: 'bloomberg', name: 'Market Terminal', icon: 'LayoutGrid', cost: 10000, description: 'Real-time financial data feed.', effectType: 'INTEL_BOOST', value: 1, unlocked: false, benefit: 'Reveals Hidden Commodity Trends' },
    { id: 'ac_unit', name: 'Industrial AC', icon: 'Wind', cost: 800, description: 'Keeps the mining rigs cool.', effectType: 'ENERGY_REGEN', value: 5, unlocked: false, benefit: '+5% Mining Efficiency' },
    { id: 'legal_lib', name: 'Legal Library', icon: 'Library', cost: 3000, description: 'Reference books for tax law.', effectType: 'STRESS_RESISTANCE', value: 10, unlocked: false, benefit: '+10% Audit Defense Chance' },
];

export const HQBuilder: React.FC<HQBuilderProps> = ({ player, onClose, onPurchase }) => {
    
    const handleBuy = (upg: HQUpgrade) => {
        if (player.bankBalance >= upg.cost && !(player.hqUpgrades?.includes(upg.id))) {
            onPurchase(upg);
            playSound('SUCCESS');
        } else {
            playSound('ERROR');
        }
    };

    const getIcon = (name: string) => {
        switch(name) {
            case 'Coffee': return <Coffee size={24} />;
            case 'Server': return <Server size={24} />;
            case 'Library': return <Library size={24} />;
            case 'Monitor': return <Monitor size={24} />;
            case 'LayoutGrid': return <LayoutGrid size={24} />;
            case 'Wind': return <Wind size={24} />;
            default: return <Zap size={24} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-blue-500/50 shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-blue-900/30 flex justify-between items-center bg-blue-900/10 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid /> Headquarters Architect
                        </h2>
                        <p className="text-slate-400 text-sm">Customize your workspace for permanent buffs.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Global Budget</p>
                            <p className="text-xl font-mono text-emerald-400 font-bold">${player.bankBalance.toLocaleString()}</p>
                        </div>
                        <button onClick={onClose} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scrollbar-thin scrollbar-thumb-blue-900">
                    {UPGRADES.map(upg => {
                        const isOwned = player.hqUpgrades?.includes(upg.id);
                        const canAfford = player.bankBalance >= upg.cost;

                        return (
                            <div 
                                key={upg.id} 
                                className={`relative p-6 rounded-xl border-2 transition-all flex flex-col group
                                    ${isOwned 
                                        ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${isOwned ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        {getIcon(upg.icon)}
                                    </div>
                                    {isOwned && <Check className="text-blue-400" />}
                                </div>

                                <h3 className="font-bold text-lg text-white mb-1">{upg.name}</h3>
                                <p className="text-xs text-slate-400 mb-4 h-8">{upg.description}</p>
                                
                                <div className="bg-slate-950 p-2 rounded mb-4 border border-slate-800">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Effect</p>
                                    <p className="text-sm text-slate-200">{upg.benefit}</p>
                                </div>

                                <div className="mt-auto">
                                    {isOwned ? (
                                        <div className="w-full py-2 bg-blue-900/50 text-blue-300 text-xs font-bold uppercase tracking-widest text-center rounded border border-blue-500/30">
                                            Installed
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleBuy(upg)}
                                            disabled={!canAfford}
                                            className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
                                                ${canAfford 
                                                    ? 'bg-slate-200 text-slate-900 hover:bg-white hover:scale-105 shadow-lg' 
                                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}
                                            `}
                                        >
                                            Buy for ${upg.cost.toLocaleString()}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};
