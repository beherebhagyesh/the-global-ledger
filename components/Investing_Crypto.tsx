
import React, { useState } from 'react';
import { CryptoAsset, MiningRig, PowerSource, TokenProject, LeveragePosition, LiquidityPool, NftCollection, NftItem } from '../types';
import { Crypto_Exchange } from './Crypto_Exchange';
import { Crypto_Futures } from './Crypto_Futures';
import { Crypto_DeFi } from './Crypto_DeFi';
import { Crypto_NFT } from './Crypto_NFT';
import { Crypto_Mining } from './Crypto_Mining';
import { Crypto_Launchpad } from './Crypto_Launchpad';

interface InvestingCryptoProps {
    assets: CryptoAsset[];
    bankBalance: number;
    rigs: MiningRig[];
    powerSources: PowerSource[];
    myToken: TokenProject | null;
    positions: LeveragePosition[];
    pools: LiquidityPool[];
    esgScore: number;
    nftCollections: NftCollection[];
    myNfts: NftItem[];
    gasPrice: number;
    
    // Actions
    onTrade: (symbol: string, action: 'BUY' | 'SELL', amount: number) => void;
    onStake: (symbol: string) => void;
    onWalletToggle: (symbol: string) => void;
    onBuyRig: (rig: MiningRig) => void;
    onBuyPower: (power: PowerSource) => void;
    onCreateToken: (project: TokenProject, cost: number) => void;
    onMarketing: (type: 'BOTS' | 'INFLUENCER' | 'COMMUNITY') => void; // Keeping for legacy compatibility but updated wrapper will use onTokenAction
    onRugPull: () => void;
    onTokenAction: (action: string, cost: number) => void; // NEW
    onOpenLeverage: (symbol: string, amount: number, leverage: number, type: 'LONG' | 'SHORT', tp?: number, sl?: number) => void;
    onCloseLeverage: (id: string) => void;
    onJoinPool: (poolId: string, amount: number, isZap: boolean) => void;
    onFlashLoan: () => void;
    onMintNft: (collectionId: string, finalCost: number) => void;
    onSellNft: (id: string) => void;
    onDeployCollection?: (name: string, symbol: string, supply: number, price: number, layers: any) => void;
    onCollectRevenue?: (collectionId: string) => void;
    onScanContract: (symbol: string) => void;
    onToggleInsurance: (poolId: string) => void;
    onToggleAutoCompound: (poolId: string) => void;
    onBorrow: (poolId: string, amount: number) => void;
    onRepay: (poolId: string, amount: number) => void;
    onVote: (poolId: string) => void;
}

export const Investing_Crypto: React.FC<InvestingCryptoProps> = (props) => {
    const [tab, setTab] = useState<'EXCHANGE' | 'FUTURES' | 'DEFI' | 'NFT' | 'MINING' | 'LAUNCHPAD'>('EXCHANGE');

    return (
        <div className="h-full flex flex-col">
            {/* Crypto Navigation */}
            <div className="flex gap-2 mb-4 bg-slate-900 p-1 rounded-lg self-start overflow-x-auto max-w-full">
                <button onClick={() => setTab('EXCHANGE')} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${tab === 'EXCHANGE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Spot Exchange</button>
                <button onClick={() => setTab('NFT')} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${tab === 'NFT' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}>NFT Marketplace</button>
                <button onClick={() => setTab('FUTURES')} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${tab === 'FUTURES' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>Futures (50x)</button>
                <button onClick={() => setTab('DEFI')} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${tab === 'DEFI' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>DeFi Farms</button>
                <button onClick={() => setTab('MINING')} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${tab === 'MINING' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Mining Farm</button>
                <button onClick={() => setTab('LAUNCHPAD')} className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap ${tab === 'LAUNCHPAD' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>ICO Launchpad</button>
            </div>

            {tab === 'EXCHANGE' && (
                <Crypto_Exchange 
                    assets={props.assets} 
                    onTrade={props.onTrade} 
                    onStake={props.onStake} 
                    onWalletToggle={props.onWalletToggle} 
                    onScanContract={props.onScanContract}
                />
            )}

            {tab === 'NFT' && (
                <Crypto_NFT 
                    nftCollections={props.nftCollections} 
                    myNfts={props.myNfts} 
                    onMintNft={props.onMintNft} 
                    onSellNft={props.onSellNft} 
                    onDeployCollection={props.onDeployCollection}
                    onCollectRevenue={props.onCollectRevenue}
                />
            )}

            {tab === 'FUTURES' && (
                <Crypto_Futures 
                    assets={props.assets} 
                    positions={props.positions} 
                    bankBalance={props.bankBalance} 
                    onOpenLeverage={props.onOpenLeverage} 
                    onCloseLeverage={props.onCloseLeverage} 
                />
            )}

            {tab === 'DEFI' && (
                <Crypto_DeFi 
                    pools={props.pools} 
                    bankBalance={props.bankBalance} 
                    onJoinPool={props.onJoinPool} 
                    onFlashLoan={props.onFlashLoan}
                    gasPrice={props.gasPrice}
                    onToggleInsurance={props.onToggleInsurance}
                    onToggleAutoCompound={props.onToggleAutoCompound}
                    onBorrow={props.onBorrow}
                    onRepay={props.onRepay}
                    onVote={props.onVote}
                />
            )}

            {tab === 'MINING' && (
                <Crypto_Mining 
                    rigs={props.rigs} 
                    powerSources={props.powerSources} 
                    esgScore={props.esgScore} 
                    onBuyRig={props.onBuyRig} 
                    onBuyPower={props.onBuyPower} 
                />
            )}

            {tab === 'LAUNCHPAD' && (
                <Crypto_Launchpad 
                    myToken={props.myToken} 
                    bankBalance={props.bankBalance} 
                    onCreateToken={props.onCreateToken} 
                    onTokenAction={props.onTokenAction}
                />
            )}
        </div>
    );
};
