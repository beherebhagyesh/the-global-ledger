import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { generateCommodityEvent, appraiseGemstone } from '../services/geminiService';
import { Commodity, MentorPersona, InventoryItem, Gemstone, MarketNews, ShippingStatus, RecyclingBatch, Mine, LeasedAsset, CustomsHold, OptionType, ActiveOption } from '../types';
import { MissionBrief } from './MissionBrief';
import { SmartTooltip } from './SmartTooltip';
import { Container, Droplets, Zap, Gavel, Radio, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Diamond, Hammer, Search, HelpCircle, Wallet, Factory, Anchor, ShieldCheck, Wind, Leaf, DollarSign, RefreshCw, Lock, Flame, Scale, RotateCcw, Ship, Trophy, CheckCircle, Globe, X, Pickaxe, Unlock } from 'lucide-react';
import { playSound } from '../utils/sound';

interface Level6Props {
    onComplete: () => void;
    addXP: (amount: number) => void;
    mentorPersona: MentorPersona;
    updateBank: (amount: number) => void;
    unlockItem: (item: InventoryItem) => void;
    inventory: InventoryItem[];
    removeItem: (id: string) => void;
    bankBalance: number;
}

const INITIAL_COMMODITIES: Commodity[] = [
    { id: 'GOLD', name: 'Gold Bullion', type: 'PRECIOUS_METAL', price: 2000, futuresPrice: 2020, marketCondition: 'CONTANGO', unit: 'oz', volatility: 0.02, storageCost: 0, trend: 0.01, history: [], esgRisk: 0.05, LC: true },
    { id: 'OIL', name: 'Crude Oil', type: 'ENERGY', price: 80, futuresPrice: 85, marketCondition: 'CONTANGO', unit: 'barrel', volatility: 0.15, storageCost: 1, trend: 0.05, history: [], esgRisk: 0.3, isRefinable: true, refineOutput: 'Fuel', refineMargin: 20, LC: true },
    { id: 'COPPER', name: 'Industrial Copper', type: 'INDUSTRIAL_METAL', price: 4, futuresPrice: 4.1, marketCondition: 'CONTANGO', unit: 'lb', volatility: 0.05, storageCost: 0.05, trend: 0.02, history: [], esgRisk: 0.1, LC: true },
    { id: 'LITHIUM', name: 'Lithium Carbonate', type: 'INDUSTRIAL_METAL', price: 40, futuresPrice: 38, marketCondition: 'BACKWARDATION', unit: 'kg', volatility: 0.1, storageCost: 0.1, trend: 0.08, history: [], esgRisk: 0.2, LC: false },
    { id: 'CARBON', name: 'Carbon Credit', type: 'CARBON', price: 50, futuresPrice: 52, marketCondition: 'CONTANGO', unit: 'ton', volatility: 0.08, storageCost: 0, trend: 0.03, history: [], esgRisk: 0, LC: false }
];

const ActionTooltip = ({ children, title, desc }: { children?: React.ReactNode, title: string, desc: string }) => (
    <div className="relative group w-full">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
            <div className="bg-slate-900 border border-slate-600 p-3 rounded-lg shadow-xl text-center">
                <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1">{title}</p>
                <p className="text-xs text-slate-300 leading-tight">{desc}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    </div>
);

