
import React, { useState, useEffect } from 'react';
import { Send, Star, RefreshCw, Trophy, ShieldAlert, CheckCircle, BrainCircuit, Activity, Lock, Unlock, PenTool, BarChart, PieChart as PieIcon, AlertTriangle, Eye, Mic, ArrowRight, MessageSquare, Briefcase } from 'lucide-react';
import { evaluatePitch, generateFinalExam, analyzePitchSection, generateClientObjection } from '../services/geminiService';
import { MissionBrief } from './MissionBrief';
import { SmartTooltip } from './SmartTooltip';
import { ActionTooltip } from './Level1_Foundations'; // Reusing existing UI helper
import { MentorPersona, FinalExamQuestion, PlayerState, ClientTrait, PitchSectionType, PitchEvaluation } from '../types';
import { playSound } from '../utils/sound';

interface BossProps {
    onComplete: () => void;
    addXP: (amount: number) => void;
    mentorPersona: MentorPersona;
    playerState: PlayerState;
}

const CLIENT_TRAITS: { id: ClientTrait, label: string, desc: string }[] = [
    { id: 'HATES_JARGON', label: 'No Fluff', desc: 'Hates buzzwords like "Synergy". Wants plain English.' },
    { id: 'VISUAL_LEARNER', label: 'Visual', desc: 'Needs charts. Text walls are ignored.' },
    { id: 'PRICE_SENSITIVE', label: 'Frugal', desc: 'Will negotiate hard. Needs high ROI proof.' },
    { id: 'DATA_DRIVEN', label: 'Analyst', desc: 'Trusts numbers over stories.' },
    { id: 'RISK_AVERSE', label: 'Cautious', desc: 'Needs social proof and guarantees.' }
];

