
import React, { useState } from 'react';
import { Globe, RefreshCw, Home, Building, Hotel, Briefcase, X, Hammer, ArrowRight, DollarSign, Search, AlertTriangle, Eye, Shield, Users, Skull, Activity, TrendingUp, TrendingDown, Gavel } from 'lucide-react';
import { PropertyListing, OwnedProperty } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { PortalTooltip } from './SmartTooltip';
import { generateHiddenGem } from '../services/geminiService';
import { playSound } from '../utils/sound';
import { RealEstate_Bidding, RealEstate_Mortgage, RealEstate_Closing } from './RealEstate_MiniGame';

const ListTooltip = ({ children, title, desc }: { children: React.ReactNode, title: string, desc: string }) => (
    <PortalTooltip title={title} desc={desc} position="right" className="w-full block">
        {children}
    </PortalTooltip>
);

interface InvestingRealEstateProps {
    listings: PropertyListing[];
    properties: OwnedProperty[];
    bankBalance: number;
    fedRate: number; // New Prop
    onBuy: (property: PropertyListing) => void; 
    onManage: (action: 'RENOVATE' | 'REFINANCE' | 'SELL' | 'FIND_TENANT' | 'EVICT' | 'INSURE' | 'REPAIR', propertyId: string) => void;
    onRefresh: () => void;
}

type Mode = 'BROWSE' | 'BIDDING' | 'FINANCING' | 'CLOSING' | 'MANAGE';

