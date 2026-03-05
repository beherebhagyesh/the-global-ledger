import { useState, useEffect, useCallback } from 'react';
import {
    MentorPersona, ActiveOption, PropertyListing, OwnedProperty,
    CryptoAsset, StartupOpportunity, PortfolioHistory, Stock,
    AlgoBot, LimitOrder, OptionType, MiningRig, PowerSource,
    TokenProject, LeveragePosition, LiquidityPool, NftCollection,
    NftItem, WhaleAlert, StartupRegion, StartupSector
} from '../types';
import { generateRealEstateListing, generateStartupPitch } from '../services/geminiService';
import { playSound } from '../utils/sound';

const genCryptoHistory = (price: number, vol: number) => {
    const hist = [];
    let p = price;
    for (let i = 0; i < 20; i++) {
        p = p * (1 + (Math.random() - 0.5) * vol);
        hist.push({ week: i, price: p });
    }
    return hist;
};

const generateHistory = (startPrice: number, trend: number, vol: number) => {
    let price = startPrice;
    const hist = [];
    for (let i = 0; i < 30; i++) {
        const change = (Math.random() - 0.5 + trend) * vol;
        price = price * (1 + change);
        const volume = Math.floor(100000 + Math.random() * 500000 + (Math.abs(change) * 1000000));
        hist.push({ day: i, price: Number(price.toFixed(2)), volume, sma: 0 });
    }
    for (let i = 0; i < hist.length; i++) {
        if (i < 4) hist[i].sma = hist[i].price;
        else {
            const sum = hist.slice(i - 4, i + 1).reduce((a, b) => a + b.price, 0);
            hist[i].sma = Number((sum / 5).toFixed(2));
        }
    }
    return hist;
}

