
import React, { useState, useEffect } from 'react';
import { PropertyListing, MortgageOffer } from '../types';
import { DollarSign, Percent, Briefcase, FileCheck, PenTool, CheckCircle, XCircle, Clock, ShieldAlert, Gavel, Building2, Wallet } from 'lucide-react';
import { playSound } from '../utils/sound';
import { ActionTooltip } from './Level1_Foundations';
import { PortalTooltip } from './SmartTooltip';

// --- SUB-COMPONENT: BIDDING WAR ---
interface BiddingProps {
    property: PropertyListing;
    onAccept: (finalPrice: number) => void;
    onCancel: () => void;
}

export const RealEstate_Bidding: React.FC<BiddingProps> = ({ property, onAccept, onCancel }) => {
    const [currentBid, setCurrentBid] = useState(property.price);
    const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'COUNTER' | 'ACCEPTED' | 'REJECTED'>('IDLE');
    const [message, setMessage] = useState("Enter your offer amount.");
    const [round, setRound] = useState(0);

    const submitOffer = () => {
        setStatus('THINKING');
        // AI Logic Simulation
        setTimeout(() => {
            const spread = (property.price - currentBid) / property.price; // % below ask
            
            // 1. Instant Accept
            if (spread <= 0 && Math.random() > 0.3) {
                setStatus('ACCEPTED');
                setMessage("Seller accepted your offer!");
                playSound('SUCCESS');
                setTimeout(() => onAccept(currentBid), 1500);
                return;
            }

            // 2. Reject lowball
            if (spread > 0.2) {
                setStatus('REJECTED');
                setMessage("Seller was insulted by your lowball offer. They walked away.");
                playSound('ERROR');
                setTimeout(onCancel, 2000);
                return;
            }

            // 3. Counter Offer / Bidding War
            if (round < 2) {
                setStatus('COUNTER');
                const counter = Math.floor(currentBid + (property.price - currentBid) * 0.6);
                setCurrentBid(counter);
                setMessage("Seller counters: 'Best I can do is...'");
                setRound(r => r + 1);
                playSound('CLICK');
            } else {
                // Final decision
                if (spread < 0.05) {
                    setStatus('ACCEPTED');
                    setMessage("Seller sighs... 'Fine. Deal.'");
                    playSound('SUCCESS');
                    setTimeout(() => onAccept(currentBid), 1500);
                } else {
                    setStatus('REJECTED');
                    setMessage("Stalemate. Seller walked.");
                    playSound('ERROR');
                    setTimeout(onCancel, 2000);
                }
            }
        }, 1500);
    };

    return (
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl animate-in zoom-in">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Gavel className="text-yellow-500"/> Make an Offer</h3>
            <p className="text-sm text-slate-400 mb-6">Property: {property.name} (Ask: ${property.price.toLocaleString()})</p>
            
            <div className="bg-slate-950 p-4 rounded-lg mb-6 text-center border border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p>
                <p className={`font-mono text-lg font-bold ${status === 'ACCEPTED' ? 'text-emerald-400' : status === 'REJECTED' ? 'text-red-400' : 'text-blue-400'}`}>
                    {status === 'THINKING' ? 'Seller Thinking...' : message}
                </p>
            </div>

            {status !== 'ACCEPTED' && status !== 'REJECTED' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Your Bid ($)</label>
                        <input 
                            type="number" 
                            value={currentBid} 
                            onChange={(e) => setCurrentBid(Number(e.target.value))} 
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                            disabled={status === 'THINKING'}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-sm font-bold">Walk Away</button>
                        <button onClick={submitOffer} disabled={status === 'THINKING'} className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg">
                            Submit Offer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: MORTGAGE SHOP ---
interface MortgageProps {
    price: number;
    creditScore: number;
    onSelect: (loanDetails: { downPayment: number, loanAmount: number, rate: number, bank: string }) => void;
    onCash: () => void;
    onCancel: () => void;
}

export const RealEstate_Mortgage: React.FC<MortgageProps> = ({ price, creditScore, onSelect, onCash, onCancel }) => {
    
    const OFFERS: MortgageOffer[] = [
        { id: '1', bankName: 'MegaBank Corp', rate: 6.5, minCreditScore: 740, maxLTV: 80, closingCostPct: 3, desc: 'Low Rate. Strict Approval.' },
        { id: '2', bankName: 'Local Credit Union', rate: 7.2, minCreditScore: 680, maxLTV: 90, closingCostPct: 2, desc: 'Friendly. Low Down Payment.' },
        { id: '3', bankName: 'Sharky Lenders', rate: 12.0, minCreditScore: 500, maxLTV: 70, closingCostPct: 5, desc: 'Fast Cash. Predatory Rates.' },
    ];

    return (
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl animate-in zoom-in max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Building2 className="text-blue-500"/> Financing Options</h3>
            <p className="text-sm text-slate-400 mb-6">Price: ${price.toLocaleString()} | Your Credit: {creditScore}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {OFFERS.map(offer => {
                    const canQualify = creditScore >= offer.minCreditScore;
                    const downPayment = Math.floor(price * (1 - (offer.maxLTV / 100)));
                    
                    return (
                        <div key={offer.id} className={`p-4 rounded-xl border flex flex-col ${canQualify ? 'bg-slate-800 border-slate-600' : 'bg-slate-950 border-red-900 opacity-60'}`}>
                            <div className="mb-2">
                                <h4 className="font-bold text-white text-sm">{offer.bankName}</h4>
                                <p className="text-[10px] text-slate-400">{offer.desc}</p>
                            </div>
                            <div className="flex-1 space-y-1 mb-4">
                                <div className="flex justify-between text-xs"><span className="text-slate-500">Rate</span> <span className="text-emerald-400 font-bold">{offer.rate}%</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-500">Down</span> <span className="text-white">${downPayment.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-500">Score</span> <span className={canQualify ? 'text-green-500' : 'text-red-500'}>{offer.minCreditScore}+</span></div>
                            </div>
                            <button 
                                onClick={() => onSelect({ downPayment, loanAmount: price - downPayment, rate: offer.rate, bank: offer.bankName })}
                                disabled={!canQualify}
                                className={`w-full py-2 rounded text-xs font-bold ${canQualify ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                {canQualify ? 'Select' : 'Denied'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                <button onClick={onCancel} className="text-slate-500 hover:text-white text-sm underline">Cancel Deal</button>
                <div className="flex gap-4">
                    <ActionTooltip title="All Cash Offer" desc="Skip financing fees. Close instantly. Requires full balance.">
                        <button onClick={onCash} className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 px-6 py-2 rounded font-bold text-sm hover:bg-emerald-900/50 flex items-center gap-2">
                            <Wallet size={16}/> Pay Cash
                        </button>
                    </ActionTooltip>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: CLOSING CEREMONY (MINI-GAME) ---
interface ClosingProps {
    onSuccess: () => void;
    onFail: () => void;
}

export const RealEstate_Closing: React.FC<ClosingProps> = ({ onSuccess, onFail }) => {
    const [timeLeft, setTimeLeft] = useState(5);
    const [signedCount, setSignedCount] = useState(0);
    const REQUIRED_SIGNS = 5;
    
    // Generate random positions for buttons
    const [positions, setPositions] = useState<{top: string, left: string}[]>([]);

    useEffect(() => {
        // Init positions
        const newPos = Array(REQUIRED_SIGNS).fill(0).map(() => ({
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`
        }));
        setPositions(newPos);

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 0.1) {
                    clearInterval(timer);
                    onFail();
                    return 0;
                }
                return t - 0.1;
            });
        }, 100);
        return () => clearInterval(timer);
    }, []);

    const handleSign = (index: number) => {
        playSound('CLICK');
        setSignedCount(s => {
            const newCount = s + 1;
            if (newCount >= REQUIRED_SIGNS) {
                setTimeout(onSuccess, 500);
            }
            return newCount;
        });
        // Remove signed doc visual logic controlled by render
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
            <div className="relative w-full max-w-3xl h-[500px] border-4 border-slate-700 rounded-2xl bg-slate-800 shadow-2xl overflow-hidden cursor-crosshair">
                
                {/* HUD */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-slate-900 z-20 pointer-events-none">
                    <h3 className="text-xl font-black text-white uppercase italic">SIGN THE PAPERS!</h3>
                    <div className="flex items-center gap-4">
                        <div className="text-2xl font-mono text-emerald-400 font-bold">{signedCount}/{REQUIRED_SIGNS}</div>
                        <div className={`text-2xl font-mono font-bold ${timeLeft < 2 ? 'text-red-500 animate-ping' : 'text-white'}`}>
                            {timeLeft.toFixed(1)}s
                        </div>
                    </div>
                </div>

                {/* Documents */}
                {positions.map((pos, i) => (
                    i >= signedCount ? (
                        <button
                            key={i}
                            onClick={() => handleSign(i)}
                            style={{ top: pos.top, left: pos.left }}
                            className="absolute w-24 h-32 bg-white text-black text-[10px] p-2 shadow-lg rounded transform hover:scale-110 active:scale-95 transition-transform flex flex-col justify-end items-center border-2 border-slate-300 rotate-[-5deg]"
                        >
                            <div className="w-full h-1 bg-slate-200 mb-1"></div>
                            <div className="w-full h-1 bg-slate-200 mb-1"></div>
                            <div className="w-full h-1 bg-slate-200 mb-4"></div>
                            <div className="w-full border-b-2 border-red-500 text-red-600 font-bold uppercase">Sign Here</div>
                            <PenTool size={16} className="mt-1"/>
                        </button>
                    ) : null
                ))}

                {/* Background Decor */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <FileCheck size={200} />
                </div>
            </div>
        </div>
    );
};
