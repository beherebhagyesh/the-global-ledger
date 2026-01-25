
import React, { useState, useEffect } from 'react';
import { ArrowRight, Wallet, Shield, AlertTriangle, CreditCard, PieChart as PieIcon, Coffee, Zap, Home, Car, Utensils, ShoppingBag, Plane, Gamepad2, HeartPulse, AlertCircle, CheckCircle2, PiggyBank, Clock, TrendingUp, Scissors, Briefcase, Umbrella, FileCheck, Info, PartyPopper, RotateCcw, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { getMentorFeedback } from '../services/geminiService';
import { MissionBrief } from './MissionBrief';
import { SmartTooltip, PortalTooltip } from './SmartTooltip';
import { MentorPersona } from '../types';
import { playSound } from '../utils/sound';

interface Level1Props {
  onComplete: () => void;
  addXP: (amount: number) => void;
  mentorPersona: MentorPersona;
  updateStress: (amount: number) => void;
  initialTaxRegime: 'NEW' | 'OLD';
  onTaxRegimeChange: (regime: 'NEW' | 'OLD') => void;
  updateBank: (amount: number) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // Savings, Needs, Wants, Debt

// Helper for Button Tooltips (Wrapper for Portal)
export const ActionTooltip = ({ children, title, desc }: { children?: React.ReactNode, title: string, desc: string }) => (
    <PortalTooltip title={title} desc={desc} position="top">
        {children}
    </PortalTooltip>
);

export const Level1_Foundations: React.FC<Level1Props> = ({ onComplete, addXP, mentorPersona, updateStress, initialTaxRegime, onTaxRegimeChange, updateBank }) => {
  // 1. Gross vs Net (Salary Illusion)
  const [grossSalary, setGrossSalary] = useState(5000);
  const [promotionsTriggered, setPromotionsTriggered] = useState(0); // Cap at 2
  
  // Tax Logic: New Regime ~15% effective, Old Regime ~25% (assuming no deductions for simplicity game flow)
  const taxRate = initialTaxRegime === 'NEW' ? 0.15 : 0.25; 
  const netIncome = Math.round(grossSalary * (1 - taxRate));

  // 2. Granular Expenses (NEEDS)
  const [housing, setHousing] = useState(1500);
  const [food, setFood] = useState(600);
  const [transport, setTransport] = useState(300);
  const [utilities, setUtilities] = useState(200);
  
  // Critical: Insurance
  const [hasInsurance, setHasInsurance] = useState(false);
  const insuranceCost = hasInsurance ? 150 : 0;

  // Granular Expenses (WANTS)
  const [entertainment, setEntertainment] = useState(300);
  const [shopping, setShopping] = useState(200);

  // 4. Habit Toggles (Micro-Choices)
  const [habits, setHabits] = useState({
      cookAtHome: false,
      publicTransport: false,
      noStarbucks: false
  });
  
  // New: Vampire Subs
  const [subsCut, setSubsCut] = useState(false);

  // Debt & Savings
  const [debt, setDebt] = useState(2000); // Credit Card Debt
  const [savingsAllocation, setSavingsAllocation] = useState({
      emergency: 50, // % of savings going to EF
      invest: 50     // % of savings going to Market
  });
  
  // Balances
  const [emergencyFund, setEmergencyFund] = useState(500);
  const [simulatedMonths, setSimulatedMonths] = useState(0);

  // View Mode: Monthly vs 10-Year Projection
  const [viewProjection, setViewProjection] = useState(false);

  // Wedding Event
  const [showWedding, setShowWedding] = useState(false);

  // Derived Values
  const totalNeeds = housing + food + transport + utilities + insuranceCost;
  const totalWants = entertainment + shopping;
  const debtMinimum = Math.round(debt * 0.03); // 3% Min Payment
  const monthlyInterest = Math.round(debt * 0.20 / 12); // 20% APR
  
  const totalExpenses = totalNeeds + totalWants + debtMinimum;
  const rawSavings = netIncome - totalExpenses;
  const monthlySavings = Math.max(0, rawSavings);

  const savingsToEF = Math.round(monthlySavings * (savingsAllocation.emergency / 100));
  const savingsToInvest = Math.round(monthlySavings * (savingsAllocation.invest / 100));

  // Freedom Clock Math (FIRE)
  // Rule of 25: Need 25x Annual Expenses to retire
  const annualExpenses = totalExpenses * 12;
  const fireNumber = annualExpenses * 25;
  const annualSavings = monthlySavings * 12;
  const yearsToFreedom = annualSavings > 0 ? Math.round(fireNumber / annualSavings) : 999;

  // Runway Calculation
  const monthlyBurn = totalNeeds; // We count only needs for survival runway
  const runwayMonths = monthlyBurn > 0 ? (emergencyFund / monthlyBurn).toFixed(1) : '0';

  // Compound Math
  // FV = P * (((1 + r)^n - 1) / r)
  const r = 0.08 / 12; // 8% annual return monthly
  const n = 120; // 10 years
  const projectedWealth = monthlySavings > 0 
      ? Math.round(monthlySavings * ( (Math.pow(1 + r, n) - 1) / r )) 
      : 0;

  // 3. Stress Meter Calculation
  const [localStress, setLocalStress] = useState(20);

  // Apply Habit Toggles
  useEffect(() => {
      if (habits.cookAtHome) setFood(300); else setFood(600);
      if (habits.publicTransport) setTransport(100); else setTransport(400);
      if (habits.noStarbucks) setEntertainment(prev => Math.max(50, prev - 100));
  }, [habits]);

  // Apply Vampire Cut
  useEffect(() => {
      if (subsCut) {
          setUtilities(prev => Math.max(100, prev - 50));
          setEntertainment(prev => Math.max(100, prev - 50));
      }
  }, [subsCut]);

  // Inflation Logic (Passive Increase)
  useEffect(() => {
      const interval = setInterval(() => {
          if (Math.random() > 0.6) { // 40% chance every 10s
              const inflationFactor = 1.02;
              setFood(prev => Math.round(prev * inflationFactor));
              setHousing(prev => Math.round(prev * 1.005)); // Housing rises slower
              setFeedback("⚠️ Inflation Monster: Food prices rose by 2%.");
              playSound('ERROR');
          }
      }, 15000); // Check every 15s
      return () => clearInterval(interval);
  }, []);

  // Calculate Stress
  useEffect(() => {
      let newStress = 20;
      
      // Debt Ratio Stress
      const debtRatio = debt / netIncome;
      newStress += debtRatio * 40; 
      
      // Runway Stress
      const efCoverage = emergencyFund / (totalNeeds || 1); 
      if (efCoverage < 3) newStress += (3 - efCoverage) * 10;
      else newStress -= 10;

      // Savings Stress
      const savingsRate = monthlySavings / netIncome;
      if (savingsRate < 0.1) newStress += 20;
      else if (savingsRate > 0.2) newStress -= 15;
      
      // Insurance Stress Relief
      if (hasInsurance) newStress -= 10;
      else newStress += 10; // Anxiety of no insurance

      newStress = Math.max(0, Math.min(100, newStress));
      setLocalStress(Math.round(newStress));
      updateStress(Math.round(newStress) - localStress); // Sync roughly with global
  }, [debt, emergencyFund, monthlySavings, netIncome, totalNeeds, hasInsurance]);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 6. Emergency Event Simulator
  const triggerEmergency = () => {
      // Random: Wedding vs Hospital
      if (Math.random() > 0.5) {
          setShowWedding(true);
          return;
      }

      // Without Insurance: $2000 (Hospital Bill)
      // With Insurance: $200 (Deductible)
      const cost = hasInsurance ? 200 : 2000;
      const eventName = hasInsurance ? "Medical Emergency (Insured)" : "Medical Emergency (Uninsured)";
      
      if (emergencyFund >= cost) {
          setEmergencyFund(prev => prev - cost);
          setFeedback(`✅ ${eventName} covered by Emergency Fund. Good job! (-$${cost})`);
          playSound('SUCCESS');
      } else {
          const shortage = cost - emergencyFund;
          setEmergencyFund(0);
          setDebt(prev => prev + shortage);
          setFeedback(`❌ ${eventName} wiped out EF and added $${shortage} to debt!`);
          playSound('ERROR');
      }
  };

  const handleWedding = (attend: boolean) => {
      if (attend) {
          const cost = 500; // Gift + Travel
          if (emergencyFund >= cost) {
              setEmergencyFund(prev => prev - cost);
              setFeedback("You attended the Wedding. Wallet lighter, but family happy. (-$500)");
          } else {
              setDebt(prev => prev + cost);
              setFeedback("You attended on Credit. Debt increased by $500.");
          }
          // Stress Relief
          updateStress(-20);
          addXP(50);
          playSound('COIN');
      } else {
          setFeedback("You skipped the wedding. Saved money, but Social Credit hit.");
          updateStress(10); // FOMO
          addXP(-20); // Reputation hit
          playSound('ERROR');
      }
      setShowWedding(false);
  };

  // 7. Promotion (Lifestyle Creep)
  const triggerPromotion = () => {
      if (promotionsTriggered >= 2) {
          setFeedback("Career Ceiling Reached for this Level. No more promotions available.");
          playSound('ERROR');
          return;
      }
      if (grossSalary > 7000) {
          setFeedback("Max salary for this level reached. Focus on savings.");
          return;
      }
      const raise = 1000;
      setGrossSalary(prev => prev + raise);
      setPromotionsTriggered(prev => prev + 1);
      
      // SIMULATE LIFESTYLE CREEP (Parkinson's Law)
      // Automatically raise expenses by 60% of the raise amount
      const creepAmount = raise * 0.6; 
      setHousing(prev => prev + (creepAmount * 0.5)); // Upgrade Apartment
      setEntertainment(prev => prev + (creepAmount * 0.3)); // More parties
      setShopping(prev => prev + (creepAmount * 0.2)); // New clothes
      
      setFeedback("🎉 PROMOTION! Income +$1000. BUT... you moved to a better apartment. Expenses increased automatically! (Lifestyle Creep)");
      playSound('COIN');
  };

  const simulateMonth = () => {
      // Bankruptcy Check
      if (monthlySavings === 0 && emergencyFund === 0 && rawSavings < 0) {
          setFeedback("⚠️ INSOLVENT: Expenses exceed Income and no Cash reserves. You cannot simulate forward. Cut expenses now!");
          playSound('ERROR');
          return;
      }

      // 1. Add Savings to EF
      if (monthlySavings > 0) {
          setEmergencyFund(prev => prev + monthlySavings);
      } else if (rawSavings < 0) {
          // Burning cash
          const burn = Math.abs(rawSavings);
          if (emergencyFund >= burn) {
              setEmergencyFund(prev => prev - burn);
          } else {
              const shortage = burn - emergencyFund;
              setEmergencyFund(0);
              setDebt(prev => prev + shortage);
          }
      }
      
      // 2. Manage Debt (Interest vs Principal)
      if (debt > 0) {
          // Standard Credit Card Math: NewBalance = OldBalance + Interest - Payment
          // The payment (debtMinimum) was already deducted from 'netIncome' via 'totalExpenses'.
          // So cashflow is already handled. Now we just update the balance.
          const newDebt = debt + monthlyInterest - debtMinimum;
          setDebt(Math.max(0, newDebt));
      }

      // 3. Count Month
      setSimulatedMonths(prev => prev + 1);
      
      if (monthlySavings > 0) {
          setFeedback(`Month ${simulatedMonths + 1}: Saved $${monthlySavings}. Debt paid down.`);
          playSound('COIN');
      } else {
          setFeedback(`Month ${simulatedMonths + 1}: Cash burned. Debt Interest accrued.`);
          playSound('ERROR');
      }
  };

  const resetLevel = () => {
      setGrossSalary(5000);
      setHousing(1500);
      setFood(600);
      setTransport(300);
      setUtilities(200);
      setHasInsurance(false);
      setEntertainment(300);
      setShopping(200);
      setDebt(2000);
      setEmergencyFund(500);
      setSimulatedMonths(0);
      setPromotionsTriggered(0);
      setHabits({ cookAtHome: false, publicTransport: false, noStarbucks: false });
      setFeedback("Simulation Reset to Day 1.");
      playSound('CLICK');
  };

  const handleVictory = () => {
      if (debt === 0 && emergencyFund > totalNeeds * 3 && monthlySavings > netIncome * 0.2) {
          addXP(500);
          // Transfer Net Savings to Global Bank
          const netTransfer = Math.max(0, emergencyFund - debt);
          updateBank(netTransfer);
          alert(`Congratulations! You saved $${netTransfer.toLocaleString()}. This amount has been transferred to your Global Business Bank Account as Seed Capital.`);
          onComplete();
      } else {
          setFeedback("Not stable yet! Goal: 0 Debt, 3mo Emergency Fund, 20% Savings Rate.");
          playSound('ERROR');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-12 relative">
      <MissionBrief 
        title="Domestic Foundations"
        rpgAnalogy="Think of Income as 'Mana Regen' and Expenses as 'Mana Drain'. Assets are 'Passive Regen Items'. If Drain > Regen, you die."
        realWorldLesson="Rich people build assets. Poor people build liabilities. The 'Rat Race' is when your Expenses grow exactly as fast as your Income (Lifestyle Creep)."
        missionGoal="Achieve Financial Stability: 0 Bad Debt, 3 Months Runway, 20% Savings Rate."
        conceptTerm="Lifestyle Creep"
        mentorPersona={mentorPersona}
      />

      {/* Wedding Modal */}
      {showWedding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in zoom-in">
              <div className="bg-slate-900 border border-pink-500 p-6 rounded-xl max-w-md text-center">
                  <PartyPopper className="mx-auto text-pink-500 mb-4" size={48} />
                  <h3 className="text-2xl font-bold text-white mb-2">The Indian Wedding Invite</h3>
                  <p className="text-slate-400 mb-6 text-sm">
                      Your cousin is getting married. It's a 3-day event in another city.
                      <br/><br/>
                      <span className="text-white font-bold">Choice:</span> Spend $500 on travel/gifts, or Skip it?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => handleWedding(true)} className="bg-pink-600 hover:bg-pink-500 text-white py-3 rounded font-bold">
                          Attend (-$500)
                      </button>
                      <button onClick={() => handleWedding(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded font-bold">
                          Skip (Save Money)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* TOP BAR: GROSS -> NET -> ALLOCATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Gross Salary</p>
                  <p className="text-2xl text-white font-mono font-bold">${grossSalary}</p>
              </div>
              <ActionTooltip title="Lifestyle Creep" desc="Getting a raise usually leads to spending more. Beware: The game automatically raises expenses when you click this! Max 2 promotions.">
                <button onClick={triggerPromotion} disabled={promotionsTriggered >= 2} className={`bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded text-xs font-bold hover:bg-emerald-900/50 transition-colors ${promotionsTriggered >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {promotionsTriggered >= 2 ? 'Max Rank' : '+ Get Promotion'}
                </button>
              </ActionTooltip>
          </div>
          
          {/* Tax Regime Card with Overflow Fix */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center relative">
              <div className="flex justify-between items-center z-10 relative">
                  <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Tax Regime</p>
                      <p className="text-2xl text-slate-200 font-mono font-bold">${netIncome} <span className="text-xs text-slate-500 font-normal">Net</span></p>
                  </div>
                  <div className="flex bg-slate-900 p-1 rounded">
                      <ActionTooltip title="New Regime" desc="Lower tax rates (15%), but NO deductions allowed (80C, HRA). Good for beginners.">
                        <button onClick={() => onTaxRegimeChange('NEW')} className={`px-3 py-1 rounded text-xs font-bold ${initialTaxRegime === 'NEW' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>New</button>
                      </ActionTooltip>
                      <ActionTooltip title="Old Regime" desc="Higher rates (25%), but allows deductions. Good if you have Loans/Insurance.">
                        <button onClick={() => onTaxRegimeChange('OLD')} className={`px-3 py-1 rounded text-xs font-bold ${initialTaxRegime === 'OLD' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Old</button>
                      </ActionTooltip>
                  </div>
              </div>
              {/* Tax Strip Visual Wrapper */}
              <div className="absolute bottom-0 left-0 w-full h-1 rounded-b-xl overflow-hidden">
                  <div className="h-full bg-red-500" style={{width: `${taxRate*100}%`}}></div>
              </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Savings Rate</p>
                  <p className={`text-2xl font-mono font-bold ${monthlySavings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {((monthlySavings/netIncome)*100).toFixed(0)}%
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase">Freedom In</p>
                  <p className="text-lg text-white font-bold">{yearsToFreedom} Yrs</p>
              </div>
          </div>
      </div>

      {/* MAIN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COL 1: LIFESTYLE INPUTS */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 space-y-6">
              <div className="flex justify-between items-center">
                  <h3 className="text-slate-400 font-bold uppercase text-xs flex items-center gap-2"><Home size={14}/> Lifestyle Config</h3>
                  <button onClick={resetLevel} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1">
                      <RotateCcw size={10} /> Reset Sim
                  </button>
              </div>
              
              {/* Needs Sliders */}
              <div className="space-y-4">
                  <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Housing</span>
                          <span className="text-slate-500">${housing}</span>
                      </div>
                      <input type="range" min="500" max="3000" step="100" value={housing} onChange={(e) => setHousing(Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Food</span>
                          <span className="text-slate-500">${food}</span>
                      </div>
                      <input type="range" min="200" max="1500" step="50" value={food} onChange={(e) => setFood(Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>
                  
                  {/* Habit Toggles */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                      <ActionTooltip title="Cook at Home" desc="Slashes food budget by 50%. Costs Time.">
                        <button 
                            onClick={() => setHabits(p => ({...p, cookAtHome: !p.cookAtHome}))}
                            className={`w-full py-2 rounded border text-xs font-bold flex flex-col items-center gap-1 ${habits.cookAtHome ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-600 text-slate-500'}`}
                        >
                            <Utensils size={14} /> Cook
                        </button>
                      </ActionTooltip>
                      <ActionTooltip title="Public Transit" desc="Slashes transport cost. Lowers comfort.">
                        <button 
                            onClick={() => setHabits(p => ({...p, publicTransport: !p.publicTransport}))}
                            className={`w-full py-2 rounded border text-xs font-bold flex flex-col items-center gap-1 ${habits.publicTransport ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-600 text-slate-500'}`}
                        >
                            <Car size={14} /> Metro
                        </button>
                      </ActionTooltip>
                  </div>
                  
                  {/* Insurance Toggle */}
                  <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-white font-bold flex items-center gap-1"><Umbrella size={12} className="text-blue-400"/> Health Insurance</span>
                          <span className="text-xs text-slate-500">$150/mo</span>
                      </div>
                      <ActionTooltip title="Risk Transfer" desc="Pay a small premium ($150) to transfer the risk of a huge bill ($2000) to the insurance company. Mathematically superior for catastrophic loss.">
                        <button 
                            onClick={() => setHasInsurance(!hasInsurance)}
                            className={`w-full py-2 rounded text-xs font-bold transition-all ${hasInsurance ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 border border-slate-600'}`}
                        >
                            {hasInsurance ? 'Policy Active' : 'No Coverage (Risky)'}
                        </button>
                      </ActionTooltip>
                  </div>
              </div>
          </div>

          {/* COL 2: THE ENGINE (Visuals) */}
          <div className="flex flex-col space-y-4">
              {/* Allocation Pie */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex-1 relative min-h-[200px]">
                  <h3 className="text-slate-400 font-bold uppercase text-xs absolute top-4 left-4">Cashflow Engine</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Savings', value: monthlySavings },
                                { name: 'Needs', value: totalNeeds },
                                { name: 'Wants', value: totalWants },
                                { name: 'Debt', value: debtMinimum }
                            ]}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} formatter={(value: number) => `$${value}`}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                          <p className="text-[10px] text-slate-500">Surplus</p>
                          <p className={`font-mono font-bold ${monthlySavings > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ${monthlySavings}
                          </p>
                      </div>
                  </div>
              </div>

              {/* Stress Meter Local */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><HeartPulse size={14}/> Financial Stress</span>
                      <span className={`text-xs font-bold ${localStress > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{localStress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${localStress > 70 ? 'bg-red-500' : localStress > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{width: `${localStress}%`}}></div>
                  </div>
              </div>
              
              {/* Feedback Box */}
              <div className="bg-slate-800 p-3 rounded-lg border-l-4 border-blue-500 min-h-[60px] flex items-center">
                  <p className="text-xs text-slate-300">{feedback || "Adjust your lifestyle to balance the engine."}</p>
              </div>
          </div>

          {/* COL 3: FUTURE & DEBT */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 space-y-6">
              <h3 className="text-slate-400 font-bold uppercase text-xs flex items-center gap-2"><TrendingUp size={14}/> Projections</h3>

              {/* Debt Section */}
              <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                      <span className="text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12}/> Bad Debt (20% APR)</span>
                      <span className="text-white">${debt.toFixed(0)}</span>
                  </div>
                  <input type="range" min="0" max="5000" step="100" value={debt} onChange={(e) => setDebt(Number(e.target.value))} className="w-full accent-red-500" />
                  
                  <div className="bg-red-900/20 p-2 rounded border border-red-900/50 flex items-center gap-2">
                      <Coffee size={16} className="text-red-400" />
                      <div className="text-[10px] text-red-200">
                          Interest cost: <span className="font-bold">${monthlyInterest}/mo</span>.
                          <br/>That's {Math.ceil(monthlyInterest/5)} coffees wasted!
                      </div>
                  </div>
              </div>

              {/* Savings Allocation */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                  <p className="text-xs text-emerald-400 font-bold uppercase">Savings Buckets</p>
                  
                  {/* Emergency Fund */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 flex items-center gap-1">
                              Emergency Fund
                              <SmartTooltip term="Runway" definition="How many months you can survive without a job. Calculated as: Total Cash / Monthly Expenses.">
                                  <Info size={10} className="text-slate-500"/>
                              </SmartTooltip>
                          </span>
                          <span className={emergencyFund < totalNeeds * 3 ? 'text-yellow-400' : 'text-emerald-400'}>${emergencyFund.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Runway:</span>
                          <span className={Number(runwayMonths) < 3 ? 'text-red-400' : 'text-emerald-400'}>{runwayMonths} Months</span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
                          <div className="bg-emerald-500 h-full" style={{width: `${Math.min(100, (emergencyFund / (totalNeeds * 3)) * 100)}%`}}></div>
                      </div>
                      
                      {/* FIXED BUTTON: SIMULATE MONTH */}
                      <div className="flex gap-2">
                          <button onClick={simulateMonth} className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-900/50 flex-1 flex items-center justify-center gap-1">
                              <Calendar size={10} /> Simulate Month {simulatedMonths + 1}
                          </button>
                          <ActionTooltip title="Test Liquidity" desc="Liquidity is how easily you can turn assets into cash. Real Estate has low liquidity; Cash has high liquidity. Simulating a crisis tests if you have liquid cash.">
                            <button onClick={triggerEmergency} className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-500/30 hover:bg-red-900/50">
                                Sim Crisis
                            </button>
                          </ActionTooltip>
                      </div>
                  </div>
              </div>

              {/* Time Travel Toggle */}
              <div className="pt-2">
                  <button onClick={() => setViewProjection(!viewProjection)} className="w-full py-2 bg-slate-800 border border-slate-600 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-700">
                      {viewProjection ? <Clock size={14}/> : <TrendingUp size={14}/>}
                      {viewProjection ? "Back to Monthly" : "View 10-Year Projection"}
                  </button>
                  {viewProjection && (
                      <div className="mt-2 bg-indigo-900/20 p-3 rounded border border-indigo-500/30 text-center animate-in zoom-in">
                          <p className="text-[10px] text-indigo-300 uppercase mb-1">Wealth in 10 Years</p>
                          <p className="text-xl font-black text-white">${projectedWealth.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">@ 8% Compounded</p>
                      </div>
                  )}
              </div>

          </div>
      </div>

      {/* Submit */}
      <div className="flex justify-center mt-8">
          <button 
            onClick={handleVictory}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
          >
              Lock In Financial Plan <CheckCircle2 size={18} />
          </button>
      </div>

    </div>
  );
};