export const FinalBoss: React.FC<BossProps> = ({ onComplete, addXP, mentorPersona, playerState }) => {
    const [stage, setStage] = useState<'GATEKEEPER' | 'AUDIT' | 'INTEL' | 'BUILDER' | 'NEGOTIATION'>('GATEKEEPER');

    // Stage 1: Quiz State
    const [questions, setQuestions] = useState<FinalExamQuestion[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    const [loadingQuiz, setLoadingQuiz] = useState(true);

    // Stage 2: Audit State
    const [auditResults, setAuditResults] = useState<{ passed: boolean, msg: string, stats: { name: string, val: string, pass: boolean }[] } | null>(null);

    // Stage 3: Intel
    const [revealedTraits, setRevealedTraits] = useState<ClientTrait[]>([]);
    const [intelPoints, setIntelPoints] = useState(3);

    // Stage 4: Builder
    const [activeSection, setActiveSection] = useState<PitchSectionType>('HOOK');
    const [pitchContent, setPitchContent] = useState({ HOOK: '', INSIGHT: '', ASK: '' });
    const [analysis, setAnalysis] = useState<Record<PitchSectionType, PitchEvaluation | null>>({ HOOK: null, INSIGHT: null, ASK: null });
    const [selectedChart, setSelectedChart] = useState<'BAR' | 'PIE' | 'NONE'>('NONE');
    const [listPrice, setListPrice] = useState(5000);
    const [discountPrice, setDiscountPrice] = useState(5000); // Anchoring logic
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [attachedItem, setAttachedItem] = useState<string | null>(null); // Inventory item ID

    // Stage 5: Negotiation
    const [clientObjection, setClientObjection] = useState<{ objection: string, correctRebuttal: string } | null>(null);
    const [negotiationTurn, setNegotiationTurn] = useState(0);
    const [finalDealStatus, setFinalDealStatus] = useState<'PENDING' | 'WON' | 'LOST'>('PENDING');

    // Load Exam
    useEffect(() => {
        const load = async () => {
            const q = await generateFinalExam();
            setQuestions(q);
            setLoadingQuiz(false);
        };
        load();
    }, []);

    // --- STAGE 1: GATEKEEPER LOGIC ---
    const handleQuizSubmit = () => {
        if (!selectedOpt) return;
        const currentQ = questions[currentQIndex];
        const isCorrect = currentQ.options.find(o => o.id === selectedOpt)?.isCorrect;
        if (isCorrect) { playSound('SUCCESS'); setQuizScore(s => s + 1); } else { playSound('ERROR'); }

        if (currentQIndex < questions.length - 1) {
            setTimeout(() => { setCurrentQIndex(i => i + 1); setSelectedOpt(null); }, 1000);
        } else {
            setTimeout(() => {
                if (quizScore >= 2) { setStage('AUDIT'); playSound('LEVEL_UP'); runAudit(); }
                else { alert("Failed Knowledge Check. Reloading..."); setCurrentQIndex(0); setQuizScore(0); setSelectedOpt(null); }
            }, 1000);
        }
    };

    // --- STAGE 2: AUDIT LOGIC ---
    const runAudit = () => {
        const stats = [
            { name: "Net Worth", val: `$${playerState.bankBalance.toLocaleString()}`, pass: playerState.bankBalance > 2000 },
            { name: "Reputation", val: `${playerState.reputation}/100`, pass: playerState.reputation > 40 },
            { name: "Stress Level", val: `${playerState.stress}%`, pass: playerState.stress < 90 }
        ];
        const passed = stats.every(s => s.pass);
        setAuditResults({
            passed,
            msg: passed ? "Audit Cleared. Client accepts meeting." : "Audit Failed. You look too risky.",
            stats
        });
    };

    // --- STAGE 3: INTEL LOGIC ---
    const revealTrait = () => {
        if (intelPoints > 0 && revealedTraits.length < CLIENT_TRAITS.length) {
            const available = CLIENT_TRAITS.filter(t => !revealedTraits.includes(t.id));
            const random = available[Math.floor(Math.random() * available.length)];
            setRevealedTraits(prev => [...prev, random.id]);
            setIntelPoints(p => p - 1);
            playSound('CLICK');
        }
    };

    // --- STAGE 4: BUILDER LOGIC ---
    const analyzeSection = async (type: PitchSectionType) => {
        if (!pitchContent[type]) return;
        setIsAnalyzing(true);
        const result = await analyzePitchSection(pitchContent[type], type, revealedTraits);
        setAnalysis(prev => ({ ...prev, [type]: result }));
        setIsAnalyzing(false);
        playSound('COIN');
    };

    const submitProposal = async () => {
        // Check chart logic
        if (revealedTraits.includes('VISUAL_LEARNER') && selectedChart === 'NONE') {
            alert("Client is Visual! You MUST attach a chart.");
            return;
        }
        if (revealedTraits.includes('DATA_DRIVEN') && selectedChart === 'PIE') {
            alert("Analysts hate Pie Charts! Use a Bar Chart.");
            return;
        }

        setStage('NEGOTIATION');
        playSound('LEVEL_UP');

        // Generate objection
        const fullPitch = `${pitchContent.HOOK} ${pitchContent.INSIGHT} ${pitchContent.ASK}`;
        const obj = await generateClientObjection(fullPitch);
        setClientObjection(obj);
    };

    // --- STAGE 5: NEGOTIATION LOGIC ---
    const handleRebuttal = (choice: string) => {
        if (!clientObjection) return;

        // Simple logic for demo: choice length determines 'correctness' relative to hint
        // In real app, we'd semantic match. Here, let's just assume option 1 is best for now or check hint words.
        const isCorrect = choice.toLowerCase().includes("social proof") || choice.toLowerCase().includes("value"); // Simplified check

        if (choice === "Walk Away") {
            setFinalDealStatus('WON'); // Power move
            playSound('VICTORY');
        } else {
            setFinalDealStatus('WON');
            playSound('VICTORY');
        }
    };

    if (finalDealStatus === 'WON') {
        return (
            <div className="text-center space-y-8 animate-in zoom-in duration-700 pt-12">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    DEAL CLOSED.
                </h1>
                <div className="bg-slate-800 p-8 rounded-2xl max-w-2xl mx-auto border border-emerald-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <div className="flex justify-center mb-4">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="text-yellow-400 fill-yellow-400 w-8 h-8" />)}
                    </div>
                    <p className="text-xl text-slate-300 italic">"Impressive data handling. The chart sealed it."</p>
                    <div className="mt-6 flex justify-center items-center gap-4">
                        <Trophy className="text-emerald-400" size={32} />
                        <p className="font-bold text-emerald-500 text-2xl">Contract Value: ${discountPrice.toLocaleString()} / mo</p>
                    </div>
                </div>
                <button onClick={onComplete} className="bg-white text-black font-bold py-4 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    Enter the Infinite Game
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">

            <MissionBrief
                title="The Final Pitch (Grandmaster)"
                rpgAnalogy="This is a Multi-Stage Boss Fight. Phase 1: Intel (Scouting). Phase 2: Build (Crafting). Phase 3: Battle (Dialogue). Use your Inventory items as 'consumables' to bypass checks."
                realWorldLesson="Sales is 80% listening (Intel) and 20% talking. 'Price Anchoring' sets the battlefield. 'Visuals' are your critical hits against data-driven clients."
                missionGoal="Construct a Perfect Proposal and Handle Objections."
                conceptTerm="Price Anchoring"
                mentorPersona={mentorPersona}
            />

            {/* PROGRESS BAR */}
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                {['GATEKEEPER', 'AUDIT', 'INTEL', 'BUILDER', 'NEGOTIATION'].map((s, i) => (
                    <div key={s} className={`flex flex-col items-center gap-1 ${stage === s ? 'text-emerald-400 scale-110' : 'text-slate-600'}`}>
                        <div className={`w-3 h-3 rounded-full ${stage === s ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                        <span className="text-[10px] font-bold">{s}</span>
                    </div>
                ))}
            </div>

            {/* --- STAGE 1 & 2 (Existing Quiz/Audit) --- */}
            {stage === 'GATEKEEPER' && (
                <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom">
                    {loadingQuiz ? <div className="text-center py-12"><RefreshCw className="animate-spin mx-auto" /></div> : (
                        <>
                            <h3 className="text-xl font-bold text-white mb-6">{questions[currentQIndex]?.question}</h3>
                            <div className="space-y-3 mb-8">
                                {questions[currentQIndex]?.options.map(opt => (
                                    <button key={opt.id} onClick={() => { setSelectedOpt(opt.id); playSound('CLICK'); }} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedOpt === opt.id ? 'bg-blue-900/50 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                                        {opt.text}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleQuizSubmit} disabled={!selectedOpt} className="w-full py-4 bg-white text-black font-bold rounded-lg">Submit</button>
                        </>
                    )}
                </div>
            )}

            {stage === 'AUDIT' && (
                <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">Financial Audit</h3>
                    {auditResults?.passed ? (
                        <button onClick={() => setStage('INTEL')} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-lg">Pass Audit {'->'} Intel Phase</button>
                    ) : <p className="text-red-500">Audit Failed.</p>}
                </div>
            )}

            {/* --- STAGE 3: INTEL GATHERING --- */}
            {stage === 'INTEL' && (
                <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Eye className="text-blue-400" /> Client Dossier</h3>
                        <div className="bg-blue-900/30 px-3 py-1 rounded text-blue-300 font-mono text-xs">Intel Points: {intelPoints}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        {CLIENT_TRAITS.map((trait) => {
                            const isRevealed = revealedTraits.includes(trait.id);
                            return (
                                <div key={trait.id} className={`p-4 rounded-lg border flex flex-col items-center text-center transition-all ${isRevealed ? 'bg-slate-800 border-blue-500' : 'bg-slate-950 border-slate-800 opacity-50'}`}>
                                    <div className="mb-2">{isRevealed ? <Unlock className="text-blue-400" /> : <Lock className="text-slate-600" />}</div>
                                    <p className="text-xs font-bold text-white">{isRevealed ? trait.label : '???'}</p>
                                    {isRevealed && <p className="text-[10px] text-slate-400 mt-1">{trait.desc}</p>}
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex justify-center gap-4">
                        <button onClick={revealTrait} disabled={intelPoints === 0} className="px-6 py-3 bg-blue-600 disabled:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-2">
                            <Eye size={16} /> Reveal Trait (-1 Point)
                        </button>
                        <button onClick={() => setStage('BUILDER')} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2">
                            Start Building Proposal <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- STAGE 4: PROPOSAL BUILDER --- */}
            {stage === 'BUILDER' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

                    {/* LEFT: SECTIONS */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Sections</h3>
                        {['HOOK', 'INSIGHT', 'ASK'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setActiveSection(s as PitchSectionType)}
                                className={`p-3 text-left rounded-lg border transition-all ${activeSection === s ? 'bg-blue-900/30 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-bold text-sm">{s}</span>
                                    {analysis[s as PitchSectionType] && (
                                        <span className={`text-xs font-bold ${analysis[s as PitchSectionType]!.score > 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                            {analysis[s as PitchSectionType]!.score}/100
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}

                        <div className="mt-auto pt-4 border-t border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Visual Evidence</h3>
                            <div className="flex gap-2">
                                <ActionTooltip title="Bar Chart" desc="Best for comparing data points (e.g. Revenue vs Cost).">
                                    <button onClick={() => setSelectedChart('BAR')} className={`flex-1 p-2 rounded border flex justify-center ${selectedChart === 'BAR' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}><BarChart size={16} /></button>
                                </ActionTooltip>
                                <ActionTooltip title="Pie Chart" desc="Best for showing composition. Bad for time series.">
                                    <button onClick={() => setSelectedChart('PIE')} className={`flex-1 p-2 rounded border flex justify-center ${selectedChart === 'PIE' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}><PieIcon size={16} /></button>
                                </ActionTooltip>
                            </div>
                        </div>

                        <div className="mt-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Attachments (Inventory)</h3>
                            <div className="flex gap-2 overflow-x-auto">
                                {playerState.inventory.slice(0, 3).map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setAttachedItem(item.id)}
                                        className={`text-[10px] px-2 py-1 rounded border ${attachedItem === item.id ? 'bg-purple-900/30 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                    >
                                        {item.name.substring(0, 10)}...
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTER: EDITOR */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><PenTool size={16} /> Writing: {activeSection}</h3>
                            <ActionTooltip title="AI Roast" desc="Get brutal feedback from Gemini 3 Pro on this specific section. Costs Energy.">
                                <button
                                    onClick={() => analyzeSection(activeSection)}
                                    disabled={isAnalyzing || !pitchContent[activeSection]}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded flex items-center gap-1"
                                >
                                    {isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <BrainCircuit size={12} />} Check Score
                                </button>
                            </ActionTooltip>
                        </div>

                        <textarea
                            value={pitchContent[activeSection]}
                            onChange={(e) => setPitchContent({ ...pitchContent, [activeSection]: e.target.value })}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                            placeholder={`Draft your ${activeSection} here...`}
                        />

                        {/* AI Feedback Overlay */}
                        {analysis[activeSection] && (
                            <div className="mt-4 bg-slate-800 p-3 rounded-lg border border-slate-700 animate-in slide-in-from-bottom">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xs font-bold uppercase ${analysis[activeSection]!.tone === 'ASSERTIVE' ? 'text-emerald-400' : 'text-orange-400'}`}>Tone: {analysis[activeSection]!.tone}</span>
                                    <span className="text-xs font-bold text-white">Score: {analysis[activeSection]!.score}</span>
                                </div>
                                <p className="text-xs text-slate-400 italic">"{analysis[activeSection]!.feedback}"</p>
                            </div>
                        )}

                        {/* PRICE ANCHORING (Only on ASK section) */}
                        {activeSection === 'ASK' && (
                            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded border border-slate-800">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">List Price (Anchor)</label>
                                    <input type="number" value={listPrice} onChange={(e) => setListPrice(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded text-slate-400 text-sm px-2 py-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-emerald-500 uppercase font-bold">Your Offer</label>
                                    <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(Number(e.target.value))} className="w-full bg-slate-900 border border-emerald-900 rounded text-emerald-400 text-sm px-2 py-1" />
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            {activeSection === 'ASK' ? (
                                <button onClick={submitProposal} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-full shadow-lg flex items-center gap-2">
                                    <Send size={16} /> Send Proposal
                                </button>
                            ) : (
                                <button
                                    onClick={() => setActiveSection(activeSection === 'HOOK' ? 'INSIGHT' : 'ASK')}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2"
                                >
                                    Next Section <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- STAGE 5: NEGOTIATION --- */}
            {stage === 'NEGOTIATION' && clientObjection && (
                <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Client Objection</h3>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-xs text-slate-500">Incoming Message</div>
                        <p className="text-lg text-white font-serif italic">"{clientObjection.objection}"</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs text-emerald-400 uppercase font-bold mb-2">Select Rebuttal Strategy</p>
                        <button onClick={() => handleRebuttal("Use Social Proof")} className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-left text-sm font-bold text-slate-300">
                            A. "We solved this for [Competitor]. Here is the case study."
                        </button>
                        <button onClick={() => handleRebuttal("Use Logic")} className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-left text-sm font-bold text-slate-300">
                            B. "The cost of inaction is higher than my fee."
                        </button>
                        <button onClick={() => handleRebuttal("Walk Away")} className="w-full p-3 bg-red-900/20 hover:bg-red-900/40 rounded border border-red-800 text-left text-sm font-bold text-red-400">
                            C. "That is my final price. I can refer you to a junior freelancer." (Walk Away)
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};
