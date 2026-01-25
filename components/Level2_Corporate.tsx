import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { PlusCircle, MinusCircle, CheckCircle, Activity, DollarSign, Briefcase, Handshake, XCircle, Repeat, CreditCard, Banknote, Globe, Search, User, Clock, AlertTriangle, Zap, Battery, FileWarning, TrendingDown, TrendingUp, Megaphone, Users, FileText, Settings, ShieldCheck, Mail, Radio, Bug, FastForward, Heart, RefreshCcw, Bell, MessageCircle, Shield, FileCheck, UserMinus, Lock, Coffee, RotateCcw, Info, X, ArrowRight } from 'lucide-react';
import { getMentorFeedback, getQuizScenario, negotiateContract, generateScopeCreep, generateUpsellOpportunity } from '../services/geminiService';
import { MissionBrief } from './MissionBrief';
import { QuizModal } from './QuizModal';
import { SmartTooltip } from './SmartTooltip';
import { ContractAnalyzer } from './ContractAnalyzer';
import { CharacterClass, InventoryItem, QuizQuestion, MentorPersona, ClientVibe, ActiveProject, ScopeCreepEvent, ProposalStrategy, MarketingChannel, StaffMember, StaffRole, UpsellOpportunity } from '../types';
import { playSound } from '../utils/sound';

interface Level2Props {
    onComplete: () => void;
    addXP: (amount: number) => void;
    characterClass: CharacterClass;
    unlockItem: (item: InventoryItem) => void;
    mentorPersona: MentorPersona;
    updateBank: (amount: number) => void;
    inventory: InventoryItem[];
    reputation: number;
    updateReputation: (amount: number) => void;
    bankBalance: number;
    forexRate: number;
    stress: number;
}

// Helper for Button Tooltips
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

const VIBES: { id: ClientVibe, label: string, desc: string, risk: number }[] = [
    { id: 'URGENT', label: 'Startups R Us (Urgent)', desc: 'Needs it yesterday. Pays well, but demanding.', risk: 0.2 },
    { id: 'CORPORATE', label: 'Big Corp Inc (Slow)', desc: 'Reliable but bureaucratic. Loves Net 60.', risk: 0.1 },
    { id: 'MICROMANAGER', label: 'Founder Dave', desc: 'Will text you at 3 AM. High scope creep risk.', risk: 0.8 },
    { id: 'CHILL', label: 'Cool Agency', desc: 'Trusts your work. Average pay.', risk: 0.1 },
    { id: 'BROKE', label: 'Bootstrap Bill', desc: 'Has "equity" but no cash. Run.', risk: 0.9 },
    // New Profiles
    { id: 'CORPORATE', label: 'Fintech Bros', desc: 'High budget, but wants "AI Blockchain" buzzwords.', risk: 0.3 },
    { id: 'CHILL', label: 'Non-Profit Org', desc: 'Low budget, high fulfillment. Very reliable.', risk: 0.05 },
    { id: 'URGENT', label: 'Crisis PR Firm', desc: 'Panic mode. Will pay 2x rate for immediate help.', risk: 0.4 }
];

