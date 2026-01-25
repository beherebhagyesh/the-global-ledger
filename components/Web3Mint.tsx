
import React, { useState, useEffect } from 'react';
import { connectWallet, generateMetadata, getSmartContractCode, signMessage } from '../services/web3Service';
import { PlayerState, NFTMetadata } from '../types';
import { Hexagon, Link, FileJson, ShieldCheck, CheckCircle, Loader2, X, Copy, Terminal, Database, Wallet, ArrowRight, PenTool } from 'lucide-react';
import { playSound } from '../utils/sound';

interface Web3MintProps {
  player: PlayerState;
  onClose: () => void;
}

type Step = 'CONNECT' | 'METADATA' | 'CONTRACT' | 'SIGN' | 'MINT' | 'SUCCESS';

export const Web3Mint: React.FC<Web3MintProps> = ({ player, onClose }) => {
  const [step, setStep] = useState<Step>('CONNECT');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Connect
  const handleConnect = async () => {
      try {
          setError(null);
          // Simulation fallback if no window.ethereum for demo purposes, or real call
          if (!window.ethereum) {
             // Simulating connection for users without metamask to see the flow
             setTimeout(() => {
                 setWalletAddress("0x71C...9A23");
                 setStep('METADATA');
                 playSound('CLICK');
             }, 1000);
             return;
          }

          const addr = await connectWallet();
          if (addr) {
              setWalletAddress(addr);
              setStep('METADATA');
              playSound('CLICK');
          }
      } catch (e: any) {
          setError(e.message);
          playSound('ERROR');
      }
  };

  // Step 2: Generate Metadata
  useEffect(() => {
      if (step === 'METADATA' && !metadata) {
          const data = generateMetadata(player);
          setMetadata(data);
      }
  }, [step, player, metadata]);

  // Step 3 -> 4
  const handleSign = async () => {
      if (!walletAddress) return;
      try {
          // If simulated wallet
          if (walletAddress === "0x71C...9A23") {
              setSignature("0xabc123...");
              setStep('MINT');
              playSound('SUCCESS');
              return;
          }

          const sig = await signMessage(walletAddress, "Verify ownership for Global Ledger Credential");
          setSignature(sig);
          setStep('MINT');
          playSound('SUCCESS');
      } catch (e: any) {
          setError("Signature rejected");
          playSound('ERROR');
      }
  };

  // Step 5: Mint Simulation
  useEffect(() => {
      if (step === 'MINT') {
          const timer = setTimeout(() => {
              setTxHash("0x9f8a...3b21");
              setStep('SUCCESS');
              playSound('VICTORY');
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
        <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col max-h-[90vh] relative overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-full text-indigo-400">
                        <Hexagon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Web3 Credential Mint</h2>
                        <p className="text-xs text-slate-400">Immutable Proof of Skill on Blockchain</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X/></button>
            </div>

            {/* Progress Steps */}
            <div className="flex border-b border-slate-800 bg-slate-900">
                {['CONNECT', 'METADATA', 'CONTRACT', 'SIGN', 'MINT'].map((s, i) => {
                    const stepIdx = ['CONNECT', 'METADATA', 'CONTRACT', 'SIGN', 'MINT', 'SUCCESS'].indexOf(step);
                    const currentIdx = ['CONNECT', 'METADATA', 'CONTRACT', 'SIGN', 'MINT'].indexOf(s);
                    return (
                        <div key={s} className={`flex-1 py-2 text-[10px] font-bold text-center border-b-2 ${stepIdx >= currentIdx ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-600'}`}>
                            {s}
                        </div>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
                
                {step === 'CONNECT' && (
                    <div className="text-center py-10">
                        <Wallet size={64} className="mx-auto text-slate-600 mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Connect Wallet</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">To mint your credential as an NFT, you need an Ethereum-compatible wallet (Metamask, Rabby, etc).</p>
                        <button onClick={handleConnect} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 mx-auto transition-transform hover:scale-105">
                            <Link size={18}/> Connect Metamask
                        </button>
                        {error && <p className="text-red-400 mt-4 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
                    </div>
                )}

                {step === 'METADATA' && metadata && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Database size={18} /> <span className="font-bold">Generating IPFS Metadata...</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                            <pre>{JSON.stringify(metadata, null, 2)}</pre>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={() => { setStep('CONTRACT'); playSound('CLICK'); }} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                Approve Metadata <ArrowRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'CONTRACT' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Terminal size={18} /> <span className="font-bold">Smart Contract Interaction</span>
                        </div>
                        <p className="text-sm text-slate-400">You are interacting with the <span className="text-white font-mono">GlobalLedgerCredential</span> ERC-721 contract.</p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 h-48 overflow-y-auto">
                            {getSmartContractCode()}
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={() => { setStep('SIGN'); playSound('CLICK'); }} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                Review Transaction <ArrowRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'SIGN' && (
                    <div className="text-center py-10">
                        <ShieldCheck size={64} className="mx-auto text-indigo-500 mb-6 animate-pulse" />
                        <h3 className="text-2xl font-bold text-white mb-2">Sign Message</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">Cryptographically prove you own wallet <span className="font-mono text-white bg-slate-800 px-1 rounded">{walletAddress}</span> to authorize minting.</p>
                        <button onClick={handleSign} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 mx-auto transition-transform hover:scale-105">
                            <PenTool size={18}/> Sign & Mint
                        </button>
                        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
                    </div>
                )}

                {step === 'MINT' && (
                    <div className="text-center py-20">
                        <Loader2 size={64} className="mx-auto text-indigo-500 animate-spin mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Minting on Blockchain...</h3>
                        <p className="text-slate-400">Confirming transaction. Please wait.</p>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="text-center py-10">
                        <CheckCircle size={80} className="mx-auto text-emerald-500 mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                        <h3 className="text-3xl font-black text-white mb-2">MINT CONFIRMED</h3>
                        <p className="text-slate-400 mb-8">Your credential is now eternal on the blockchain.</p>
                        
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-w-sm mx-auto mb-8 text-left">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Transaction Hash</p>
                            <div className="flex justify-between items-center">
                                <span className="font-mono text-emerald-400 text-sm">{txHash}</span>
                                <Copy size={14} className="text-slate-600 cursor-pointer hover:text-white" />
                            </div>
                        </div>

                        <button onClick={onClose} className="bg-slate-800 text-white font-bold py-3 px-8 rounded-xl border border-slate-700 hover:bg-slate-700">
                            Close Wallet
                        </button>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};
