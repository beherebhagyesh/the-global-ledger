
import React, { useState, useEffect } from 'react';
import { DollarSign, Eye, RefreshCw, TrendingUp, Home, Bitcoin, Rocket, Gauge, Info, RotateCcw, CheckCircle, Unlock, PlayCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MissionBrief } from './MissionBrief';
import { generateRealEstateListing, generateStartupPitch } from '../services/geminiService';
import { MentorPersona, ActiveOption, PropertyListing, OwnedProperty, CryptoAsset, StartupOpportunity, PortfolioHistory, Stock, AlgoBot, LimitOrder, OptionType, MiningRig, PowerSource, TokenProject, LeveragePosition, LiquidityPool, NftCollection, NftItem, WhaleAlert } from '../types';
import { SmartTooltip } from './SmartTooltip';
import { playSound } from '../utils/sound';
import { ActionTooltip } from './Level1_Foundations';

// Sub-components
import { Investing_Stocks } from './Investing_Stocks';
import { Investing_RealEstate } from './Investing_RealEstate';
import { Investing_Crypto } from './Investing_Crypto';
import { Investing_Angel } from './Investing_Angel';

interface Level4Props {
  onComplete: () => void;
  addXP: (amount: number) => void;
  mentorPersona: MentorPersona;
  updateBank: (amount: number) => void;
  bankBalance: number;
}

const GOAL_VALUE = 25000; 
const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#10b981', '#ef4444'];

// Helper to gen history
const genCryptoHistory = (price: number, vol: number) => {
    const hist = [];
    let p = price;
    for(let i=0; i<20; i++) {
        p = p * (1 + (Math.random() - 0.5) * vol);
        hist.push({ week: i, price: p });
    }
    return hist;
};

