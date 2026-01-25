
import React, { createContext, useContext, useState, useEffect, useReducer, ReactNode } from 'react';
import {
    PlayerState, GameLevel, CharacterClass, InventoryItem,
    MentorPersona, Skill, Loan, HQUpgrade
} from '../types';
import { playSound } from '../utils/sound';

interface GameContextType {
    player: PlayerState;
    addXP: (amount: number) => void;
    updateBank: (amount: number) => void;
    updateReputation: (amount: number) => void;
    updateStress: (amount: number) => void;
    unlockItem: (item: InventoryItem) => void;
    removeItem: (id: string) => void;
    unlockSkill: (skillId: string) => void;
    purchaseHQ: (upgrade: HQUpgrade) => void;
    unlockAchievement: (id: string, rewardXP: number) => void;
    advanceLevel: () => void;
    jumpToLevel: (level: GameLevel) => void;
    setTaxRegime: (regime: 'NEW' | 'OLD') => void;
    onTakeLoan: (loan: Loan) => void;
    updateForex: (rate: number) => void;
    setMentor: (mentor: MentorPersona) => void;
    setClass: (charClass: CharacterClass) => void;
    resetGame: () => void;
}

const INITIAL_SKILLS: Skill[] = [
    { id: 'silver_tongue', name: 'Silver Tongue', description: 'Increases negotiation success chance by 20%.', cost: 1000, icon: 'Zap', unlocked: false, effect: 'NEGOTIATION_BONUS' },
    { id: 'audit_shield', name: 'Audit Shield', description: 'Reduces the chance of failure in Tax Levels.', cost: 2000, icon: 'Shield', unlocked: false, effect: 'TAX_SHIELD' },
    { id: 'forex_hedge', name: 'Forex Hedge', description: 'Locks in a favorable exchange rate for 1 transaction.', cost: 3000, icon: 'TrendingUp', unlocked: false, effect: 'FOREX_HEDGE' },
    { id: 'credit_builder', name: 'Credit Builder', description: 'Passively increases Credit Score by 5 pts per level.', cost: 1500, icon: 'CreditCard', unlocked: false, effect: 'CREDIT_BOOST' },
    { id: 'appraisal_eye', name: 'Gemologist Eye', description: 'Shows true value range for gemstones in Level 6.', cost: 2500, icon: 'Eye', unlocked: false, effect: 'APPRAISAL_EYE' },
];