export const Level2_Corporate: React.FC<Level2Props> = ({
    onComplete, addXP, characterClass, unlockItem, mentorPersona, updateBank, inventory, reputation, updateReputation, bankBalance, forexRate, stress
}) => {
    const [transactions, setTransactions] = useState<{ id: number, name: string, type: 'revenue' | 'expense', amount: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    // Game State
    const [energy, setEnergy] = useState(100);
    const [clientVibe, setClientVibe] = useState<ClientVibe | null>(null);
    const [activeProject, setActiveProject] = useState<ActiveProject | null>(null);
    const [scopeCreep, setScopeCreep] = useState<ScopeCreepEvent | null>(null);
    // Invoices now support 'isGhosted' status
    const [invoices, setInvoices] = useState<{ id: number, amount: number, term: number, client: string, risk: number, currencyVal: number, isGhosted?: boolean }[]>([]);

    // New States
    const [proposalStrategy, setProposalStrategy] = useState<ProposalStrategy>('VALUE_BASED');
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [caseStudies, setCaseStudies] = useState(0);
    const [burnRate, setBurnRate] = useState(0);
    const [pendingExpense, setPendingExpense] = useState<{ name: string, amount: number } | null>(null);

    // Negotiation State
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [bidAmount, setBidAmount] = useState(2000);
    const [paymentTerm, setPaymentTerm] = useState<'NET_0' | 'NET_30'>('NET_30');
    const [killFee, setKillFee] = useState(0);
    const [negotiationResult, setNegotiationResult] = useState<{ accepted: boolean, message: string } | null>(null);

    // New Mechanics States
    const [crunchMode, setCrunchMode] = useState(false);
    const [upsellOpp, setUpsellOpp] = useState<UpsellOpportunity | null>(null);
    const [marketingFatigue, setMarketingFatigue] = useState<Record<string, number>>({});
    const [referrals, setReferrals] = useState<string[]>([]);

    // Doormat Tracking
    const [freeScopeAccepted, setFreeScopeAccepted] = useState(0);

    // Advanced Level 2 Mechanics
    const [nonCompeteActive, setNonCompeteActive] = useState(false);
    const [poachingEvent, setPoachingEvent] = useState<StaffMember | null>(null);

    // Quiz State
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);

    // Contract Analyzer Side Quest
    const [showContractAnalyzer, setShowContractAnalyzer] = useState(false);
    const [contractQuestComplete, setContractQuestComplete] = useState(false);

    const initializeLevel = () => {
        let initialExp = 0;
        let expName = 'Setup Costs';
        if (characterClass === 'TECH_NOMAD') { initialExp = 100; expName = 'Server Hosting'; }
        else if (characterClass === 'CREATIVE_AGENCY') { initialExp = 600; expName = 'Adobe Suite'; }
        else if (characterClass === 'SAAS_FOUNDER') { initialExp = 1000; expName = 'Cloud Infrastructure'; }
        else if (characterClass === 'VIRTUAL_ASSISTANT') { initialExp = 50; expName = 'Productivity Tools'; }

        // Start with a pending expense to teach categorization
        setPendingExpense({ name: expName, amount: initialExp });
        setBurnRate(initialExp); // Base burn
    };

    // Init
    useEffect(() => {
        initializeLevel();
    }, [characterClass]);

    // PASSIVE ENERGY RECHARGE
    useEffect(() => {
        // Energy recharge affected by GLOBAL STRESS
        // Stress > 80: Recharge very slow (10s)
        // Stress > 50: Recharge slow (5s)
        // Stress low: Normal (3s)
        let rechargeInterval = 3000;
        if (stress > 80) rechargeInterval = 10000;
        else if (stress > 50) rechargeInterval = 5000;

        const timer = setInterval(() => {
            setEnergy(prev => Math.min(100, prev + 1));
        }, rechargeInterval);
        return () => clearInterval(timer);
    }, [stress]);

    const resetLevel = () => {
        setEnergy(100);
        setClientVibe(null);
        setActiveProject(null);
        setInvoices([]);
        setStaff([]);
        setCaseStudies(0);
        setIsNegotiating(false);
        setNonCompeteActive(false);
        setTransactions([]);
        initializeLevel();

        // Fix Soft-Lock: If broke, give seed grant
        if (bankBalance < 200) {
            updateBank(200);
            setFeedback("Sim Reset. Staff fired. Projects cleared. +$200 Seed Grant.");
        } else {
            setFeedback("Sim Reset. Staff fired. Projects cleared.");
        }

        playSound('CLICK');
    };

    // Invoice Aging & SaaS Bloat & Referral Logic & Staff Churn & Poaching & Non-Compete
    useEffect(() => {
        const timer = setInterval(() => {
            setInvoices(prev => prev.map(inv => {
                // Ghosting Logic: When term hits 0, 15% chance to become Ghosted
                let isGhosted = inv.isGhosted;
                if (inv.term === 1 && !isGhosted && Math.random() < 0.15) {
                    isGhosted = true;
                }
                return { ...inv, term: Math.max(-10, inv.term - 1), isGhosted };
            }));

            // SaaS Bloat (Random Event)
            if (Math.random() < 0.02) {
                setBurnRate(prev => {
                    const increase = 20;
                    setFeedback("⚠️ SaaS Bloat: A free trial expired. Burn rate +$20.");
                    return prev + increase;
                });
            }

            // Referral Generation (If High Rep)
            if (reputation > 70 && Math.random() < 0.05 && referrals.length < 3) {
                setReferrals(prev => [...prev, "Referral Lead"]);
                setFeedback("🌟 Happy Client sent a Referral!");
                playSound('SUCCESS');
            }

            // Staff Churn (If Bank Balance Low)
            if (staff.length > 0 && bankBalance < 500 && Math.random() < 0.05) {
                const leavingStaff = staff[0];
                setStaff(prev => prev.slice(1)); // One person quits
                setBurnRate(prev => Math.max(0, prev - leavingStaff.salary)); // FIX: Reduce burn rate
                setFeedback("❌ Staff QUIT! Payroll was unsure. Maintain cash buffer.");
                playSound('ERROR');
            }

            // POACHING EVENT (2% chance if you have staff)
            if (staff.length > 0 && !poachingEvent && Math.random() < 0.02) {
                const victim = staff[Math.floor(Math.random() * staff.length)];
                setPoachingEvent(victim);
                playSound('ERROR');
            }

            // NON-COMPETE LAWSUIT (1% chance)
            if (!nonCompeteActive && Math.random() < 0.01) {
                setNonCompeteActive(true);
                setFeedback("⚖️ LAW SUIT! Old client claims Non-Compete violation. Marketing blocked.");
                playSound('ERROR');
            }

        }, 1000); // 1 sec = 1 day for simulation speed
        return () => clearInterval(timer);
    }, [reputation, referrals.length, bankBalance, staff.length, poachingEvent, nonCompeteActive]);

    const calculateTotals = () => {
        const revenue = transactions.filter(t => t.type === 'revenue').reduce((acc, curr) => acc + curr.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        return { revenue, expense, profit: revenue - expense };
    };

    const { revenue, expense, profit } = calculateTotals();

    const data = [
        { name: 'Revenue', amount: revenue, fill: '#3b82f6', label: 'Inflow' },
        { name: 'Expenses', amount: expense, fill: '#ef4444', label: 'Outflow' },
        { name: 'Profit', amount: profit, fill: profit >= 0 ? '#10b981' : '#b91c1c', label: 'Growth' },
    ];

    const handleExpenseTag = (isDeductible: boolean) => {
        if (!pendingExpense) return;

        setTransactions(prev => [...prev, { id: Date.now(), name: pendingExpense.name, type: 'expense', amount: pendingExpense.amount }]);
        updateBank(-pendingExpense.amount);

        if (isDeductible) {
            addXP(50);
            setFeedback(`Categorized "${pendingExpense.name}" as Deductible. Tax Shield Active!`);
        } else {
            setFeedback(`Categorized "${pendingExpense.name}" as Personal. No Tax Benefit.`);
        }
        setPendingExpense(null);
    };

    const triggerMarketing = (channel: MarketingChannel | 'REFERRAL') => {
        if (nonCompeteActive) {
            setFeedback("⛔ BLOCKED by Non-Compete Lawsuit! Settle it first.");
            playSound('ERROR');
            return;
        }

        if (channel !== 'REFERRAL' && energy < 20) {
            setFeedback("Too tired to market yourself. Rest first.");
            playSound('ERROR');
            return;
        }

        let successChance = 0.3;
        let cost = 0;
        let energyCost = 20;

        // Referral Logic
        if (channel === 'REFERRAL') {
            if (referrals.length === 0) return;
            setReferrals(prev => prev.slice(1));
            successChance = 0.9;
            energyCost = 10;
        } else {
            // Check Fatigue
            const usage = marketingFatigue[channel] || 0;
            if (usage > 2) successChance *= 0.5; // Diminishing returns
            setMarketingFatigue(prev => ({ ...prev, [channel]: usage + 1 }));
        }

        if (channel === 'PAID_ADS') {
            cost = 500;
            if (bankBalance < cost) {
                setFeedback("Insufficient funds for Ads ($500).");
                playSound('ERROR');
                return;
            }
            successChance = 0.7;
            energyCost = 5;
        } else if (channel === 'COLD_EMAIL') {
            successChance = 0.2;
            energyCost = 30; // Grindy
        } else if (channel === 'NETWORKING') {
            successChance = 0.5 + (reputation / 200); // Scales with rep
            energyCost = 25;
        }

        updateBank(-cost);
        setEnergy(e => Math.max(0, e - energyCost));

        if (Math.random() < successChance) {
            // Randomly pick a vibe from the entire list
            setClientVibe(VIBES[Math.floor(Math.random() * VIBES.length)].id);
            setIsNegotiating(true);
            setNegotiationResult(null);
            setBidAmount(4000);
            setPaymentTerm('NET_30');
            setKillFee(0);
            setProposalStrategy('VALUE_BASED');
            playSound('CLICK');
            setFeedback(`Lead Acquired via ${channel}!`);
        } else {
            setFeedback(`Marketing (${channel}) Failed. Market saturated? Rotate channels.`);
            playSound('ERROR');
        }
    };

    const cycleLead = () => {
        if (energy < 5) {
            setFeedback("Not enough energy to find another lead.");
            return;
        }
        setEnergy(e => Math.max(0, e - 5));
        const randomVibe = VIBES[Math.floor(Math.random() * VIBES.length)];
        setClientVibe(randomVibe.id);
        playSound('CLICK');
        setFeedback("Cycling Lead... New profile found.");
    };

    const submitBid = async () => {
        setLoading(true);
        const hasTemplate = inventory.some(i => i.id === 'invoice_template');
        const caseStudyBuff = caseStudies * 500; // Each case study allows $500 more value perception

        // Strategy Impact
        let strategyBuff = 0;
        if (clientVibe === 'URGENT' && proposalStrategy === 'SPEED_PREMIUM') strategyBuff = 1000;
        if (clientVibe === 'CORPORATE' && proposalStrategy === 'VALUE_BASED') strategyBuff = 500;
        if (clientVibe === 'BROKE' && proposalStrategy === 'COST_PLUS') strategyBuff = 200;

        const effectiveBid = bidAmount - strategyBuff - caseStudyBuff; // Lower effective bid is easier to accept

        const result = await negotiateContract(
            characterClass,
            effectiveBid, // Pass the easier-to-swallow number to the AI logic simulation
            hasTemplate,
            clientVibe || 'CORPORATE',
            paymentTerm
        );

        // Override AI result logic slightly with our custom strategy buffs
        const finalAccept = result.accepted;

        if (finalAccept) {
            playSound('SUCCESS');
            setNegotiationResult({ accepted: true, message: result.message });

            const label = VIBES.find(v => v.id === clientVibe)?.label || 'Client';

            setActiveProject({
                id: Date.now().toString(),
                clientName: label,
                vibe: clientVibe || 'CORPORATE',
                contractValue: bidAmount,
                paymentTerm: paymentTerm,
                progress: 0,
                killFee: killFee,
                isOutsourced: false,
                bugs: 0,
                clientHappiness: 50 // Start neutral
            });
            setEnergy(e => Math.max(0, e - 20));
        } else {
            playSound('ERROR');
            setNegotiationResult({ accepted: false, message: result.message });
            setEnergy(e => Math.max(0, e - 10));
        }
        setLoading(false);
    };

    const workOnProject = () => {
        if (!activeProject) return;

        // BURNOUT CHECK
        if (energy < 10) {
            if (Math.random() < 0.1) { // 10% chance of collapse
                setEnergy(100);
                updateBank(-500); // Medical bill
                setFeedback("🚑 BURNOUT COLLAPSE! You were hospitalized. Lost $500 and time.");
                playSound('ERROR');
                return;
            }
        }

        let workSpeed = 10;
        let energyCost = 15;
        let bugRisk = 0;

        // Crunch Mode Logic
        if (crunchMode) {
            workSpeed = 25;
            energyCost = 40;
            bugRisk += 0.3; // High risk of bugs when rushing
        }

        // Staff Automation
        let staffProgress = 0;
        staff.forEach(s => {
            staffProgress += s.efficiencyBuff;
            if (Math.random() < s.bugRate) bugRisk += 0.2;
        });

        if (energy < energyCost && staffProgress === 0) {
            setFeedback("Too tired to work! Hire staff or Rest.");
            return;
        }

        // Bug Generation
        if (Math.random() < bugRisk) {
            setActiveProject(prev => prev ? ({ ...prev, bugs: prev.bugs + 1 }) : null);
            setFeedback("Bug created! Quality dropped.");
        }

        // Scope Creep Check
        if (Math.random() > 0.85 && !scopeCreep && activeProject.progress > 20) triggerScopeCreep();

        // Upsell Check
        if (Math.random() > 0.9 && !upsellOpp && activeProject.progress > 40) triggerUpsell();

        const totalProgress = workSpeed + staffProgress;
        setEnergy(e => Math.max(0, e - energyCost));

        if (activeProject.progress + totalProgress >= 100) {
            // Cap at 100, wait for delivery click
            setActiveProject(prev => prev ? ({ ...prev, progress: 100 }) : null);
        } else {
            setActiveProject(prev => prev ? ({ ...prev, progress: Math.min(100, prev.progress + totalProgress) }) : null);
            playSound('CLICK');
        }
    };

    const debugProject = () => {
        if (!activeProject || activeProject.bugs === 0 || energy < 20) return;
        setEnergy(e => e - 20);
        setActiveProject(prev => prev ? ({ ...prev, bugs: Math.max(0, prev.bugs - 1) }) : null);
        setFeedback("Bug fixed. Code is cleaner.");
        playSound('CLICK');
    };

    const hireStaff = (role: StaffRole) => {
        if (bankBalance < 200) {
            setFeedback("Not enough cash to pay recruiting fee ($200)!");
            playSound('ERROR');
            return;
        }

        let salary = 1000;
        let buff = 5;
        let bugRate = 0.05;

        if (role === 'JUNIOR_DEV') { salary = 1000; buff = 5; bugRate = 0.4; }
        else if (role === 'DESIGNER') { salary = 1200; buff = 5; bugRate = 0.1; }
        else if (role === 'SENIOR_DEV') { salary = 3000; buff = 15; bugRate = 0.01; }

        updateBank(-200); // Recruiting fee
        setStaff(prev => [...prev, { id: Date.now().toString(), role, salary, efficiencyBuff: buff, bugRate }]);
        setBurnRate(prev => prev + salary);
        setFeedback(`Hired ${role}. Burn rate increased by $${salary}/mo.`);
    };

    const handlePoaching = (match: boolean) => {
        if (!poachingEvent) return;
        if (match) {
            // Match Offer: Salary goes up 20%
            const raise = poachingEvent.salary * 0.2;
            setStaff(prev => prev.map(s => s.id === poachingEvent.id ? { ...s, salary: s.salary + raise } : s));
            setBurnRate(prev => prev + raise);
            setFeedback(`Matched offer. ${poachingEvent.role} stayed, but Burn Rate +$${raise}.`);
        } else {
            // Let go
            setStaff(prev => prev.filter(s => s.id !== poachingEvent.id));
            setBurnRate(prev => prev - poachingEvent.salary);
            setFeedback(`${poachingEvent.role} left for a better offer.`);
        }
        setPoachingEvent(null);
    };

    const settleNonCompete = () => {
        if (bankBalance >= 1000) {
            updateBank(-1000);
            setNonCompeteActive(false);
            setFeedback("Settled lawsuit for $1,000. Restriction lifted.");
            playSound('COIN');
        } else {
            setFeedback("Need $1,000 to settle!");
            playSound('ERROR');
        }
    };

    const pleadPoverty = () => {
        setNonCompeteActive(false);
        updateReputation(-20);
        setFeedback("Begged for mercy. Lawsuit dropped, but Reputation tanked (-20).");
        playSound('ERROR');
    };

    const burnoutRetreat = () => {
        if (bankBalance >= 2000) {
            updateBank(-2000);
            setEnergy(100);
            setFeedback("Vipassana Retreat complete. Energy restored to 100%.");
            playSound('SUCCESS');
        } else {
            setFeedback("Too poor for a retreat. Sleep instead.");
            playSound('ERROR');
        }
    };

    const createCaseStudy = () => {
        if (energy < 40) { setFeedback("Need 40 Energy to write a Case Study."); return; }
        setEnergy(e => e - 40);
        setCaseStudies(c => c + 1);
        addXP(300);
        setFeedback("Case Study Created! Future negotiation power increased.");
    };

    const auditVendors = () => {
        if (energy < 20) return;
        setEnergy(e => e - 20);
        const savings = Math.floor(burnRate * 0.1); // Save 10%
        setBurnRate(b => b - savings);
        setFeedback(`Vendor Audit Complete. Cut bloatware. Burn rate reduced by $${savings}/mo.`);
    };

    const triggerScopeCreep = async () => {
        const event = await generateScopeCreep();
        setScopeCreep(event);
        playSound('ERROR');
    };

    const triggerUpsell = async () => {
        const opp = await generateUpsellOpportunity();
        setUpsellOpp(opp);
    };

    const handleScopeCreep = (action: 'FREE' | 'CHARGE' | 'REFUSE') => {
        // 1. Apply Logic if Project Exists
        if (scopeCreep && activeProject) {
            if (action === 'FREE') {
                setActiveProject(prev => prev ? ({ ...prev, clientHappiness: Math.min(100, prev.clientHappiness + 20) }) : null);
                setFeedback("Client happy. Worked for free.");

                // DOORMAT MECHANIC
                setFreeScopeAccepted(prev => {
                    const newVal = prev + 1;
                    if (newVal > 2) {
                        // Transform Client
                        setActiveProject(curr => curr ? { ...curr, vibe: 'MICROMANAGER' } : null);
                        setFeedback("⚠️ Doormat Effect: You accepted too much free work. Client is now a MICROMANAGER.");
                        playSound('ERROR');
                    }
                    return newVal;
                });

            } else if (action === 'CHARGE') {
                setActiveProject(prev => prev ? ({ ...prev, contractValue: prev.contractValue + scopeCreep.impactCost, clientHappiness: Math.max(0, prev.clientHappiness - 10) }) : null);
                setFeedback("Client annoyed, but paying extra.");
            } else {
                setActiveProject(prev => prev ? ({ ...prev, clientHappiness: Math.max(0, prev.clientHappiness - 30) }) : null);
                setFeedback("Client furious.");
            }
        }

        // 2. ALWAYS Close Modal (Prevent Softlock)
        setScopeCreep(null);
    };

    const handleUpsell = (accept: boolean) => {
        // 1. Apply Logic
        if (upsellOpp && activeProject) {
            if (accept) {
                if (energy < upsellOpp.costEnergy) {
                    setFeedback("Not enough energy for upsell!");
                    // Do not close if just failing a check? No, close it to keep game flowing.
                    setUpsellOpp(null);
                    return;
                }
                setEnergy(e => Math.max(0, e - upsellOpp.costEnergy));
                setActiveProject(prev => prev ? ({ ...prev, contractValue: prev.contractValue + upsellOpp.potentialRevenue }) : null);
                setFeedback(`Upsell Sold! Contract value +$${upsellOpp.potentialRevenue}`);
                playSound('COIN');
            } else {
                setFeedback("Upsell declined. Focused on core scope.");
            }
        }
        // 2. ALWAYS Close Modal
        setUpsellOpp(null);
    };

    const completeProject = () => {
        if (!activeProject) return;
        if (activeProject.bugs > 0) {
            setFeedback(`Cannot deliver with ${activeProject.bugs} bugs! Debug first.`);
            playSound('ERROR');
            return;
        }

        // Invoice Creation
        const newInvoice = {
            id: Date.now(),
            amount: activeProject.contractValue,
            term: activeProject.paymentTerm === 'NET_30' ? 30 : 0,
            client: activeProject.clientName,
            risk: activeProject.vibe === 'BROKE' ? 0.5 : 0.1,
            currencyVal: activeProject.contractValue // Snapshot value
        };

        setInvoices(prev => [...prev, newInvoice]);

        // Reputation update
        const repChange = Math.floor(activeProject.clientHappiness / 10);
        updateReputation(repChange);

        // Try Retainer Upsell
        if (activeProject.clientHappiness > 80 && Math.random() > 0.5) {
            setFeedback("Project Delivered! Client LOVED it. They want a Retainer!");
            addXP(500);
        } else {
            setFeedback("Project Delivered. Invoice Sent.");
        }

        playSound('SUCCESS');
        setActiveProject(null);
        addXP(1000);

        // Trigger Quiz sometimes
        if (Math.random() > 0.7) {
            setTimeout(async () => {
                const q = await getQuizScenario("Client Payment Dispute");
                setQuizQuestion(q);
                setShowQuiz(true);
            }, 2000);
        }
    };

    const collectInvoice = (id: number) => {
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;

        if (inv.term > 0) {
            // Early collect (Factoring)
            const fee = inv.amount * 0.05;
            const payout = inv.amount - fee;
            updateBank(payout);
            setTransactions(prev => [...prev, { id: Date.now(), name: `Factored: ${inv.client}`, type: 'revenue', amount: payout }]);
            setFeedback(`Invoice Factored. Paid $${fee.toFixed(0)} fee for instant cash.`);
        } else {
            updateBank(inv.amount);
            setTransactions(prev => [...prev, { id: Date.now(), name: `Payment: ${inv.client}`, type: 'revenue', amount: inv.amount }]);
        }
        setInvoices(prev => prev.filter(i => i.id !== id));
        playSound('COIN');
    };

    const chaseInvoice = (id: number) => {
        if (energy < 20) return;
        setEnergy(e => e - 20);
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, isGhosted: false, term: 5 } : i)); // Reset term slightly
        setFeedback("Chased client. They promised to pay soon.");
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-12 relative">
            <MissionBrief
                title="The Corporate Engine"
                rpgAnalogy="Your business is an engine. Revenue is fuel. Expenses are friction. Profit is acceleration. If you run out of fuel (Cash), the engine stops (Game Over)."
                realWorldLesson="Accounting is the language of business. You must separate 'Revenue' (Sales) from 'Cashflow' (Money in Bank). Net 30 terms mean you work today but get paid next month. Manage your 'Burn Rate'."
                missionGoal="Generate $2,500 in Profit and unlock the 'Pro Invoice' tool."
                conceptTerm="Profit and Loss"
                mentorPersona={mentorPersona}
            />

            {showContractAnalyzer && (
                <ContractAnalyzer
                    onClose={() => setShowContractAnalyzer(false)}
                    onComplete={(score) => {
                        setShowContractAnalyzer(false);
                        setContractQuestComplete(true);
                        addXP(score);
                        setFeedback(`Contract Review Complete. Score: ${score}`);
                    }}
                />
            )}

            {showQuiz && quizQuestion && (
                <QuizModal
                    question={quizQuestion}
                    onPass={() => { setShowQuiz(false); addXP(200); }}
                    onFail={() => { setShowQuiz(false); updateReputation(-10); }}
                />
            )}

            {/* POACHING EVENT OVERLAY */}
            {poachingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-red-500 rounded-xl p-6 max-w-md text-center animate-shake">
                        <UserMinus className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-white mb-2">Headhunter Alert!</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            A competitor offered your <strong>{poachingEvent.role}</strong> a 20% raise. They will leave unless you match it.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => handlePoaching(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold">Match (+20% Cost)</button>
                            <button onClick={() => handlePoaching(false)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold">Let Them Go</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                    <div className="bg-emerald-900/20 p-3 rounded-full text-emerald-400">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Bank Balance</p>
                        <p className={`text-2xl font-mono font-bold ${bankBalance < 500 ? 'text-red-500 animate-pulse' : 'text-white'}`}>${bankBalance.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                    <div className="bg-blue-900/20 p-3 rounded-full text-blue-400">
                        <Activity size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs uppercase font-bold mb-1">
                            <span className="text-slate-500">Energy {stress > 50 && <span className="text-red-400 animate-pulse">(Slowed by Stress)</span>}</span>
                            <span className={energy < 30 ? 'text-red-400' : 'text-blue-400'}>{energy}%</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${energy < 30 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${energy}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-slate-500 uppercase font-bold flex items-center gap-1">
                            Burn Rate
                            <SmartTooltip term="Burn Rate" definition="The speed at which your business spends money every month. High burn = You go broke fast.">
                                <Info size={10} className="text-slate-500" />
                            </SmartTooltip>
                        </span>
                        <span className="text-red-400 font-mono">-${burnRate}/mo</span>
                    </div>
                    <div className="flex gap-1">
                        <ActionTooltip title="Cut Costs" desc="Review recurring expenses and cancel unused SaaS tools. Saves ~10%.">
                            <button onClick={auditVendors} className="w-full flex-1 text-[10px] bg-slate-900 text-slate-400 py-1 rounded border border-slate-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                                <Search size={10} /> Audit
                            </button>
                        </ActionTooltip>
                        <ActionTooltip title="Restore Energy" desc="Pay $2,000 to instantly refill Energy bar to 100%. Cheaper than a hospital visit.">
                            <button onClick={burnoutRetreat} className="w-full flex-1 text-[10px] bg-emerald-900/20 text-emerald-400 py-1 rounded border border-emerald-500/30 hover:text-white transition-colors flex items-center justify-center gap-1">
                                <Coffee size={10} /> Retreat ($2k)
                            </button>
                        </ActionTooltip>
                    </div>
                </div>
            </div>

            {/* Main Game Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: ACTIONS */}
                <div className="space-y-4">
                    {/* Marketing Deck */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative">
                        {nonCompeteActive && (
                            <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-center p-4">
                                <Lock className="text-red-500 mb-2" />
                                <p className="text-xs font-bold text-red-400 mb-2">Marketing Locked by Lawsuit</p>
                                <div className="flex gap-2">
                                    <button onClick={settleNonCompete} className="bg-white text-red-900 text-xs font-bold py-2 px-4 rounded-full hover:bg-slate-200">Settle ($1,000)</button>
                                    <button onClick={pleadPoverty} className="bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold py-2 px-4 rounded-full hover:bg-slate-700">Plead Poverty (-Rep)</button>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Megaphone size={14} /> Lead Generation</h3>
                            <ActionTooltip title="Reset Level" desc="Restart this level from scratch. Lose progress, reset cash.">
                                <button onClick={resetLevel} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1"><RotateCcw size={10} /> Reset</button>
                            </ActionTooltip>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <ActionTooltip title="Cold Email" desc="Free but low success rate. Drains Energy. Good for beginners.">
                                <button onClick={() => triggerMarketing('COLD_EMAIL')} className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded text-left border border-slate-700 transition-colors">
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Cold Email</div>
                                    <div className="text-xs font-bold text-white">Free / Slow</div>
                                </button>
                            </ActionTooltip>
                            <ActionTooltip title="Paid Ads" desc="High success rate but costs $500 cash. Fast results.">
                                <button onClick={() => triggerMarketing('PAID_ADS')} className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded text-left border border-slate-700 transition-colors">
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Paid Ads ($500)</div>
                                    <div className="text-xs font-bold text-emerald-400">Fast / Costly</div>
                                </button>
                            </ActionTooltip>
                            <ActionTooltip title="Networking" desc="Moderate success. Costs Energy. Improves with higher Reputation.">
                                <button onClick={() => triggerMarketing('NETWORKING')} className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded text-left border border-slate-700 transition-colors">
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Networking</div>
                                    <div className="text-xs font-bold text-blue-400">High Energy</div>
                                </button>
                            </ActionTooltip>
                            <ActionTooltip title="Client Referrals" desc="High quality leads. Only available if you have happy past clients.">
                                <button onClick={() => triggerMarketing('REFERRAL')} disabled={referrals.length === 0} className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded text-left border border-slate-700 transition-colors disabled:opacity-50 relative">
                                    <div className="text-[10px] text-slate-400 uppercase mb-1">Referrals</div>
                                    <div className="text-xs font-bold text-purple-400">{referrals.length} Available</div>
                                    {referrals.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>}
                                </button>
                            </ActionTooltip>
                        </div>
                    </div>

                    {/* Staffing Deck */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Users size={14} /> Team ({staff.length})</h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {staff.map((s) => (
                                <div key={s.id} className="flex justify-between items-center text-xs bg-slate-950 p-2 rounded">
                                    <span className="text-slate-300">{s.role}</span>
                                    <span className="text-red-400">-${s.salary}/mo</span>
                                </div>
                            ))}
                            {staff.length === 0 && <p className="text-xs text-slate-600 italic">No employees. You are solo.</p>}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <ActionTooltip title="Junior Dev" desc="Cheap ($1k/mo) but high bug rate. Good for simple tasks.">
                                <button onClick={() => hireStaff('JUNIOR_DEV')} className="w-full text-[10px] py-1 bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700">Hire Jr Dev ($1k)</button>
                            </ActionTooltip>
                            <ActionTooltip title="Designer" desc="Moderate cost ($1.2k/mo). Improves client happiness.">
                                <button onClick={() => hireStaff('DESIGNER')} className="w-full text-[10px] py-1 bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700">Hire Designer ($1.2k)</button>
                            </ActionTooltip>
                        </div>
                    </div>

                    {/* Pending Expense (Categorization) */}
                    {pendingExpense && (
                        <div className="bg-slate-800 border-l-4 border-yellow-500 p-4 rounded-r-xl animate-in slide-in-from-left">
                            <h4 className="font-bold text-white text-sm mb-1">Expense Alert: {pendingExpense.name}</h4>
                            <p className="text-xs text-slate-400 mb-3">Amount: <span className="text-white font-mono">${pendingExpense.amount}</span></p>
                            <p className="text-[10px] text-slate-500 mb-2">How do you tag this?</p>
                            <div className="flex gap-2">
                                <ActionTooltip title="Business Expense" desc="Reduces taxable profit. Must be legitimate business cost.">
                                    <button onClick={() => handleExpenseTag(true)} className="flex-1 bg-emerald-900/30 text-emerald-400 text-xs py-2 rounded font-bold hover:bg-emerald-900/50 border border-emerald-500/30">
                                        Business (Tax Safe)
                                    </button>
                                </ActionTooltip>
                                <button onClick={() => handleExpenseTag(false)} className="flex-1 bg-slate-700 text-slate-300 text-xs py-2 rounded font-bold hover:bg-slate-600">
                                    Personal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* CENTER: PROJECT & NEGOTIATION */}
                <div className="space-y-6">
                    {isNegotiating ? (
                        <div className="bg-slate-800 p-6 rounded-xl border-2 border-blue-500 shadow-2xl animate-in zoom-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Handshake className="text-blue-400" /> Contract Negotiation</h3>
                                <button
                                    onClick={cycleLead}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300 border border-slate-600 flex items-center gap-1"
                                    title="Spend 5 Energy to find a different client type"
                                >
                                    <RefreshCcw size={12} /> Next Lead (-5 Energy)
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Client Profile</p>
                                    <div className="bg-slate-900 p-2 rounded text-sm text-slate-300">
                                        {VIBES.find(v => v.id === clientVibe)?.label || clientVibe}
                                        <br />
                                        <span className="text-xs text-slate-500 italic">{VIBES.find(v => v.id === clientVibe)?.desc}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Your Bid ($)</label>
                                    <input type="range" min="1000" max="10000" step="500" value={bidAmount} onChange={(e) => setBidAmount(Number(e.target.value))} className="w-full accent-blue-500" />
                                    <div className="text-center font-mono text-xl font-bold text-white">${bidAmount}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Payment Terms</label>
                                        <div className="flex bg-slate-900 p-1 rounded">
                                            <ActionTooltip title="Net 0" desc="Immediate payment. Clients hate this. Lowers acceptance chance.">
                                                <button onClick={() => setPaymentTerm('NET_0')} className={`w-full flex-1 text-[10px] py-1 rounded ${paymentTerm === 'NET_0' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Immediate</button>
                                            </ActionTooltip>
                                            <ActionTooltip title="Net 30" desc="Payment after 30 days. Standard corporate term. Increases acceptance chance.">
                                                <button onClick={() => setPaymentTerm('NET_30')} className={`w-full flex-1 text-[10px] py-1 rounded ${paymentTerm === 'NET_30' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Net 30</button>
                                            </ActionTooltip>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Strategy</label>
                                        <select value={proposalStrategy} onChange={(e) => setProposalStrategy(e.target.value as ProposalStrategy)} className="w-full bg-slate-900 text-white text-xs p-1.5 rounded border border-slate-700 outline-none">
                                            <option value="VALUE_BASED">Value Based</option>
                                            <option value="COST_PLUS">Cost Plus</option>
                                            <option value="SPEED_PREMIUM">Speed Premium</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <ActionTooltip title="Send Proposal" desc="Submits your terms to the client. AI determines if they accept based on your Strategy and Price.">
                                <button onClick={submitBid} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                                    {loading ? 'Negotiating...' : 'Send Proposal'} <MessageCircle size={16} />
                                </button>
                            </ActionTooltip>

                            {negotiationResult && (
                                <div className={`mt-4 p-3 rounded text-xs text-center font-bold ${negotiationResult.accepted ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {negotiationResult.message}
                                    {negotiationResult.accepted && (
                                        <button onClick={() => { setIsNegotiating(false); }} className="block mx-auto mt-2 underline opacity-80">Start Project</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : activeProject ? (
                        <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30 relative overflow-hidden">
                            {/* Project Header */}
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{activeProject.clientName}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">{activeProject.paymentTerm.replace('_', ' ')}</span>
                                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400">${activeProject.contractValue}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Happiness</div>
                                    <div className={`font-bold ${activeProject.clientHappiness > 80 ? 'text-emerald-400' : activeProject.clientHappiness < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {activeProject.clientHappiness}%
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6 relative z-10">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Completion</span>
                                    <span className="text-white">{activeProject.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden relative border border-slate-700">
                                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${activeProject.progress}%` }}></div>
                                    {activeProject.bugs > 0 && (
                                        <div className="absolute top-0 right-0 h-full bg-red-500/50 animate-pulse" style={{ width: `${Math.min(100, activeProject.bugs * 10)}%` }}></div>
                                    )}
                                </div>
                                {activeProject.bugs > 0 && <p className="text-[10px] text-red-400 mt-1 text-right flex items-center justify-end gap-1"><Bug size={10} /> {activeProject.bugs} Bugs Found</p>}
                            </div>

                            {/* Action Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                                <button onClick={workOnProject} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
                                    <Briefcase size={18} /> Work
                                </button>
                                <button onClick={debugProject} disabled={activeProject.bugs === 0} className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform disabled:opacity-50">
                                    <Bug size={18} /> Debug
                                </button>
                            </div>

                            <div className="flex justify-between items-center relative z-10">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={crunchMode} onChange={() => setCrunchMode(!crunchMode)} className="accent-red-500" />
                                    <SmartTooltip term="Crunch Mode" definition="Doubles work speed but increases Energy drain and Bug generation chance.">
                                        <span className={`text-xs font-bold ${crunchMode ? 'text-red-400' : 'text-slate-500'}`}>Crunch Mode</span>
                                    </SmartTooltip>
                                </label>

                                {activeProject.progress >= 100 && (
                                    <button onClick={completeProject} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-xs animate-bounce">
                                        Deliver & Invoice
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                            <Briefcase size={48} className="text-slate-600 mb-4" />
                            <h3 className="text-slate-400 font-bold">No Active Project</h3>
                            <p className="text-xs text-slate-500 mb-6">Use Marketing to find leads.</p>
                            <button onClick={() => setEnergy(e => Math.min(100, e + 50))} className="bg-blue-900/20 text-blue-400 px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-900/40 transition-colors flex items-center gap-2">
                                <Battery size={14} /> Rest & Recover
                            </button>
                        </div>
                    )}

                    {/* Feedback Toast */}
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 min-h-[40px] flex items-center justify-center text-center">
                        {feedback || "System: Ready for operations."}
                    </div>
                </div>

                {/* RIGHT: FINANCIALS */}
                <div className="space-y-6">
                    {/* P&L Chart */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 h-48">
                        <h3 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Profit & Loss</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Invoices List */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[10px] text-slate-500 uppercase font-bold">Accounts Receivable</h3>
                            <span className="text-[10px] text-emerald-400">Forex: ₹{forexRate.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-slate-700">
                            {invoices.length === 0 && <p className="text-xs text-slate-600 text-center py-4">No pending invoices.</p>}
                            {invoices.map((inv) => (
                                <div key={inv.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group">
                                    <div>
                                        <p className="text-xs font-bold text-slate-300">{inv.client}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-slate-500 font-mono">${inv.amount}</p>
                                            {inv.term > 0 ? (
                                                <span className={`text-[8px] px-1 rounded ${inv.isGhosted ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'}`}>
                                                    {inv.isGhosted ? 'GHOSTED' : `Net ${inv.term}`}
                                                </span>
                                            ) : (
                                                <span className="text-[8px] px-1 rounded bg-emerald-900 text-emerald-400">Due Now</span>
                                            )}
                                        </div>
                                    </div>

                                    {inv.isGhosted ? (
                                        <button onClick={() => chaseInvoice(inv.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded transition-colors" title="Follow Up">
                                            <Bell size={14} />
                                        </button>
                                    ) : inv.term > 0 ? (
                                        <button onClick={() => collectInvoice(inv.id)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white rounded transition-colors" title="Factor Invoice (5% fee)">
                                            <RefreshCcw size={14} />
                                        </button>
                                    ) : (
                                        <button onClick={() => collectInvoice(inv.id)} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors">
                                            <DollarSign size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        {!contractQuestComplete && (
                            <button onClick={() => setShowContractAnalyzer(true)} className="text-xs text-slate-500 underline hover:text-white flex items-center justify-center gap-1">
                                <ShieldCheck size={12} /> Review Master Agreement (Side Quest)
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* SCOPE CREEP OVERLAY - GLOBAL */}
            {scopeCreep && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full text-center shadow-2xl relative">
                        {/* Fail-safe Close Button */}
                        <button
                            onClick={() => setScopeCreep(null)}
                            className="absolute top-2 right-2 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
                        <h4 className="font-bold text-white mb-2 text-xl">{scopeCreep.title}</h4>

                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 max-h-40 overflow-y-auto">
                            <p className="text-sm text-slate-300 italic">"{scopeCreep.description}"</p>
                        </div>

                        <div className="space-y-3 w-full">
                            <button onClick={() => handleScopeCreep('FREE')} className="w-full py-4 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 text-sm font-bold rounded-lg border border-emerald-500/50 transition-all hover:scale-[1.02]">
                                Do it for Free <span className="text-xs font-normal opacity-70 block">(Reputation +, Doormat Risk)</span>
                            </button>
                            <button onClick={() => handleScopeCreep('CHARGE')} className="w-full py-4 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-sm font-bold rounded-lg border border-blue-500/50 transition-all hover:scale-[1.02]">
                                Charge Extra <span className="text-xs font-normal opacity-70 block">(Cash +, Client Sad)</span>
                            </button>
                            <button onClick={() => handleScopeCreep('REFUSE')} className="w-full py-4 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-bold rounded-lg border border-red-500/50 transition-all hover:scale-[1.02]">
                                Refuse <span className="text-xs font-normal opacity-70 block">(Client Furious)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPSELL OVERLAY - GLOBAL */}
            {upsellOpp && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-emerald-950/90 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-6 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

                        {/* Fail-safe Close Button */}
                        <button
                            onClick={() => setUpsellOpp(null)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <TrendingUp className="mx-auto text-emerald-400 mb-4" size={48} />
                        <h4 className="font-bold text-white mb-2 text-xl">Opportunity: {upsellOpp.title}</h4>
                        <p className="text-sm text-emerald-200 mb-6 px-4">{upsellOpp.description}</p>

                        <div className="flex justify-center gap-4 text-sm font-mono font-bold mb-8 bg-slate-950 p-4 rounded-lg mx-4">
                            <span className="text-emerald-400 flex items-center gap-1"><DollarSign size={14} /> +{upsellOpp.potentialRevenue}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-blue-400 flex items-center gap-1"><Zap size={14} /> -{upsellOpp.costEnergy} Energy</span>
                        </div>

                        <div className="flex gap-4 w-full px-4">
                            <button onClick={() => handleUpsell(true)} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                                Pitch Upsell
                            </button>
                            <button onClick={() => handleUpsell(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700">
                                Ignore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {profit > 2500 && (
                <div className="flex justify-center mt-8 animate-bounce">
                    <button onClick={() => {
                        unlockItem({ id: 'invoice_template', name: 'Pro Invoice Template', description: 'Increases Trust', icon: 'FileText', buff: '+10% Win Rate' });
                        onComplete();
                    }} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2">
                        Claim Victory & Level Up <CheckCircle size={20} />
                    </button>
                </div>
            )}

        </div>
    );
};