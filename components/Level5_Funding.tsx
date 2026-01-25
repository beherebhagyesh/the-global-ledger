
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { generateInvestors, generateTermSheet, getMentorFeedback } from '../services/geminiService';
import { TermSheetClause, CapTableEntity, MentorPersona, Loan, InvestorProfile, FundingRound, PitchCard, ExitScenario, CoFounder, CoFounderCandidate, RoadshowCity } from '../types';
import { MissionBrief } from './MissionBrief';
import { SmartTooltip } from './SmartTooltip';
import { Users, Building2, AlertTriangle, CheckCircle, XCircle, CreditCard, DollarSign, Briefcase, ChevronRight, TrendingUp, Handshake, Layers, Zap, Clock, Skull, Gavel, PieChart as PieIcon, Download, FileText, UserMinus, RotateCcw, Info, X, MapPin, Plane } from 'lucide-react';
import { playSound } from '../utils/sound';

interface Level5Props {
  onComplete: () => void;
  addXP: (amount: number) => void;
  mentorPersona: MentorPersona;
  creditScore: number;
  updateBank: (amount: number) => void;
  onTakeLoan: (loan: Loan) => void;
  bankBalance: number;
}

const PITCH_DECK_CARDS: PitchCard[] = [
    { id: 'TEAM_A', type: 'TEAM', label: 'Ex-Google Founders', scoreEffect: 1.5, desc: 'High pedigree. Investors love this.' },
    { id: 'TEAM_B', type: 'TEAM', label: 'Solo Dev', scoreEffect: 0.8, desc: 'Risky. "Single Point of Failure".' },
    { id: 'MKT_A', type: 'MARKET', label: '$10B TAM (AI)', scoreEffect: 1.4, desc: 'Massive market. High growth potential.' },
    { id: 'MKT_B', type: 'MARKET', label: 'Niche Hobby', scoreEffect: 0.7, desc: 'Lifestyle business. Not VC material.' },
    { id: 'PROD_A', type: 'PRODUCT', label: 'Live MVP w/ Users', scoreEffect: 1.3, desc: 'Execution proven. De-risked.' },
    { id: 'PROD_B', type: 'PRODUCT', label: 'Idea on Napkin', scoreEffect: 0.5, desc: 'Vaporware. Hard to value.' }
];

const INITIAL_CITIES: RoadshowCity[] = [
    { id: 'NY', name: 'New York', sentiment: 80, cost: 5000, visited: false, sectorPreference: 'FINTECH' },
    { id: 'SF', name: 'San Francisco', sentiment: 90, cost: 3000, visited: false, sectorPreference: 'TECH' },
    { id: 'LON', name: 'London', sentiment: 70, cost: 6000, visited: false, sectorPreference: 'FINTECH' },
    { id: 'HK', name: 'Hong Kong', sentiment: 75, cost: 8000, visited: false, sectorPreference: 'CONSUMER' },
    { id: 'DXB', name: 'Dubai', sentiment: 85, cost: 7000, visited: false, sectorPreference: 'CONSUMER' }
];