export const Level4_Investing: React.FC<Level4Props> = ({ onComplete, addXP, mentorPersona, updateBank, bankBalance }) => {
  // Game State
  const [week, setWeek] = useState(0);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([{ week: 0, netWorth: bankBalance, cash: bankBalance, stocks: 0, realEstate: 0, crypto: 0, angel: 0 }]);
  const [msg, setMsg] = useState("Global Markets Open. Diversify or Die.");
  const [activeTab, setActiveTab] = useState<'STOCKS' | 'REAL_ESTATE' | 'CRYPTO' | 'ANGEL'>('STOCKS');
  const [loading, setLoading] = useState(false);
  const [stayInLevel, setStayInLevel] = useState(false);

  // --- ADVANCED MECHANICS STATE ---
  const [fearGreedIndex, setFearGreedIndex] = useState(50); // 0-100
  const [fedRate, setFedRate] = useState(5.0); // Interest Rate baseline
  const [dripEnabled, setDripEnabled] = useState(false);
  const [dcaEnabled, setDcaEnabled] = useState(false);
  const [marginUsed, setMarginUsed] = useState(0);
  const [marginLimit] = useState(20000); 
  const [gasPrice, setGasPrice] = useState(20); // Dynamic Gas
  
  // GRANDMASTER FEATURES
  const [algoBot, setAlgoBot] = useState<AlgoBot | null>(null);
  const [inflationBonds, setInflationBonds] = useState(0); 
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([]);
  const [marketNews, setMarketNews] = useState<string[]>([]);

  // --- ASSET STATES ---
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [activeOptions, setActiveOptions] = useState<ActiveOption[]>([]);
  const [propertyListings, setPropertyListings] = useState<PropertyListing[]>([]);
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);
  
  // --- CRYPTO ASSETS (Expanded List with Advanced Stats) ---
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([
      { symbol: 'BTC', name: 'Bitcoin', chain: 'BITCOIN', sector: 'L1', price: 40000, holdings: 0, staked: 0, apy: 0.0, volatility: 0.05, history: genCryptoHistory(40000, 0.05), walletType: 'HOT', change24h: 1.2, rank: 1, marketCap: 800, volume24h: 25000, dominance: 45, sentiment: 65, riskScore: 3, change1h: 0.1, change7d: 5.4, isHoneypot: false, isScanned: false },
      { symbol: 'ETH', name: 'Ethereum', chain: 'ETHEREUM', sector: 'L1', price: 2500, holdings: 0, staked: 0, apy: 0.04, volatility: 0.06, history: genCryptoHistory(2500, 0.06), walletType: 'HOT', change24h: -0.5, rank: 2, marketCap: 300, volume24h: 12000, dominance: 18, sentiment: 55, riskScore: 4, change1h: -0.2, change7d: -1.2, isHoneypot: false, isScanned: false },
      { symbol: 'SOL', name: 'Solana', chain: 'SOLANA', sector: 'L1', price: 100, holdings: 0, staked: 0, apy: 0.07, volatility: 0.12, history: genCryptoHistory(100, 0.12), walletType: 'HOT', change24h: 5.4, rank: 5, marketCap: 45, volume24h: 3000, dominance: 3, sentiment: 80, riskScore: 6, change1h: 1.2, change7d: 15.2, isHoneypot: false, isScanned: false },
      { symbol: 'MATIC', name: 'Polygon', chain: 'POLYGON', sector: 'L2', price: 0.8, holdings: 0, staked: 0, apy: 0.05, volatility: 0.08, history: genCryptoHistory(0.8, 0.08), walletType: 'HOT', change24h: 0.2, rank: 15, marketCap: 8, volume24h: 500, dominance: 0.5, sentiment: 45, riskScore: 5, change1h: 0.0, change7d: -2.1, isHoneypot: false, isScanned: false },
      { symbol: 'USDC', name: 'USD Coin', chain: 'BASE', sector: 'STABLE', price: 1.0, holdings: 0, staked: 0, apy: 0.05, volatility: 0.001, history: genCryptoHistory(1.0, 0.001), walletType: 'HOT', change24h: 0.0, rank: 6, marketCap: 25, volume24h: 2000, dominance: 2, sentiment: 50, riskScore: 1, change1h: 0.0, change7d: 0.0, isHoneypot: false, isScanned: false },
      { symbol: 'MEME', name: 'DogeCoin', chain: 'BITCOIN', sector: 'MEME', price: 0.1, holdings: 0, staked: 0, apy: 0.0, volatility: 0.20, history: genCryptoHistory(0.1, 0.20), walletType: 'HOT', change24h: -8.5, rank: 9, marketCap: 12, volume24h: 4000, dominance: 1, sentiment: 30, riskScore: 9, change1h: -1.5, change7d: -12.4, isHoneypot: false, isScanned: false },
      // NEW COINS
      { symbol: 'LINK', name: 'Chainlink', chain: 'ETHEREUM', sector: 'ORACLE', price: 15, holdings: 0, staked: 0, apy: 0.0, volatility: 0.09, history: genCryptoHistory(15, 0.09), walletType: 'HOT', change24h: 2.1, rank: 12, marketCap: 9, volume24h: 800, dominance: 0.6, sentiment: 60, riskScore: 5, change1h: 0.3, change7d: 4.5, isHoneypot: false, isScanned: false },
      { symbol: 'UNI', name: 'Uniswap', chain: 'ETHEREUM', sector: 'DEFI', price: 6, holdings: 0, staked: 0, apy: 0.0, volatility: 0.10, history: genCryptoHistory(6, 0.10), walletType: 'HOT', change24h: -1.2, rank: 18, marketCap: 4, volume24h: 200, dominance: 0.3, sentiment: 40, riskScore: 6, change1h: -0.1, change7d: -5.6, isHoneypot: false, isScanned: false },
      { symbol: 'AAVE', name: 'Aave', chain: 'ETHEREUM', sector: 'DEFI', price: 90, holdings: 0, staked: 0, apy: 0.03, volatility: 0.08, history: genCryptoHistory(90, 0.08), walletType: 'HOT', change24h: 0.5, rank: 35, marketCap: 2, volume24h: 150, dominance: 0.1, sentiment: 55, riskScore: 5, change1h: 0.1, change7d: 1.2, isHoneypot: false, isScanned: false },
      { symbol: 'PEPE', name: 'Pepe', chain: 'ETHEREUM', sector: 'MEME', price: 0.000001, holdings: 0, staked: 0, apy: 0.0, volatility: 0.40, history: genCryptoHistory(0.000001, 0.4), walletType: 'HOT', change24h: 15.0, rank: 45, marketCap: 1, volume24h: 5000, dominance: 0.05, sentiment: 90, riskScore: 10, change1h: 2.5, change7d: 45.0, isHoneypot: true, isScanned: false },
      { symbol: 'ARB', name: 'Arbitrum', chain: 'ARBITRUM', sector: 'L2', price: 1.2, holdings: 0, staked: 0, apy: 0.0, volatility: 0.11, history: genCryptoHistory(1.2, 0.11), walletType: 'HOT', change24h: -3.4, rank: 30, marketCap: 3, volume24h: 400, dominance: 0.2, sentiment: 42, riskScore: 6, change1h: -0.5, change7d: -8.2, isHoneypot: false, isScanned: false },
      { symbol: 'PAXG', name: 'Paxos Gold', chain: 'ETHEREUM', sector: 'RWA', price: 2000, holdings: 0, staked: 0, apy: 0.0, volatility: 0.01, history: genCryptoHistory(2000, 0.01), walletType: 'HOT', change24h: 0.1, rank: 100, marketCap: 0.5, volume24h: 10, dominance: 0.01, sentiment: 50, riskScore: 1, change1h: 0.0, change7d: 0.2, isHoneypot: false, isScanned: false }
  ]);

  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);

  const [startups, setStartups] = useState<StartupOpportunity[]>([]);
  const [angelPortfolio, setAngelPortfolio] = useState<StartupOpportunity[]>([]);

  // --- NEW CRYPTO TYCOON STATES ---
  const [miningRigs, setMiningRigs] = useState<MiningRig[]>([]);
  const [powerSources, setPowerSources] = useState<PowerSource[]>([]);
  const [myToken, setMyToken] = useState<TokenProject | null>(null);
  const [leveragePositions, setLeveragePositions] = useState<LeveragePosition[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([
      { id: '1', name: 'ETH-USDC', pair: 'ETH-USDC', tvl: 5000000, myShare: 0, apy: 15, impermanentLoss: 0, pendingRewards: 0, riskScore: 20, protocol: 'UNISWAP', type: 'FARM', airdropPoints: 0 },
      { id: '2', name: 'SOL-USDC', pair: 'SOL-USDC', tvl: 2500000, myShare: 0, apy: 45, impermanentLoss: 0, pendingRewards: 0, riskScore: 50, protocol: 'AAVE', type: 'FARM', airdropPoints: 0 },
      { id: '3', name: 'MEME-ETH', pair: 'MEME-ETH', tvl: 100000, myShare: 0, apy: 420, impermanentLoss: 0, pendingRewards: 0, riskScore: 90, protocol: 'PEPE', type: 'FARM', airdropPoints: 0 },
      { id: '4', name: 'USDT-DAI', pair: 'USDT-DAI', tvl: 15000000, myShare: 0, apy: 5, impermanentLoss: 0, pendingRewards: 0, riskScore: 5, protocol: 'CURVE', type: 'FARM', airdropPoints: 0 },
      // LENDING POOLS
      { id: '5', name: 'AAVE Lending', pair: 'ETH', tvl: 20000000, myShare: 0, apy: 3, impermanentLoss: 0, pendingRewards: 0, riskScore: 10, protocol: 'AAVE', type: 'LENDING', borrowedAmount: 0, collateralAmount: 0, healthFactor: 2.5, airdropPoints: 0 }
  ]);
  const [esgScore, setEsgScore] = useState(50); // 0-100

  // --- NFT STATES ---
  const [nftCollections, setNftCollections] = useState<NftCollection[]>([
      { id: 'c1', name: 'Bored Apes Clone', chain: 'ETHEREUM', floorPrice: 0.5, supply: 10000, hype: 80 },
      { id: 'c2', name: 'Pixel Punks', chain: 'SOLANA', floorPrice: 5, supply: 5000, hype: 60 },
      { id: 'c3', name: 'Abstract Art Blocks', chain: 'BASE', floorPrice: 0.1, supply: 1000, hype: 40 },
      { id: 'c4', name: 'Cyber Ronin', chain: 'POLYGON', floorPrice: 150, supply: 3333, hype: 75 },
      { id: 'c5', name: 'Ordinal Pebbles', chain: 'BITCOIN', floorPrice: 0.05, supply: 100, hype: 95 },
      { id: 'c6', name: 'Arbi-nauts', chain: 'ARBITRUM', floorPrice: 0.2, supply: 2000, hype: 50 },
      { id: 'c7', name: 'Based Ghouls', chain: 'BASE', floorPrice: 0.02, supply: 8888, hype: 85 },
      { id: 'c8', name: 'Sol-Sisters', chain: 'SOLANA', floorPrice: 2.5, supply: 500, hype: 90 },
      { id: 'c9', name: 'Pudgy Penguins', chain: 'ETHEREUM', floorPrice: 1.2, supply: 8888, hype: 92 }
  ]);
  const [myNfts, setMyNfts] = useState<NftItem[]>([]);

  // Initialization
  useEffect(() => {
    initializeMarket();
  }, []);

  const initializeMarket = () => {
    const initStocks: Stock[] = [
        { ticker: 'TECH', name: 'Gigabit Systems', price: 150, trend: 0.02, volatility: 0.05, history: generateHistory(150, 0.02, 0.05), dividendYield: 0.01, avgBuyPrice: 0, peRatio: 45, sector: 'TECH', beta: 1.5, analystRating: 'BUY', rsi: 55, sentiment: 60, marketCap: 800, weekHigh: 155, weekLow: 145 },
        { ticker: 'AUTO', name: 'Vortex Motors', price: 80, trend: -0.01, volatility: 0.08, history: generateHistory(80, -0.01, 0.08), dividendYield: 0, peRatio: 12, sector: 'AUTO', beta: 1.1, analystRating: 'HOLD', rsi: 40, sentiment: 45, marketCap: 60, weekHigh: 85, weekLow: 75 },
        { ticker: 'VOO', name: 'S&P 500 ETF', price: 400, trend: 0.002, volatility: 0.015, history: generateHistory(400, 0.002, 0.015), dividendYield: 0.02, avgBuyPrice: 0, peRatio: 22, sector: 'ETF', beta: 1.0, analystRating: 'BUY', rsi: 60, sentiment: 55, marketCap: 10000, weekHigh: 405, weekLow: 395 },
        { ticker: 'BIO', name: 'Zenith Pharma', price: 45, trend: 0.0, volatility: 0.12, history: generateHistory(45, 0.0, 0.12), dividendYield: 0.03, avgBuyPrice: 0, peRatio: 30, sector: 'HEALTH', beta: 0.8, analystRating: 'BUY', rsi: 48, sentiment: 70, marketCap: 20, weekHigh: 50, weekLow: 40 },
        { ticker: 'RETL', name: 'MegaMart', price: 120, trend: 0.005, volatility: 0.03, history: generateHistory(120, 0.005, 0.03), dividendYield: 0.025, avgBuyPrice: 0, peRatio: 18, sector: 'CONSUMER', beta: 0.9, analystRating: 'HOLD', rsi: 52, sentiment: 50, marketCap: 250, weekHigh: 125, weekLow: 115 },
        { ticker: 'BANK', name: 'Global Finance', price: 60, trend: 0.01, volatility: 0.04, history: generateHistory(60, 0.01, 0.04), dividendYield: 0.04, avgBuyPrice: 0, peRatio: 10, sector: 'FINANCE', beta: 1.2, analystRating: 'SELL', rsi: 35, sentiment: 30, marketCap: 150, weekHigh: 65, weekLow: 55 },
        { ticker: 'WRLD', name: 'Emerging Mkts', price: 35, trend: 0.03, volatility: 0.15, history: generateHistory(35, 0.03, 0.15), dividendYield: 0.01, avgBuyPrice: 0, peRatio: 15, sector: 'ETF', beta: 1.8, analystRating: 'BUY', rsi: 75, sentiment: 80, marketCap: 50, weekHigh: 40, weekLow: 30 },
    ];
    setStocks(initStocks);
    refreshListings();
  };

  function generateHistory(startPrice: number, trend: number, vol: number) {
      let price = startPrice;
      const hist = [];
      for(let i=0; i<30; i++) {
          const change = (Math.random() - 0.5 + trend) * vol;
          price = price * (1 + change);
          const volume = Math.floor(100000 + Math.random() * 500000 + (Math.abs(change) * 1000000));
          hist.push({ day: i, price: Number(price.toFixed(2)), volume, sma: 0 });
      }
      // Calc SMA
      for(let i=0; i<hist.length; i++) {
          if (i < 4) hist[i].sma = hist[i].price;
          else {
              const sum = hist.slice(i-4, i+1).reduce((a, b) => a + b.price, 0);
              hist[i].sma = Number((sum / 5).toFixed(2));
          }
      }
      return hist;
  }

  const refreshListings = async () => {
      const props = await Promise.all([generateRealEstateListing(), generateRealEstateListing(), generateRealEstateListing()]);
      setPropertyListings(props);
      const startup = await generateStartupPitch();
      setStartups([startup]);
  };

  // --- CALCULATION HELPERS ---
  const getStockValue = () => stocks.reduce((acc, s) => acc + (holdings[s.ticker] || 0) * s.price, 0);
  const getRealEstateEquity = () => ownedProperties.reduce((acc, p) => acc + p.equity, 0);
  const getCryptoValue = () => cryptoAssets.reduce((acc, c) => acc + (c.holdings + c.staked) * c.price, 0);
  const getAngelValue = () => angelPortfolio.length * 5000;
  const getNftValue = () => myNfts.reduce((acc, n) => acc + n.currentValuation, 0);
  
  const getTotalNetWorth = () => bankBalance + getStockValue() + getRealEstateEquity() + getCryptoValue() + getAngelValue() + getNftValue() - marginUsed + inflationBonds;

  // --- HANDLERS ---
  const handleStockTrade = (ticker: string, mode: 'BUY'|'SELL'|'SHORT'|'LIMIT_BUY'|'LIMIT_SELL', amount: number, limitPrice?: number) => {
      const stock = stocks.find(s => s.ticker === ticker);
      if (!stock) return;

      if (mode.includes('LIMIT')) {
          if (!limitPrice || limitPrice <= 0) { setMsg("Set a valid limit price."); return; }
          const shares = Math.floor(amount / limitPrice);
          if (mode === 'LIMIT_SELL' && (holdings[ticker] || 0) < shares) { setMsg("Insufficient shares."); return; }
          if (mode === 'LIMIT_BUY' && bankBalance < amount) { setMsg("Insufficient cash."); return; }
          setLimitOrders(prev => [...prev, {
              id: Date.now().toString(), ticker, type: mode === 'LIMIT_BUY' ? 'BUY' : 'SELL', targetPrice: limitPrice, shares: Math.max(1, shares)
          }]);
          setMsg(`${mode.replace('_', ' ')} placed at $${limitPrice}`);
          playSound('CLICK');
          return;
      }

      const shares = amount / stock.price;
      if (amount <= 0) return;

      if (mode === 'BUY' && stock.washSaleExpiry && week < stock.washSaleExpiry) {
          setMsg(`Wash Sale Rule! Locked until Week ${stock.washSaleExpiry}.`);
          playSound('ERROR');
          return;
      }

      if (mode === 'BUY') {
          const currentShares = holdings[ticker] || 0;
          if (currentShares < 0) {
              if (bankBalance < amount) { setMsg("Not enough cash."); return; }
              updateBank(-amount);
              setHoldings(h => ({...h, [ticker]: currentShares + shares}));
              playSound('COIN');
              setMsg(`Covered Short: ${shares.toFixed(2)} shares.`);
          } else {
              let cashUsed = Math.min(bankBalance, amount);
              let loanUsed = Math.max(0, amount - bankBalance);
              if (cashUsed > 0) updateBank(-cashUsed);
              setMarginUsed(m => m + loanUsed);
              const oldAvg = stock.avgBuyPrice || 0;
              const newAvg = ((currentShares * oldAvg) + (shares * stock.price)) / (currentShares + shares);
              setStocks(prev => prev.map(s => s.ticker === ticker ? { ...s, avgBuyPrice: newAvg } : s));
              setHoldings(h => ({...h, [ticker]: (h[ticker] || 0) + shares}));
              playSound('COIN');
              if (loanUsed > 0) setMsg(`Bought on Margin. Debt: $${loanUsed.toFixed(0)}`);
          }
      } else if (mode === 'SELL') {
          if ((holdings[ticker] || 0) <= 0) { setMsg("Nothing to sell."); return; }
          updateBank(amount);
          if (marginUsed > 0) setMarginUsed(m => Math.max(0, m - amount));
          setHoldings(h => ({...h, [ticker]: (h[ticker] || 0) - shares}));
          playSound('COIN');
      } else if (mode === 'SHORT') {
          updateBank(amount);
          setHoldings(h => ({...h, [ticker]: (h[ticker] || 0) - shares}));
          setMsg(`Short Sold ${shares.toFixed(2)} shares.`);
          playSound('CLICK');
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
      setActiveOptions(prev => [...prev, {
          id: Date.now().toString(), ticker, type, strikePrice: stock.price, premiumPaid: premium, quantity: contracts, purchaseWeek: week
      }]);
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
          setHoldings(h => ({...h, [ticker]: 0}));
          setStocks(prev => prev.map(s => s.ticker === ticker ? { ...s, avgBuyPrice: 0, washSaleExpiry: week + 4 } : s));
          setMsg(`Loss Harvested! Saved $${taxCredit.toFixed(0)}. Ticker LOCKED for 4 weeks.`);
          playSound('SUCCESS');
      }
  };

  // Real Estate Handlers
  const handleBuyProperty = (prop: PropertyListing) => {
      const downPayment = prop.price * (prop.downPaymentPct / 100);
      if (bankBalance < downPayment) { setMsg("Insufficient Cash."); playSound('ERROR'); return; }
      updateBank(-downPayment);
      setOwnedProperties(prev => [...prev, { 
          ...prop, 
          mortgageBalance: prop.price - downPayment, 
          equity: downPayment, 
          isVacant: false, 
          lastRentPaidWeek: week,
          isSquatter: false,
          maintenanceHealth: 100,
          hasInsurance: false,
          tenantStatus: 'GOOD',
          propertyTaxRate: 1.2
      }]);
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
      } else if (action === 'FIND_TENANT') {
          if (bankBalance < 500) { setMsg("Need $500."); return; }
          updateBank(-500);
          if (Math.random() < 0.8) {
              const newProps = [...ownedProperties]; newProps[index] = { ...prop, isVacant: false, tenantStatus: 'GOOD' }; setOwnedProperties(newProps);
              setMsg("Tenant Found!"); playSound('SUCCESS');
          } else { setMsg("Marketing failed."); playSound('ERROR'); }
      } else if (action === 'EVICT') {
          if (bankBalance < 2000) { setMsg("Legal fees $2k."); return; }
          updateBank(-2000);
          const newProps = [...ownedProperties]; newProps[index] = { ...prop, isSquatter: false, isVacant: true }; setOwnedProperties(newProps);
          setMsg("Squatter Evicted. Unit now Vacant."); playSound('SUCCESS');
      } else if (action === 'INSURE') {
          if (bankBalance < 200) { setMsg("Cost $200."); return; }
          updateBank(-200);
          const newProps = [...ownedProperties]; newProps[index] = { ...prop, hasInsurance: true }; setOwnedProperties(newProps);
          setMsg("Property Insured for 10 Weeks."); playSound('CLICK');
      } else if (action === 'REPAIR') {
          if (bankBalance < 500) { setMsg("Cost $500."); return; }
          updateBank(-500);
          const newProps = [...ownedProperties]; newProps[index] = { ...prop, maintenanceHealth: 100 }; setOwnedProperties(newProps);
          setMsg("Repairs Complete. Health restored."); playSound('HAMMER');
      }
  };

  // Crypto Handlers
  const handleCryptoTrade = (symbol: string, action: 'BUY'|'SELL', amount: number) => {
      const asset = cryptoAssets.find(c => c.symbol === symbol);
      if(!asset) return;
      
      // HONEYPOT TRAP
      if (action === 'SELL' && asset.isHoneypot) {
          setMsg(`⚠️ TRANSACTION FAILED! ${symbol} is a Honeypot scam. You cannot sell.`);
          playSound('ERROR');
          return;
      }

      if (asset.walletType === 'COLD' && action === 'SELL') { setMsg("Cold Wallet Locked. Transfer to Hot Wallet first."); return; }
      
      const gasFee = asset.chain === 'ETHEREUM' ? 15 : asset.chain === 'BITCOIN' ? 5 : 0.01;

      if (action === 'BUY') {
          if (bankBalance >= amount + gasFee) {
              updateBank(-(amount + gasFee));
              const coins = amount / asset.price;
              setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? {...c, holdings: c.holdings + coins} : c));
              playSound('COIN');
          } else {
              setMsg("Insufficient Funds (Check Gas Fees)");
          }
      } else if (action === 'SELL') {
          const coins = amount / asset.price;
          if (asset.holdings >= coins) {
              // Selling also incurs gas? Let's say yes for realism, deducted from proceeds or balance.
              // Deducting from balance for simplicity
              updateBank(amount - gasFee);
              setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? {...c, holdings: c.holdings - coins} : c));
              playSound('COIN');
          }
      }
  };

  const handleScanContract = (symbol: string) => {
      if (bankBalance < 200) {
          setMsg("Scanning costs $200.");
          return;
      }
      updateBank(-200);
      setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? { ...c, isScanned: true } : c));
      setMsg(`Contract Scanned: ${symbol}`);
      playSound('CLICK');
  }

  const toggleStake = (symbol: string) => {
      setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? (c.holdings > 0 ? { ...c, staked: c.staked + c.holdings, holdings: 0 } : { ...c, holdings: c.holdings + c.staked, staked: 0 }) : c));
      playSound('CLICK');
  };

  const toggleWallet = (symbol: string) => {
      setCryptoAssets(prev => prev.map(c => c.symbol === symbol ? { ...c, walletType: c.walletType === 'HOT' ? 'COLD' : 'HOT' } : c));
      setMsg("Wallet type toggled.");
  };

  // --- CRYPTO TYCOON HANDLERS ---
  const handleBuyRig = (rig: MiningRig) => {
      if (bankBalance < rig.cost) { setMsg("Insufficient Funds."); return; }
      updateBank(-rig.cost);
      setMiningRigs(prev => [...prev, rig]);
      
      // ESG Logic
      setEsgScore(prev => Math.max(0, prev - (rig.efficiency > 90 ? 2 : 5)));
      
      playSound('SUCCESS');
      setMsg(`Acquired ${rig.name}. Hashrate +${rig.hashrate} TH/s`);
  };

  const handleBuyPower = (power: PowerSource) => {
      if (bankBalance < power.cost) { setMsg("Insufficient Funds."); return; }
      updateBank(-power.cost);
      setPowerSources(prev => [...prev, power]);
      
      // Green Energy Bonus
      if (power.type === 'SOLAR') setEsgScore(prev => Math.min(100, prev + 15));
      if (power.type === 'NUCLEAR') setEsgScore(prev => Math.min(100, prev + 40));

      playSound('SUCCESS');
      setMsg(`Infrastructure Upgrade: ${power.name}`);
  };

  const handleCreateToken = (project: TokenProject, cost: number) => {
      updateBank(-cost);
      setMyToken(project);
      playSound('VICTORY');
      setMsg(`${project.ticker} Launched! Initial Liquidity Injected.`);
  };

  const handleTokenAction = (action: string, cost: number) => {
      if (!myToken) return;
      if (myToken.isRugged) { setMsg("Token is dead."); return; }
      if (bankBalance < cost) { setMsg("Insufficient Funds."); return; }

      updateBank(-cost);

      if (action === 'MARKETING') {
          setMyToken(prev => prev ? ({ 
              ...prev, 
              hype: Math.min(100, prev.hype + 15), 
              secRisk: Math.min(100, prev.secRisk + 5),
              price: prev.price * 1.1 
          }) : null);
          setMsg("Marketing Campaign Deployed! Hype increasing.");
      } 
      else if (action === 'LOCK_LP') {
          setMyToken(prev => prev ? ({ ...prev, isLpLocked: true, hype: Math.min(100, prev.hype + 20) }) : null);
          setMsg("Liquidity Locked! Holder confidence boosted.");
      }
      else if (action === 'RENOUNCE') {
          setMyToken(prev => prev ? ({ ...prev, hype: Math.min(100, prev.hype + 10) }) : null);
          setMsg("Ownership Renounced. Trust increased.");
      }
      else if (action === 'LISTING') {
          // Simplification for brevity, assume next tier up
          const tiers: any[] = ['DEX', 'TIER_3', 'TIER_2', 'TIER_1'];
          const currentIdx = tiers.indexOf(myToken.listing);
          const nextListing = tiers[Math.min(3, currentIdx + 1)];
          setMyToken(prev => prev ? ({ ...prev, listing: nextListing, hype: Math.min(100, prev.hype + 30), price: prev.price * 1.2 }) : null);
          setMsg("Exchange Listing Approved! Price Pump!");
      }
      else if (action === 'RUG') {
          handleRugPull();
      }
      
      playSound('CLICK');
  };

  const handleRugPull = () => {
      if (!myToken || myToken.isRugged) return;
      const stealAmount = myToken.liquidity + (myToken.marketCap * 0.1); 
      updateBank(stealAmount);
      setMyToken(prev => prev ? ({ ...prev, isRugged: true, marketCap: 0, hype: 0, price: 0 }) : null);
      setMsg(`RUG PULLED! Stole $${stealAmount.toLocaleString()}. SEC Investigation Likely.`);
      playSound('VICTORY'); 
      addXP(-500); 
  };

  // --- NEW LEVERAGE & DEFI HANDLERS ---
  const handleOpenLeverage = (symbol: string, amount: number, leverage: number, type: 'LONG' | 'SHORT', tp?: number, sl?: number) => {
      if (bankBalance < amount) { setMsg("Insufficient Collateral."); return; }
      updateBank(-amount);
      const assetPrice = cryptoAssets.find(a => a.symbol === symbol)?.price || 0;
      if(assetPrice === 0) return;

      const liqPrice = type === 'LONG' 
          ? assetPrice * (1 - (1/leverage)) 
          : assetPrice * (1 + (1/leverage));
      
      const tpPrice = tp ? (type === 'LONG' ? assetPrice * (1 + tp/100) : assetPrice * (1 - tp/100)) : undefined;
      const slPrice = sl ? (type === 'LONG' ? assetPrice * (1 - sl/100) : assetPrice * (1 + sl/100)) : undefined;

      setLeveragePositions(prev => [...prev, {
          id: Date.now().toString(),
          symbol,
          entryPrice: assetPrice,
          amount,
          leverage,
          type,
          liquidationPrice: liqPrice,
          tpPrice,
          slPrice
      }]);
      playSound('CLICK');
      setMsg(`${leverage}x ${type} Opened on ${symbol}. High Risk.`);
  };

  const handleCloseLeverage = (id: string) => {
      const pos = leveragePositions.find(p => p.id === id);
      if(!pos) return;
      
      const currentPrice = cryptoAssets.find(a => a.symbol === pos.symbol)?.price || 0;
      let pnlPct = 0;
      if (pos.type === 'LONG') pnlPct = ((currentPrice - pos.entryPrice) / pos.entryPrice) * pos.leverage;
      else pnlPct = ((pos.entryPrice - currentPrice) / pos.entryPrice) * pos.leverage;
      
      const payout = pos.amount * (1 + pnlPct);
      updateBank(payout);
      setLeveragePositions(prev => prev.filter(p => p.id !== id));
      
      if(payout > pos.amount) { playSound('COIN'); setMsg(`Trade Closed. Profit: $${(payout - pos.amount).toFixed(0)}`); }
      else { playSound('ERROR'); setMsg(`Trade Closed. Loss: $${(pos.amount - payout).toFixed(0)}`); }
  };

  const handleJoinPool = (poolId: string, amount: number, isZap: boolean) => {
      if(bankBalance < amount) { setMsg("Insufficient Cash."); return; }
      updateBank(-amount);
      setLiquidityPools(prev => prev.map(p => {
          if (p.id !== poolId) return p;
          const share = amount / p.tvl; 
          return { ...p, myShare: p.myShare + share, tvl: p.tvl + amount };
      }));
      setMsg(isZap ? "Zapped into Pool! Assets Auto-Swapped." : "Liquidity Provided. Earning Yield.");
      playSound('SUCCESS');
  };

  const handleFlashLoan = () => {
      // High level arbitrage simulation
      if (bankBalance < 5000) { setMsg("Need $5k gas fees."); return; }
      if (Math.random() < 0.2) {
          updateBank(50000);
          setMsg("⚡ FLASH LOAN ARBITRAGE SUCCESS! Net Profit: $50k");
          playSound('VICTORY');
      } else {
          updateBank(-5000);
          setMsg("Flash Loan Failed. Gas fees lost.");
          playSound('ERROR');
      }
  };

  const handleToggleInsurance = (poolId: string) => {
      setLiquidityPools(prev => prev.map(p => {
          if(p.id !== poolId) return p;
          const newStatus = !p.hasInsurance;
          // Reduce APY if insuring
          const newApy = newStatus ? p.apy * 0.9 : p.apy / 0.9;
          return { ...p, hasInsurance: newStatus, apy: newApy };
      }));
      playSound('CLICK');
  }

  const handleToggleAutoCompound = (poolId: string) => {
      setLiquidityPools(prev => prev.map(p => p.id === poolId ? { ...p, isAutoCompounding: !p.isAutoCompounding } : p));
      playSound('CLICK');
  }

  const handleBorrow = (poolId: string, amount: number) => {
      setLiquidityPools(prev => prev.map(p => {
          if(p.id !== poolId) return p;
          // Simplified Health: Collateral / Borrowed. 
          // Assume user deposited $1000 collateral already.
          const collateral = p.tvl * p.myShare;
          if (collateral < amount * 1.5) {
              setMsg("Borrow failed. Collateral ratio too low (Need 150%).");
              return p;
          }
          const newBorrowed = (p.borrowedAmount || 0) + amount;
          updateBank(amount);
          return { ...p, borrowedAmount: newBorrowed };
      }));
  }

  const handleRepay = (poolId: string, amount: number) => {
      // Stub
  }

  const handleVote = (poolId: string) => {
      setLiquidityPools(prev => prev.map(p => p.id === poolId ? { ...p, apy: p.apy + 10 } : p));
      setMsg("Voted! APY boosted.");
      playSound('COIN');
  }

  // --- NFT HANDLERS ---
  const handleMintNft = (collectionId: string, cost: number) => {
      const col = nftCollections.find(c => c.id === collectionId);
      if(!col) return;
      
      // Cost is passed from GasWar logic now
      if(bankBalance < cost) { setMsg("Insufficient Funds for Mint"); return; }
      updateBank(-cost);
      
      const newItem: NftItem = {
          id: Date.now().toString(), collectionId: collectionId, name: `${col.name} #${Math.floor(Math.random()*1000)}`,
          rarity: Math.random() > 0.9 ? 'LEGENDARY' : Math.random() > 0.6 ? 'RARE' : 'COMMON',
          purchasePrice: cost, currentValuation: cost, imageColor: '#' + Math.floor(Math.random()*16777215).toString(16)
      };
      setMyNfts(p => [...p, newItem]);
      setMsg(`Minted ${newItem.name} (${newItem.rarity})!`);
      playSound('SUCCESS');
  };

  const handleSellNft = (id: string) => {
      const item = myNfts.find(n => n.id === id);
      if (!item) return;
      
      updateBank(item.currentValuation);
      setMyNfts(prev => prev.filter(n => n.id !== id));
      setMsg(`Sold ${item.name} for $${item.currentValuation.toLocaleString()}`);
      playSound('COIN');
  };

  const handleDeployCollection = (name: string, symbol: string, supply: number, price: number, layers: any) => {
      const cost = 2000;
      if (bankBalance < cost) {
          setMsg("Need $2,000 to deploy (Gas + Dev).");
          return;
      }
      
      updateBank(-cost);
      const newCol: NftCollection = {
          id: Date.now().toString(),
          name,
          chain: 'ETHEREUM',
          floorPrice: price,
          supply,
          hype: 10,
          isUserCreated: true,
          mintedCount: 0,
          revenueCollected: 0,
          layerConfig: layers
      };
      
      // We need to access setNftCollections from parent. 
      // Since we are inside Level4_Investing which owns the state, we can just update it here.
      setNftCollections(prev => [...prev, newCol]);
      setMsg("Collection Deployed! It's live on the testnet.");
      playSound('VICTORY');
  };

  const handleCollectRevenue = (id: string) => {
      const col = nftCollections.find(c => c.id === id);
      if (!col || !col.revenueCollected || col.revenueCollected <= 0) return;
      
      // Convert ETH to USD (Approx)
      const ethPrice = cryptoAssets.find(c => c.symbol === 'ETH')?.price || 2000;
      const usdValue = col.revenueCollected * ethPrice;
      
      updateBank(usdValue);
      setNftCollections(prev => prev.map(c => c.id === id ? {...c, revenueCollected: 0} : c));
      setMsg(`Collected ${col.revenueCollected.toFixed(3)} ETH ($${usdValue.toLocaleString()})`);
      playSound('COIN');
  };

  // Angel Handlers
  const handleInvest = (startup: StartupOpportunity) => {
      if (bankBalance < startup.ask) { setMsg("Insufficient Funds."); return; }
      updateBank(-startup.ask);
      setAngelPortfolio(prev => [...prev, { ...startup, status: 'FUNDED', mentorLevel: 0 }]);
      setStartups(prev => prev.filter(s => s.id !== startup.id));
      playSound('SUCCESS');
      setMsg(`Invested in ${startup.name}.`);
      addXP(300);
  };

  const handleMentor = (id: string) => {
      if (bankBalance < 200) { setMsg("Need $200."); return; }
      updateBank(-200);
      setAngelPortfolio(prev => prev.map(s => s.id === id ? { ...s, mentorLevel: (s.mentorLevel || 0) + 1 } : s));
      setMsg("Mentored Founder.");
      playSound('CLICK');
      addXP(50);
  };

  // --- SIMULATION ENGINE ---
  const calculateRSI = (history: any[]) => {
      if (history.length < 14) return 50;
      let gains = 0;
      let losses = 0;
      
      for(let i = history.length - 14; i < history.length; i++) {
          const change = history[i].price - history[i-1].price;
          if (change > 0) gains += change;
          else losses -= change;
      }
      
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      
      if (avgLoss === 0) return 100;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
  };

  const advanceWeek = async () => {
      setLoading(true);
      setWeek(w => w + 1);
      
      // Randomize Gas
      const newGas = Math.floor(Math.random() * 80) + 10;
      setGasPrice(newGas);

      // News
      if (Math.random() < 0.3) {
          const events = [{ text: "Fed Raises Rates", impact: -0.05, sector: 'ALL' }, { text: "Tech Boom", impact: 0.10, sector: 'TECH' }];
          const evt = events[Math.floor(Math.random() * events.length)];
          setMarketNews(prev => [evt.text, ...prev].slice(0, 5));
          setMsg(`NEWS: ${evt.text}`);
          setStocks(prev => prev.map(s => (evt.sector === 'ALL' || evt.sector === s.sector) ? { ...s, price: s.price * (1 + evt.impact) } : s));
      }

      setFearGreedIndex(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)));

      // --- WHALE WATCHER GENERATOR ---
      if (Math.random() < 0.4) {
          const symbols = ['BTC', 'ETH', 'SOL'];
          const sym = symbols[Math.floor(Math.random() * symbols.length)];
          const amount = Math.floor(Math.random() * 5000) + 100;
          const type = Math.random() > 0.5 ? 'INFLOW' : 'OUTFLOW';
          
          const alert: WhaleAlert = {
              id: Date.now().toString(),
              symbol: sym,
              amount: amount,
              value: 0,
              type: type,
              timestamp: Date.now()
          };
          setWhaleAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10
      }

      // --- CRYPTO PRICE SIMULATION ---
      const newCrypto = cryptoAssets.map(c => {
          let change = (Math.random() - 0.5) * c.volatility;
          
          // HONEYPOT LOGIC
          if (c.isHoneypot) {
              // Honeypots usually only go up until the rug
              change = Math.abs(change) + 0.05; 
          }

          const newPrice = Math.max(0.000001, c.price * (1 + change));
          
          if (c.staked > 0) c.staked += c.staked * (c.apy / 52);
          
          // HACK EVENT (Hot Wallet Risk)
          if (c.walletType === 'HOT' && c.holdings > 0 && Math.random() < 0.05) { 
              c.holdings = 0; 
              setMsg(`🚨 SECURITY BREACH! Exchange Hacked. Lost all ${c.symbol}. Not your keys...`); 
              playSound('ERROR'); 
          }
          
          // Append history
          const newHistory = [...c.history, { week: week+1, price: newPrice }].slice(-20); // Keep last 20 for charts

          return { 
              ...c, 
              price: newPrice, 
              change24h: change * 100, 
              history: newHistory 
          };
      });
      setCryptoAssets(newCrypto);

      // --- NFT MARKET SIMULATION ---
      // Update Collection Hype & Floors & User Mints
      const updatedCollections = nftCollections.map(col => {
          const hypeChange = Math.random() > 0.5 ? 5 : -5;
          const newHype = Math.max(0, Math.min(100, col.hype + hypeChange));
          // Price moves with hype + underlying chain volatility
          const baseToken = newCrypto.find(c => c.chain === col.chain);
          const chainTrend = baseToken && baseToken.history.length > 2 ? 
              (baseToken.price - baseToken.history[baseToken.history.length-2].price) / baseToken.price : 0;
          
          const priceChange = (newHype - 50) * 0.001 + chainTrend; 
          
          // User Created Logic: Random mints based on Hype
          let newMintedCount = col.mintedCount;
          let newRevenue = col.revenueCollected;
          
          if (col.isUserCreated && (col.mintedCount || 0) < col.supply) {
              const mintRate = Math.floor((newHype / 100) * 50); // Up to 50 mints per week
              const actualMints = Math.min(col.supply - (col.mintedCount||0), mintRate);
              if (actualMints > 0) {
                  newMintedCount = (col.mintedCount || 0) + actualMints;
                  newRevenue = (col.revenueCollected || 0) + (actualMints * col.floorPrice);
                  setMsg(`Your Collection: ${actualMints} new mints!`);
              }
          }

          return { 
              ...col, 
              hype: newHype, 
              floorPrice: Math.max(0.01, col.floorPrice * (1 + priceChange)),
              mintedCount: newMintedCount,
              revenueCollected: newRevenue
          };
      });
      setNftCollections(updatedCollections);

      // Update Owned NFT Valuations
      setMyNfts(prev => prev.map(item => {
          const col = updatedCollections.find(c => c.id === item.collectionId);
          if (!col) return item;
          
          const baseTokenPrice = newCrypto.find(c => c.chain === col.chain)?.price || 0;
          const floorUSD = col.floorPrice * baseTokenPrice;
          
          let multiplier = 1;
          if (item.rarity === 'RARE') multiplier = 2;
          if (item.rarity === 'LEGENDARY') multiplier = 5;
          
          return { ...item, currentValuation: floorUSD * multiplier };
      }));

      // --- LEVERAGE LIQUIDATION & TP/SL CHECK ---
      const activePositions: LeveragePosition[] = [];
      leveragePositions.forEach(pos => {
          const currentPrice = newCrypto.find(c => c.symbol === pos.symbol)?.price || 0;
          let liquidated = false;
          let hitTP = false;
          let hitSL = false;
          
          // Check Liquidation
          if (pos.type === 'LONG' && currentPrice <= pos.liquidationPrice) liquidated = true;
          if (pos.type === 'SHORT' && currentPrice >= pos.liquidationPrice) liquidated = true;
          
          // Check TP
          if (pos.tpPrice) {
              if (pos.type === 'LONG' && currentPrice >= pos.tpPrice) hitTP = true;
              if (pos.type === 'SHORT' && currentPrice <= pos.tpPrice) hitTP = true;
          }

          // Check SL
          if (pos.slPrice) {
              if (pos.type === 'LONG' && currentPrice <= pos.slPrice) hitSL = true;
              if (pos.type === 'SHORT' && currentPrice >= pos.slPrice) hitSL = true;
          }

          if (liquidated) {
              setMsg(`💀 LIQUIDATED! ${pos.leverage}x ${pos.symbol} position wiped out.`);
              playSound('ERROR');
          } else if (hitTP) {
              // Execute Profit Take
              const pnlPct = pos.type === 'LONG' 
                  ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * pos.leverage
                  : ((pos.entryPrice - currentPrice) / pos.entryPrice) * pos.leverage;
              const payout = pos.amount * (1 + pnlPct);
              updateBank(payout);
              setMsg(`🎯 TAKE PROFIT HIT! ${pos.symbol} closed at $${currentPrice.toFixed(2)}. Profit: $${(payout - pos.amount).toFixed(0)}`);
              playSound('COIN');
          } else if (hitSL) {
              // Execute Stop Loss
              const pnlPct = pos.type === 'LONG' 
                  ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * pos.leverage
                  : ((pos.entryPrice - currentPrice) / pos.entryPrice) * pos.leverage;
              const payout = pos.amount * (1 + pnlPct);
              updateBank(payout);
              setMsg(`🛡️ STOP LOSS HIT! ${pos.symbol} closed at $${currentPrice.toFixed(2)}. Loss: $${(pos.amount - payout).toFixed(0)}`);
              playSound('CLICK'); // Neutral sound for stop loss
          } else {
              activePositions.push(pos);
          }
      });
      setLeveragePositions(activePositions);

      // --- DEFI POOL SIMULATION ---
      const updatedPools = liquidityPools.map(p => {
          // Impermanent Loss Sim (Deeper Logic)
          let il = 0;
          if (p.type === 'FARM') {
              const underlying = newCrypto.find(c => p.pair.includes(c.symbol));
              if (underlying) {
                  const entryPrice = underlying.history[0].price;
                  const currentPrice = underlying.price;
                  const ratio = currentPrice / entryPrice;
                  // Standard IL formula: 2 * sqrt(ratio) / (1 + ratio) - 1
                  il = (2 * Math.sqrt(ratio) / (1 + ratio) - 1) * 100;
              }
          }
          
          // Yield Payout
          let tickReward = (p.tvl * p.myShare) * (p.apy / 100 / 52); // Weekly yield approx
          
          // Auto-Compound Logic
          if (p.isAutoCompounding) {
              // Reinvest reward into stake (simulated by just adding to myShare value indirectly via pendingRewards for now, or updating myShare)
              // For simplicity game loop: we'll just boost the APY effect by 20%
              tickReward *= 1.2; 
          }

          // Airdrop Point Gen
          let newPoints = (p.airdropPoints || 0) + (p.myShare > 0 ? 100 : 0);

          // Borrowing Interest
          if (p.borrowedAmount && p.borrowedAmount > 0) {
              const interest = p.borrowedAmount * 0.05 / 52; // 5% APR on debt
              p.borrowedAmount += interest;
          }

          // Health Factor Update
          let newHealth = 2.0;
          if (p.type === 'LENDING' && p.borrowedAmount > 0) {
              const ethPrice = newCrypto.find(c => c.symbol === 'ETH')?.price || 2000;
              const collateralValue = (p.collateralAmount || 0) * (p.pair === 'ETH' ? ethPrice : 1);
              newHealth = collateralValue / p.borrowedAmount;
              
              if (newHealth < 1.0) {
                  // LIQUIDATION LOGIC
                  p.collateralAmount = 0;
                  p.borrowedAmount = 0;
                  setMsg("💀 LENDING LIQUIDATION! Collateral seized to repay debt.");
                  playSound('ERROR');
              }
          }
          
          return { ...p, impermanentLoss: il, pendingRewards: (p.pendingRewards || 0) + tickReward, airdropPoints: newPoints, healthFactor: newHealth };
      });
      setLiquidityPools(updatedPools);

      // --- MINING SIMULATION (Enhanced Tycoon Mechanics) ---
      // NOTE: Rigs are now updated inside Crypto_Mining component visually, but we update the REAL state here for the game week tick.
      // We simulate average uptime.
      
      const totalHashrate = miningRigs.reduce((acc, r) => acc + (r.isOnline ? r.hashrate * (r.overclock / 100) : 0), 0);
      const totalPowerUsage = miningRigs.reduce((acc, r) => acc + (r.isOnline ? r.powerUsage * (r.overclock / 100) : 0), 0);
      const totalPowerCapacity = powerSources.filter(p => p.type !== 'COOLING').reduce((acc, p) => acc + p.capacity, 0); // Exclude Cooling from Generation
      
      if (totalHashrate > 0) {
          const btcMined = (totalHashrate / 100) * 0.05;
          const btcPrice = newCrypto.find(c => c.symbol === 'BTC')?.price || 40000;
          const revenue = btcMined * btcPrice;
          
          const gridUsage = Math.max(0, totalPowerUsage - totalPowerCapacity);
          const gridCost = gridUsage * 0.15; 
          const infraCost = powerSources.reduce((acc, p) => acc + p.weeklyCost, 0);
          
          // ESG Penalty
          if (esgScore < 30 && Math.random() < 0.2) {
              setMsg("📉 DELISTED! Exchange blocked your 'dirty' coins due to low ESG score. Revenue lost.");
          } else {
              updateBank(revenue - gridCost - infraCost);
          }
      }
      
      // Update Rig Conditions (Game Logic Tick)
      setMiningRigs(prev => prev.map(r => {
          if (!r.isOnline) return r;
          let damage = 0.5; // Weekly wear
          if (r.overclock > 120) damage += 2;
          if (r.temp > 80) damage += 1;
          const nextCondition = Math.max(0, r.condition - damage);
          return { ...r, condition: nextCondition, isOnline: nextCondition > 0 };
      }));

      // --- LAUNCHPAD SIMULATION (NEW) ---
      if (myToken && !myToken.isRugged) {
          // Decay Hype
          const hypeDecay = 2;
          let newHype = Math.max(0, myToken.hype - hypeDecay);
          
          // Price Move based on Hype
          // Hype > 50 = Price Up, Hype < 50 = Price Down
          const growth = (newHype - 40) / 1000; // Small daily movement
          const newPrice = Math.max(0.00000001, myToken.price * (1 + growth));
          
          const newHistory = [...myToken.history, { time: Date.now(), price: newPrice }];
          // Keep history manageable
          if (newHistory.length > 50) newHistory.shift();

          const newMarketCap = newPrice * myToken.supply;

          setMyToken(prev => prev ? ({ 
              ...prev, 
              hype: newHype, 
              marketCap: newMarketCap, 
              price: newPrice,
              history: newHistory
          }) : null);
          
          // SEC RAID EVENT
          if (myToken.secRisk > 80 && Math.random() < 0.05) {
              setMsg("⚖️ SEC RAID! Your token is a 'Unregistered Security'. Assets Frozen.");
              updateBank(-10000); // Fine
              setMyToken(prev => prev ? ({ ...prev, hype: 0, price: 0, isRugged: true }) : null); // Project killed
              playSound('ERROR');
          }
      }

      // ... (Existing Stock Processing) ...
      // Process Stocks
      const newStocks = stocks.map(s => {
          let sentimentMod = (fearGreedIndex - 50) * 0.001; 
          let change = (Math.random() - 0.5 + s.trend + sentimentMod) * s.volatility;
          const newPrice = Math.max(1, s.price * (1 + change));
          const newVolume = Math.floor(100000 + Math.random() * 500000 + (Math.abs(change) * 1000000));
          
          // Dividends
          if (s.dividendYield > 0 && week % 12 === 0 && holdings[s.ticker]) { 
              const divAmount = holdings[s.ticker] * s.price * (s.dividendYield / 4);
              if (dripEnabled) setHoldings(h => ({...h, [s.ticker]: h[s.ticker] + divAmount/newPrice}));
              else updateBank(divAmount);
          }

          // Stop Loss
          if (s.stopLoss && newPrice < s.stopLoss && (holdings[s.ticker] || 0) > 0) {
              updateBank(holdings[s.ticker] * newPrice);
              setHoldings(h => ({...h, [s.ticker]: 0}));
              setMsg(`STOP LOSS: Sold ${s.ticker}`);
          }

          // Limits
          limitOrders.forEach(order => {
              if (order.ticker === s.ticker) {
                  if (order.type === 'BUY' && newPrice <= order.targetPrice && bankBalance >= order.shares * newPrice) {
                      updateBank(-order.shares * newPrice);
                      setHoldings(h => ({...h, [s.ticker]: (h[s.ticker]||0) + order.shares}));
                      setLimitOrders(prev => prev.filter(o => o.id !== order.id));
                      setMsg(`LIMIT BUY: ${s.ticker}`);
                  } else if (order.type === 'SELL' && newPrice >= order.targetPrice && holdings[s.ticker] >= order.shares) {
                      updateBank(order.shares * newPrice);
                      setHoldings(h => ({...h, [s.ticker]: holdings[s.ticker] - order.shares}));
                      setLimitOrders(prev => prev.filter(o => o.id !== order.id));
                      setMsg(`LIMIT SELL: ${s.ticker}`);
                  }
              }
          });

          // Calc SMA & History
          const history = s.history;
          let newSma = newPrice;
          if (history.length >= 4) {
              const last4 = history.slice(-4).map(h => h.price);
              newSma = (last4.reduce((a, b) => a + b, 0) + newPrice) / 5;
          }
          const newHistory = [...s.history, { day: week, price: newPrice, volume: newVolume, sma: newSma }];
          
          // Recalc RSI & High/Low
          const rsi = calculateRSI(newHistory);
          const weekHigh = Math.max(s.weekHigh, newPrice);
          const weekLow = Math.min(s.weekLow, newPrice);
          const sentiment = Math.max(0, Math.min(100, s.sentiment + (change > 0 ? 2 : -2) + (Math.random()-0.5)*5));

          return { 
              ...s, 
              price: newPrice, 
              history: newHistory,
              rsi,
              weekHigh,
              weekLow,
              sentiment
          };
      });
      setStocks(newStocks);

      // Options
      let optionProfit = 0;
      activeOptions.forEach(opt => {
          const s = newStocks.find(st => st.ticker === opt.ticker);
          if (!s) return;
          let payout = 0;
          if (opt.type === 'CALL' && s.price > opt.strikePrice) payout = (s.price - opt.strikePrice) * opt.quantity;
          if (opt.type === 'PUT' && opt.strikePrice > s.price) payout = (opt.strikePrice - s.price) * opt.quantity;
          optionProfit += payout;
      });
      if (optionProfit > 0) { updateBank(optionProfit); setMsg(`Options Payout: $${optionProfit.toFixed(0)}`); playSound('COIN'); }
      setActiveOptions([]);

      // ... (Real Estate, Fed, Angel - KEEP EXISTING) ...
      // --- REAL ESTATE EVENT ENGINE ---
      let netRent = 0;
      const updatedProps = ownedProperties.map(p => {
          let appreciation = p.appreciationRate + (p.location === 'INDIA' ? 0.05 : 0);
          let newCondition = Math.max(0, p.condition - 0.2); // Natural decay
          let newMaintenance = Math.max(0, p.maintenanceHealth - 0.5); 
          let isSquatter = p.isSquatter;
          let tenantStatus = p.tenantStatus;
          let vacant = p.isVacant;
          let hasInsurance = p.hasInsurance;

          // 1. Squatter Check (If vacant > 5% chance)
          if (vacant && !isSquatter && Math.random() < 0.05) {
              isSquatter = true; vacant = false;
              setMsg(`⚠️ SQUATTERS in ${p.name}! Rent stopped. Evict now.`); playSound('ERROR');
          }

          // 2. Special Assessment (Random Bill)
          if (Math.random() < 0.01) {
              updateBank(-2000);
              setMsg(`💸 Special Assessment: New Roof for ${p.name}. Cost $2,000.`); playSound('ERROR');
          }

          // 3. Tenant Default
          if (tenantStatus === 'GOOD' && Math.random() < 0.02) {
              tenantStatus = 'LATE';
              setMsg(`⚠️ Tenant in ${p.name} stopped paying rent.`);
          }

          // 4. Gentrification (Value Bump)
          if (Math.random() < 0.005) {
              appreciation += 0.15;
              setMsg(`🚀 Gentrification! ${p.name} neighborhood booming.`); playSound('SUCCESS');
          }

          // 5. Neighborhood Decay
          if (Math.random() < 0.005) {
              appreciation -= 0.10;
              setMsg(`📉 Crime Wave near ${p.name}. Values dropping.`); playSound('ERROR');
          }

          // 6. Maintenance Crisis
          if (newMaintenance < 30 && Math.random() < 0.1) {
              updateBank(-1000);
              setMsg(`💥 HVAC Died in ${p.name} due to low maintenance. Cost $1,000.`); playSound('ERROR');
          }

          // 7. Insurance Event
          if (Math.random() < 0.005) {
              if (hasInsurance) {
                  setMsg(`🔥 Fire at ${p.name}! Insurance covered the damages.`);
              } else {
                  newCondition = Math.max(0, newCondition - 50);
                  setMsg(`🔥 FIRE at ${p.name}! No Insurance. Value tanked.`); playSound('ERROR');
              }
          }

          // 8. Tax Hike
          if (Math.random() < 0.01) {
              // Simulating by just reducing cash, technically should update propTaxRate state
              updateBank(-500);
              setMsg(`🏛️ Property Tax Reassessment for ${p.name}. Paid $500.`);
          }

          // 9. Fed Rate Impact (Global) - Handled outside loop, affects new loans

          const newPrice = p.price * (1 + (appreciation / 52)) * (newCondition/100);
          
          // Rent Logic
          let weeklyRent = (p.price * (p.rentalYield / 100)) / 52;
          if (vacant || isSquatter || tenantStatus === 'LATE') weeklyRent = 0;
          else if (newMaintenance < 50) weeklyRent *= 0.8; // Bad maintenance lowers rent

          netRent += (weeklyRent - (p.mortgageBalance * (fedRate + 2) / 100 / 52)); // Interest rate dynamic

          return { 
              ...p, 
              price: newPrice, 
              equity: newPrice - p.mortgageBalance, 
              condition: newCondition,
              maintenanceHealth: newMaintenance,
              isSquatter,
              isVacant: vacant,
              tenantStatus,
              hasInsurance: Math.random() > 0.1 ? hasInsurance : false // 10% chance insurance expires weekly (simulates term end)
          };
      });
      setOwnedProperties(updatedProps);
      if (netRent !== 0) updateBank(netRent);

      // Fed Rate Move
      if (Math.random() < 0.05) {
          const change = (Math.random() - 0.5) * 0.5;
          setFedRate(r => Math.max(2, Math.min(10, r + change)));
          setMsg(`🏦 FED UPDATE: Rates now ${fedRate.toFixed(2)}%`);
      }

      // DCA
      if (dcaEnabled && bankBalance >= 500) {
          const spy = stocks.find(s => s.ticker === 'VOO');
          if (spy) {
              const shares = 500 / spy.price;
              updateBank(-500);
              setHoldings(h => ({...h, ['VOO']: (h['VOO'] || 0) + shares}));
          }
      }

      // Algo Bot
      if (algoBot?.isActive) {
          if (Math.random() < algoBot.flashCrashRisk) {
              updateBank(-Math.min(bankBalance, 2000)); setMsg("⚠️ BOT CRASHED!"); playSound('ERROR');
          } else {
              const profit = Math.floor(Math.random() * 300); updateBank(profit);
          }
      }

      // Bonds
      if (inflationBonds > 0) updateBank(inflationBonds * (0.04 / 52));

      // Angel
      const updatedAngel = angelPortfolio.map(s => {
          if (s.status === 'FUNDED') {
              const roll = Math.random();
              if (roll < 0.02 + ((s.mentorLevel||0)*0.05)) {
                  if (Math.random() < 0.2) { 
                      const payout = s.ask * (s.potentialX || 10); updateBank(payout); s.status = 'EXITED'; setMsg(`UNICORN EXIT: $${payout.toLocaleString()}`); playSound('VICTORY'); 
                  } else { s.status = 'BANKRUPT'; setMsg(`${s.name} Bankrupt.`); playSound('ERROR'); }
              }
          }
          return s;
      });
      setAngelPortfolio(updatedAngel);

      if (marginUsed > 0) updateBank(-(marginUsed * 0.08 / 52));
      if (week % 4 === 0) refreshListings();

      // Check Margin Call
      if (marginUsed > 0 && (getStockValue() + bankBalance) < marginUsed * 0.5) {
          setMsg("MARGIN CALL! Liquidated.");
          setHoldings({}); setMarginUsed(0); playSound('ERROR');
      }

      setPortfolioHistory(prev => [...prev, { week: week + 1, netWorth: getTotalNetWorth(), cash: Math.max(0, bankBalance), stocks: getStockValue(), realEstate: getRealEstateEquity(), crypto: getCryptoValue(), angel: getAngelValue() }]);
      setLoading(false);
  };

  const handleBailout = () => {
      if (bankBalance >= 1000) {
          const target = 9000; updateBank(target - bankBalance);
          setHoldings({}); setOwnedProperties([]); setAngelPortfolio([]); setLimitOrders([]); setMarginUsed(0); setWeek(0); setAlgoBot(null); setInflationBonds(0);
          setPortfolioHistory([{ week: 0, netWorth: target, cash: target, stocks: 0, realEstate: 0, crypto: 0, angel: 0 }]);
          initializeMarket(); setMsg("BAILOUT GRANTED. Reset."); playSound('CLICK');
      } else { setMsg("Need $1k for Bailout fee."); playSound('ERROR'); }
  };

  const panicSell = () => {
      const val = getStockValue(); if (val === 0) return;
      updateBank(val); setHoldings({}); setMsg("PANIC SOLD ALL STOCKS."); playSound('ERROR');
  };

  // Pie Chart Data
  const allocationData = [
      { name: 'Cash', value: Math.max(0, bankBalance) },
      { name: 'Stocks', value: getStockValue() },
      { name: 'Real Estate', value: getRealEstateEquity() },
      { name: 'Crypto', value: getCryptoValue() },
      { name: 'Angel', value: getAngelValue() },
      { name: 'Bonds', value: inflationBonds }
  ].filter(d => d.value > 0);

  const currentNetWorth = portfolioHistory[portfolioHistory.length-1].netWorth;
  const isVictory = currentNetWorth >= GOAL_VALUE;

  return (
    <div className="space-y-6 animate-in zoom-in duration-500 pb-12 relative">
        <MissionBrief 
            title="The Wealth Matrix (A-Tier)"
            rpgAnalogy="Asset Allocation is your 'Build Loadout'. Limit Orders are 'Traps'. Margin is 'Berserk Mode' (High Dmg, Low Def)."
            realWorldLesson="Amateurs pick stocks. Pros manage risk. Use Limit Orders to buy dips automatically. Watch Volume for breakout confirmation."
            missionGoal={`Net Worth > $${(GOAL_VALUE/1000).toFixed(0)}k across all asset classes.`}
            conceptTerm="Margin Trading"
            mentorPersona={mentorPersona}
        />

        {/* VICTORY BANNER */}
        {isVictory && !stayInLevel && (
            <div className="fixed bottom-0 left-0 right-0 bg-indigo-900/95 border-t-4 border-indigo-500 p-6 z-50 flex items-center justify-center animate-in slide-in-from-bottom">
                <div className="max-w-4xl flex items-center gap-8">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-2"><TrendingUp className="text-emerald-400" size={32} /> Market Mastery</h2>
                        <p className="text-indigo-200">Portfolio Target Achieved.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => { addXP(5000); onComplete(); }} className="bg-white text-indigo-900 font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2">Collect Profits <CheckCircle size={24} /></button>
                        <button onClick={() => setStayInLevel(true)} className="bg-transparent border-2 border-indigo-400 text-indigo-200 font-bold py-4 px-8 rounded-full hover:bg-indigo-800 transition-colors flex items-center gap-2">Stay (Sandbox) <Unlock size={24} /></button>
                    </div>
                </div>
            </div>
        )}

        {/* TOP HUD */}
        <div className="bg-slate-900/80 border border-emerald-500/30 p-6 rounded-2xl grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-lg">
            <div className="flex flex-col justify-center">
                <div className="flex justify-between items-center">
                    <h2 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2">Total Net Worth</h2>
                    <ActionTooltip title="Market Bailout" desc="Reset Portfolio to $9,000 Cash. Cost: $1,000 Penalty.">
                        <button onClick={handleBailout} className="text-[10px] bg-red-900/20 text-red-400 px-2 py-1 rounded border border-red-900 hover:bg-red-900/40 flex items-center gap-1"><RotateCcw size={10} /> Bailout ($1k)</button>
                    </ActionTooltip>
                </div>
                <div className="text-4xl font-black font-mono text-white mb-1">${currentNetWorth.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                <div className="flex gap-4 text-xs">
                    <span className={`flex items-center gap-1 ${bankBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}><DollarSign size={12}/> Cash: ${bankBalance.toLocaleString()}</span>
                    {marginUsed > 0 && <span className="text-red-400 flex items-center gap-1">Margin Debt: -${marginUsed.toLocaleString()} <Info size={10} /></span>}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Market Sentiment:</span>
                    <Gauge size={16} className={fearGreedIndex > 60 ? 'text-red-500' : fearGreedIndex < 40 ? 'text-emerald-500' : 'text-yellow-500'} />
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 w-1 bg-white" style={{left: `${fearGreedIndex}%`}}></div>
                        <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 opacity-50"></div>
                    </div>
                </div>
                {fearGreedIndex < 30 && getStockValue() > 0 && <button onClick={panicSell} className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest animate-pulse shadow-lg"><AlertTriangle className="inline mr-2"/> PANIC SELL ALL</button>}
            </div>
            
            <div className="h-40 bg-slate-950/50 rounded-lg border border-slate-700 relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioHistory}>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} itemStyle={{padding: 0}} />
                        <Area type="monotone" dataKey="angel" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                        <Area type="monotone" dataKey="crypto" stackId="1" stroke="#ec4899" fill="#ec4899" />
                        <Area type="monotone" dataKey="realEstate" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                        <Area type="monotone" dataKey="stocks" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                        <Area type="monotone" dataKey="cash" stackId="1" stroke="#10b981" fill="#10b981" />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="absolute top-2 left-2 text-[10px] text-slate-500 uppercase font-bold">Wealth Stack</div>
            </div>

            <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={allocationData} innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                            {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} formatter={(val: number) => `$${val.toLocaleString()}`}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* MAIN DASHBOARD */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="flex border-b border-slate-700 bg-slate-900 overflow-x-auto">
                {['STOCKS', 'REAL_ESTATE', 'CRYPTO', 'ANGEL'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors ${activeTab === tab ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}>
                        {tab === 'STOCKS' && <TrendingUp size={16} />}
                        {tab === 'REAL_ESTATE' && <Home size={16} />}
                        {tab === 'CRYPTO' && <Bitcoin size={16} />}
                        {tab === 'ANGEL' && <Rocket size={16} />}
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {activeTab === 'STOCKS' && (
                    <Investing_Stocks 
                        stocks={stocks} holdings={holdings} bankBalance={bankBalance} marginUsed={marginUsed} marginLimit={marginLimit} limitOrders={limitOrders} activeOptions={activeOptions} marketNews={marketNews} algoBot={algoBot} dcaEnabled={dcaEnabled} dripEnabled={dripEnabled}
                        onTrade={handleStockTrade} onBuyOption={handleOptionBuy} onHarvestTaxLoss={handleHarvestLoss} onCancelLimitOrder={(id) => setLimitOrders(prev => prev.filter(o => o.id !== id))}
                        onToggleDCA={() => setDcaEnabled(!dcaEnabled)} onToggleDRIP={() => setDripEnabled(!dripEnabled)} onBuyAlgoBot={() => { if(bankBalance>=5000) { updateBank(-5000); setAlgoBot({id:'bot',level:1,isActive:true,totalProfit:0,flashCrashRisk:0.01}); }}}
                        onBuyBond={(amt) => { if(bankBalance>=amt) { updateBank(-amt); setInflationBonds(prev => prev+amt); }}}
                    />
                )}
                {activeTab === 'REAL_ESTATE' && (
                    <Investing_RealEstate 
                        listings={propertyListings} 
                        properties={ownedProperties} 
                        bankBalance={bankBalance} 
                        fedRate={fedRate}
                        onBuy={handleBuyProperty} 
                        onManage={handleManageProperty} 
                        onRefresh={refreshListings} 
                    />
                )}
                {activeTab === 'CRYPTO' && (
                    <Investing_Crypto 
                        assets={cryptoAssets} 
                        bankBalance={bankBalance} 
                        rigs={miningRigs}
                        powerSources={powerSources}
                        myToken={myToken}
                        positions={leveragePositions}
                        pools={liquidityPools}
                        esgScore={esgScore}
                        nftCollections={nftCollections}
                        myNfts={myNfts}
                        gasPrice={gasPrice}
                        onTrade={handleCryptoTrade} 
                        onStake={toggleStake} 
                        onWalletToggle={(sym) => setCryptoAssets(prev => prev.map(c => c.symbol === sym ? {...c, walletType: c.walletType==='HOT'?'COLD':'HOT'} : c))}
                        onBuyRig={(rig) => { if(bankBalance >= rig.cost) { updateBank(-rig.cost); setMiningRigs(p => [...p, rig]); setEsgScore(s => Math.max(0, s-5)); }}}
                        onBuyPower={(power) => { if(bankBalance >= power.cost) { updateBank(-power.cost); setPowerSources(p => [...p, power]); setEsgScore(s => Math.min(100, s+20)); }}}
                        onCreateToken={(project, cost) => { 
                            updateBank(-cost);
                            setMyToken(project);
                            playSound('VICTORY');
                            setMsg(`${project.ticker} Launched!`);
                        }}
                        onMarketing={(type) => { 
                            // Legacy fallback
                            const cost = type==='BOTS'?500:2000; 
                            if(bankBalance>=cost) { updateBank(-cost); setMyToken(p => p ? {...p, hype: p.hype+20} : null); }
                        }}
                        onRugPull={() => { 
                            if(myToken && !myToken.isRugged) { 
                                updateBank(myToken.liquidity); 
                                setMyToken(p => p ? {...p, isRugged: true} : null); 
                            }
                        }}
                        onTokenAction={(action, cost) => {
                            if (!myToken || myToken.isRugged) return;
                            if (bankBalance < cost) { setMsg("Insufficient funds."); return; }
                            updateBank(-cost);
                            
                            if (action === 'MARKETING') {
                                setMyToken(prev => prev ? ({ ...prev, hype: Math.min(100, prev.hype + 15), price: prev.price * 1.1 }) : null);
                                setMsg("Marketing Boosted!");
                            } else if (action === 'LOCK_LP') {
                                setMyToken(prev => prev ? ({ ...prev, isLpLocked: true, hype: prev.hype + 20 }) : null);
                                setMsg("Liquidity Locked!");
                            } else if (action === 'RENOUNCE') {
                                setMyToken(prev => prev ? ({ ...prev, hype: prev.hype + 10 }) : null);
                                setMsg("Ownership Renounced!");
                            } else if (action === 'LISTING') {
                                setMyToken(prev => prev ? ({ ...prev, price: prev.price * 1.2, hype: prev.hype + 30 }) : null);
                                setMsg("New Listing Approved!");
                            } else if (action === 'RUG') {
                                const steal = myToken.liquidity;
                                updateBank(steal);
                                setMyToken(prev => prev ? ({ ...prev, isRugged: true, price: 0 }) : null);
                                setMsg("RUG PULLED! You stole the liquidity.");
                                playSound('VICTORY');
                            }
                            playSound('CLICK');
                        }}
                        onOpenLeverage={(s, amt, lev, type, tp, sl) => { if(bankBalance >= amt) { updateBank(-amt); setLeveragePositions(p => [...p, { id: Date.now().toString(), symbol: s, entryPrice: cryptoAssets.find(c=>c.symbol===s)?.price||0, amount: amt, leverage: lev, type, liquidationPrice: (cryptoAssets.find(c=>c.symbol===s)?.price||0) * (type==='LONG' ? 1-(1/lev) : 1+(1/lev)), tpPrice: tp ? (type === 'LONG' ? (cryptoAssets.find(c=>c.symbol===s)?.price||0) * (1 + tp/100) : (cryptoAssets.find(c=>c.symbol===s)?.price||0) * (1 - tp/100)) : undefined, slPrice: sl ? (type === 'LONG' ? (cryptoAssets.find(c=>c.symbol===s)?.price||0) * (1 - sl/100) : (cryptoAssets.find(c=>c.symbol===s)?.price||0) * (1 + sl/100)) : undefined }]); }}}
                        onCloseLeverage={(id) => { const p = leveragePositions.find(pos=>pos.id===id); if(p) { const cp = cryptoAssets.find(c=>c.symbol===p.symbol)?.price||0; const pnl = p.type==='LONG' ? (cp-p.entryPrice)/p.entryPrice : (p.entryPrice-cp)/p.entryPrice; updateBank(p.amount * (1 + pnl*p.leverage)); setLeveragePositions(prev=>prev.filter(pos=>pos.id!==id)); }}}
                        onJoinPool={(id, amt, isZap) => { if(bankBalance >= amt) { updateBank(-amt); setLiquidityPools(prev => prev.map(p => p.id===id ? {...p, myShare: p.myShare + (amt/p.tvl)} : p)); setMsg(isZap ? "Zapped into Pool! Auto-Swapped." : "Liquidity Provided."); playSound('SUCCESS'); }}}
                        onFlashLoan={() => { if(bankBalance >= 5000) { if(Math.random()<0.3) { updateBank(50000); setMsg("Flash Loan Success! +$50k"); } else { updateBank(-5000); setMsg("Flash Loan Failed. Gas Lost."); }}}}
                        onMintNft={(colId, cost) => { 
                            const col = nftCollections.find(c => c.id === colId);
                            if(!col) return;
                            
                            // Cost is passed from GasWar logic now
                            if(bankBalance < cost) { setMsg("Insufficient Funds for Mint"); return; }
                            updateBank(-cost);
                            
                            const newItem: NftItem = {
                                id: Date.now().toString(), collectionId: colId, name: `${col.name} #${Math.floor(Math.random()*1000)}`,
                                rarity: Math.random() > 0.9 ? 'LEGENDARY' : Math.random() > 0.6 ? 'RARE' : 'COMMON',
                                purchasePrice: cost, currentValuation: cost, imageColor: '#' + Math.floor(Math.random()*16777215).toString(16)
                            };
                            setMyNfts(p => [...p, newItem]);
                            setMsg(`Minted ${newItem.name} (${newItem.rarity})!`);
                            playSound('SUCCESS');
                        }}
                        onSellNft={(id) => {
                            const nft = myNfts.find(n => n.id === id);
                            if(!nft) return;
                            updateBank(nft.currentValuation);
                            setMyNfts(p => p.filter(n => n.id !== id));
                            setMsg(`Sold ${nft.name} for $${nft.currentValuation.toLocaleString()}`);
                            playSound('COIN');
                        }}
                        onDeployCollection={handleDeployCollection}
                        onCollectRevenue={handleCollectRevenue}
                        onScanContract={handleScanContract}
                        onToggleInsurance={(poolId) => { setLiquidityPools(prev => prev.map(p => p.id === poolId ? { ...p, hasInsurance: !p.hasInsurance, apy: p.hasInsurance ? p.apy / 0.9 : p.apy * 0.9 } : p)); playSound('CLICK'); }}
                        onToggleAutoCompound={(poolId) => { setLiquidityPools(prev => prev.map(p => p.id === poolId ? { ...p, isAutoCompounding: !p.isAutoCompounding } : p)); playSound('CLICK'); }}
                        onBorrow={(poolId, amt) => { setLiquidityPools(prev => prev.map(p => { if (p.id !== poolId) return p; if ((p.tvl * p.myShare) < amt * 1.5) { setMsg("Borrow Failed. Low Collateral."); return p; } updateBank(amt); return { ...p, borrowedAmount: (p.borrowedAmount || 0) + amt }; })); playSound('COIN'); }}
                        onRepay={(poolId, amt) => { /* stub */ }}
                        onVote={(poolId) => { setLiquidityPools(prev => prev.map(p => p.id === poolId ? { ...p, apy: p.apy + 10 } : p)); setMsg("Voted! APY Boosted."); playSound('SUCCESS'); }}
                    />
                )}
                {activeTab === 'ANGEL' && (
                    <Investing_Angel startups={startups} portfolio={angelPortfolio} bankBalance={bankBalance} onInvest={handleInvest} onMentor={handleMentor} />
                )}
            </div>

            {/* Master Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg"><Eye className="text-indigo-400" size={20} /></div>
                    <p className="text-sm text-slate-300 font-mono animate-pulse">{msg}</p>
                </div>
                <button onClick={advanceWeek} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50">
                    {loading ? <RefreshCw className="animate-spin"/> : <PlayCircle fill="currentColor" />} Simulate Week
                </button>
            </div>
        </div>
    </div>
  );
};
