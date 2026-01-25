import React, { useState, useEffect } from 'react';
import { Shield, Check, AlertCircle, HelpCircle, FileCheck, CheckSquare, Info, X, ArrowRight, Globe, Landmark, Coins, BookOpen, Percent, DollarSign, FileText, RefreshCw, AlertTriangle, Banknote, Calendar, Lock, Unlock, MousePointer, Briefcase, Building2, Scale, LayoutDashboard, Bitcoin, RotateCcw, CheckCircle, Gavel } from 'lucide-react';
import { checkW8BEN, getQuizScenario } from '../services/geminiService';
import { MissionBrief } from './MissionBrief';
import { QuizModal } from './QuizModal';
import { SmartTooltip } from './SmartTooltip';
import { FailOverlay } from './FailOverlay';
import { InventoryItem, QuizQuestion, MentorPersona } from '../types';
import { playSound } from '../utils/sound';

interface Level3Props {
  onComplete: () => void;
  addXP: (amount: number) => void;
  unlockItem: (item: InventoryItem) => void;
  mentorPersona: MentorPersona;
  globalTaxRegime: 'NEW' | 'OLD';
  forexRate: number;
  updateBank: (amount: number) => void;
  bankBalance: number;
  reputation: number;
}

interface AuditResult {
    triggered: boolean;
    issues: string[];
    penalty: number;
    taxSaved: number;
    finalVerdict: 'CLEAN' | 'WARNING' | 'SEIZED';
    yearsSurvived: number;
}

const TREATY_ARTICLES = [
    { 
        id: 'ART_7', 
        name: 'Business Profits', 
        article: 'Article 7', 
        rate: 0, 
        desc: 'Standard for freelancers/agencies with NO permanent office in the US. Income is taxed ONLY in India.',
        icon: 'Briefcase',
        type: 'SERVICE'
    },
    { 
        id: 'ART_12', 
        name: 'Royalties / Tech Fees', 
        article: 'Article 12', 
        rate: 15, 
        desc: 'For transferring IP, Copyrights, or specific "Technical Knowledge". US withholds 15%, you claim credit in India.',
        icon: 'Cpu',
        type: 'ROYALTY'
    },
    { 
        id: 'ART_10', 
        name: 'Dividends', 
        article: 'Article 10', 
        rate: 25, 
        desc: 'Income from US Stocks (e.g., Apple/Microsoft). Reduced from 30% to 25%. Important for investors.',
        icon: 'TrendingUp',
        type: 'INVESTMENT'
    }
];

// Helper for Button Tooltips
const ActionTooltip: React.FC<{ children?: React.ReactNode; title: string; desc: string; className?: string }> = ({ children, title, desc, className = "w-full" }) => (
    <div className={`relative group ${className}`}>
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none">
            <div className="bg-slate-900 border border-slate-600 p-3 rounded-lg shadow-xl text-center relative">
                <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1">{title}</p>
                <p className="text-xs text-slate-300 leading-tight">{desc}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    </div>
);