export const Level6_Commodities: React.FC<Level6Props> = ({ onComplete, addXP, mentorPersona, updateBank, unlockItem, inventory, removeItem, bankBalance }) => {
    const [activeTab, setActiveTab] = useState<'THE_PIT' | 'LOGISTICS' | 'INDUSTRIAL' | 'MACRO'>('THE_PIT');
    const [commodities, setCommodities] = useState<Commodity[]>(INITIAL_COMMODITIES);
    const [holdings, setHoldings] = useState<Record<string, number>>({});
    const [shortPositions, setShortPositions] = useState<Record<string, number>>({});
    const [news, setNews] = useState<MarketNews | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [week, setWeek] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stayInLevel, setStayInLevel] = useState(false);

    // 14 GRANDMASTER MECHANICS STATES
    const [warehouseUsed, setWarehouseUsed] = useState(0);
    const WAREHOUSE_CAP = 1000;
    const [shippingStatus, setShippingStatus] = useState<ShippingStatus>('CLEAR');
    const [tariffsActive, setTariffsActive] = useState(false);
    const [dxy, setDxy] = useState(102.50); // Dollar Index
    const [recyclingQueue, setRecyclingQueue] = useState<RecyclingBatch[]>([]);

    // 9 NUANCED MECHANICS
    const [useLC, setUseLC] = useState(false); // Letter of Credit mode
    const [puts, setPuts] = useState<ActiveOption[]>([]);
    const [demurrageCost, setDemurrageCost] = useState(0);
    const [leasedGold, setLeasedGold] = useState<LeasedAsset[]>([]);
    const [mines, setMines] = useState<Mine[]>([]);
    const [customsHold, setCustomsHold] = useState<CustomsHold[]>([]);

    // Gemstone State
    const [currentGem, setCurrentGem] = useState<string>('Unidentified Red Stone');
    const [appraisal, setAppraisal] = useState<Gemstone | null>(null);
    const [loadingAppraisal, setLoadingAppraisal] = useState(false);

    const myGems = inventory.filter(i => i.icon === 'Diamond');
    const VICTORY_CASH = 50000;

    const initializeCommodities = () => {
        const initWithHistory = INITIAL_COMMODITIES.map(c => {
            const hist = [];
            let p = c.price;
            for (let i = 0; i < 20; i++) {
                hist.push({ week: i, price: p });
                p = p * (1 + (Math.random() - 0.5) * c.volatility);
            }
            return { ...c, history: hist };
        });
        setCommodities(initWithHistory);
    }

    useEffect(() => {
        initializeCommodities();
    }, []);

    const handleBankruptcy = () => {
        if (bankBalance >= 5000) {
            const cost = 5000;
            updateBank(-cost);

            setHoldings({});
            setShortPositions({});
            setMines([]);
            setLeasedGold([]);
            setPuts([]);
            setCustomsHold([]);
            setRecyclingQueue([]);

            setWeek(0);
            initializeCommodities();
            setFeedback("CHAPTER 11 BANKRUPTCY DECLARED. Cost: $5,000.");
            playSound('ERROR');
        } else {
            // Broke Logic: Reset to $10,000
            const gap = 10000 - bankBalance;
            updateBank(gap); // Set balance to 10k

            setHoldings({});
            setShortPositions({});
            setMines([]);
            setLeasedGold([]);
            setPuts([]);
            setCustomsHold([]);
            setRecyclingQueue([]);

            setWeek(0);
            initializeCommodities();
            setFeedback("TOTAL INSOLVENCY. Assets seized. Government Seed Grant: $10,000.");
            playSound('ERROR');
        }
    }

    useEffect(() => {
        let total = 0;
        Object.entries(holdings).forEach(([id, qty]) => {
            if (id !== 'CARBON') total += (qty as number);
        });
        setWarehouseUsed(total);
    }, [holdings]);

    const handleBuy = (id: string, qty: number) => {
        const comm = commodities.find(c => c.id === id);
        if (!comm) return;

        let price = comm.price;
        if (tariffsActive) price *= 1.2;

        const cost = price * qty;

        if (Math.random() < 0.1) {
            updateBank(-cost);
            setCustomsHold(prev => [...prev, { id: Date.now().toString(), commodityId: id, qty, releaseWeek: week + 3 }]);
            setFeedback("🛂 CUSTOMS SEIZURE! Goods held for inspection (3 weeks).");
            playSound('ERROR');
            return;
        }

        let cashRequired = cost;
        let lcUsed = false;
        if (useLC && comm.LC) {
            cashRequired = cost * 0.2;
            const lcFee = cost * 0.05;
            updateBank(-lcFee);
            lcUsed = true;
        }

        if (bankBalance >= cashRequired) {
            updateBank(-cashRequired);
            setHoldings(h => ({ ...h, [id]: (h[id] || 0) + qty }));
            addXP(10);
            playSound('COIN');
            if (tariffsActive) setFeedback("Paid 20% Tariff Premium on Import.");
            if (lcUsed) setFeedback("Bought via Letter of Credit (20% Down + 5% Fee).");
        } else {
            setFeedback("Insufficient funds.");
        }
    };

    const handleSell = (id: string, qty: number, isSmuggle: boolean = false) => {
        if (shippingStatus === 'BLOCKED' && !isSmuggle) {
            setFeedback("🚫 Shipping Blocked! Port closed. Cannot sell via legal channels.");
            playSound('ERROR');
            return;
        }

        const comm = commodities.find(c => c.id === id);
        if (!comm) return;
        const currentQty = holdings[id] || 0;
        if (currentQty >= qty) {
            let revenue = comm.price * qty;

            if (isSmuggle) {
                if (Math.random() < 0.1) {
                    setHoldings(h => ({ ...h, [id]: currentQty - qty }));
                    setFeedback("💀 SMUGGLER DEFAULTED! The buyer vanished with your goods. $0 received.");
                    playSound('ERROR');
                    return;
                }
                revenue *= 1.2;
                setFeedback("Sold on Grey Market. +20% Premium.");
            }

            updateBank(revenue);
            setHoldings(h => ({ ...h, [id]: currentQty - qty }));
            playSound('COIN');
        }
    };

    const handleShort = (id: string, qty: number) => {
        const comm = commodities.find(c => c.id === id);
        if (!comm) return;

        const margin = comm.price * qty;
        if (bankBalance < margin) return;

        updateBank(-margin);
        setShortPositions(p => ({ ...p, [id]: (p[id] || 0) + qty }));
        setFeedback(`Short Position Opened: ${qty} units of ${comm.name}. Betting on drop.`);
    };

    const buyPutOption = (id: string) => {
        const comm = commodities.find(c => c.id === id);
        if (!comm) return;

        const premium = comm.price * 0.05 * 10;
        if (bankBalance < premium) return;

        updateBank(-premium);
        setPuts(prev => [...prev, {
            id: Date.now().toString(),
            ticker: id,
            type: 'PUT',
            strikePrice: comm.price,
            premiumPaid: premium,
            quantity: 10,
            purchaseWeek: week
        }]);
        setFeedback(`Bought Puts on ${comm.name}. Hedged against price drop.`);
        playSound('CLICK');
    };

    const refineOil = () => {
        const oil = holdings['OIL'] || 0;
        if (oil < 10) { setFeedback("Need 10 Barrels of Crude to start refining."); return; }
        if (bankBalance < 500) { setFeedback("Refining costs $500 per batch."); return; }

        if (Math.random() < 0.2) {
            setFeedback("📉 ENVIRONMENTAL AUDIT! Factory shut down for inspection. No refining today.");
            playSound('ERROR');
            if (Math.random() < 0.5) {
                updateBank(-1000);
                setFeedback("❌ FAILED AUDIT! Fined $1,000 for emissions.");
            }
            return;
        }

        const carbon = holdings['CARBON'] || 0;
        if (carbon < 1) {
            setFeedback("⚠️ EPA VIOLATION! Refining requires 1 Carbon Credit offset.");
            playSound('ERROR');
            return;
        }

        setHoldings(h => ({
            ...h,
            'OIL': h['OIL'] - 10,
            'CARBON': h['CARBON'] - 1
        }));
        updateBank(-500);

        const revenue = (commodities.find(c => c.id === 'OIL')!.price * 10) + 500 + 200;
        updateBank(revenue);
        setFeedback("Refined 10 Barrels -> Fuel. Net Profit: $200.");
        playSound('SUCCESS');
    };

    const recycleCopper = () => {
        if (bankBalance < 200) return;
        updateBank(-200);
        setRecyclingQueue(q => [...q, { id: Date.now().toString(), commodityId: 'COPPER', qty: 100, completionWeek: week + 2, outputQty: 50 }]);
        setFeedback("Bought Scrap Copper. Processing in 2 weeks.");
    };

    const buyMine = () => {
        if (bankBalance < 10000) { setFeedback("Copper Mine Stake costs $10,000."); return; }
        updateBank(-10000);
        setMines(prev => [...prev, { id: Date.now().toString(), name: "Andes Copper Mine", resource: "COPPER", weeklyOutput: 20, operatingCost: 200 }]);
        setFeedback("Acquired Mine Stake. Weekly output: 20 Copper.");
        playSound('SUCCESS');
    };

    const leaseGold = () => {
        const gold = holdings['GOLD'] || 0;
        if (gold < 10) { setFeedback("Need 10oz Gold to start leasing."); return; }

        setHoldings(h => ({ ...h, 'GOLD': h['GOLD'] - 10 }));
        setLeasedGold(prev => [...prev, { commodityId: 'GOLD', qty: 10, weeklyYield: 50 }]);
        setFeedback("Gold Leased to Bank. Earning Yield.");
        playSound('COIN');
    };

    const buyGovContract = () => {
        const oil = holdings['OIL'] || 0;
        if (oil < 50) { setFeedback("Gov Contract requires 50 Barrels."); return; }

        const revenue = 50 * 70;
        setHoldings(h => ({ ...h, 'OIL': oil - 50 }));
        updateBank(revenue);
        setFeedback("Fulfilled Strategic Reserve Contract.");
        playSound('SUCCESS');
    };

    const advanceWeek = async () => {
        setLoading(true);
        setWeek(w => w + 1);

        if (Math.random() < 0.3) {
            const evt = await generateCommodityEvent();
            setNews(evt);
            setFeedback(`NEWS: ${evt.headline}`);
            playSound('CLICK'); // Alert sound

            if (evt.headline.includes("SPR")) {
                setCommodities(prev => prev.map(c => c.id === 'OIL' ? { ...c, price: c.price * 0.7 } : c));
            }
            if (evt.sector === 'SHIPPING') setShippingStatus('BLOCKED');
            else setShippingStatus('CLEAR');
        } else {
            setNews(null);
        }

        const dxyChange = (Math.random() - 0.5) * 0.5;
        setDxy(d => d + dxyChange);

        const newComms = commodities.map(c => {
            let change = (Math.random() - 0.5 + c.trend) * c.volatility;
            if (dxyChange > 0) change -= 0.01;
            else change += 0.01;

            let newPrice = Math.max(1, c.price * (1 + change));
            let newFutures = newPrice * (c.marketCondition === 'CONTANGO' ? 1.05 : 0.95);

            return { ...c, price: newPrice, futuresPrice: newFutures, history: [...c.history, { week: week + 1, price: newPrice }] };
        });
        setCommodities(newComms);

        let storageBill = 0;
        Object.entries(holdings).forEach(([id, qty]) => {
            const comm = newComms.find(c => c.id === id);
            if (comm) storageBill += (qty as number) * comm.storageCost;
        });
        if (shippingStatus === 'BLOCKED') {
            storageBill *= 2;
            setDemurrageCost(storageBill / 2);
        } else {
            setDemurrageCost(0);
        }

        if (storageBill > 0) {
            updateBank(-storageBill);
        }

        let leaseIncome = 0;
        leasedGold.forEach(l => leaseIncome += l.weeklyYield);
        if (leaseIncome > 0) updateBank(leaseIncome);

        mines.forEach(m => {
            setHoldings(h => ({ ...h, [m.resource]: (h[m.resource] || 0) + m.weeklyOutput }));
            updateBank(-m.operatingCost);
        });

        const completedRecycling = recyclingQueue.filter(r => r.completionWeek === week + 1);
        completedRecycling.forEach(r => {
            setHoldings(h => ({ ...h, [r.commodityId]: (h[r.commodityId] || 0) + r.outputQty }));
            setFeedback("Recycling Batch Complete!");
        });
        setRecyclingQueue(prev => prev.filter(r => r.completionWeek > week + 1));

        const releasedCustoms = customsHold.filter(c => c.releaseWeek === week + 1);
        releasedCustoms.forEach(c => {
            setHoldings(h => ({ ...h, [c.commodityId]: (h[c.commodityId] || 0) + c.qty }));
            setFeedback("Customs Released Goods.");
        });
        setCustomsHold(prev => prev.filter(c => c.releaseWeek > week + 1));

        if (Math.random() < 0.05) {
            const oil = holdings['OIL'] || 0;
            if (oil > 0) {
                setHoldings(h => ({ ...h, 'OIL': Math.floor(oil * 0.95) }));
                setFeedback("Inventory Spoilage/Leakage: Lost 5% of Oil.");
            }
        }

        playSound('CLICK');
        setLoading(false);
    };

    const handleAppraise = async () => {
        setLoadingAppraisal(true);
        const result = await appraiseGemstone(currentGem);
        setAppraisal(result);
        setLoadingAppraisal(false);
        playSound('SUCCESS');
    };

    const buyGem = () => {
        if (!appraisal) return;
        if (bankBalance < appraisal.askingPrice) { setFeedback("Too expensive."); return; }

        updateBank(-appraisal.askingPrice);
        unlockItem({
            id: appraisal.id,
            name: appraisal.name,
            description: appraisal.description,
            icon: 'Diamond',
            rarity: appraisal.trueValue > 1000 ? 'LEGENDARY' : 'COMMON',
            value: appraisal.trueValue
        });
        setFeedback("Gemstone Purchased. Added to Inventory.");
        setAppraisal(null);
        const types = ["Ruby", "Sapphire", "Emerald", "Diamond"];
        setCurrentGem(`Uncut ${types[Math.floor(Math.random() * types.length)]}`);
    };

    const sellGemAtAuction = (item: InventoryItem) => {
        const isFake = item.name.toLowerCase().includes("synthetic") || item.description.toLowerCase().includes("fake");
        if (isFake || Math.random() < 0.1) {
            setFeedback("AUCTION HOUSE REJECTED IT! 'It's a fake!' Item confiscated.");
            playSound('ERROR');
            removeItem(item.id);
        } else {
            const salePrice = (item.value || 100) * 1.2;
            updateBank(salePrice);
            setFeedback(`Sold ${item.name} at Auction for $${salePrice.toLocaleString()}`);
            playSound('COIN');
            removeItem(item.id);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 relative">
            <MissionBrief
                title="The Supply Chain"
                rpgAnalogy="Commodities are 'Raw Materials'. Futures are 'Pre-Orders'. Contango is when storage costs make future loot more expensive. Arbitrage is buying low in one server and selling high in another."
                realWorldLesson="Physical assets have friction (Storage, Shipping, Tariffs). Paper assets (Futures) have expiry dates. The Dollar (DXY) is the ruler of all commodity prices."
                missionGoal={`Amass $${VICTORY_CASH.toLocaleString()} cash through trading.`}
                conceptTerm="Contango"
                mentorPersona={mentorPersona}
            />

            {/* BREAKING NEWS MODAL */}
            {news && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
                    <div className={`w-full max-w-lg rounded-xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col max-h-[90vh] ${news.impact === 'BULLISH' ? 'border-emerald-500 bg-emerald-950' : news.impact === 'BEARISH' ? 'border-red-500 bg-red-950' : 'border-slate-500 bg-slate-950'}`}>
                        <div className="p-6 text-center relative z-10 flex-1 overflow-y-auto">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 rounded-full bg-black/30 border-2 border-white/20 animate-pulse">
                                    <Globe size={48} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2 leading-none">Breaking News</h2>
                            <div className="w-16 h-1 bg-white/50 mx-auto mb-4"></div>

                            <h3 className="text-xl font-bold text-white mb-2">{news.headline}</h3>
                            <p className="text-sm text-white/80 italic mb-6">"{news.lore}"</p>

                            <div className="bg-black/30 p-3 rounded-lg border border-white/10 mb-6">
                                <div className="flex justify-between text-xs font-bold uppercase text-white/60">
                                    <span>Sector</span>
                                    <span>Impact</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-white">
                                    <span>{news.sector}</span>
                                    <span className={news.impact === 'BULLISH' ? 'text-emerald-400' : 'text-red-400'}>{news.impact}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setNews(null)}
                                className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded hover:bg-slate-200 transition-colors"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOP HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
                    <Wallet size={24} className="text-emerald-400" />
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Cash</p>
                        <p className="text-xl font-mono font-bold text-white">${bankBalance.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
                    <Container size={24} className={warehouseUsed > WAREHOUSE_CAP ? 'text-red-500' : 'text-blue-400'} />
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Warehouse</p>
                        <p className={`text-sm font-bold ${warehouseUsed > WAREHOUSE_CAP ? 'text-red-400' : 'text-white'}`}>{warehouseUsed} / {WAREHOUSE_CAP} units</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
                    <DollarSign size={24} className="text-green-400" />
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">DXY Index</p>
                        <p className="text-sm font-mono font-bold text-white">{dxy.toFixed(2)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ActionTooltip title="Declare Bankruptcy" desc="Reset Level 6. Cost: $5,000 legal fees. Wipes inventory. If broke, resets to $10k grant.">
                        <button onClick={handleBankruptcy} className="text-[10px] bg-red-900/20 text-red-400 px-3 py-2 rounded border border-red-800 hover:bg-red-900/40 flex items-center gap-1">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </ActionTooltip>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['THE_PIT', 'LOGISTICS', 'INDUSTRIAL', 'MACRO'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {tab === 'THE_PIT' && <TrendingUp size={14} />}
                        {tab === 'LOGISTICS' && <Ship size={14} />}
                        {tab === 'INDUSTRIAL' && <Factory size={14} />}
                        {tab === 'MACRO' && <Radio size={14} />}
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">

                {/* LEFT: ASSET LIST */}
                <div className="lg:col-span-2 space-y-4">
                    {activeTab === 'THE_PIT' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-800 p-3 rounded text-xs">
                                <label className="flex items-center gap-2 text-white">
                                    <input type="checkbox" checked={useLC} onChange={() => setUseLC(!useLC)} className="accent-emerald-500" />
                                    Use Letter of Credit (LC) - 5x Leverage
                                </label>
                                <span className="text-slate-500">Fee: 5% | Down: 20%</span>
                            </div>

                            {commodities.map(c => (
                                <div key={c.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-3 w-full md:w-1/3">
                                        <div className="p-2 bg-slate-800 rounded text-slate-400">
                                            {c.id === 'GOLD' ? <Diamond size={18} /> : c.id === 'OIL' ? <Droplets size={18} /> : c.id === 'COPPER' ? <Hammer size={18} /> : c.id === 'LITHIUM' ? <Zap size={18} /> : <Leaf size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{c.name}</h3>
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                {c.marketCondition}
                                                <SmartTooltip term={c.marketCondition} definition={c.marketCondition === 'CONTANGO' ? "Future Price > Spot. Storage is expensive." : "Spot > Future. Immediate shortage."}><HelpCircle size={10} /></SmartTooltip>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="h-12">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={c.history}>
                                                    <Area type="monotone" dataKey="price" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="text-right w-full md:w-1/3 flex flex-col gap-2">
                                        <div className="text-xl font-mono font-bold text-white">${c.price.toFixed(2)}</div>
                                        <div className="flex gap-1 justify-end">
                                            <div className="text-[10px] text-slate-400">Hold: <span className="text-emerald-400 font-bold">{holdings[c.id] || 0}</span></div>
                                            {shortPositions[c.id] && <div className="text-[10px] text-red-400">Short: {shortPositions[c.id]}</div>}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleBuy(c.id, 10)} className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded text-[10px] font-bold hover:bg-emerald-900/50 flex-1">Buy 10</button>
                                            <button onClick={() => handleSell(c.id, 10)} className="bg-blue-900/30 text-blue-400 border border-blue-500/50 px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-900/50 flex-1">Sell 10</button>
                                            <ActionTooltip title="Short" desc="Bet price drops. Risky.">
                                                <button onClick={() => handleShort(c.id, 10)} className="bg-red-900/30 text-red-400 border border-red-500/50 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-900/50">S</button>
                                            </ActionTooltip>
                                            <ActionTooltip title="Put Option" desc="Insurance against price drop.">
                                                <button onClick={() => buyPutOption(c.id)} className="bg-purple-900/30 text-purple-400 border border-purple-500/50 px-2 py-1 rounded text-[10px] font-bold hover:bg-purple-900/50">P</button>
                                            </ActionTooltip>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ... (Keep Logistics, Industrial, Macro tabs unchanged) ... */}
                    {activeTab === 'LOGISTICS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Anchor size={16} /> Shipping Status</h3>
                                <div className={`p-3 rounded border text-center mb-4 ${shippingStatus === 'BLOCKED' ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-emerald-900/20 border-emerald-500 text-emerald-400'}`}>
                                    {shippingStatus === 'BLOCKED' ? 'PORT BLOCKED (Ever Given Event)' : 'Clear Sailing'}
                                </div>
                                {demurrageCost > 0 && (
                                    <div className="text-xs text-red-400 text-center font-bold">Paying ${demurrageCost.toFixed(0)}/week Demurrage Fees!</div>
                                )}
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-xs text-slate-500 font-bold uppercase">Customs Hold</h4>
                                    {customsHold.length === 0 ? <p className="text-xs text-slate-600">No seizures.</p> : (
                                        customsHold.map(c => (
                                            <div key={c.id} className="bg-slate-950 p-2 rounded text-xs flex justify-between text-red-400">
                                                <span>{c.qty} {c.commodityId}</span>
                                                <span>Releases Wk {c.releaseWeek}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock size={16} /> Vault Services</h3>
                                <ActionTooltip title="Lease Gold" desc="Lend your physical gold to the bank for interest. You lose access to sell it, but earn yield.">
                                    <button onClick={leaseGold} className="w-full py-3 bg-yellow-900/20 border border-yellow-600 text-yellow-500 rounded font-bold text-xs mb-2">
                                        Lease 10oz Gold (Yield)
                                    </button>
                                </ActionTooltip>
                                <div className="space-y-1 mt-2">
                                    {leasedGold.map((l, i) => (
                                        <div key={i} className="text-[10px] text-slate-400 flex justify-between bg-slate-950 p-1 rounded">
                                            <span>{l.qty}oz Gold</span>
                                            <span className="text-emerald-400">+${l.weeklyYield}/wk</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'INDUSTRIAL' && (
                        <div className="space-y-4">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Flame size={16} /> Refinery</h3>
                                    <p className="text-xs text-slate-400">Convert 10 Oil {'->'} Fuel + Profit</p>
                                </div>
                                <ActionTooltip title="Refine" desc="Process Crude Oil into Value-Added Fuel. Requires Carbon Credits. Risk of Environmental Audit.">
                                    <button onClick={refineOil} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold text-xs">
                                        Start Batch ($500)
                                    </button>
                                </ActionTooltip>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><RefreshCw size={16} /> Recycling Plant</h3>
                                    <p className="text-xs text-slate-400">Buy Scrap Copper {'->'} Process {'->'} Pure Copper</p>
                                </div>
                                <button onClick={recycleCopper} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs">
                                    Buy Scrap ($200)
                                </button>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Pickaxe size={16} /> Upstream Mining</h3>
                                    <button onClick={buyMine} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white border border-slate-600">Buy Stake ($10k)</button>
                                </div>
                                <div className="space-y-2">
                                    {mines.map(m => (
                                        <div key={m.id} className="bg-slate-950 p-2 rounded flex justify-between items-center text-xs">
                                            <span className="text-slate-300">{m.name}</span>
                                            <span className="text-emerald-400">+{m.weeklyOutput} {m.resource}/wk</span>
                                        </div>
                                    ))}
                                    {mines.length === 0 && <p className="text-xs text-slate-600">No active mine stakes.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'MACRO' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-white mb-2">Government Contracts</h3>
                                <p className="text-xs text-slate-400 mb-4">Strategic Reserve Fill Order</p>
                                <button onClick={buyGovContract} className="w-full py-2 bg-blue-600 text-white rounded font-bold text-xs">
                                    Sell 50 Oil @ $70 Fixed
                                </button>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-white mb-2">Smuggler's Cove</h3>
                                <p className="text-xs text-slate-400 mb-4">High Risk, High Reward. No Questions.</p>
                                <button onClick={() => handleSell('GOLD', 10, true)} className="w-full py-2 bg-red-900/30 border border-red-600 text-red-400 rounded font-bold text-xs hover:bg-red-900/50">
                                    Sell 10 Gold (Black Market)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: SIDEBAR (GEM LAB & FEEDBACK) */}
                <div className="space-y-4">
                    {/* Gem Lab */}
                    <div className="bg-slate-900 border border-purple-500/30 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Diamond className="text-purple-400" />
                            <h3 className="font-bold text-white">Gemstone Lab</h3>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-lg text-center mb-4">
                            <div className="text-4xl mb-2">💎</div>
                            <p className="text-sm font-bold text-white">{currentGem}</p>
                            <p className="text-xs text-slate-500">Unappraised</p>
                        </div>

                        {!appraisal ? (
                            <button
                                onClick={handleAppraise}
                                disabled={loadingAppraisal}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                            >
                                {loadingAppraisal ? <RefreshCw className="animate-spin" /> : <Search size={14} />} Appraise
                            </button>
                        ) : (
                            <div className="space-y-2 animate-in zoom-in">
                                <div className="text-xs bg-slate-800 p-2 rounded border border-slate-700">
                                    <p className="text-slate-400">{appraisal.description}</p>
                                    <div className="mt-2 flex justify-between font-bold">
                                        <span className="text-slate-300">Est Value:</span>
                                        <span className="text-emerald-400">${appraisal.trueValue}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span className="text-slate-300">Ask Price:</span>
                                        <span className="text-red-400">${appraisal.askingPrice}</span>
                                    </div>
                                </div>
                                <button onClick={buyGem} className="w-full bg-emerald-600 text-white font-bold py-2 rounded text-xs">Buy Gem</button>
                                <button onClick={() => setAppraisal(null)} className="w-full bg-slate-700 text-white font-bold py-2 rounded text-xs">Reject</button>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">My Collection</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {myGems.map(gem => (
                                    <div key={gem.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                                        <span className="text-[10px] text-slate-300 truncate w-20">{gem.name}</span>
                                        <ActionTooltip title="Auction" desc="Sell to highest bidder. Risk of being identified as Fake.">
                                            <button onClick={() => sellGemAtAuction(gem)} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-yellow-500 border border-yellow-500/30 hover:bg-yellow-900/20">
                                                Auction
                                            </button>
                                        </ActionTooltip>
                                    </div>
                                ))}
                                {myGems.length === 0 && <p className="text-[10px] text-slate-600 text-center">No gems collected.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Feedback Toast */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-h-[100px] flex items-center justify-center text-center">
                        <p className="text-xs text-slate-300">{feedback || "Market is Open. Waiting for orders."}</p>
                    </div>

                    <button
                        onClick={advanceWeek}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                        Next Week
                    </button>
                </div>

            </div>

            {/* VICTORY BANNER (PERSISTENT EXIT) */}
            {bankBalance >= VICTORY_CASH && stayInLevel && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={() => {
                            unlockItem({ id: 'shipping_magnate', name: 'Shipping Magnate Badge', description: 'Master of Logistics', icon: 'Anchor', rarity: 'LEGENDARY' });
                            onComplete();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 animate-bounce border-2 border-emerald-400"
                    >
                        Complete Level <CheckCircle size={20} />
                    </button>
                </div>
            )}

            {/* VICTORY BANNER (BLOCKING) */}
            {bankBalance >= VICTORY_CASH && !stayInLevel && (
                <div className="fixed bottom-0 left-0 right-0 bg-emerald-900/95 border-t-4 border-emerald-500 p-6 z-50 flex items-center justify-center animate-in slide-in-from-bottom">
                    <div className="max-w-4xl flex items-center gap-8">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                <Trophy className="text-yellow-400" size={32} /> Supply Chain Domination
                            </h2>
                            <p className="text-emerald-200">You have amassed ${bankBalance.toLocaleString()} in liquid capital. The trade routes are yours.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    unlockItem({ id: 'shipping_magnate', name: 'Shipping Magnate Badge', description: 'Master of Logistics', icon: 'Anchor', rarity: 'LEGENDARY' });
                                    onComplete();
                                }}
                                className="bg-white text-emerald-900 font-bold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                Liquidate & Ascend <CheckCircle size={24} />
                            </button>
                            <button
                                onClick={() => setStayInLevel(true)}
                                className="bg-transparent border-2 border-emerald-400 text-emerald-200 font-bold py-4 px-8 rounded-full hover:bg-emerald-800 transition-colors flex items-center gap-2"
                            >
                                Stay & Trade (Sandbox) <Unlock size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};