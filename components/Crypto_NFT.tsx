
import React, { useState } from 'react';
import { Hexagon, Image as ImageIcon, Sparkles, Tag, Flame, Activity, Layers, Search, Filter, Zap, Globe, LayoutGrid, List, Plus, Box, Smile, Eye, Coins, Check, AlertTriangle, Gauge } from 'lucide-react';
import { NftCollection, NftItem, Blockchain } from '../types';
import { ActionTooltip } from './Level1_Foundations';
import { PortalTooltip } from './SmartTooltip';
import { playSound } from '../utils/sound';

interface CryptoNFTProps {
    nftCollections: NftCollection[];
    myNfts: NftItem[];
    onMintNft: (collectionId: string, finalCost: number) => void;
    onSellNft: (id: string) => void;
    onDeployCollection?: (name: string, symbol: string, supply: number, price: number, layers: any) => void;
    onCollectRevenue?: (collectionId: string) => void;
}

// --- CREATOR STUDIO LAYERS ---
const LAYER_OPTIONS = {
    BG: ['bg-slate-800', 'bg-gradient-to-br from-purple-900 to-indigo-900', 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500', 'bg-[url("https://grainy-gradients.vercel.app/noise.svg")] bg-emerald-900'],
    BODY: ['Hexagon', 'Box', 'Circle'], // Using lucide icons
    EYES: ['Normal', 'Laser', 'Wink'],
    MOUTH: ['Smile', 'Neutral', 'Open']
};

export const Crypto_NFT: React.FC<CryptoNFTProps> = ({ nftCollections, myNfts, onMintNft, onSellNft, onDeployCollection, onCollectRevenue }) => {
    const [view, setView] = useState<'MARKET' | 'WALLET' | 'CREATE'>('MARKET');
    const [searchTerm, setSearchTerm] = useState('');
    const [chainFilter, setChainFilter] = useState<'ALL' | 'ETHEREUM' | 'SOLANA' | 'BASE' | 'BITCOIN' | 'POLYGON'>('ALL');

    // CREATOR STUDIO STATE
    const [layers, setLayers] = useState({ bg: 0, body: 0, eyes: 0, mouth: 0 });
    const [colName, setColName] = useState('');
    const [colSymbol, setColSymbol] = useState('');
    const [mintPrice, setMintPrice] = useState(0.05);
    const [supply, setSupply] = useState(1000);

    // GAS WAR STATE
    const [activeMintId, setActiveMintId] = useState<string | null>(null);
    const [gasPrice, setGasPrice] = useState(20); // Gwei
    const [networkDemand, setNetworkDemand] = useState(0); // 0-100
    const [isMinting, setIsMinting] = useState(false);

    const openGasWar = (id: string) => {
        setActiveMintId(id);
        setGasPrice(20);
        // Random demand based on Hype
        const col = nftCollections.find(c => c.id === id);
        setNetworkDemand(col ? Math.min(95, col.hype) : 50);
        playSound('CLICK');
    };

    const confirmMint = () => {
        if (!activeMintId) return;
        setIsMinting(true);
        
        // Simulation
        setTimeout(() => {
            const requiredGas = 20 + (networkDemand * 0.5); // Logic: Higher demand requires more gas
            if (gasPrice >= requiredGas) {
                // Success
                const col = nftCollections.find(c => c.id === activeMintId);
                const gasCostETH = (gasPrice * 21000) / 1000000000; // Simplified Gwei calc
                const basePrice = 2000; // Mock ETH price
                const gasUSD = gasCostETH * basePrice;
                
                // Add Mint Price (simplified USD conversion for game flow)
                // In a real app we'd convert SOL/MATIC prices. Assuming 1 ETH = $2000, 1 SOL = $100, 1 MATIC = $1 for simplicity
                let mintCostUSD = 0;
                if (col) {
                    if (col.chain === 'SOLANA') mintCostUSD = col.floorPrice * 100;
                    else if (col.chain === 'POLYGON') mintCostUSD = col.floorPrice * 1;
                    else if (col.chain === 'BITCOIN') mintCostUSD = col.floorPrice * 40000;
                    else mintCostUSD = col.floorPrice * 2000;
                }
                
                onMintNft(activeMintId, mintCostUSD + gasUSD);
            } else {
                // Fail
                playSound('ERROR');
                alert(`OUT OF GAS! Network required ${Math.ceil(requiredGas)} gwei. You paid ${gasPrice}. Transaction Reverted.`);
            }
            setIsMinting(false);
            setActiveMintId(null);
        }, 2000);
    };

    const getChainColor = (chain: Blockchain) => {
        switch(chain) {
            case 'ETHEREUM': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
            case 'SOLANA': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'BASE': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
            case 'BITCOIN': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
            case 'POLYGON': return 'text-violet-400 border-violet-500/30 bg-violet-500/10';
            case 'ARBITRUM': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
            default: return 'text-slate-400 border-slate-700';
        }
    };

    const getCurrencyLabel = (chain: Blockchain) => {
        if (chain === 'SOLANA') return 'SOL';
        if (chain === 'POLYGON') return 'MATIC';
        if (chain === 'BITCOIN') return 'BTC';
        return 'ETH';
    };

    const getRarityColor = (rarity: string) => {
        switch(rarity) {
            case 'LEGENDARY': return 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-amber-950/10';
            case 'RARE': return 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)] bg-blue-950/10';
            default: return 'border-slate-800 bg-slate-900';
        }
    };

    const getGasPriceDisplay = (chain: Blockchain) => {
        if (chain === 'ETHEREUM') return '15 gwei';
        if (chain === 'SOLANA') return '0.0005 SOL';
        if (chain === 'BITCOIN') return '50 sats/vB';
        if (chain === 'POLYGON') return '100 gwei';
        return '0.01 gwei';
    };

    // Filter Logic
    const filteredCollections = nftCollections.filter(c => 
        (chainFilter === 'ALL' || c.chain === chainFilter) &&
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNfts = myNfts.filter(n => {
        const col = nftCollections.find(c => c.id === n.collectionId);
        const matchesChain = chainFilter === 'ALL' || (col && col.chain === chainFilter);
        const matchesSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesChain && matchesSearch;
    });

    const portfolioValue = myNfts.reduce((acc, n) => acc + n.currentValuation, 0);
    const myCollections = nftCollections.filter(c => c.isUserCreated);

    const renderPreview = (scale = 1) => (
        <div className={`relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 flex items-center justify-center transition-all ${LAYER_OPTIONS.BG[layers.bg]}`} style={{ width: `${200 * scale}px`, height: `${200 * scale}px` }}>
            {/* Body */}
            <div className="absolute text-slate-200">
                {layers.body === 0 && <Hexagon size={120 * scale} fill="currentColor" className="opacity-80"/>}
                {layers.body === 1 && <Box size={120 * scale} fill="currentColor" className="opacity-80"/>}
                {layers.body === 2 && <div className="rounded-full bg-slate-200 opacity-80" style={{width: 120*scale, height: 120*scale}}></div>}
            </div>
            {/* Eyes */}
            <div className="absolute text-slate-900" style={{ top: '35%' }}>
                {layers.eyes === 0 && <div className="flex gap-4"><div className="w-4 h-4 bg-black rounded-full"></div><div className="w-4 h-4 bg-black rounded-full"></div></div>}
                {layers.eyes === 1 && <div className="flex gap-2"><div className="w-12 h-2 bg-red-500 shadow-[0_0_10px_red]"></div></div>}
                {layers.eyes === 2 && <div className="flex gap-4"><Eye size={32 * scale}/><Eye size={32 * scale}/></div>}
            </div>
            {/* Mouth */}
            <div className="absolute text-slate-900" style={{ bottom: '25%' }}>
                {layers.mouth === 0 && <Smile size={48 * scale}/>}
                {layers.mouth === 1 && <div className="w-12 h-2 bg-black rounded"></div>}
                {layers.mouth === 2 && <div className="w-8 h-8 bg-black rounded-full"></div>}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col relative">
            
            {/* GAS WAR MODAL */}
            {activeMintId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-purple-500 rounded-xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">GAS WAR ACTIVE</h2>
                            <p className="text-purple-300 text-xs font-mono">Mempool is congested. Pay priority fee to win.</p>
                        </div>

                        {/* Network Demand Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                <span>Network Congestion</span>
                                <span className={networkDemand > 80 ? 'text-red-500' : 'text-yellow-500'}>{networkDemand}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300 relative" style={{width: `${networkDemand}%`}}>
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Gas Slider */}
                        <div className="mb-8 p-4 bg-slate-800 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-white flex items-center gap-2"><FuelIcon /> Gas Price (Gwei)</span>
                                <span className="text-2xl font-mono text-purple-400 font-bold">{gasPrice}</span>
                            </div>
                            <input 
                                type="range" min="10" max="200" step="5" 
                                value={gasPrice} onChange={(e) => setGasPrice(Number(e.target.value))}
                                className="w-full accent-purple-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                                <span>Slow (10)</span>
                                <span>Standard (50)</span>
                                <span>Instant (200)</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setActiveMintId(null)} className="flex-1 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-lg font-bold">Cancel</button>
                            <button onClick={confirmMint} disabled={isMinting} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                                {isMinting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Zap size={16}/>}
                                {isMinting ? 'Broadcasting...' : 'Confirm Mint'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MARKET PULSE HEADER */}
            <div className="grid grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 shrink-0">
                <div className="flex items-center gap-3 border-r border-slate-800">
                    <div className="p-2 bg-blue-500/10 rounded text-blue-400"><Activity size={16} /></div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">24h Volume</p>
                        <p className="text-sm font-mono text-white font-bold">$12.4M</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-800">
                    <div className="p-2 bg-orange-500/10 rounded text-orange-400"><Flame size={16} /></div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Trending</p>
                        <p className="text-sm text-white font-bold truncate">Bored Apes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-800">
                    <div className="p-2 bg-purple-500/10 rounded text-purple-400"><Zap size={16} /></div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">ETH Gas</p>
                        <p className="text-sm font-mono text-white font-bold">18 gwei</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded text-emerald-400"><Globe size={16} /></div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Active Mints</p>
                        <p className="text-sm font-mono text-white font-bold">{nftCollections.length}</p>
                    </div>
                </div>
            </div>

            {/* CONTROL BAR */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setView('MARKET')} className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${view === 'MARKET' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Flame size={14}/> Live Mints
                    </button>
                    <button onClick={() => setView('WALLET')} className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${view === 'WALLET' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Layers size={14}/> Portfolio <span className="bg-slate-800 px-1.5 rounded text-[10px] text-emerald-400">${portfolioValue > 0 ? (portfolioValue/1000).toFixed(1) + 'k' : '0'}</span>
                    </button>
                    <button onClick={() => setView('CREATE')} className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${view === 'CREATE' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-purple-400'}`}>
                        <Plus size={14}/> Creator Studio
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none w-40"
                        />
                    </div>
                    <select 
                        value={chainFilter} 
                        onChange={(e) => setChainFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 outline-none"
                    >
                        <option value="ALL">All Chains</option>
                        <option value="ETHEREUM">Ethereum</option>
                        <option value="SOLANA">Solana</option>
                        <option value="BASE">Base</option>
                        <option value="POLYGON">Polygon</option>
                        <option value="BITCOIN">Bitcoin (Ordinals)</option>
                    </select>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="flex-1 overflow-y-auto pr-1 pb-20 scrollbar-thin scrollbar-thumb-slate-700">
                
                {/* --- LIVE MINTS VIEW --- */}
                {view === 'MARKET' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCollections.map(col => {
                            const mintedPct = Math.min(100, Math.floor((col.hype / 100) * 80) + 10); 
                            const isMine = col.isUserCreated;
                            
                            return (
                                <div key={col.id} className={`bg-slate-900 rounded-xl border p-4 relative group hover:border-slate-600 transition-all ${isMine ? 'border-purple-500/50' : 'border-slate-800'}`}>
                                    {isMine && <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">YOURS</span>}
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 relative overflow-hidden">
                                                {/* If user created, recreate mini preview */}
                                                {isMine && col.layerConfig ? (
                                                    <div className={`absolute inset-0 ${LAYER_OPTIONS.BG[col.layerConfig.bg as any]}`}></div>
                                                ) : (
                                                    <Hexagon size={20} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{col.name}</h3>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${getChainColor(col.chain)}`}>{col.chain}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Mint Price</div>
                                            <div className="font-mono font-bold text-white">{col.floorPrice} {getCurrencyLabel(col.chain)}</div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                        <div className="text-center">
                                            <p className="text-[9px] text-slate-500 uppercase">Supply</p>
                                            <p className="text-xs font-bold text-white">{col.supply}</p>
                                        </div>
                                        <div className="text-center border-l border-slate-800">
                                            <p className="text-[9px] text-slate-500 uppercase">Hype</p>
                                            <p className={`text-xs font-bold ${col.hype > 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>{col.hype}/100</p>
                                        </div>
                                        <div className="text-center border-l border-slate-800">
                                            <p className="text-[9px] text-slate-500 uppercase">Est Gas</p>
                                            <p className="text-xs font-bold text-slate-400">{getGasPriceDisplay(col.chain)}</p>
                                        </div>
                                    </div>

                                    {/* Mint Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>Minted</span>
                                            <span>{isMine ? ((col.mintedCount || 0) / col.supply * 100).toFixed(1) : mintedPct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000" style={{width: `${isMine ? ((col.mintedCount||0)/col.supply*100) : mintedPct}%`}}></div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {isMine ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-950 rounded p-1 text-center">
                                                <p className="text-[9px] text-slate-500">Unclaimed Rev</p>
                                                <p className="text-emerald-400 font-mono text-xs font-bold">{col.revenueCollected?.toFixed(3) || 0} ETH</p>
                                            </div>
                                            <button 
                                                onClick={() => onCollectRevenue && onCollectRevenue(col.id)}
                                                disabled={!col.revenueCollected || col.revenueCollected <= 0}
                                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded text-xs"
                                            >
                                                Claim Revenue
                                            </button>
                                        </div>
                                    ) : (
                                        <ActionTooltip title="Mint NFT" desc="Attempt to mint directly from contract. Rarity is revealed after transaction.">
                                            <button 
                                                onClick={() => openGasWar(col.id)}
                                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <Sparkles size={16} /> Mint Now
                                            </button>
                                        </ActionTooltip>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- PORTFOLIO VIEW --- */}
                {view === 'WALLET' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredNfts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                                <ImageIcon size={48} className="mb-4 opacity-50"/>
                                <p className="text-sm font-bold">Your gallery is empty.</p>
                                <p className="text-xs">Head to the Market to mint some JPEGs.</p>
                            </div>
                        )}
                        {filteredNfts.map(nft => (
                            <div key={nft.id} className={`rounded-xl p-3 border-2 flex flex-col relative group transition-transform hover:scale-[1.02] ${getRarityColor(nft.rarity)}`}>
                                
                                {/* Rarity Tag */}
                                <div className="absolute top-2 left-2 z-10">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shadow-sm ${nft.rarity === 'LEGENDARY' ? 'bg-amber-500 text-black' : nft.rarity === 'RARE' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                        {nft.rarity}
                                    </span>
                                </div>

                                {/* Image Placeholder */}
                                <div className="aspect-square w-full rounded-lg mb-3 flex items-center justify-center relative overflow-hidden bg-slate-800 border border-slate-700" style={{backgroundColor: nft.imageColor}}>
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                    <Hexagon size={64} className="text-white/20 drop-shadow-xl" />
                                    {nft.rarity === 'LEGENDARY' && <Sparkles className="absolute bottom-2 right-2 text-white animate-pulse" size={20}/>}
                                </div>

                                {/* Info */}
                                <div className="mb-3">
                                    <h4 className="font-bold text-white text-xs truncate mb-1">{nft.name}</h4>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] text-slate-500 uppercase">Est Value</p>
                                            <p className={`font-mono text-xs font-bold ${nft.currentValuation >= nft.purchasePrice ? 'text-emerald-400' : 'text-red-400'}`}>
                                                ${nft.currentValuation.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 uppercase">Cost</p>
                                            <p className="font-mono text-xs text-slate-400">${nft.purchasePrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <ActionTooltip title="Sell at Floor" desc="Instantly liquidate this NFT at the current collection floor price.">
                                    <button 
                                        onClick={() => onSellNft(nft.id)}
                                        className="mt-auto w-full py-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-300 hover:border-red-500 text-slate-300 rounded text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1 transition-all"
                                    >
                                        <Tag size={12}/> Paper Hand (Sell)
                                    </button>
                                </ActionTooltip>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- CREATOR STUDIO VIEW (NEW) --- */}
                {view === 'CREATE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                        
                        {/* LEFT: CANVAS & PREVIEW */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center relative">
                            <div className="absolute top-4 left-4 text-xs font-bold text-purple-400 uppercase tracking-widest">Generative Preview</div>
                            {renderPreview(1.5)}
                            <div className="mt-8 text-center">
                                <h2 className="text-2xl font-black text-white">{colName || "Untitled Project"}</h2>
                                <p className="text-slate-400 font-mono text-sm">{colSymbol || "SYMB"}</p>
                            </div>
                        </div>

                        {/* RIGHT: CONFIGURATION */}
                        <div className="space-y-6">
                            {/* Layer Selectors */}
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Layers size={16}/> Layer Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Background</label>
                                        <div className="flex gap-2">
                                            {LAYER_OPTIONS.BG.map((bg, i) => (
                                                <button key={i} onClick={() => setLayers(p => ({...p, bg: i}))} className={`w-8 h-8 rounded-full border-2 ${bg} ${layers.bg === i ? 'border-white scale-110' : 'border-transparent'}`}></button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Body Type</label>
                                        <div className="flex gap-2 bg-slate-800 p-1 rounded">
                                            {LAYER_OPTIONS.BODY.map((b, i) => (
                                                <button key={i} onClick={() => setLayers(p => ({...p, body: i}))} className={`flex-1 py-1 text-xs rounded ${layers.body === i ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>{b}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Eyes</label>
                                        <div className="flex gap-2 bg-slate-800 p-1 rounded">
                                            {LAYER_OPTIONS.EYES.map((b, i) => (
                                                <button key={i} onClick={() => setLayers(p => ({...p, eyes: i}))} className={`flex-1 py-1 text-xs rounded ${layers.eyes === i ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>{b}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Config */}
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Zap size={16}/> Smart Contract</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Name</label>
                                        <input type="text" value={colName} onChange={e => setColName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" placeholder="Bored Apes"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Symbol</label>
                                        <input type="text" value={colSymbol} onChange={e => setColSymbol(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" placeholder="BAYC"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Supply</label>
                                        <input type="number" value={supply} onChange={e => setSupply(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Mint Price (ETH)</label>
                                        <input type="number" value={mintPrice} onChange={e => setMintPrice(Number(e.target.value))} step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"/>
                                    </div>
                                </div>
                                <ActionTooltip title="Deploy Contract" desc="Costs $2,000 (Gas + Dev Fees). Launches your collection on the blockchain.">
                                    <button 
                                        onClick={() => onDeployCollection && onDeployCollection(colName, colSymbol, supply, mintPrice, layers)}
                                        disabled={!colName || !colSymbol}
                                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <RocketIcon /> Deploy Collection ($2,000)
                                    </button>
                                </ActionTooltip>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const RocketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);

const FuelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42l-1.82-1.82a2 2 0 0 0-1.42-.59H14"/></svg>
);