export const Level3_Tax: React.FC<Level3Props> = ({ onComplete, addXP, unlockItem, mentorPersona, globalTaxRegime, forexRate, updateBank, bankBalance, reputation }) => {
  // Form State
  const [formData, setFormData] = useState({
    name: 'Player One',
    country: 'India',
    pan: '',
    article: '',
    hasPE: false // Permanent Establishment Trap
  });
  
  // Simulation State
  const [incomeType, setIncomeType] = useState<'SERVICE' | 'ROYALTY' | 'INVESTMENT'>('SERVICE');
  const [hasLUT, setHasLUT] = useState(false); 
  const [bankType, setBankType] = useState<'TRADITIONAL' | 'NEOBANK'>('TRADITIONAL');
  const [remittanceAmount, setRemittanceAmount] = useState(5000); // USD
  const [is44ADA, setIs44ADA] = useState(false); 
  
  // Advanced Compliance Mechanics
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState(false); 
  const [eefcBalance, setEefcBalance] = useState(0); 
  const [invoiceChecklist, setInvoiceChecklist] = useState({ 
      hasIEC: false,
      hasLUTRef: false,
      hasCurrency: false
  });
  const [softexFiled, setSoftexFiled] = useState(false); 
  const [paymentRoute, setPaymentRoute] = useState<'SWIFT' | 'LOCAL' | 'CRYPTO'>('SWIFT'); 
  const [trcUploaded, setTrcUploaded] = useState(false); 
  const [dscActive, setDscActive] = useState(false); 
  const [rcmPaid, setRcmPaid] = useState(false); // Reverse Charge Mechanism
  const [ptPaid, setPtPaid] = useState(false); // Professional Tax
  
  // NEW: Advanced Structuring State
  const [showStructuring, setShowStructuring] = useState(false);
  const [hufCreated, setHufCreated] = useState(false);
  const [hufAllocation, setHufAllocation] = useState(0); // % allocated to HUF
  const [incorpUS, setIncorpUS] = useState(false);
  const [mgmtLocation, setMgmtLocation] = useState<'INDIA' | 'USA'>('INDIA'); // POEM Risk
  const [transferPrice, setTransferPrice] = useState(100); // % of market rate
  const [scheduleFADeclared, setScheduleFADeclared] = useState(false);
  const [deductions80C, setDeductions80C] = useState(false); // 1.5L Deduction
  const [privateTrust, setPrivateTrust] = useState(false);

  // Progression State
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'fail'>('idle');
  const [msg, setMsg] = useState('');
  const [auditReport, setAuditReport] = useState<AuditResult | null>(null);
  const [simulatingAudit, setSimulatingAudit] = useState(false);
  
  // Tutorial Mode State
  const [tutorialStep, setTutorialStep] = useState(0); // 0: Income, 1: Logic Check, 2: Form Fill, 3: Done
  
  // One-time Action State (Prevent Infinite Money Glitch)
  const [remittanceProcessed, setRemittanceProcessed] = useState(false);

  // Quiz & Modal State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [showFailOverlay, setShowFailOverlay] = useState(false);
  const [failReason, setFailReason] = useState("");

  const maxRemittance = 2000 + (reputation * 200); // Based on Reputation

  const resetLevel = () => {
      setFormData({ name: 'Player One', country: 'India', pan: '', article: '', hasPE: false });
      setHasLUT(false);
      setBankType('TRADITIONAL');
      setIs44ADA(false);
      setAdvanceTaxPaid(false);
      setEefcBalance(0);
      setInvoiceChecklist({ hasIEC: false, hasLUTRef: false, hasCurrency: false });
      setSoftexFiled(false);
      setPaymentRoute('SWIFT');
      setTrcUploaded(false);
      setDscActive(false);
      setRcmPaid(false);
      setPtPaid(false);
      setHufCreated(false);
      setIncorpUS(false);
      setDeductions80C(false);
      setAuditReport(null);
      setStatus('idle');
      setRemittanceProcessed(false);
      setTutorialStep(0);
      setMsg("Forms Cleared. Start fresh.");
      playSound('CLICK');
  };

  // --- CALCULATIONS ---
  const activeTreaty = TREATY_ARTICLES.find(t => t.type === incomeType) || TREATY_ARTICLES[0];
  // Use Global Forex Rate
  const inrRate = forexRate;
  
  // 1. US Withholding Tax
  const usTaxRate = (status === 'success' && trcUploaded) ? activeTreaty.rate / 100 : 0.30;
  const usTaxAmount = remittanceAmount * usTaxRate;
  const amountAfterUSTax = remittanceAmount - usTaxAmount;

  // 2. Forex Spread & Route Costs
  let swiftFee = 0;
  let forexSpread = 0;

  if (paymentRoute === 'SWIFT') {
      swiftFee = 20;
      forexSpread = bankType === 'TRADITIONAL' ? 0.025 : 0.01;
  } else if (paymentRoute === 'LOCAL') {
      swiftFee = 0;
      forexSpread = 0.005;
  } else if (paymentRoute === 'CRYPTO') {
      swiftFee = 1; // Gas fee approx
      forexSpread = 0.0; // Pure rate, but P2P spread might exist. Assuming efficient route.
  }
  
  const amountAfterSwift = amountAfterUSTax - swiftFee;
  const forexLoss = amountAfterSwift * forexSpread;
  const landedUSD = amountAfterSwift - forexLoss;
  
  // 3. GST (The Cashflow Trap)
  const isExport = incomeType !== 'INVESTMENT';
  const gstRate = (isExport && !hasLUT) ? 0.18 : 0;
  const gstBlocked = landedUSD * gstRate;

  // Final Cash in Hand (Pre-Income Tax)
  const finalLandedAmount = landedUSD - gstBlocked;
  const grossINR = finalLandedAmount * inrRate;

  // --- INCOME TAX CALCULATOR (INDIAN SIDE) ---
  // Split Income between Self and HUF
  const hufShare = hufCreated ? grossINR * (hufAllocation / 100) : 0;
  const selfShare = grossINR - hufShare;

  const calculateTax = (amount: number, isPresumptive: boolean, isCrypto: boolean) => {
      if (amount <= 0) return 0;
      
      // CRYPTO TAX TRAP (Sec 115BBH)
      if (isCrypto) {
          // 30% Flat + 4% Cess = 31.2%
          // IMPORTANT: No deductions allowed. No expense claims.
          return amount * 0.312; 
      }

      // Deductions
      const taxable = isPresumptive ? amount * 0.5 : amount * 0.8;
      // If crypto, deductions80C logic was already handled by `isCrypto` check above (it returns early).
      const netTaxable = Math.max(0, taxable - (deductions80C ? 150000 : 0));
      
      // Simple Slabs (Old Regime approx for simulation)
      if (netTaxable <= 500000) return 0;
      if (netTaxable <= 1000000) return (netTaxable - 500000) * 0.2 + 12500; 
      return (netTaxable - 1000000) * 0.3 + 112500;
  };

  // Calculate Transfer Pricing Risk
  const tpRisk = incorpUS && (transferPrice < 80 || transferPrice > 120); // Must be Arm's Length

  const isCryptoRoute = paymentRoute === 'CRYPTO';
  const selfTax = calculateTax(selfShare, is44ADA, isCryptoRoute);
  const hufTax = calculateTax(hufShare, is44ADA, isCryptoRoute);
  
  const totalTaxLiability = selfTax + hufTax;
  
  // POEM Risk: If US Company managed from India -> Indian Tax applies to US Income
  const poemImpact = (incorpUS && mgmtLocation === 'INDIA') ? remittanceAmount * inrRate * 0.4 : 0; // 40% corporate tax penalty

  const taxPenalty = advanceTaxPaid ? 0 : 0.03;
  const finalIncomeTax = (totalTaxLiability + poemImpact) * (1 + taxPenalty);

  const totalLeakage = (remittanceAmount * inrRate) - (grossINR - finalIncomeTax);

  // Compliance Health (0-100)
  const complianceScore = (
      (status === 'success' ? 15 : 0) + 
      (hasLUT ? 10 : 0) + 
      (trcUploaded ? 10 : 0) +
      (softexFiled ? 10 : 0) +
      (advanceTaxPaid ? 10 : 0) +
      (invoiceChecklist.hasIEC ? 5 : 0) +
      (invoiceChecklist.hasLUTRef ? 5 : 0) + 
      (dscActive ? 5 : 0) +
      (scheduleFADeclared ? 20 : 0) +
      (paymentRoute === 'CRYPTO' ? -20 : 5) + // Crypto hurts compliance score due to PMLA risk
      (rcmPaid ? 5 : 0)
  );

  // EEFC Forced Conversion Timer
  useEffect(() => {
      if (eefcBalance > 0) {
          const timer = setTimeout(() => {
              if (eefcBalance > 0) {
                  const forcedConversion = eefcBalance * inrRate * 0.95; // Penalty rate
                  updateBank(forcedConversion);
                  setEefcBalance(0);
                  setMsg("EEFC Warning: RBI Forced Conversion applied! (Held > 15 Days). Converted at Bad Rate.");
                  playSound('ERROR');
                  addXP(-100);
              }
          }, 20000); // 20 seconds simulation = ~2 weeks
          return () => clearTimeout(timer);
      }
  }, [eefcBalance]);

  const simulateAudit = () => {
      setSimulatingAudit(true);
      playSound('CLICK');
      
      setTimeout(() => {
          let issues: string[] = [];
          let penalty = 0;
          let verdict: 'CLEAN' | 'WARNING' | 'SEIZED' = 'CLEAN';
          let years = 3;

          // 1. Black Money Act (Critical)
          if (incomeType === 'INVESTMENT' && !scheduleFADeclared) {
              issues.push("CRITICAL: Undeclared Foreign Assets (Schedule FA).");
              penalty += 1000000; // 10 Lakhs
              verdict = 'SEIZED';
              years = 1;
          }

          // 2. POEM Risk
          if (incorpUS && mgmtLocation === 'INDIA') {
              issues.push("POEM Triggered: US Company taxed as Indian Resident.");
              penalty += remittanceAmount * inrRate * 0.4;
              verdict = 'WARNING';
          }

          // 3. Crypto FEMA Risk
          if (paymentRoute === 'CRYPTO') {
              if (Math.random() > 0.5) { // 50% chance of notice
                  issues.push("FEMA Notice: Unexplained Crypto Inward Remittance.");
                  penalty += 50000;
                  verdict = verdict === 'SEIZED' ? 'SEIZED' : 'WARNING';
              }
              // Also check tax
              if (deductions80C && isCryptoRoute) {
                  // Although calculator prevents it, if user manually tried to think they got it
                  issues.push("Sec 115BBH Violation: No deductions allowed on VDA Income.");
                  penalty += 20000;
              }
          }

          // 4. RCM & PT
          if (!rcmPaid) { issues.push("Non-compliance: GST RCM not paid on imports."); penalty += 10000; }
          if (!ptPaid) { issues.push("Non-compliance: Professional Tax not paid."); penalty += 5000; }

          // 5. 44ADA Limits (Simulation)
          if (is44ADA && remittanceAmount * 12 * inrRate > 7500000) {
              issues.push("44ADA Violation: Income > ₹75L. Audit required.");
              penalty += 25000; // Penalty for wrong filing
          }

          // Savings Calculation (Structure vs Standard)
          // Standard Tax (No HUF, No 44ADA, 30% Bracket)
          const standardTax = (remittanceAmount * inrRate * 12 * 0.3);
          // Your Tax
          const yourTaxAnnual = finalIncomeTax * 12;
          const taxSaved = Math.max(0, standardTax - yourTaxAnnual);

          // Apply Penalty
          if (penalty > 0) updateBank(-penalty);

          setAuditReport({
              triggered: true,
              issues: issues.length > 0 ? issues : ["No major discrepancies found."],
              penalty,
              taxSaved,
              finalVerdict: verdict,
              yearsSurvived: years
          });
          setSimulatingAudit(false);
          
          if (penalty > 0) playSound('ERROR');
          else playSound('SUCCESS');

      }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('checking');
    playSound('CLICK');
    
    // PASS EXPECTED ARTICLE CONTEXT
    const result = await checkW8BEN(formData, activeTreaty.article);
    
    if (result.valid) {
        setStatus('success');
        setMsg(`Treaty Shield Deployed! Tax reduced to ${activeTreaty.rate}%.`);
        addXP(500);
        playSound('SUCCESS');
        setTutorialStep(3); // Complete
        
        setTimeout(async () => {
            const q = await getQuizScenario("Cross Border Tax Audit");
            setQuizQuestion(q);
            setShowQuiz(true);
        }, 1500);

    } else {
        setStatus('fail');
        playSound('ERROR');
        setMsg(result.message || "Validation Failed. Check inputs.");
    }
  };

  const holdInEEFC = () => {
      if (remittanceProcessed) {
          setMsg("Already processed this remittance. Reset to process new invoice.");
          return;
      }
      if (finalLandedAmount > 0) {
          setEefcBalance(prev => prev + finalLandedAmount);
          setRemittanceProcessed(true);
          playSound('COIN');
          addXP(100);
          setMsg("Funds moved to EEFC. Holding in USD. Warning: Auto-convert in 2 weeks.");
      }
  };

  const withdrawToBank = () => {
      if (remittanceProcessed) {
          setMsg("Already processed this remittance. Reset to process new invoice.");
          return;
      }
      if (finalLandedAmount > 0) {
          const inrAmount = Math.floor(finalLandedAmount * inrRate);
          updateBank(inrAmount);
          setRemittanceProcessed(true);
          playSound('COIN');
          setMsg(`Success! Withdrawn ₹${inrAmount.toLocaleString()} to Global Bank.`);
      }
  }

  const payAdvanceTax = () => {
      const estQuarterlyTax = Math.round(finalIncomeTax * 0.25);
      const taxInUSD = Math.round(estQuarterlyTax / inrRate);
      
      if (bankBalance < taxInUSD) {
          setMsg(`Insufficient Global Funds to pay Advance Tax ($${taxInUSD}).`);
          playSound('ERROR');
          return;
      }

      updateBank(-taxInUSD);
      setAdvanceTaxPaid(true);
      setMsg(`Paid Advance Tax: $${taxInUSD} (approx ₹${estQuarterlyTax.toLocaleString()}).`);
      playSound('COIN');
  }

  const toggle80C = () => {
      if (globalTaxRegime === 'NEW') {
          alert("You selected the NEW TAX REGIME in Level 1. You cannot claim 80C deductions! (Lockout Mechanic)");
          playSound('ERROR');
          return;
      }
      setDeductions80C(!deductions80C);
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-700 pb-12 relative">
      
      <MissionBrief 
        title="The Cross-Border Bridge"
        rpgAnalogy="Money traveling from the US to India passes through 'filters' (IRS, Bank, GST). Your job is to install 'Bypasses' (W-8BEN, Neo-Bank, LUT, 44ADA) to keep your HP (Cash) intact."
        realWorldLesson="44ADA is the ultimate freelance cheat code: declare 50% profit flat. Combine it with an HUF (Hindu Undivided Family) to split income and double your tax-free slabs. But beware the 'Audit Boss' in Year 3."
        missionGoal="Build a tax-efficient structure and survive the Fiscal Stress Test."
        conceptTerm="Presumptive Tax (44ADA)"
        mentorPersona={mentorPersona}
      />

      {/* FISCAL COURT MODAL (AUDIT REPORT) */}
      {auditReport && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in zoom-in">
              <div className={`w-full max-w-2xl rounded-2xl border-4 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] relative ${auditReport.finalVerdict === 'CLEAN' ? 'border-emerald-500' : auditReport.finalVerdict === 'WARNING' ? 'border-orange-500' : 'border-red-500'}`}>
                  {/* Backdrop Pattern */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                  
                  <div className="bg-slate-900 p-8 text-center relative z-10 flex-1 overflow-y-auto">
                      <div className="flex justify-center mb-6">
                          <div className={`p-6 rounded-full border-4 ${auditReport.finalVerdict === 'CLEAN' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}>
                              <Gavel size={48} />
                          </div>
                      </div>
                      
                      <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">Fiscal Verdict</h2>
                      <p className={`text-2xl font-bold font-mono mb-8 ${auditReport.finalVerdict === 'CLEAN' ? 'text-emerald-400' : auditReport.finalVerdict === 'WARNING' ? 'text-orange-400' : 'text-red-500'}`}>
                          {auditReport.finalVerdict}
                      </p>

                      <div className="bg-slate-950 rounded-xl p-6 mb-8 text-left border border-slate-800">
                          <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Findings</h3>
                          <ul className="space-y-3">
                              {auditReport.issues.map((issue, i) => (
                                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                      <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                      {issue}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-slate-800 p-4 rounded-xl">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Tax Saved</p>
                              <p className="text-xl font-mono font-bold text-emerald-400">+₹{(auditReport.taxSaved/100000).toFixed(1)}L</p>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Penalty</p>
                              <p className="text-xl font-mono font-bold text-red-400">-₹{(auditReport.penalty/100000).toFixed(1)}L</p>
                          </div>
                      </div>

                      <div className="flex gap-4 justify-center">
                          <button onClick={() => setAuditReport(null)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">
                              Review Structure
                          </button>
                          {auditReport.finalVerdict !== 'SEIZED' && (
                              <button 
                                onClick={() => {
                                    unlockItem({ id: 'w8ben_guide', name: 'W-8BEN Master Guide', description: 'Tax Compliance Item', icon: 'FileCheck', buff: 'Audit Immunity' });
                                    addXP(1000);
                                    onComplete();
                                }} 
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20"
                              >
                                  Clear Tax & Level Up
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ADVANCED STRUCTURING MODAL */}
      {showStructuring && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in zoom-in">
              <div className="bg-slate-900 border border-purple-500 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-purple-900 bg-purple-900/20 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2"><LayoutDashboard /> Advanced Wealth Structuring</h2>
                      <button onClick={() => setShowStructuring(false)} className="text-slate-400 hover:text-white"><X /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-purple-900">
                      
                      {/* HUF SECTION */}
                      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="text-lg font-bold text-white">HUF Creation Station</h3>
                                  <p className="text-xs text-slate-400">Create a separate tax entity for your family. Double the tax slabs.</p>
                              </div>
                              <button onClick={() => setHufCreated(!hufCreated)} className={`px-3 py-1 rounded text-xs font-bold ${hufCreated ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                  {hufCreated ? 'ACTIVE' : 'CREATE HUF'}
                              </button>
                          </div>
                          {hufCreated && (
                              <div className="bg-slate-900 p-4 rounded-lg">
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Income Diversion to HUF ({hufAllocation}%)</label>
                                  <input type="range" min="0" max="50" step="5" value={hufAllocation} onChange={(e) => setHufAllocation(Number(e.target.value))} className="w-full accent-purple-500"/>
                                  <p className="text-xs text-emerald-400 mt-2">Tax Saved: ₹{(calculateTax(grossINR, is44ADA, false) - (calculateTax(selfShare, is44ADA, false) + calculateTax(hufShare, is44ADA, false))).toLocaleString()}</p>
                              </div>
                          )}
                      </div>

                      {/* PRIVATE TRUST SECTION */}
                      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="text-lg font-bold text-white">Private Family Trust</h3>
                                  <p className="text-xs text-slate-400">Asset Protection Vehicle. Shields wealth from lawsuits/bankruptcy.</p>
                              </div>
                              <button onClick={() => setPrivateTrust(!privateTrust)} className={`px-3 py-1 rounded text-xs font-bold ${privateTrust ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                  {privateTrust ? 'TRUST ACTIVE' : 'ESTABLISH TRUST'}
                              </button>
                          </div>
                      </div>

                      {/* FOREIGN ENTITY SECTION */}
                      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="text-lg font-bold text-white">Delaware C-Corp</h3>
                                  <p className="text-xs text-slate-400">Incorporate in USA. Essential for raising VC money, but dangerous for tax.</p>
                              </div>
                              <button onClick={() => setIncorpUS(!incorpUS)} className={`px-3 py-1 rounded text-xs font-bold ${incorpUS ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                  {incorpUS ? 'INCORPORATED' : 'FORM LLC/C-CORP'}
                              </button>
                          </div>
                          {incorpUS && (
                              <div className="space-y-4 bg-slate-900 p-4 rounded-lg">
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Place of Effective Management (POEM)</label>
                                      <div className="flex gap-2">
                                          <button onClick={() => setMgmtLocation('INDIA')} className={`flex-1 py-2 text-xs rounded border ${mgmtLocation === 'INDIA' ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                              Bangalore (Home)
                                          </button>
                                          <button onClick={() => setMgmtLocation('USA')} className={`flex-1 py-2 text-xs rounded border ${mgmtLocation === 'USA' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                              USA (Nominee Director)
                                          </button>
                                      </div>
                                      {mgmtLocation === 'INDIA' && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10}/> RISK: POEM leads to Double Taxation!</p>}
                                  </div>

                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Transfer Pricing (Service Fee)</label>
                                      <input type="range" min="50" max="150" step="10" value={transferPrice} onChange={(e) => setTransferPrice(Number(e.target.value))} className="w-full accent-blue-500"/>
                                      <div className="flex justify-between text-xs mt-1">
                                          <span className="text-red-400">Undervalued</span>
                                          <span className="text-emerald-400">Arm's Length (100%)</span>
                                          <span className="text-red-400">Overvalued</span>
                                      </div>
                                      {tpRisk && <p className="text-xs text-red-500 mt-1">AUDIT RISK: Pricing is not at Arm's Length.</p>}
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* COMPLIANCE CHECKLIST */}
                      <div className="bg-red-950/20 p-6 rounded-xl border border-red-500/30">
                          <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2"><AlertTriangle /> Critical Reporting</h3>
                          <label className="flex items-center gap-3 bg-slate-900 p-3 rounded border border-red-900/50 cursor-pointer">
                              <input type="checkbox" checked={scheduleFADeclared} onChange={() => setScheduleFADeclared(!scheduleFADeclared)} className="w-5 h-5 accent-red-500" />
                              <div>
                                  <p className="font-bold text-white text-sm">Schedule FA (Foreign Assets)</p>
                                  <p className="text-xs text-slate-400">Must declare unlisted foreign shares (ESOPs) or bank accounts. Penalty: ₹10 Lakhs.</p>
                              </div>
                          </label>
                      </div>

                  </div>
                  <div className="p-4 border-t border-purple-900 bg-slate-900 flex justify-end">
                      <button onClick={() => setShowStructuring(false)} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2 rounded-lg font-bold">Confirm Structure</button>
                  </div>
              </div>
          </div>
      )}

      {/* TUTORIAL OVERLAY GUIDE (Pulsing Box) */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg sticky top-0 z-20">
          <div className="flex items-center gap-3">
              <div className="bg-blue-900/30 p-2 rounded-full text-blue-400 animate-pulse">
                  <Info size={20} />
              </div>
              <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tutorial Guide</p>
                  <p className="text-sm font-bold text-white">
                      {tutorialStep === 0 && "Step 1: Select your Income Source (Service vs Royalty)."}
                      {tutorialStep === 1 && "Step 2: Check the Article Number for that income type."}
                      {tutorialStep === 2 && "Step 3: Enter that Article into the Form below."}
                      {tutorialStep === 3 && "System Nominal. Proceed with Advanced Structuring."}
                  </p>
              </div>
          </div>
          <div className="text-right">
              <span className={`text-xs font-bold ${complianceScore < 50 ? 'text-red-500' : 'text-emerald-500'}`}>Risk: {100-complianceScore}%</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: CONFIGURATION & OPTIMIZATION (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
              
              {/* 1. Income Context */}
              <div className={`bg-slate-800 p-5 rounded-xl border transition-all ${tutorialStep === 0 ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02] shadow-lg shadow-blue-500/20' : 'border-slate-700'}`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-slate-400 font-bold uppercase text-xs flex items-center gap-2"><Globe size={14}/> Income Stream</h3>
                      <ActionTooltip title="Reset Level" desc="Clear all forms and start fresh. No penalty in learning mode." className="w-auto">
                        <button onClick={resetLevel} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1"><RotateCcw size={10}/> Reset</button>
                      </ActionTooltip>
                  </div>
                  <div className="flex bg-slate-900 p-1 rounded-lg">
                      {TREATY_ARTICLES.map(t => (
                          <ActionTooltip key={t.type} title={t.name} desc={t.desc}>
                            <button
                                onClick={() => { setIncomeType(t.type as any); setTutorialStep(1); playSound('CLICK'); }}
                                className={`w-full py-2 text-[10px] font-bold rounded transition-all ${incomeType === t.type ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t.type}
                            </button>
                          </ActionTooltip>
                      ))}
                  </div>
                  {/* Helper for Step 2 */}
                  {tutorialStep === 1 && (
                      <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/50 rounded text-xs text-blue-200 flex items-center gap-2 animate-in fade-in">
                          <ArrowRight size={14} /> You need <span className="font-bold font-mono bg-blue-900 px-1 rounded">{activeTreaty.article}</span> for {incomeType}.
                      </div>
                  )}
              </div>

              {/* 4. Perfect Invoice Builder */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-slate-400 font-bold uppercase text-xs flex items-center gap-2"><FileCheck size={14}/> Invoice Compliance</h3>
                      <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500">Mandatory</span>
                  </div>
                  <div className="space-y-2">
                      <ActionTooltip title="Import Export Code" desc="IEC is mandatory for anyone exporting services. Without it, your bank cannot process inward remittances legally.">
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-600 transition-colors w-full h-auto">
                              <input type="checkbox" checked={invoiceChecklist.hasIEC} onChange={() => setInvoiceChecklist(p => ({...p, hasIEC: !p.hasIEC}))} className="accent-emerald-500"/>
                              <span className="text-xs text-slate-300">IEC Code (Import Export Code)</span>
                          </label>
                      </ActionTooltip>
                      <ActionTooltip title="Letter of Undertaking" desc="Reference Number of your filed LUT. This proves to the tax officer why you didn't charge 18% IGST on the invoice.">
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-600 transition-colors w-full h-auto">
                              <input type="checkbox" checked={invoiceChecklist.hasLUTRef} onChange={() => setInvoiceChecklist(p => ({...p, hasLUTRef: !p.hasLUTRef}))} className="accent-emerald-500"/>
                              <span className="text-xs text-slate-300">LUT Reference Number Printed</span>
                          </label>
                      </ActionTooltip>
                      <ActionTooltip title="Foreign Currency" desc="The invoice MUST be in USD (or foreign currency) to qualify as an 'Export of Service'. INR invoices are domestic and liable for GST.">
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-600 transition-colors w-full h-auto">
                              <input type="checkbox" checked={invoiceChecklist.hasCurrency} onChange={() => setInvoiceChecklist(p => ({...p, hasCurrency: !p.hasCurrency}))} className="accent-emerald-500"/>
                              <span className="text-xs text-slate-300">Invoiced in Foreign Currency (USD)</span>
                          </label>
                      </ActionTooltip>
                  </div>
              </div>

              {/* 2. Banking Pipeline */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <h3 className="text-slate-400 font-bold uppercase text-xs mb-4 flex items-center gap-2"><Banknote size={14}/> Banking Pipeline</h3>
                  
                  <div className="space-y-4">
                      {/* Route */}
                      <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-300">Payment Route</span>
                          <div className="flex gap-2 bg-slate-900 p-1 rounded">
                              <ActionTooltip title="SWIFT Network" desc="Old school. High fees ($20+). Slow (3-5 days). Bad exchange rates." className="w-auto">
                                <button onClick={() => setPaymentRoute('SWIFT')} className={`px-2 py-1 rounded text-[10px] font-bold ${paymentRoute === 'SWIFT' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>SWIFT</button>
                              </ActionTooltip>
                              <ActionTooltip title="Local Rails (ACH)" desc="Simulates a local US bank account (Wise/Payoneer). No SWIFT fees. Faster." className="w-auto">
                                <button onClick={() => setPaymentRoute('LOCAL')} className={`px-2 py-1 rounded text-[10px] font-bold ${paymentRoute === 'LOCAL' ? 'bg-emerald-900/50 text-emerald-400' : 'text-slate-500'}`}>Local</button>
                              </ActionTooltip>
                              <ActionTooltip title="USDC / Crypto" desc="Instant. Zero Spread. BUT: 30% Flat Tax (Sec 115BBH). FEMA Risk." className="w-auto">
                                <button onClick={() => setPaymentRoute('CRYPTO')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${paymentRoute === 'CRYPTO' ? 'bg-orange-900/50 text-orange-400' : 'text-slate-500'}`}><Bitcoin size={10}/> Crypto</button>
                              </ActionTooltip>
                          </div>
                      </div>

                      {/* Bank Type */}
                      <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-300">Bank Partner</span>
                          <div className="flex gap-2 bg-slate-900 p-1 rounded">
                              <ActionTooltip title="Traditional Bank" desc="HDFC/SBI/ICICI. Safe but high forex markup (2-3% spread)." className="w-auto">
                                <button onClick={() => setBankType('TRADITIONAL')} className={`px-3 py-1 rounded text-[10px] font-bold ${bankType === 'TRADITIONAL' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Trad Bank</button>
                              </ActionTooltip>
                              <ActionTooltip title="Neo Bank" desc="Digital first. Lower fees. Better UI. Lower forex markup (0.5-1%)." className="w-auto">
                                <button onClick={() => setBankType('NEOBANK')} className={`px-3 py-1 rounded text-[10px] font-bold ${bankType === 'NEOBANK' ? 'bg-blue-900/50 text-blue-400' : 'text-slate-500'}`}>Neo Bank</button>
                              </ActionTooltip>
                          </div>
                      </div>

                      {/* 3. Actions: Withdraw or EEFC */}
                      <div className="pt-2 border-t border-slate-700 grid grid-cols-2 gap-2">
                          <ActionTooltip title="Hold USD (EEFC)" desc="Keep funds in Dollar account. Wait for exchange rate to improve. Warning: RBI forces conversion after a few weeks.">
                            <button 
                                onClick={holdInEEFC}
                                className={`w-full text-[10px] py-2 rounded font-bold border flex items-center justify-center gap-1 ${remittanceProcessed ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50'}`}
                            >
                                Hold (EEFC)
                            </button>
                          </ActionTooltip>
                          <ActionTooltip title="Withdraw to Bank" desc="Convert to INR and deposit to your Global Bank Balance.">
                            <button 
                                onClick={withdrawToBank}
                                className={`w-full text-[10px] py-2 rounded font-bold border flex items-center justify-center gap-1 ${remittanceProcessed ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-900/30 border-emerald-500 text-emerald-300 hover:bg-emerald-900/50'}`}
                            >
                                Withdraw
                            </button>
                          </ActionTooltip>
                      </div>
                  </div>
              </div>

              {/* TAX HACKS */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <h3 className="text-slate-400 font-bold uppercase text-xs mb-4 flex items-center gap-2"><Percent size={14}/> Tax Optimization</h3>
                  
                  {/* 44ADA Switch */}
                  <div className="flex items-center justify-between mb-4">
                      <div>
                          <p className="text-xs text-white font-bold flex items-center gap-2">Section 44ADA <span className="text-[10px] bg-emerald-900 text-emerald-400 px-1 rounded">OP</span></p>
                          <p className="text-xs text-slate-500">Declare flat 50% profit. No audit.</p>
                      </div>
                      <ActionTooltip title="Presumptive Taxation" desc="The biggest benefit for Indian freelancers. If revenue < 75L, you can legally declare 50% of income as profit and pay tax only on that. No expense proof needed." className="w-auto">
                        <button 
                            onClick={() => setIs44ADA(!is44ADA)}
                            disabled={paymentRoute === 'CRYPTO'}
                            className={`w-10 h-5 rounded-full transition-colors relative ${is44ADA ? 'bg-emerald-500' : 'bg-slate-700'} ${paymentRoute === 'CRYPTO' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${is44ADA ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </ActionTooltip>
                  </div>
                  {paymentRoute === 'CRYPTO' && <p className="text-[10px] text-orange-500 mb-2">⚠️ 44ADA Disabled for Crypto Income (Sec 115BBH).</p>}

                  {/* 80C */}
                  <div className="flex items-center justify-between mb-4">
                      <div>
                          <p className="text-xs text-white font-bold">80C Deduction</p>
                          <p className="text-[10px] text-slate-500">Invest ₹1.5L in PPF/ELSS.</p>
                          {globalTaxRegime === 'NEW' && <p className="text-[10px] text-red-500">Disabled by New Regime</p>}
                      </div>
                      <ActionTooltip title="Tax Saving Investments" desc="Section 80C allows you to reduce taxable income by 1.5 Lakhs if you invest in PPF, ELSS Mutual Funds, or LIC." className="w-auto">
                        <button onClick={toggle80C} className={`text-[10px] px-3 py-1 rounded font-bold border ${deductions80C ? 'bg-blue-900/30 border-blue-500 text-blue-400' : globalTaxRegime === 'NEW' ? 'bg-slate-900 border-red-900 text-red-900 cursor-not-allowed opacity-50' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                            {deductions80C ? 'Applied' : 'Apply'}
                        </button>
                      </ActionTooltip>
                  </div>

                  {/* RCM & PT */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <ActionTooltip title="Reverse Charge Mechanism" desc="You pay GST on imports (like Zoom/Slack subscriptions) then claim credit. Mandatory for importers of service.">
                          <div className="bg-slate-900 p-2 rounded border border-slate-700 flex items-center justify-between cursor-help h-full">
                              <span className="text-[10px] text-slate-400">RCM Paid</span>
                              <input type="checkbox" checked={rcmPaid} onChange={() => setRcmPaid(!rcmPaid)} className="accent-blue-500"/>
                          </div>
                      </ActionTooltip>
                      <ActionTooltip title="Professional Tax" desc="State-level tax on professions (e.g., in Maharashtra/Karnataka). Mandatory ~₹2500/year.">
                          <div className="bg-slate-900 p-2 rounded border border-slate-700 flex items-center justify-between cursor-help h-full">
                              <span className="text-[10px] text-slate-400">Prof. Tax</span>
                              <input type="checkbox" checked={ptPaid} onChange={() => setPtPaid(!ptPaid)} className="accent-blue-500"/>
                          </div>
                      </ActionTooltip>
                  </div>

                  {/* Advance Tax */}
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-xs text-white font-bold flex items-center gap-2">Advance Tax <Calendar size={12}/></p>
                          <p className="text-[10px] text-slate-500">Pay quarterly to avoid interest.</p>
                      </div>
                      <ActionTooltip title="Pay As You Earn" desc="If tax liability > 10k, you must pay in installments (Jun/Sep/Dec/Mar). If you wait till year-end, you pay interest penalty (Sec 234B/C)." className="w-auto">
                        <button 
                            onClick={payAdvanceTax}
                            disabled={advanceTaxPaid}
                            className={`text-[10px] px-3 py-1 rounded font-bold border ${advanceTaxPaid ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-slate-900 border-red-500/50 text-red-400 hover:bg-slate-800'}`}
                        >
                            {advanceTaxPaid ? 'Paid' : 'Pay Now'}
                        </button>
                      </ActionTooltip>
                  </div>
              </div>

          </div>

          {/* RIGHT: VISUALIZER & FORMS (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
              
              {/* W-8BEN FORM (COMPACT) */}
              <div className={`bg-white text-slate-900 p-4 rounded-xl shadow-lg relative transition-all duration-500 ${tutorialStep >= 1 ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-purple-600 rounded-t-xl"></div>
                  
                  {msg && (
                      <div className={`mb-3 p-2 rounded text-xs font-bold text-center animate-in slide-in-from-top ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {status === 'fail' && <AlertCircle size={16} className="inline mr-1 mb-0.5"/>}
                          {status === 'success' && <CheckSquare size={16} className="inline mr-1 mb-0.5"/>}
                          {msg}
                      </div>
                  )}

                  <h3 className="font-bold text-sm mb-2 border-b border-slate-100 pb-1 flex justify-between items-center">
                      Form W-8BEN 
                      <span className="text-[10px] font-normal bg-slate-100 px-2 py-1 rounded text-slate-500">Certificate of Foreign Status</span>
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Line 1: Name</label>
                              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 p-1.5 rounded bg-slate-50 text-xs" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Country</label>
                              <div className="w-full border border-slate-300 p-1.5 rounded bg-slate-100 text-xs text-slate-500 cursor-not-allowed">India</div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Line 6: Foreign Tax ID <span className="text-red-500">*</span></label>
                              <div className="relative group">
                                  <input type="text" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} placeholder="ABCDE1234F" className="w-full border border-slate-300 p-1.5 rounded bg-slate-50 font-mono uppercase text-xs" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Line 10: Article <span className="text-red-500">*</span></label>
                              <div className={`relative group p-0.5 rounded transition-all ${tutorialStep === 2 ? 'ring-2 ring-blue-400 bg-blue-50 shadow-md' : ''}`}>
                                  <input 
                                    type="text" 
                                    value={formData.article} 
                                    onChange={e => { setFormData({...formData, article: e.target.value}); if(tutorialStep === 2) setTutorialStep(3); }} 
                                    placeholder={`e.g. ${activeTreaty.article}`} 
                                    className="w-full border border-slate-300 p-1.5 rounded bg-slate-50 focus:ring-1 focus:ring-purple-500 outline-none text-xs" 
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Permanent Establishment TRAP */}
                      <div className="bg-slate-100 p-2 rounded border border-slate-300 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={formData.hasPE} onChange={() => setFormData(p => ({...p, hasPE: !p.hasPE}))} className="w-3 h-3 accent-red-500"/>
                              <span className="text-[10px] font-bold text-slate-700">Line 5: I have a Permanent Establishment (Office) in the USA.</span>
                          </label>
                          <div title="Checking this implies you are liable for US Taxes.">
                              <Info size={12} className="text-slate-400"/>
                          </div>
                      </div>

                      <ActionTooltip title="Validate" desc="Submits form to the AI agent to check against US-India DTAA rules based on your inputs.">
                        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 w-full rounded transition-colors flex items-center justify-center gap-2 shadow-lg text-xs uppercase tracking-widest mt-1">
                            {status === 'checking' ? <RefreshCw className="animate-spin" size={12}/> : <FileCheck size={12}/>}
                            Sign & Submit
                        </button>
                      </ActionTooltip>
                  </form>
              </div>

              {/* 3. Net Landed Cost Visualizer (Expanded) */}
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative shadow-2xl">
                  <h3 className="text-slate-400 font-bold uppercase text-xs mb-6 text-center tracking-widest">Net Realization Waterfall</h3>
                  
                  <div className="space-y-3 text-xs relative z-10">
                      {/* Gross */}
                      <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Invoice Amount</span>
                          <span className="font-mono font-bold text-white text-base">${remittanceAmount.toLocaleString()}</span>
                      </div>
                      
                      {/* US Tax */}
                      <div className="flex justify-between items-center relative group">
                          <div className="absolute inset-0 bg-red-900/10 rounded -z-10" style={{width: `${usTaxRate*100}%`}}></div>
                          <span className="text-red-400 flex items-center gap-2"><AlertTriangle size={12}/> US Withholding ({usTaxRate*100}%)</span>
                          <span className="font-mono text-red-400">-${usTaxAmount.toFixed(0)}</span>
                          {!trcUploaded && <span className="text-[10px] text-red-500 absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black p-1 rounded transition-opacity">Upload TRC to lower this!</span>}
                      </div>

                      {/* SWIFT Fee */}
                      {swiftFee > 0 && (
                          <div className="flex justify-between items-center">
                              <span className="text-orange-400 flex items-center gap-2"><ArrowRight size={12}/> Network Fee</span>
                              <span className="font-mono text-orange-400">-${swiftFee}</span>
                          </div>
                      )}

                      {/* Forex Loss */}
                      <div className="flex justify-between items-center">
                          <span className="text-orange-400 flex items-center gap-2">
                              <RefreshCw size={12}/> Forex Spread ({bankType})
                              <SmartTooltip term="Spread" definition="The hidden fee banks charge by giving you a lower exchange rate than Google shows. Neo-Banks charge less."><HelpCircle size={10} className="text-slate-500"/></SmartTooltip>
                          </span>
                          <span className="font-mono text-orange-400">-${forexLoss.toFixed(0)}</span>
                      </div>

                      {/* GST Block */}
                      {gstBlocked > 0 && (
                          <div className="flex justify-between items-center bg-yellow-900/10 p-1 rounded">
                              <span className="text-yellow-500 flex items-center gap-2"><FileText size={12}/> GST Blocked (No LUT)</span>
                              <span className="font-mono text-yellow-500">-${gstBlocked.toFixed(0)}</span>
                          </div>
                      )}

                      <div className="h-px bg-slate-700 my-2"></div>

                      {/* Final Landed */}
                      <div className="flex justify-between items-center bg-emerald-900/10 p-2 rounded border border-emerald-500/20">
                          <span className="font-bold text-emerald-400 uppercase">Net Landed (USD)</span>
                          <span className="font-mono font-black text-emerald-400 text-lg">${finalLandedAmount.toFixed(0)}</span>
                      </div>

                      {/* Indian Tax Projection */}
                      <div className="mt-4 pt-4 border-t border-slate-800 opacity-75">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Indian Tax Projection (FY End)</p>
                          {hufCreated && (
                              <div className="flex justify-between items-center mb-1 text-[10px]">
                                  <span className="text-purple-400">HUF Allocation ({hufAllocation}%)</span>
                                  <span className="font-mono text-purple-400">Tax: ₹{hufTax.toLocaleString()}</span>
                              </div>
                          )}
                          <div className="flex justify-between items-center">
                              <span className="text-slate-400">Est. Tax Liability (Total)</span>
                              <span className="font-mono text-slate-200">₹{finalIncomeTax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                              <span className="text-slate-400">Take Home (INR)</span>
                              <span className="font-mono text-white font-bold">₹{Math.round(grossINR - finalIncomeTax).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 text-right mt-1">Exch Rate: ₹{inrRate.toFixed(2)}</div>
                          {taxPenalty > 0 && <p className="text-[10px] text-red-500 text-right mt-1">Includes Interest Penalty (Sec 234)</p>}
                          {paymentRoute === 'CRYPTO' && <p className="text-[10px] text-orange-500 text-right mt-1 font-bold">INCLUDES 30% CRYPTO TAX (115BBH) + 4% CESS</p>}
                          {poemImpact > 0 && <p className="text-[10px] text-red-500 text-right mt-1 font-bold">INCLUDES POEM PENALTY (DOUBLE TAX)</p>}
                      </div>
                  </div>
                  
                  <input 
                      type="range" min="1000" max={maxRemittance} step="1000"
                      value={remittanceAmount} 
                      onChange={(e) => setRemittanceAmount(Number(e.target.value))}
                      disabled={remittanceProcessed} // Lock slider if processed
                      className={`w-full mt-6 accent-emerald-500 h-1 bg-slate-800 rounded appearance-none relative z-10 ${remittanceProcessed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <div className="text-center text-[10px] text-slate-500 mt-2">Adjust Invoice Amount (Max: ${maxRemittance.toLocaleString()} based on Reputation)</div>
              </div>

              {/* FISCAL STRESS TEST REPORT (COMPACT) */}
              <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/30 relative flex items-center justify-between">
                  <div>
                      <h3 className="font-bold text-white text-xs flex items-center gap-2"><Scale size={14}/> Fiscal Stress Test</h3>
                      <p className="text-[10px] text-slate-400">Simulate 3-Year Audit Cycle.</p>
                  </div>
                  
                  <ActionTooltip title="The Ultimate Test" desc="Runs a simulation against Indian Tax Laws (Black Money Act, POEM, FEMA). If your structure is weak, you get fined.">
                    <button 
                        onClick={simulateAudit} 
                        disabled={simulatingAudit}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded-full shadow-lg flex items-center gap-2 disabled:opacity-50 text-xs"
                    >
                        {simulatingAudit ? <RefreshCw className="animate-spin" size={12}/> : <RefreshCw size={12}/>}
                        {simulatingAudit ? 'Auditing...' : 'Run Simulation'}
                    </button>
                  </ActionTooltip>
              </div>

          </div>
      </div>

    </div>
  );
};