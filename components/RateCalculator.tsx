import React, { useState } from 'react';
import { Calculator, ArrowRight, X } from 'lucide-react';
import { SmartTooltip } from './SmartTooltip';

interface RateCalculatorProps {
  onClose: () => void;
}

export const RateCalculator: React.FC<RateCalculatorProps> = ({ onClose }) => {
  const [targetIncome, setTargetIncome] = useState(5000); // Monthly Take-home
  const [expenses, setExpenses] = useState(500); // Business Expenses
  const [taxRate, setTaxRate] = useState(20); // Approx Tax %
  const [weeksOff, setWeeksOff] = useState(4); // Vacation + Sick
  const [billableRatio, setBillableRatio] = useState(70); // % of hours actually billable
  
  const calculateRate = () => {
      // 1. Annual Net Goal
      const annualNet = targetIncome * 12;
      // 2. Add Business Expenses (Annual)
      const annualExpenses = expenses * 12;
      // 3. Gross Revenue Needed (Pre-Tax) -> Gross * (1 - Tax) = Net + Exp
      const grossRevenue = (annualNet + annualExpenses) / (1 - (taxRate / 100));
      
      // 4. Available Hours
      const workWeeks = 52 - weeksOff;
      const totalHours = workWeeks * 40;
      const billableHours = totalHours * (billableRatio / 100);
      
      return Math.ceil(grossRevenue / billableHours);
  };

  const hourlyRate = calculateRate();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
       <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-cyan-500/50 shadow-2xl relative flex flex-col max-h-[85vh] md:max-h-[90vh]">
          
          <div className="bg-cyan-900/30 p-4 border-b border-cyan-500/30 flex justify-between items-center shrink-0 rounded-t-2xl">
              <h2 className="text-cyan-400 font-bold flex items-center gap-2">
                  <Calculator size={20} /> Freelance Rate Engine
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 flex-1">
             <p className="text-sm text-slate-400">
                 Don't guess your rate. Reverse-engineer it from your lifestyle goals.
             </p>

             <div className="space-y-4">
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Target Monthly Take-Home Pay ($)</label>
                     <input type="number" value={targetIncome} onChange={(e) => setTargetIncome(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Monthly Business Expenses ($)</label>
                     <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Est. Tax Rate (%)</label>
                        <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Weeks Off / Year</label>
                        <input type="number" value={weeksOff} onChange={(e) => setWeeksOff(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                    </div>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Billable Efficiency (%)</label>
                     <input type="range" min="10" max="100" value={billableRatio} onChange={(e) => setBillableRatio(Number(e.target.value))} className="w-full accent-cyan-500" />
                     <div className="text-right text-xs text-cyan-400">{billableRatio}% (Time spent actually coding/designing)</div>
                 </div>
             </div>

             <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center">
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Minimum Hourly Rate</div>
                 <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                     ${hourlyRate}
                 </div>
                 <div className="text-[10px] text-slate-600 mt-2">
                     *Based on {52 - weeksOff} working weeks/yr
                 </div>
             </div>
          </div>
          
       </div>
    </div>
  );
};