const INITIAL_STATE: PlayerState = {
    name: "Visual Capitalist",
    xp: 0,
    bankBalance: 100000,
    reputation: 80,
    creditScore: 800,
    stress: 20,
    level: GameLevel.Intro,
    characterClass: 'NONE',
    mentorPersona: 'GAMER_BRO',
    achievements: [],
    skills: INITIAL_SKILLS,
    inventory: [],
    loans: [],
    targetIncome: 5000,
    pitchDraft: '',
    forexRate: 83.50,
    commodityHoldings: {},
    taxRegime: 'NEW',
    hqUpgrades: []
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [player, setPlayer] = useState<PlayerState>(INITIAL_STATE);
    const [loaded, setLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem('globalLedgerSave');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const mergedSkills = INITIAL_SKILLS.map(s => {
                    const existing = parsed.skills?.find((ps: Skill) => ps.id === s.id);
                    return existing || s;
                });
                setPlayer({
                    ...parsed,
                    skills: mergedSkills,
                    forexRate: parsed.forexRate || 83.50,
                    creditScore: parsed.creditScore || 680,
                    stress: parsed.stress || 20,
                    loans: parsed.loans || [],
                    commodityHoldings: parsed.commodityHoldings || {},
                    taxRegime: parsed.taxRegime || 'NEW',
                    achievements: parsed.achievements || [],
                    hqUpgrades: parsed.hqUpgrades || []
                });
            } catch (e) {
                console.error("Save file corrupted");
            }
        }
        setLoaded(true);
    }, []);

    // Save on Change
    useEffect(() => {
        if (loaded) {
            localStorage.setItem('globalLedgerSave', JSON.stringify(player));
        }
    }, [player, loaded]);

    // Actions
    const addXP = (amount: number) => {
        if (amount > 0) playSound('COIN');
        setPlayer(prev => ({ ...prev, xp: prev.xp + amount }));
    };

    const updateBank = (amount: number) => {
        if (amount > 0) playSound('COIN');
        setPlayer(prev => ({ ...prev, bankBalance: prev.bankBalance + amount }));
    };

    const updateReputation = (amount: number) => {
        setPlayer(prev => ({ ...prev, reputation: Math.max(0, Math.min(100, prev.reputation + amount)) }));
    };

    const updateStress = (amount: number) => {
        let finalAmount = amount;
        if (amount > 0 && player.hqUpgrades?.includes('ergonomic')) {
            finalAmount *= 0.85;
        }
        setPlayer(prev => ({ ...prev, stress: Math.max(0, Math.min(100, prev.stress + finalAmount)) }));
    };

    const unlockItem = (item: InventoryItem) => {
        playSound('SUCCESS');
        setPlayer(prev => {
            if (prev.inventory.some(i => i.id === item.id)) return prev;
            return { ...prev, inventory: [...prev.inventory, item] };
        });
    };

    const removeItem = (id: string) => {
        setPlayer(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
    };

    const unlockSkill = (skillId: string) => {
        setPlayer(prev => {
            const skill = prev.skills.find(s => s.id === skillId);
            if (!skill || prev.xp < skill.cost) {
                playSound('ERROR');
                return prev;
            }
            playSound('LEVEL_UP');
            let creditBoost = skill.effect === 'CREDIT_BOOST' ? 20 : 0;
            return {
                ...prev,
                xp: prev.xp - skill.cost,
                creditScore: prev.creditScore + creditBoost,
                skills: prev.skills.map(s => s.id === skillId ? { ...s, unlocked: true } : s)
            };
        });
    };

    const purchaseHQ = (upgrade: HQUpgrade) => {
        setPlayer(prev => ({
            ...prev,
            bankBalance: prev.bankBalance - upgrade.cost,
            hqUpgrades: [...(prev.hqUpgrades || []), upgrade.id]
        }));
    };

    const unlockAchievement = (id: string, rewardXP: number) => {
        setPlayer(prev => {
            if (prev.achievements.includes(id)) return prev;
            return {
                ...prev,
                achievements: [...prev.achievements, id],
                xp: prev.xp + rewardXP
            };
        });
    };

    const advanceLevel = () => {
        playSound('LEVEL_UP');
        setPlayer(prev => {
            const levels = Object.values(GameLevel);
            const currentIndex = levels.indexOf(prev.level);
            let nextIndex = currentIndex + 1;

            if (prev.level === GameLevel.Intro) return { ...prev, level: GameLevel.MentorSelection };
            if (prev.level === GameLevel.MentorSelection) return { ...prev, level: GameLevel.ClassSelection };
            if (prev.level === GameLevel.ClassSelection) return { ...prev, level: GameLevel.Level1 };

            const nextLevel = levels[nextIndex] || GameLevel.Victory;
            return { ...prev, level: nextLevel };
        });
    };

    const jumpToLevel = (level: GameLevel) => {
        playSound('CLICK');
        setPlayer(prev => ({ ...prev, level }));
    };

    const setTaxRegime = (regime: 'NEW' | 'OLD') => {
        setPlayer(prev => ({ ...prev, taxRegime: regime }));
    };

    const onTakeLoan = (loan: Loan) => {
        playSound('SUCCESS');
        setPlayer(prev => ({
            ...prev,
            loans: [...prev.loans, loan],
            creditScore: Math.max(300, prev.creditScore - 10)
        }));
    };

    const updateForex = (rate: number) => {
        setPlayer(prev => ({ ...prev, forexRate: rate }));
    };

    const setMentor = (mentor: MentorPersona) => {
        playSound('CLICK');
        setPlayer(prev => ({ ...prev, mentorPersona: mentor, level: GameLevel.ClassSelection }));
    };

    const setClass = (charClass: CharacterClass) => {
        playSound('LEVEL_UP');
        let starterItems: InventoryItem[] = [];
        if (charClass === 'SAAS_FOUNDER') {
            starterItems.push({ id: 'corp_card', name: 'Corporate Card', description: 'Builds credit if paid monthly.', icon: 'CreditCard' });
        }
        setPlayer(prev => ({
            ...prev,
            characterClass: charClass,
            level: GameLevel.Level1,
            inventory: [...prev.inventory, ...starterItems]
        }));
    };

    const resetGame = () => {
        if (confirm("Reset all progress?")) {
            setPlayer(INITIAL_STATE);
            localStorage.removeItem('globalLedgerSave');
        }
    };

    return (
        <GameContext.Provider value={{
            player, addXP, updateBank, updateReputation, updateStress,
            unlockItem, removeItem, unlockSkill, purchaseHQ,
            unlockAchievement, advanceLevel, jumpToLevel, setTaxRegime,
            onTakeLoan, updateForex, setMentor, setClass, resetGame
        }}>
            {loaded && children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};
