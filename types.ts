
export enum GameLevel {
  Intro = 'INTRO',
  MentorSelection = 'MENTOR_SELECTION',
  ClassSelection = 'CLASS_SELECTION',
  Level1 = 'LEVEL_1',
  Level2 = 'LEVEL_2',
  Level3 = 'LEVEL_3',
  Level4 = 'LEVEL_4',
  Level5 = 'LEVEL_5',
  Level6 = 'LEVEL_6',
  FinalBoss = 'FINAL_BOSS',
  Victory = 'VICTORY',
  Sandbox = 'SANDBOX'
}

export type CharacterClass = 'TECH_NOMAD' | 'CREATIVE_AGENCY' | 'SAAS_FOUNDER' | 'VIRTUAL_ASSISTANT' | 'NONE';
export type MentorPersona = 'WALL_ST' | 'ZEN_MONK' | 'GAMER_BRO';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity?: 'COMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
  buff?: string;
  value?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  unlocked: boolean;
  effect?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  remainingBalance: number;
}

export interface HQUpgrade {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
  effectType: string;
  value: number;
  unlocked: boolean;
  benefit: string;
}

export interface PlayerState {
  name: string;
  xp: number;
  bankBalance: number;
  reputation: number;
  creditScore: number;
  stress: number;
  level: GameLevel;
  characterClass: CharacterClass;
  mentorPersona: MentorPersona;
  achievements: string[];
  skills: Skill[];
  inventory: InventoryItem[];
  loans: Loan[];
  targetIncome: number;
  pitchDraft: string;
  forexRate: number;
  commodityHoldings: Record<string, number>;
  taxRegime: 'NEW' | 'OLD';
  hqUpgrades: string[];
}