// Helper for Action Buttons
const ActionTooltip: React.FC<{ children?: React.ReactNode; title: string; desc: string }> = ({ children, title, desc }) => (
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

export const Level5_Funding: React.FC<Level5Props> = ({ 
    onComplete, addXP, mentorPersona, creditScore, updateBank, onTakeLoan, bankBalance
}) => {
  const [currentStage, setCurrentStage] = useState<'CO_FOUNDER_HUNT' | 'PITCH_DECK' | 'SEED_NEGOTIATION' | 'SERIES_A_NEGOTIATION' | 'IPO_ROADSHOW'>('CO_FOUNDER_HUNT');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // --- CAP TABLE STATE ---
  const [capTable, setCapTable] = useState<CapTableEntity[]>([
      { name: "Founders (You)", shares: 1000000, percent: 100, color: '#10b981' }
  ]);
  
  // --- CO-FOUNDER STATE ---
  const [candidates, setCandidates] = useState<CoFounderCandidate[]>([
      { id: '1', name: 'Woz', role: 'CTO', skill: 95, equityAsk: 40, salaryAsk: 2000, trait: 'GENIUS', desc: "Technical Wizard. Zero social skills." },
      { id: '2', name: 'Zuck', role: 'CTO', skill: 90, equityAsk: 50, salaryAsk: 0, trait: 'TOXIC', desc: "Brilliant but might steal your company." },
      { id: '3', name: 'Gary', role: 'CMO', skill: 80, equityAsk: 20, salaryAsk: 5000, trait: 'CONNECTOR', desc: "Knows everyone. Expensive taste." },
      { id: '4', name: 'Dave', role: 'CFO', skill: 60, equityAsk: 10, salaryAsk: 4000, trait: 'LAZY', desc: "Average skills. Low equity ask." }
  ]);
  const [coFounder, setCoFounder] = useState<CoFounder | null>(null);
  const [coFounderLeft, setCoFounderLeft] = useState(false);

  // --- PITCH DECK STATE ---
  const [selectedCards, setSelectedCards] = useState<PitchCard[]>([]);
  const [preMoneyValuation, setPreMoneyValuation] = useState(0);

  // --- SEED ROUND STATE ---
  const [seedInstrument, setSeedInstrument] = useState<'SAFE' | 'EQUITY'>('SAFE');
  const [seedInvestor, setSeedInvestor] = useState<InvestorProfile | null>(null);
  
  // --- SERIES A STATE ---
  const [esopPool, setEsopPool] = useState(10); // % Option Pool
  const [boardSeatsGiven, setBoardSeatsGiven] = useState(1);
  const [runwayCash, setRunwayCash] = useState(bankBalance); // Simulation Cash
  const [dueDiligenceIssues, setDueDiligenceIssues] = useState<string[]>([]);
  const [ventureDebtTaken, setVentureDebtTaken] = useState(false);
  
  // --- IPO STATE ---
  const [cities, setCities] = useState<RoadshowCity[]>(INITIAL_CITIES);
  const [orderBook, setOrderBook] = useState(0); // $ Amount committed
  const [roadshowWeeks, setRoadshowWeeks] = useState(3);
  const [ipoValuation, setIpoValuation] = useState(50000000); // $50M Start

  // RUNWAY TIMER (Burn Rate Pressure)
  useEffect(() => {
      if (currentStage === 'SERIES_A_NEGOTIATION') {
          const interval = setInterval(() => {
              setRunwayCash(prev => {
                  if (prev <= 0) {
                      clearInterval(interval);
                      setFeedback("🚨 BANKRUPT! You ran out of cash negotiation. Forced to accept bad terms.");
                      playSound('ERROR');
                      return 0;
                  }
                  return prev - 50; // Burn $50/tick
              });
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [currentStage]);

  const handleRestructure = () => {
      if (bankBalance >= 2000) {
          updateBank(-2000);
          setCurrentStage('CO_FOUNDER_HUNT');
          setCapTable([{ name: "Founders (You)", shares: 1000000, percent: 100, color: '#10b981' }]);
          setSelectedCards([]);
          setPreMoneyValuation(0);
          setSeedInvestor(null);
          setCoFounder(null);
          setEsopPool(10);
          setBoardSeatsGiven(1);
          setVentureDebtTaken(false);
          setOrderBook(0);
          setRoadshowWeeks(3);
          setCities(INITIAL_CITIES);
          
          setFeedback("Corp Restructure complete. Cap Table reset. Cost: $2,000 legal fees.");
          playSound('CLICK');
      } else {
          setFeedback("Need $2,000 for legal fees to restructure.");
          playSound('ERROR');
      }
  };

  // --- PHASE 0: CO-FOUNDER HUNT ---
  const hireCoFounder = (candidate: CoFounderCandidate) => {
      setCoFounder({
          name: candidate.name,
          role: candidate.role,
          equity: candidate.equityAsk,
          relationship: 100,
          hasVesting: true, // Default to true for now, can change in Series A
          isActive: true
      });
      // Adjust Cap Table
      const founderShares = 1000000 * ((100 - candidate.equityAsk) / 100);
      const coFounderShares = 1000000 * (candidate.equityAsk / 100);
      setCapTable([
          { name: "You", shares: founderShares, percent: 100 - candidate.equityAsk, color: '#10b981' },
          { name: candidate.name, shares: coFounderShares, percent: candidate.equityAsk, color: '#f59e0b' }
      ]);
      
      setFeedback(`Hired ${candidate.name}! Proceed to Pitch Deck.`);
      playSound('SUCCESS');
      setCurrentStage('PITCH_DECK');
  };

  const passCandidate = () => {
      setCandidates(prev => {
          const next = prev.slice(1);
          if (next.length === 0) {
              setFeedback("Ran out of candidates. You are a Solo Founder.");
              setCurrentStage('PITCH_DECK');
              return [];
          }
          return next;
      });
      playSound('CLICK');
  };

  // --- PHASE 1: PITCH DECK BUILDER ---
  const toggleCard = (card: PitchCard) => {
      setSelectedCards(prev => {
          const exists = prev.find(c => c.id === card.id);
          if (exists) return prev.filter(c => c.id !== card.id);
          const filtered = prev.filter(c => c.type !== card.type);
          return [...filtered, card];
      });
  };

  const submitPitch = async () => {
      if (selectedCards.length < 3) {
          setFeedback("Incomplete Deck! Need Team, Market, and Product slides.");
          return;
      }
      setLoading(true);
      // Calculate Valuation Score
      let multiplier = 1;
      selectedCards.forEach(c => multiplier *= c.scoreEffect);
      
      if (coFounder) {
          // Buff from Co-Founder
          multiplier *= 1.2; 
      } else {
          // Penalty for Solo
          multiplier *= 0.8;
      }

      const baseVal = 2000000; // $2M Base
      const finalVal = Math.round(baseVal * multiplier);
      
      setPreMoneyValuation(finalVal);
      
      const investors = await generateInvestors(); 
      const matchedInvestor = investors[0]; 
      matchedInvestor.offerValuation = finalVal;
      matchedInvestor.offerAmount = Math.round(finalVal * 0.15); 
      
      setSeedInvestor(matchedInvestor);
      setCurrentStage('SEED_NEGOTIATION');
      setLoading(false);
      setFeedback(prev => (prev ? prev + " " : "") + `Pitch Successful! Valuation set at $${(finalVal/1000000).toFixed(1)}M.`);
      addXP(500);
      playSound('SUCCESS');
  };

  // --- PHASE 2: SEED ROUND ---
  const closeSeed = () => {
      if (!seedInvestor) return;
      
      const investAmount = seedInvestor.offerAmount;
      const postMoney = preMoneyValuation + investAmount;
      const investorShares = (investAmount / postMoney) * 1000000; 
      
      // Re-normalize shares
      const totalOldShares = capTable.reduce((acc, e) => acc + e.shares, 0);
      const newTotal = totalOldShares + investorShares;
      
      const newCapTable = capTable.map(e => ({
          ...e,
          percent: parseFloat(((e.shares / newTotal) * 100).toFixed(1))
      }));
      
      newCapTable.push({ name: "Seed Investor", shares: investorShares, percent: parseFloat(((investorShares / newTotal) * 100).toFixed(1)), color: '#3b82f6' });
      
      setCapTable(newCapTable);
      updateBank(investAmount);
      setCurrentStage('SERIES_A_NEGOTIATION');
      playSound('COIN');
  };

  // --- PHASE 3: SERIES A ---
  const triggerDueDiligence = () => {
      if (Math.random() > 0.5) {
          setDueDiligenceIssues(["Unsigned IP Assignment from Intern", "GDPR Violation Risk"]);
          setFeedback("⚠️ DUE DILIGENCE ALERT! Investors found issues. Fix them or valuation drops.");
          playSound('ERROR');
      } else {
          closeSeriesA();
      }
  };

  const solveDueDiligence = (issueIndex: number) => {
      if (bankBalance < 1000) {
          setFeedback("Not enough cash ($1,000) to fix due diligence issues! Try ignoring them (Risky).");
          playSound('ERROR');
          return;
      }
      updateBank(-1000);
      setDueDiligenceIssues(prev => prev.filter((_, i) => i !== issueIndex));
      setFeedback("Skeleton buried. Cost: $1,000.");
      playSound('CLICK');
  };

  const closeSeriesA = () => {
      const seriesAInvest = 5000000; // $5M raise
      const seriesAVal = 20000000; // $20M Pre
      
      const currentTotal = capTable.reduce((acc, e) => acc + e.shares, 0);
      const poolShares = (currentTotal * esopPool) / (100 - esopPool);
      
      const postMoney = seriesAVal + seriesAInvest;
      const investorShares = (seriesAInvest / postMoney) * (currentTotal + poolShares);
      
      const finalTotal = currentTotal + poolShares + investorShares;
      
      const newCapTable = capTable.map(e => ({
          ...e,
          percent: parseFloat(((e.shares / finalTotal) * 100).toFixed(1))
      }));
      
      newCapTable.push({ name: "ESOP Pool", shares: poolShares, percent: parseFloat(((poolShares / finalTotal) * 100).toFixed(1)), color: '#f59e0b' });
      newCapTable.push({ name: "Series A VC", shares: investorShares, percent: parseFloat(((investorShares / finalTotal) * 100).toFixed(1)), color: '#8b5cf6' });
      
      if (ventureDebtTaken) updateBank(500000);

      setCapTable(newCapTable);
      updateBank(seriesAInvest);
      setCurrentStage('IPO_ROADSHOW'); // Move to Roadshow
      setIpoValuation(postMoney * 2); // Start IPO val at 2x Series A post
      playSound('VICTORY');
  };

  // --- PHASE 4: IPO ROADSHOW ---
  const visitCity = (cityId: string) => {
      if (roadshowWeeks <= 0) { setFeedback("Roadshow Over! Ring the Bell."); return; }
      
      const city = cities.find(c => c.id === cityId);
      if (!city || city.visited) return;
      if (bankBalance < city.cost) { setFeedback("Cannot afford travel!"); return; }
      
      updateBank(-city.cost);
      setRoadshowWeeks(w => w - 1);
      
      // Calculate Demand
      let demand = 5000000; // Base $5M
      if (selectedCards.some(c => c.label.includes("AI"))) demand *= 1.5; // Tech hype
      demand *= (city.sentiment / 100);
      
      setOrderBook(prev => prev + demand);
      setCities(prev => prev.map(c => c.id === cityId ? {...c, visited: true} : c));
      setFeedback(`Pitched in ${city.name}. Order Book +$${(demand/1000000).toFixed(1)}M`);
      playSound('SUCCESS');
  };

  const ringTheBell = () => {
      const oversubscribed = orderBook / (ipoValuation * 0.2); // Selling 20% float
      let finalExitVal = ipoValuation;
      
      if (oversubscribed > 2) {
          finalExitVal *= 1.5; // IPO Pop
          setFeedback("🚀 IPO POP! Stock up 50% on Day 1!");
      } else if (oversubscribed < 0.5) {
          finalExitVal *= 0.5; // Flop
          setFeedback("📉 IPO FLOP! Underpriced.");
      }
      
      // Calculate Payout
      const mySharesPct = capTable.find(e => e.name === "You")?.percent || 0;
      const payout = finalExitVal * (mySharesPct / 100);
      
      updateBank(Math.round(payout));
      onComplete();
  };

  // --- RENDER ---

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 relative">
        <MissionBrief 
            title="The Fundraising Round (Master Class)"
            rpgAnalogy="Valuation is your 'Power Level'. Dilution is 'Health Loss'. Board Seats are 'Controller Ports'."
            realWorldLesson="The 'Pre-Money Shuffle' (ESOP) is the biggest hidden tax on founders. An IPO Roadshow is a global sales campaign to build the 'Order Book'."
            missionGoal="Navigate Seed -> Series A -> IPO and maximize your Net Worth."
            conceptTerm="ESOP"
            mentorPersona={mentorPersona}
        />

        {/* --- PHASE 0: CO-FOUNDER HUNT --- */}
        {currentStage === 'CO_FOUNDER_HUNT' && (
            <div className="max-w-md mx-auto text-center">
                <h2 className="text-2xl font-black text-white mb-6">Find a Co-Founder</h2>
                {candidates.length > 0 ? (
                    <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 relative shadow-2xl transform hover:scale-[1.02] transition-transform">
                        <div className="w-20 h-20 bg-indigo-900/50 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                            {candidates[0].trait === 'GENIUS' ? '🧙‍♂️' : candidates[0].trait === 'TOXIC' ? '🧛' : '🤵'}
                        </div>
                        <h3 className="text-xl font-bold text-white">{candidates[0].name}</h3>
                        <p className="text-emerald-400 font-bold mb-4">{candidates[0].role}</p>
                        
                        <div className="space-y-2 text-sm text-slate-300 mb-6 bg-slate-950 p-4 rounded-xl">
                            <div className="flex justify-between"><span>Skill</span> <span className="text-white font-bold">{candidates[0].skill}/100</span></div>
                            <div className="flex justify-between"><span>Ask</span> <span className="text-white font-bold">{candidates[0].equityAsk}% Equity</span></div>
                            <div className="flex justify-between"><span>Salary</span> <span className="text-white font-bold">${candidates[0].salaryAsk}/mo</span></div>
                            <div className="pt-2 text-xs italic text-slate-500 border-t border-slate-800 mt-2">"{candidates[0].desc}"</div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={passCandidate} className="flex-1 py-3 border border-slate-600 rounded-xl text-slate-400 font-bold hover:bg-slate-800">Pass</button>
                            <button onClick={() => hireCoFounder(candidates[0])} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg">Hire</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setCurrentStage('PITCH_DECK')} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Continue Solo</button>
                )}
            </div>
        )}

        {/* --- PHASE 1-3: PITCH & FUNDING (Existing Logic Condensed) --- */}
        {(currentStage === 'PITCH_DECK' || currentStage === 'SEED_NEGOTIATION' || currentStage === 'SERIES_A_NEGOTIATION') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    {/* Visualizer */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center mb-6">
                        <h3 className="text-slate-400 font-bold uppercase text-xs mb-4">Cap Table</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={capTable} innerRadius={40} outerRadius={60} dataKey="shares">
                                        {capTable.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Legend verticalAlign="bottom"/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Logic UI */}
                    {currentStage === 'PITCH_DECK' && (
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-white font-bold mb-4">Select 3 Slides</h3>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {PITCH_DECK_CARDS.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => toggleCard(c)}
                                        className={`p-2 text-xs rounded border ${selectedCards.find(sc => sc.id === c.id) ? 'bg-emerald-900/30 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={submitPitch} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Launch Pitch</button>
                        </div>
                    )}

                    {currentStage === 'SEED_NEGOTIATION' && seedInvestor && (
                        <div className="bg-slate-900 p-6 rounded-xl border border-blue-500">
                            <h3 className="text-white font-bold mb-2">Seed Offer</h3>
                            <p className="text-emerald-400 text-2xl font-mono mb-4">${(seedInvestor.offerValuation/1000000).toFixed(1)}M Val</p>
                            <button onClick={closeSeed} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg">Accept & Close</button>
                        </div>
                    )}

                    {currentStage === 'SERIES_A_NEGOTIATION' && (
                        <div className="bg-slate-900 p-6 rounded-xl border border-purple-500">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-white font-bold">Series A Term Sheet</h3>
                                <span className="text-red-400 font-mono">${runwayCash} Runway</span>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs text-slate-500">ESOP Pool ({esopPool}%)</label>
                                    <input type="range" min="10" max="20" value={esopPool} onChange={(e) => setEsopPool(Number(e.target.value))} className="w-full accent-purple-500"/>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={ventureDebtTaken} onChange={() => setVentureDebtTaken(!ventureDebtTaken)} className="accent-purple-500"/>
                                    <span className="text-sm text-slate-300">Venture Debt (+$500k)</span>
                                </div>
                            </div>

                            <button onClick={triggerDueDiligence} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg">Sign Term Sheet</button>
                            
                            {dueDiligenceIssues.length > 0 && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded text-xs text-red-300">
                                    <p className="font-bold mb-2">⚠️ Due Diligence Issues:</p>
                                    {dueDiligenceIssues.map((iss, i) => (
                                        <div key={i} className="flex justify-between items-center mb-1">
                                            <span>{iss}</span>
                                            <button onClick={() => solveDueDiligence(i)} className="text-white underline">Fix ($1k)</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- PHASE 4: IPO ROADSHOW (ENDGAME) --- */}
        {currentStage === 'IPO_ROADSHOW' && (
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">IPO Roadshow</h2>
                    <p className="text-slate-400">Travel the world. Build the book. Ring the bell.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* STATS */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 uppercase font-bold">Weeks Remaining</p>
                            <div className="flex gap-1 mt-1">
                                {[1,2,3].map(w => (
                                    <div key={w} className={`h-2 flex-1 rounded ${w <= roadshowWeeks ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 uppercase font-bold">Order Book</p>
                            <p className="text-3xl font-mono font-black text-white">${(orderBook/1000000).toFixed(1)}M</p>
                            <p className="text-xs text-emerald-400">Target: $10.0M</p>
                        </div>
                        <button 
                            onClick={ringTheBell}
                            disabled={roadshowWeeks > 0}
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Ring The Bell
                        </button>
                    </div>

                    {/* MAP */}
                    <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 relative h-[400px] overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center"></div>
                        
                        {cities.map(city => (
                            <div 
                                key={city.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${city.visited ? 'scale-110 grayscale opacity-50' : 'hover:scale-110 cursor-pointer'}`}
                                style={{
                                    top: city.id === 'NY' ? '35%' : city.id === 'SF' ? '38%' : city.id === 'LON' ? '30%' : city.id === 'DXB' ? '45%' : '40%',
                                    left: city.id === 'NY' ? '28%' : city.id === 'SF' ? '18%' : city.id === 'LON' ? '48%' : city.id === 'DXB' ? '58%' : '80%'
                                }}
                                onClick={() => visitCity(city.id)}
                            >
                                <div className="flex flex-col items-center group">
                                    <MapPin size={32} className={`${city.visited ? 'text-slate-500' : 'text-emerald-500'} fill-current drop-shadow-lg`} />
                                    <div className="bg-slate-900/80 px-2 py-1 rounded text-[10px] text-white font-bold mt-1 backdrop-blur-sm border border-slate-700">
                                        {city.name}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-black text-white text-xs p-2 rounded w-32 text-center pointer-events-none z-10">
                                        Travel: ${city.cost}<br/>
                                        Sector: {city.sectorPreference}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Plane Animation */}
                        <Plane className="absolute top-1/2 left-1/2 text-slate-700 animate-pulse" />
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