const calculateRSI = (history: any[]) => {
    if (history.length < 14) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = history.length - 14; i < history.length; i++) {
        const change = history[i].price - (history[i - 1]?.price || history[i].price);
        if (change > 0) gains += change;
        else losses -= change;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const useInvestmentSim = (bankBalance: number, updateBank: (amount: number) => void, addXP: (amount: number) => void) => {
    const [week, setWeek] = useState(0);
    const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([{ week: 0, netWorth: bankBalance, cash: bankBalance, stocks: 0, realEstate: 0, crypto: 0, angel: 0 }]);
    const [msg, setMsg] = useState("Global Markets Open. Diversify or Die.");
    const [loading, setLoading] = useState(false);

    // --- MARKET STATE ---
    const [fearGreedIndex, setFearGreedIndex] = useState(50);
    const [fedRate, setFedRate] = useState(5.0);
    const [dripEnabled, setDripEnabled] = useState(false);
    const [dcaEnabled, setDcaEnabled] = useState(false);
    const [marginUsed, setMarginUsed] = useState(0);
    const [marginLimit] = useState(20000);
    const [gasPrice, setGasPrice] = useState(20);
    const [algoBot, setAlgoBot] = useState<AlgoBot | null>(null);
    const [inflationBonds, setInflationBonds] = useState(0);
    const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);
    const [marketNews, setMarketNews] = useState<string[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [holdings, setHoldings] = useState<Record<string, number>>({});
    const [activeOptions, setActiveOptions] = useState<ActiveOption[]>([]);
    const [propertyListings, setPropertyListings] = useState<PropertyListing[]>([]);
    const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);

    const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([
        { symbol: 'BTC', name: 'Bitcoin', chain: 'BITCOIN', sector: 'L1', price: 40000, holdings: 0, staked: 0, apy: 0.0, volatility: 0.05, history: genCryptoHistory(40000, 0.05), walletType: 'HOT', change24h: 1.2, rank: 1, marketCap: 800, volume24h: 25000, dominance: 45, sentiment: 65, riskScore: 3, change1h: 0.1, change7d: 5.4, isHoneypot: false, isScanned: false },
        { symbol: 'ETH', name: 'Ethereum', chain: 'ETHEREUM', sector: 'L1', price: 2500, holdings: 0, staked: 0, apy: 0.04, volatility: 0.06, history: genCryptoHistory(2500, 0.06), walletType: 'HOT', change24h: -0.5, rank: 2, marketCap: 300, volume24h: 12000, dominance: 18, sentiment: 55, riskScore: 4, change1h: -0.2, change7d: -1.2, isHoneypot: false, isScanned: false },
        { symbol: 'SOL', name: 'Solana', chain: 'SOLANA', sector: 'L1', price: 100, holdings: 0, staked: 0, apy: 0.07, volatility: 0.12, history: genCryptoHistory(100, 0.12), walletType: 'HOT', change24h: 5.4, rank: 5, marketCap: 45, volume24h: 3000, dominance: 3, sentiment: 80, riskScore: 6, change1h: 1.2, change7d: 15.2, isHoneypot: false, isScanned: false },
        { symbol: 'MATIC', name: 'Polygon', chain: 'POLYGON', sector: 'L2', price: 0.8, holdings: 0, staked: 0, apy: 0.05, volatility: 0.08, history: genCryptoHistory(0.8, 0.08), walletType: 'HOT', change24h: 0.2, rank: 15, marketCap: 8, volume24h: 500, dominance: 0.5, sentiment: 45, riskScore: 5, change1h: 0.0, change7d: -2.1, isHoneypot: false, isScanned: false },
        { symbol: 'USDC', name: 'USD Coin', chain: 'BASE', sector: 'STABLE', price: 1.0, holdings: 0, staked: 0, apy: 0.05, volatility: 0.001, history: genCryptoHistory(1.0, 0.001), walletType: 'HOT', change24h: 0.0, rank: 6, marketCap: 25, volume24h: 2000, dominance: 2, sentiment: 50, riskScore: 1, change1h: 0.0, change7d: 0.0, isHoneypot: false, isScanned: false }
    ]);

    const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
    const [startups, setStartups] = useState<StartupOpportunity[]>([]);
    const [angelPortfolio, setAngelPortfolio] = useState<StartupOpportunity[]>([]);
    const [miningRigs, setMiningRigs] = useState<MiningRig[]>([]);
    const [powerSources, setPowerSources] = useState<PowerSource[]>([]);
    const [myToken, setMyToken] = useState<TokenProject | null>(null);
    const [leveragePositions, setLeveragePositions] = useState<LeveragePosition[]>([]);
    const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([
        { id: '1', name: 'ETH-USDC', pair: 'ETH-USDC', tvl: 5000000, myShare: 0, apy: 15, impermanentLoss: 0, pendingRewards: 0, riskScore: 20, protocol: 'UNISWAP', type: 'FARM' },
        { id: '2', name: 'SOL-USDC', pair: 'SOL-USDC', tvl: 2500000, myShare: 0, apy: 45, impermanentLoss: 0, pendingRewards: 0, riskScore: 50, protocol: 'AAVE', type: 'FARM' }
    ]);
    const [esgScore, setEsgScore] = useState(50);
    const [nftCollections, setNftCollections] = useState<NftCollection[]>([
        { id: 'c1', name: 'Bored Apes Clone', chain: 'ETHEREUM', floorPrice: 0.5, supply: 10000, hype: 80 }
    ]);
    const [myNfts, setMyNfts] = useState<NftItem[]>([]);

    const getStockValue = useCallback(() => stocks.reduce((acc, s) => acc + (holdings[s.ticker] || 0) * s.price, 0), [stocks, holdings]);
    const getRealEstateEquity = useCallback(() => ownedProperties.reduce((acc, p) => acc + p.equity, 0), [ownedProperties]);
    const getCryptoValue = useCallback(() => cryptoAssets.reduce((acc, c) => acc + (c.holdings + c.staked) * c.price, 0), [cryptoAssets]);
    const getAngelValue = useCallback(() => angelPortfolio.length * 5000, [angelPortfolio]);
    const getNftValue = useCallback(() => myNfts.reduce((acc, n) => acc + n.currentValuation, 0), [myNfts]);
    const getTotalNetWorth = useCallback(() => bankBalance + getStockValue() + getRealEstateEquity() + getCryptoValue() + getAngelValue() + getNftValue() - marginUsed + inflationBonds, [bankBalance, getStockValue, getRealEstateEquity, getCryptoValue, getAngelValue, getNftValue, marginUsed, inflationBonds]);

    const refreshListings = useCallback(async () => {
        const props = await Promise.all([generateRealEstateListing(), generateRealEstateListing(), generateRealEstateListing()]);
        setPropertyListings(props);
        const startup = await generateStartupPitch();
        setStartups([startup]);
    }, []);

    const initializeMarket = useCallback(() => {
        const initStocks: Stock[] = [
            { ticker: 'TECH', name: 'Gigabit Systems', price: 150, trend: 0.02, volatility: 0.05, history: generateHistory(150, 0.02, 0.05), dividendYield: 0.01, avgBuyPrice: 0, peRatio: 45, sector: 'TECH', beta: 1.5, analystRating: 'BUY', rsi: 55, sentiment: 60, marketCap: 800, weekHigh: 155, weekLow: 145 },
            { ticker: 'VOO', name: 'S&P 500 ETF', price: 400, trend: 0.002, volatility: 0.015, history: generateHistory(400, 0.002, 0.015), dividendYield: 0.02, avgBuyPrice: 0, peRatio: 22, sector: 'ETF', beta: 1.0, analystRating: 'BUY', rsi: 60, sentiment: 55, marketCap: 10000, weekHigh: 405, weekLow: 395 }
        ];
        setStocks(initStocks);
        refreshListings();
    }, [refreshListings]);

    useEffect(() => {
        initializeMarket();
    }, [initializeMarket]);

    const advanceWeek = async () => {
        setLoading(true);
        setWeek(w => w + 1);
        setFearGreedIndex(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)));

        const newStocks = stocks.map(s => {
            let change = (Math.random() - 0.5 + s.trend) * s.volatility;
            const np = Math.max(1, s.price * (1 + change));
            const nHist = [...s.history, { day: week, price: np, volume: 100000, sma: np }].slice(-30);
            return { ...s, price: np, history: nHist, rsi: calculateRSI(nHist) };
        });
        setStocks(newStocks);

        setPortfolioHistory(prev => [...prev, { week: week + 1, netWorth: getTotalNetWorth(), cash: bankBalance, stocks: getStockValue(), realEstate: getRealEstateEquity(), crypto: getCryptoValue(), angel: getAngelValue() }]);
        setLoading(false);
    };

    const handleStockTrade = (ticker: string, mode: 'BUY' | 'SELL' | 'SHORT' | 'LIMIT_BUY' | 'LIMIT_SELL', amount: number, limitPrice?: number) => {
        const stock = stocks.find(s => s.ticker === ticker);
        if (!stock) return;

        if (mode.includes('LIMIT')) {
            if (!limitPrice || limitPrice <= 0) { setMsg("Set a valid limit price."); return; }
            const shares = Math.floor(amount / limitPrice);
            if (mode === 'LIMIT_SELL' && (holdings[ticker] || 0) < shares) { setMsg("Insufficient shares."); return; }
            if (mode === 'LIMIT_BUY' && bankBalance < amount) { setMsg("Insufficient cash."); return; }
            setLimitOrders(prev => [...prev, { id: Date.now().toString(), ticker, type: mode === 'LIMIT_BUY' ? 'BUY' : 'SELL', targetPrice: limitPrice, shares: Math.max(1, shares) }]);
            setMsg(`${mode.replace('_', ' ')} placed at $${limitPrice}`);
            playSound('CLICK');
            return;
        }

        const shares = amount / stock.price;
        if (amount <= 0) return;

        if (mode === 'BUY') {
            const currentShares = holdings[ticker] || 0;
            updateBank(-amount);
            setHoldings(h => ({ ...h, [ticker]: currentShares + shares }));
            playSound('COIN');
        } else if (mode === 'SELL') {
            if ((holdings[ticker] || 0) <= 0) { setMsg("Nothing to sell."); return; }
            updateBank(amount);
            setHoldings(h => ({ ...h, [ticker]: (h[ticker] || 0) - shares }));
            playSound('COIN');
        }
    };

    const handleOptionBuy = (ticker: string, type: OptionType, amount: number) => {
        const stock = stocks.find(s => s.ticker === ticker);
        if (!stock) return;
        const premium = stock.price * stock.volatility * 0.5;
        const contracts = Math.floor(amount / premium);
        const cost = contracts * premium;
        if (cost <= 0) return;
        updateBank(-cost);
        setActiveOptions(prev => [...prev, { id: Date.now().toString(), ticker, type, strikePrice: stock.price, premiumPaid: premium, quantity: contracts, purchaseWeek: week }]);
        playSound('CLICK');
    };

    const handleHarvestLoss = (ticker: string) => {
        const stock = stocks.find(s => s.ticker === ticker);
        if (!stock) return;
        const shares = holdings[ticker] || 0;
        if (shares <= 0) return;
        if (stock.price < (stock.avgBuyPrice || 0)) {
            const loss = (stock.avgBuyPrice! - stock.price) * shares;
            const taxCredit = loss * 0.3;
            updateBank((shares * stock.price) + taxCredit);
            setHoldings(h => ({ ...h, [ticker]: 0 }));
            setStocks(prev => prev.map(s => s.ticker === ticker ? { ...s, avgBuyPrice: 0, washSaleExpiry: week + 4 } : s));
            setMsg(`Loss Harvested! Saved $${taxCredit.toFixed(0)}.`);
            playSound('SUCCESS');
        }
    };

    const handleBuyProperty = (prop: PropertyListing) => {
        const downPayment = prop.price * (prop.downPaymentPct / 100);
        if (bankBalance < downPayment) { setMsg("Insufficient Cash."); playSound('ERROR'); return; }
        updateBank(-downPayment);
        setOwnedProperties(prev => [...prev, { ...prop, mortgageBalance: prop.price - downPayment, equity: downPayment, isVacant: false, lastRentPaidWeek: week, isSquatter: false, maintenanceHealth: 100, hasInsurance: false, tenantStatus: 'GOOD', propertyTaxRate: 1.2 }]);
        setPropertyListings(prev => prev.filter(p => p.id !== prop.id));
        playSound('SUCCESS');
        setMsg(`Property Acquired in ${prop.location}!`);
        addXP(200);
    };

    const handleManageProperty = (action: 'RENOVATE' | 'REFINANCE' | 'SELL' | 'FIND_TENANT' | 'EVICT' | 'INSURE' | 'REPAIR', propertyId: string) => {
        const index = ownedProperties.findIndex(p => p.id === propertyId);
        if (index === -1) return;
        const prop = ownedProperties[index];

        if (action === 'RENOVATE') {
            if (bankBalance < 5000) { setMsg("Need $5k."); return; }
            updateBank(-5000);
            const updated = { ...prop, condition: Math.min(100, prop.condition + 20), price: prop.price * 1.1, rentalYield: prop.rentalYield + 1 };
            const newProps = [...ownedProperties]; newProps[index] = updated; setOwnedProperties(newProps);
            setMsg("Renovation Complete!"); playSound('HAMMER');
        } else if (action === 'REFINANCE') {
            const maxLoan = prop.price * 0.75;
            const cashOut = maxLoan - prop.mortgageBalance;
            if (cashOut <= 0) { setMsg("No equity available."); return; }
            updateBank(cashOut);
            const newProps = [...ownedProperties]; newProps[index] = { ...prop, mortgageBalance: maxLoan, equity: prop.price - maxLoan }; setOwnedProperties(newProps);
            setMsg(`Refinanced! Pulled out $${cashOut.toLocaleString()}.`); playSound('COIN');
        } else if (action === 'SELL') {
            const fees = prop.price * 0.06;
            const net = prop.price - prop.mortgageBalance - fees;
            updateBank(net);
            setOwnedProperties(prev => prev.filter(p => p.id !== propertyId));
            setMsg(`Sold! Net: $${net.toLocaleString()}.`); playSound('COIN');
        }
    };

    const handleCryptoTrade = (symbol: string, action: 'BUY' | 'SELL', amount: number) => {
        const asset = cryptoAssets.find(c => c.symbol === symbol);
        if (!asset) return;
        if (action === 'SELL' && asset.isHoneypot) { setMsg(`⚠️ TRANSACTION FAILED! ${symbol} is a Honeypot scam.`); playSound('ERROR'); return; }
        const gasFee = asset.chain === 'ETHEREUM' ? 15 : asset.chain === 'BITCOIN' ? 5 : 0.01;
        if (action === 'BUY') {
            if (bankBalance >= amount + gasFee) {
                updateBank(-(amount + gasFee));
                const coins = amount / asset.price;
                setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? { ...c, holdings: c.holdings + coins } : c));
                playSound('COIN');
            } else { setMsg("Insufficient Funds (Check Gas Fees)"); }
        } else if (action === 'SELL') {
            const coins = amount / asset.price;
            if (asset.holdings >= coins) {
                updateBank(amount - gasFee);
                setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? { ...c, holdings: c.holdings - coins } : c));
                playSound('COIN');
            }
        }
    };
    const handleScanContract = (symbol: string) => {
        if (bankBalance < 200) { setMsg("Scanning costs $200."); return; }
        updateBank(-200);
        setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? { ...c, isScanned: true } : c));
        setMsg(`Contract Scanned: ${symbol}`);
        playSound('CLICK');
    };

    const toggleStake = (symbol: string) => {
        setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? (c.holdings > 0 ? { ...c, staked: c.staked + c.holdings, holdings: 0 } : { ...c, holdings: c.holdings + c.staked, staked: 0 }) : c));
        playSound('CLICK');
    };

    const handleBuyRig = (rig: MiningRig) => {
        if (bankBalance < rig.cost) { setMsg("Insufficient Funds."); return; }
        updateBank(-rig.cost);
        setMiningRigs(prev => [...prev, rig]);
        setEsgScore(prev => Math.max(0, prev - 5));
        playSound('SUCCESS');
    };

    const handleBuyPower = (power: PowerSource) => {
        if (bankBalance < power.cost) { setMsg("Insufficient Funds."); return; }
        updateBank(-power.cost);
        setPowerSources(prev => [...prev, power]);
        if (power.type === 'SOLAR') setEsgScore(prev => Math.min(100, prev + 15));
        playSound('SUCCESS');
    };

    const handleCreateToken = (project: TokenProject, cost: number) => {
        if (bankBalance < cost) { setMsg("Insufficient Funds."); return; }
        updateBank(-cost);
        setMyToken(project);
        playSound('VICTORY');
        setMsg(`${project.ticker} Launched!`);
    };

    const handleTokenAction = (action: string, cost: number) => {
        if (!myToken || myToken.isRugged) return;
        if (bankBalance < cost) { setMsg("Insufficient funds."); return; }
        updateBank(-cost);
        if (action === 'MARKETING') {
            setMyToken(prev => prev ? ({ ...prev, hype: Math.min(100, prev.hype + 15), price: prev.price * 1.1 }) : null);
            setMsg("Marketing Boosted!");
        } else if (action === 'RUG') {
            const steal = myToken.liquidity;
            updateBank(steal);
            setMyToken(prev => prev ? ({ ...prev, isRugged: true, price: 0 }) : null);
            setMsg("RUG PULLED!");
            playSound('VICTORY');
        }
        playSound('CLICK');
    };

    const handleOpenLeverage = (symbol: string, amount: number, leverage: number, type: 'LONG' | 'SHORT', tp?: number, sl?: number) => {
        if (bankBalance < amount) { setMsg("Insufficient Collateral."); return; }
        updateBank(-amount);
        const assetPrice = cryptoAssets.find(a => a.symbol === symbol)?.price || 0;
        if (assetPrice === 0) return;
        setLeveragePositions(prev => [...prev, {
            id: Date.now().toString(),
            symbol,
            entryPrice: assetPrice,
            amount,
            leverage,
            type,
            liquidationPrice: type === 'LONG' ? assetPrice * (1 - (1 / leverage)) : assetPrice * (1 + (1 / leverage)),
            tpPrice: tp ? (type === 'LONG' ? assetPrice * (1 + tp / 100) : assetPrice * (1 - tp / 100)) : undefined,
            slPrice: sl ? (type === 'LONG' ? assetPrice * (1 - sl / 100) : assetPrice * (1 + sl / 100)) : undefined
        }]);
        playSound('CLICK');
    };

    const handleCloseLeverage = (id: string) => {
        const pos = leveragePositions.find(p => p.id === id);
        if (!pos) return;
        const cp = cryptoAssets.find(a => a.symbol === pos.symbol)?.price || 0;
        const pnl = pos.type === 'LONG' ? (cp - pos.entryPrice) / pos.entryPrice : (pos.entryPrice - cp) / pos.entryPrice;
        updateBank(pos.amount * (1 + pnl * pos.leverage));
        setLeveragePositions(prev => prev.filter(p => p.id !== id));
    };

    const handleJoinPool = (poolId: string, amount: number) => {
        if (bankBalance < amount) { setMsg("Insufficient Cash."); return; }
        updateBank(-amount);
        setLiquidityPools(prev => prev.map(p => p.id === poolId ? { ...p, myShare: p.myShare + (amount / p.tvl) } : p));
        playSound('SUCCESS');
    };

    const handleMintNft = (collectionId: string, cost: number) => {
        const col = nftCollections.find(c => c.id === collectionId);
        if (!col || bankBalance < cost) return;
        updateBank(-cost);
        const newItem: NftItem = {
            id: Date.now().toString(), collectionId, name: `${col.name} #${Math.floor(Math.random() * 1000)}`,
            rarity: Math.random() > 0.9 ? 'LEGENDARY' : Math.random() > 0.6 ? 'RARE' : 'COMMON',
            purchasePrice: cost, currentValuation: cost, imageColor: '#' + Math.floor(Math.random() * 16777215).toString(16)
        };
        setMyNfts(p => [...p, newItem]);
        playSound('SUCCESS');
    };

    const handleSellNft = (id: string) => {
        const nft = myNfts.find(n => n.id === id);
        if (!nft) return;
        updateBank(nft.currentValuation);
        setMyNfts(p => p.filter(n => n.id !== id));
        playSound('COIN');
    };

    const handleInvest = (startup: StartupOpportunity) => {
        if (bankBalance < startup.ask) { setMsg("Insufficient Funds."); return; }
        updateBank(-startup.ask);
        setAngelPortfolio(prev => [...prev, { ...startup, status: 'FUNDED', mentorLevel: 0 }]);
        setStartups(prev => prev.filter(s => s.id !== startup.id));
        playSound('SUCCESS');
        addXP(300);
    };

    return {
        week, portfolioHistory, msg, loading, fearGreedIndex, fedRate, dripEnabled, dcaEnabled, marginUsed, marginLimit, gasPrice, algoBot, inflationBonds, limitOrders, marketNews, stocks, holdings, activeOptions, propertyListings, ownedProperties, cryptoAssets, whaleAlerts, startups, angelPortfolio, miningRigs, powerSources, myToken, leveragePositions, liquidityPools, esgScore, nftCollections, myNfts,
        setWeek, setMsg, setDripEnabled, setDcaEnabled, setAlgoBot, setLimitOrders, setStocks, setHoldings, setPropertyListings, setOwnedProperties, setCryptoAssets, setStartups, setAngelPortfolio, setMiningRigs, setPowerSources, setMyToken, setLeveragePositions, setLiquidityPools, setMyNfts,
        initializeMarket, refreshListings, advanceWeek, getTotalNetWorth, getStockValue, getRealEstateEquity, getCryptoValue, getAngelValue, getNftValue,
        handleStockTrade, handleOptionBuy, handleHarvestLoss, handleBuyProperty, handleManageProperty, handleCryptoTrade, handleScanContract, toggleStake, handleBuyRig, handleBuyPower, handleCreateToken, handleTokenAction, handleOpenLeverage, handleCloseLeverage, handleJoinPool, handleMintNft, handleSellNft, handleInvest
    };
};