export interface QuizQuestion {
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface GigOffer {
  clientName: string;
  projectTitle: string;
  budget: string;
  description: string;
  isGoodDeal: boolean;
  flags: string[];
}

export interface ContractClause {
  id: string;
  text: string;
  type: 'SAFE' | 'DANGEROUS';
  explanation: string;
}

export interface TermSheetClause {
  id: string;
  term: string;
  description: string;
  isStandard: boolean;
}

export interface Gemstone {
  id: string;
  name: string;
  description: string;
  trueValue: number;
  askingPrice: number;
}

export interface MarketNews {
  headline: string;
  lore: string;
  sector: string;
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface InvestorProfile {
  name: string;
  firm: string;
  style: string;
  offerValuation: number;
  offerAmount: number;
}

export interface FinalExamQuestion {
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface ScopeCreepEvent {
  title: string;
  description: string;
  impactCost: number;
}

export interface UpsellOpportunity {
  title: string;
  description: string;
  potentialRevenue: number;
  costEnergy: number;
}

export type ClientVibe = 'URGENT' | 'CORPORATE' | 'MICROMANAGER' | 'CHILL' | 'BROKE';
export type ProposalStrategy = 'VALUE_BASED' | 'COST_PLUS' | 'SPEED_PREMIUM';
export type MarketingChannel = 'COLD_EMAIL' | 'PAID_ADS' | 'NETWORKING';
export type StaffRole = 'JUNIOR_DEV' | 'DESIGNER' | 'SENIOR_DEV';

export interface ActiveProject {
  id: string;
  clientName: string;
  vibe: ClientVibe;
  contractValue: number;
  paymentTerm: 'NET_0' | 'NET_30';
  progress: number;
  killFee: number;
  isOutsourced: boolean;
  bugs: number;
  clientHappiness: number;
}

export interface StaffMember {
  id: string;
  role: StaffRole;
  salary: number;
  efficiencyBuff: number;
  bugRate: number;
}

export interface PropertyListing {
  id: string;
  name: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'FIXER_UPPER';
  price: number;
  location: string;
  rentalYield: number;
  condition: number; // 0-100
  appreciationRate: number;
  isOffMarket: boolean;
  downPaymentPct: number;
  arv?: number;
  renovationCostEst?: number;
}

export interface PitchEvaluation {
  score: number;
  tone: string;
  feedback: string;
}

export type ClientTrait = 'HATES_JARGON' | 'VISUAL_LEARNER' | 'PRICE_SENSITIVE' | 'DATA_DRIVEN' | 'RISK_AVERSE';
export type PitchSectionType = 'HOOK' | 'INSIGHT' | 'ASK';

export type OptionType = 'CALL' | 'PUT';

export interface ActiveOption {
  id: string;
  ticker: string;
  type: OptionType;
  strikePrice: number;
  premiumPaid: number;
  quantity: number;
  purchaseWeek: number;
}

export interface OwnedProperty extends PropertyListing {
  mortgageBalance: number;
  equity: number;
  isVacant: boolean;
  lastRentPaidWeek: number;
  isSquatter: boolean;
  maintenanceHealth: number;
  hasInsurance: boolean;
  tenantStatus: 'GOOD' | 'LATE';
  propertyTaxRate: number;
}

export type Blockchain = 'ETHEREUM' | 'SOLANA' | 'BITCOIN' | 'POLYGON' | 'BASE' | 'ARBITRUM';
export type CryptoSector = 'L1' | 'L2' | 'DEFI' | 'MEME' | 'STABLE' | 'ORACLE' | 'RWA' | 'INFRA';

export interface CryptoAsset {
  symbol: string;
  name: string;
  chain: Blockchain;
  sector: CryptoSector;
  price: number;
  holdings: number;
  staked: number;
  apy: number;
  volatility: number;
  history: { week: number, price: number }[];
  walletType: 'HOT' | 'COLD';
  change24h: number;
  rank: number;
  marketCap: number; // in Billions
  volume24h: number; // in Millions
  dominance: number;
  sentiment: number; // 0-100
  riskScore: number; // 1-10
  change1h: number;
  change7d: number;
  isHoneypot: boolean;
  isScanned: boolean;
}

export interface PortfolioHistory {
  week: number;
  netWorth: number;
  cash: number;
  stocks: number;
  realEstate: number;
  crypto: number;
  angel: number;
}

export interface Stock {
  ticker: string;
  name: string;
  price: number;
  trend: number;
  volatility: number;
  history: { day: number, price: number, volume: number, sma: number }[];
  dividendYield: number;
  avgBuyPrice?: number;
  peRatio: number;
  sector: 'TECH' | 'AUTO' | 'ETF' | 'HEALTH' | 'FINANCE' | 'CONSUMER';
  beta: number;
  analystRating: 'BUY' | 'SELL' | 'HOLD';
  rsi: number;
  sentiment: number;
  marketCap: number; // Billions
  weekHigh: number;
  weekLow: number;
  stopLoss?: number;
  washSaleExpiry?: number;
}

export interface AlgoBot {
  id: string;
  level: number;
  isActive: boolean;
  totalProfit: number;
  flashCrashRisk: number;
}

export interface LimitOrder {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  targetPrice: number;
  shares: number;
}

export interface MiningRig {
  id: string;
  name: string;
  hashrate: number; // TH/s
  powerUsage: number; // Watts
  cost: number;
  efficiency: number; // %
  type: 'GPU' | 'ASIC';
  temp: number;
  overclock: number; // %
  condition: number;
  isOnline: boolean;
}

export interface PowerSource {
  id: string;
  name: string;
  capacity: number; // Watts
  cost: number;
  weeklyCost: number;
  type: 'GRID' | 'SOLAR' | 'WIND' | 'HYDRO' | 'NUCLEAR' | 'COOLING';
}

export interface TokenProject {
  id: string;
  name: string;
  ticker: string;
  supply: number;
  buyTax: number;
  sellTax: number;
  teamAllocation: number;
  marketCap: number;
  liquidity: number;
  price: number;
  holders: number;
  hype: number; // 0-100
  secRisk: number; // 0-100
  isRugged: boolean;
  isLpLocked: boolean;
  isAudited: boolean;
  listing: 'DEX' | 'TIER_3' | 'TIER_2' | 'TIER_1';
  history: { time: number, price: number }[];
}

export interface LeveragePosition {
  id: string;
  symbol: string;
  entryPrice: number;
  amount: number;
  leverage: number;
  type: 'LONG' | 'SHORT';
  liquidationPrice: number;
  tpPrice?: number;
  slPrice?: number;
}

export interface LiquidityPool {
  id: string;
  name: string;
  pair: string;
  tvl: number;
  myShare: number;
  apy: number;
  impermanentLoss: number;
  pendingRewards: number;
  riskScore: number;
  protocol: 'UNISWAP' | 'AAVE' | 'CURVE' | 'PEPE';
  type: 'FARM' | 'LENDING';
  borrowedAmount?: number;
  collateralAmount?: number;
  healthFactor?: number;
  airdropPoints?: number;
  hasInsurance?: boolean;
  isAutoCompounding?: boolean;
}

export interface NftCollection {
  id: string;
  name: string;
  chain: Blockchain;
  floorPrice: number;
  supply: number;
  hype: number;
  isUserCreated: boolean;
  mintedCount?: number;
  revenueCollected?: number;
  layerConfig?: any;
}

export interface NftItem {
  id: string;
  collectionId: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  purchasePrice: number;
  currentValuation: number;
  imageColor: string;
}

export interface WhaleAlert {
  id: string;
  symbol: string;
  amount: number;
  value: number;
  type: 'INFLOW' | 'OUTFLOW';
  timestamp: number;
}

export interface CapTableEntity {
  name: string;
  shares: number;
  percent: number;
  color: string;
}

export interface FundingRound {
  name: string;
  valuation: number;
  raised: number;
}

export interface PitchCard {
  id: string;
  type: 'TEAM' | 'MARKET' | 'PRODUCT';
  label: string;
  scoreEffect: number;
  desc: string;
}

export type ExitScenario = 'IPO' | 'ACQUISITION' | 'FAIL';

export interface CoFounder {
  name: string;
  role: 'CTO' | 'CMO' | 'CFO';
  equity: number;
  relationship: number;
  hasVesting: boolean;
  isActive: boolean;
}

export interface CoFounderCandidate {
  id: string;
  name: string;
  role: 'CTO' | 'CMO' | 'CFO';
  skill: number;
  equityAsk: number;
  salaryAsk: number;
  trait: 'GENIUS' | 'TOXIC' | 'CONNECTOR' | 'LAZY';
  desc: string;
}

export interface RoadshowCity {
  id: string;
  name: string;
  sentiment: number;
  cost: number;
  visited: boolean;
  sectorPreference: string;
}

export interface Commodity {
  id: string;
  name: string;
  type: 'PRECIOUS_METAL' | 'ENERGY' | 'INDUSTRIAL_METAL' | 'CARBON';
  price: number;
  futuresPrice: number;
  marketCondition: 'CONTANGO' | 'BACKWARDATION';
  unit: string;
  volatility: number;
  storageCost: number;
  trend: number;
  history: { week: number, price: number }[];
  esgRisk: number;
  LC: boolean;
  isRefinable?: boolean;
  refineOutput?: string;
  refineMargin?: number;
}

export type ShippingStatus = 'CLEAR' | 'BLOCKED';

export interface RecyclingBatch {
  id: string;
  commodityId: string;
  qty: number;
  completionWeek: number;
  outputQty: number;
}

export interface Mine {
  id: string;
  name: string;
  resource: string;
  weeklyOutput: number;
  operatingCost: number;
}

export interface LeasedAsset {
  commodityId: string;
  qty: number;
  weeklyYield: number;
}

export interface CustomsHold {
  id: string;
  commodityId: string;
  qty: number;
  releaseWeek: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string, value: string | number }[];
}

export interface FinalStats {
  subject: string;
  A: number;
  fullMark: number;
}

export interface MortgageOffer {
  id: string;
  bankName: string;
  rate: number;
  minCreditScore: number;
  maxLTV: number;
  closingCostPct: number;
  desc: string;
}

// Angel Investing Types
export type StartupRegion = 'SILICON_VALLEY' | 'BANGALORE' | 'TEL_AVIV' | 'BERLIN' | 'LAGOS' | 'SINGAPORE';
export type StartupSector = 'AI_INFRA' | 'FINTECH' | 'BIOTECH' | 'CONSUMER' | 'WEB3' | 'CLIMATE' | 'SAAS';
export type FounderArchetype = 'VISIONARY' | 'HACKER' | 'HUSTLER' | 'ACADEMIC' | 'FRAUDSTER';

export interface FounderProfile {
  name: string;
  role: string;
  archetype: FounderArchetype;
  skill: number; // 0-100
  integrity: number; // 0-100 (Hidden stat revealed by DD)
  pitchStyle: string;
}

export interface StartupOpportunity {
  id: string;
  name: string;
  pitch: string;