export const Investing_RealEstate: React.FC<InvestingRealEstateProps> = (props) => {
    const [mode, setMode] = useState<Mode>('BROWSE');
    const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(null);
    const [selectedOwned, setSelectedOwned] = useState<OwnedProperty | null>(null);
    const [dealStructure, setDealStructure] = useState<{price: number, loan?: {amount: number, down: number, rate: number, bank: string}} | null>(null);
    const [scoutLoading, setScoutLoading] = useState(false);
    const [localListings, setLocalListings] = useState<PropertyListing[]>(props.listings);

    React.useEffect(() => {
        if (localListings.length === 0) setLocalListings(props.listings);
    }, [props.listings]);

    const handleScout = async () => {
        if (props.bankBalance < 500) {
            alert("Scouting costs $500.");
            return;
        }
        setScoutLoading(true);
        playSound('CLICK');
        const gem = await generateHiddenGem();
        setLocalListings(prev => [gem, ...prev]);
        setScoutLoading(false);
        playSound('SUCCESS');
    };

    const startDeal = (p: PropertyListing) => {
        setSelectedListing(p);
        setMode('BIDDING');
    };

    const handleBidAccept = (price: number) => {
        setDealStructure({ price });
        setMode('FINANCING');
    };

    const handleFinanceSelect = (loanDetails: { downPayment: number, loanAmount: number, rate: number, bank: string }) => {
        setDealStructure(prev => ({ ...prev!, loan: { amount: loanDetails.loanAmount, down: loanDetails.downPayment, rate: loanDetails.rate, bank: loanDetails.bank } }));
        setMode('CLOSING');
    };

    const handleCashBuy = () => {
        if (!dealStructure || !selectedListing) return;
        if (props.bankBalance < dealStructure.price) {
            alert("Insufficient Cash!");
            return;
        }
        const finalProp = { ...selectedListing, price: dealStructure.price, downPaymentPct: 100 };
        props.onBuy(finalProp);
        setMode('BROWSE');
        setSelectedListing(null);
    };

    const handleClosingSuccess = () => {
        if (!selectedListing || !dealStructure) return;
        playSound('VICTORY');
        
        if (dealStructure.loan) {
            const impliedDownPct = (dealStructure.loan.down / dealStructure.price) * 100;
            const finalProp = { ...selectedListing, price: dealStructure.price, downPaymentPct: impliedDownPct };
            props.onBuy(finalProp);
        }
        setMode('BROWSE');
        setSelectedListing(null);
    };

    return (
        <div className="h-full relative">
            
            {/* CLOSING GAME OVERLAY */}
            {mode === 'CLOSING' && (
                <RealEstate_Closing 
                    onSuccess={handleClosingSuccess}
                    onFail={() => { 
                        alert("Closing Failed! Seller walked away."); 
                        setMode('BROWSE'); 
                        playSound('ERROR');
                    }}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                
                {/* LEFT: MARKET */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col h-full relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><Globe size={16}/> Market <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Fed Rate: {props.fedRate.toFixed(1)}%</span></h3>
                        <div className="flex gap-2">
                            <ActionTooltip title="Scout Hidden Deals" desc="Spend $500 to find off-market Fixer Uppers. High risk, high reward.">
                                <button onClick={handleScout} disabled={scoutLoading} className="text-xs bg-purple-900/30 border border-purple-500/50 text-purple-300 px-3 py-1 rounded hover:bg-purple-900/50 flex items-center gap-1 transition-all">
                                    {scoutLoading ? <RefreshCw className="animate-spin" size={12}/> : <Search size={12}/>} Scout
                                </button>
                            </ActionTooltip>
                            <ActionTooltip title="Refresh MLS" desc="Load new standard market listings.">
                                <button onClick={props.onRefresh} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white"><RefreshCw size={12}/></button>
                            </ActionTooltip>
                        </div>
                    </div>
                    
                    {/* Listings Feed */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 pb-20 scrollbar-thin scrollbar-thumb-slate-700">
                        {localListings.map(p => (
                            <div key={p.id} className={`p-3 rounded-lg border transition-all group relative ${p.type === 'FIXER_UPPER' ? 'bg-red-950/10 border-red-500/30 hover:border-red-500' : 'bg-slate-950 border-slate-800 hover:border-amber-500'}`}>
                                <ListTooltip title={`${p.type} in ${p.location}`} desc={`ARV: $${p.arv ? p.arv.toLocaleString() : '???'}. Reno Est: $${p.renovationCostEst ? p.renovationCostEst.toLocaleString() : '0'}.`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {p.type === 'RESIDENTIAL' ? <Home size={14} className="text-blue-400"/> : p.type === 'COMMERCIAL' ? <Building size={14} className="text-purple-400"/> : p.type === 'FIXER_UPPER' ? <Hammer size={14} className="text-red-400"/> : <Hotel size={14} className="text-emerald-400"/>}
                                                <span className="font-bold text-sm text-white">{p.name}</span>
                                                {p.isOffMarket && <span className="text-[8px] bg-red-600 text-white px-1 rounded uppercase">Off-Market</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                                <span className="bg-slate-900 px-1 rounded border border-slate-800">{p.location}</span>
                                                <span>Cond: {p.condition}%</span>
                                                {p.arv && <span className="text-emerald-500 font-bold">ARV: ${p.arv.toLocaleString()}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-sm font-bold text-white">${p.price.toLocaleString()}</div>
                                            <div className="text-[10px] text-emerald-400">Yld: {p.rentalYield}%</div>
                                        </div>
                                    </div>
                                </ListTooltip>
                                
                                <button onClick={() => startDeal(p)} className="w-full py-2 bg-slate-800 hover:bg-white hover:text-black text-slate-400 font-bold rounded text-xs transition-colors mt-2">
                                    Analyze & Bid
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: INTERACTION PANEL (Context Sensitive) */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col h-full relative">
                    
                    {mode === 'BROWSE' && (
                        <>
                            <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Briefcase size={16}/> My Portfolio</h3>
                            <div className="space-y-2 overflow-y-auto flex-1 pr-2 pb-20">
                                {props.properties.map(p => (
                                    <ListTooltip key={p.id} title={p.name} desc={`Equity: $${p.equity.toLocaleString()}. Status: ${p.isVacant ? 'Vacant' : 'Occupied'}.`}>
                                        <button 
                                            onClick={() => setSelectedOwned(p)}
                                            className="w-full flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500 transition-colors group"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-xs text-white flex items-center gap-2">
                                                    {p.name}
                                                    {p.isSquatter && <Skull size={10} className="text-red-500 animate-pulse"/>}
                                                    {p.tenantStatus === 'LATE' && <AlertTriangle size={10} className="text-yellow-500"/>}
                                                </div>
                                                <div className="text-[10px] text-slate-500">Eq: ${p.equity.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                {p.isSquatter ? <span className="text-[10px] bg-red-900 text-red-400 px-1 rounded font-bold">SQUATTER</span> : 
                                                 p.isVacant ? <span className="text-[10px] bg-red-900/50 text-red-300 px-1 rounded">VACANT</span> : 
                                                 <span className="text-[10px] bg-emerald-900 text-emerald-400 px-1 rounded">RENTED</span>}
                                                <div className="text-[10px] text-slate-500 mt-1">{p.condition.toFixed(0)}% Cond</div>
                                            </div>
                                        </button>
                                    </ListTooltip>
                                ))}
                                {props.properties.length === 0 && (
                                    <div className="text-center py-20 text-slate-600 text-xs italic flex flex-col items-center">
                                        <Search size={32} className="mb-2 opacity-50"/>
                                        Select a property to bid on.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* MANAGE MODE (Portfolio Item Selected) */}
                    {mode === 'BROWSE' && selectedOwned && (
                        <div className="absolute inset-0 bg-slate-900 p-4 z-10 flex flex-col animate-in slide-in-from-right">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">{selectedOwned.name}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${selectedOwned.hasInsurance ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>
                                        {selectedOwned.hasInsurance ? 'INSURED' : 'UNINSURED (RISKY)'}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedOwned(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                            </div>
                            
                            {/* Visual Status */}
                            <div className="relative h-24 bg-slate-950 rounded-lg mb-4 overflow-hidden border border-slate-800 flex items-center justify-around p-2">
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">Condition</div>
                                    <div className={`text-lg font-bold ${selectedOwned.condition < 30 ? 'text-red-500' : 'text-emerald-400'}`}>{selectedOwned.condition}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">Tenant</div>
                                    <div className={`text-lg font-bold ${selectedOwned.isSquatter ? 'text-red-500' : selectedOwned.tenantStatus === 'GOOD' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                                        {selectedOwned.isSquatter ? 'SQUATTER' : selectedOwned.isVacant ? 'NONE' : selectedOwned.tenantStatus}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">Maint Health</div>
                                    <div className={`text-lg font-bold ${selectedOwned.maintenanceHealth < 40 ? 'text-red-500' : 'text-blue-400'}`}>{selectedOwned.maintenanceHealth}%</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                <div className="bg-slate-800 p-2 rounded"><span className="text-slate-500 block">Equity</span><span className="text-emerald-400 font-bold font-mono">${selectedOwned.equity.toLocaleString()}</span></div>
                                <div className="bg-slate-800 p-2 rounded"><span className="text-slate-500 block">Mortgage</span><span className="text-red-400 font-bold font-mono">${selectedOwned.mortgageBalance.toLocaleString()}</span></div>
                                <div className="bg-slate-800 p-2 rounded"><span className="text-slate-500 block">Prop Tax</span><span className="text-slate-300 font-bold">{selectedOwned.propertyTaxRate}%</span></div>
                                <div className="bg-slate-800 p-2 rounded"><span className="text-slate-500 block">Yield</span><span className="text-blue-400 font-bold">{selectedOwned.rentalYield}%</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto overflow-y-auto max-h-[200px] pr-1">
                                {selectedOwned.isSquatter ? (
                                    <ActionTooltip title="Evict Squatter" desc="Legal process to remove squatter. Costs $2,000 and takes time.">
                                        <button onClick={() => props.onManage('EVICT', selectedOwned.id)} className="col-span-2 w-full py-4 bg-red-600 hover:bg-red-500 text-white border border-red-800 rounded font-bold text-sm flex items-center justify-center gap-2 animate-pulse">
                                            <Gavel size={16}/> EVICT SQUATTER ($2k)
                                        </button>
                                    </ActionTooltip>
                                ) : (
                                    <>
                                        <ActionTooltip title="Renovate" desc="Invest $5k to improve condition +20% and Property Value.">
                                            <button onClick={() => props.onManage('RENOVATE', selectedOwned.id)} className="w-full py-2 bg-orange-900/30 text-orange-400 border border-orange-500/30 rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-orange-900/50"><Hammer size={12}/> Renovate</button>
                                        </ActionTooltip>
                                        <ActionTooltip title="Find Tenant" desc="Spend $500 marketing to fill vacancy.">
                                            <button onClick={() => props.onManage('FIND_TENANT', selectedOwned.id)} disabled={!selectedOwned.isVacant} className="w-full py-2 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-blue-900/50 disabled:opacity-50"><ArrowRight size={12}/> Fill Unit</button>
                                        </ActionTooltip>
                                        
                                        <ActionTooltip title="Maintenance" desc="Repair broken items (HVAC, Roof). Prevents tenant leaving or value drop. Cost varies.">
                                            <button onClick={() => props.onManage('REPAIR', selectedOwned.id)} className="w-full py-2 bg-slate-800 text-slate-300 border border-slate-600 rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-700"><Activity size={12}/> Repair</button>
                                        </ActionTooltip>
                                        <ActionTooltip title="Insurance" desc="Pay $200 for 10 weeks of coverage. Protects against Fires and Floods.">
                                            <button onClick={() => props.onManage('INSURE', selectedOwned.id)} disabled={selectedOwned.hasInsurance} className="w-full py-2 bg-indigo-900/30 text-indigo-400 border border-indigo-500/30 rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-indigo-900/50 disabled:opacity-50"><Shield size={12}/> Buy Policy</button>
                                        </ActionTooltip>

                                        <ActionTooltip title="Refinance" desc={`Pull cash out if equity > 25%. Current Rates: ${props.fedRate + 2}%`}>
                                            <button onClick={() => props.onManage('REFINANCE', selectedOwned.id)} className="w-full py-2 bg-purple-900/30 text-purple-400 border border-purple-500/30 rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-purple-900/50"><RefreshCw size={12}/> Refinance</button>
                                        </ActionTooltip>
                                        <ActionTooltip title="Sell" desc="Liquidate asset. Pay 6% closing fees.">
                                            <button onClick={() => { props.onManage('SELL', selectedOwned.id); setSelectedOwned(null); }} className="w-full py-2 bg-red-900/30 text-red-400 border border-red-500/30 rounded font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-900/50"><DollarSign size={12}/> Sell</button>
                                        </ActionTooltip>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MINI-GAME MODES */}
                    {mode === 'BIDDING' && selectedListing && (
                        <div className="absolute inset-0 bg-slate-900 z-20 p-4">
                            <RealEstate_Bidding 
                                property={selectedListing} 
                                onAccept={handleBidAccept} 
                                onCancel={() => { setMode('BROWSE'); setSelectedListing(null); }} 
                            />
                        </div>
                    )}

                    {mode === 'FINANCING' && dealStructure && (
                        <div className="absolute inset-0 bg-slate-900 z-20 p-4">
                            <RealEstate_Mortgage 
                                price={dealStructure.price} 
                                creditScore={750} // In real app, pass from props
                                onSelect={handleFinanceSelect}
                                onCash={handleCashBuy}
                                onCancel={() => { setMode('BROWSE'); setSelectedListing(null); }}
                            />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