  // Geography & Sector
  region: StartupRegion;
  sector: StartupSector;

  // Deal Terms
  valuation: number;
  ask: number; // Min ticket
  equityOffered: number; // %

  // Hidden Stats (Revealed by Due Diligence)
  burnRate: number; // $/mo
  runwayMonths: number;
  traction: number; // MRR or Users
  redFlags: string[]; // e.g., "Pending Lawsuit"
  greenFlags: string[]; // e.g., "Ex-Google Team"

  // People
  founder: FounderProfile;

  // Status
  status: 'OPEN' | 'FUNDED' | 'PASSED' | 'EXITED' | 'BANKRUPT' | 'DILUTED';
  investedAmount?: number;
  currentValuation?: number; // For tracking portfolio growth
  round: 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'SERIES_B';

  // Additional fields for gameplay
  mentorLevel?: number;
  potentialX?: number; // Potential multiplier for exit
}

export interface SectorTrend {
  id: StartupSector;
  name: string;
  hype: number; // 0-100. Affects Valuation.
  exitMultiple: number; // 5x - 100x potential
  volatility: number;
}

export interface RegionStats {
  id: StartupRegion;
  name: string;
  valuationMod: number; // 1.0 = Standard, 0.5 = Cheap, 2.0 = Expensive
  talentPool: number; // Affects success rate
  riskFactor: number;
}
