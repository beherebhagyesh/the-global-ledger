
import React, { useState, useEffect } from 'react';
import { GameLevel, PlayerState, CharacterClass, InventoryItem, MentorPersona, Skill, Loan, HQUpgrade } from './types';
import { GameLayout } from './components/GameLayout';
import { Level1_Foundations } from './components/Level1_Foundations';
import { Level2_Corporate } from './components/Level2_Corporate';
import { Level3_Tax } from './components/Level3_Tax';
import { Level4_Investing } from './components/Level4_Investing';
import { Level5_Funding } from './components/Level5_Funding';
import { Level6_Commodities } from './components/Level6_Commodities'; // Import Level 6
import { FinalBoss } from './components/FinalBoss';
import { ClassSelector } from './components/ClassSelector';
import { MentorSelector } from './components/MentorSelector';
import { RandomEncounter } from './components/RandomEncounter';
import { VictoryScreen } from './components/VictoryScreen';
import { GigSimulator } from './components/GigSimulator';
import { AchievementManager } from './components/AchievementManager';
import { Play } from 'lucide-react';
import { playSound } from './utils/sound';

const INITIAL_SKILLS: Skill[] = [
    { id: 'silver_tongue', name: 'Silver Tongue', description: 'Increases negotiation success chance by 20%.', cost: 1000, icon: 'Zap', unlocked: false, effect: 'NEGOTIATION_BONUS' },
    { id: 'audit_shield', name: 'Audit Shield', description: 'Reduces the chance of failure in Tax Levels.', cost: 2000, icon: 'Shield', unlocked: false, effect: 'TAX_SHIELD' },
    { id: 'forex_hedge', name: 'Forex Hedge', description: 'Locks in a favorable exchange rate for 1 transaction.', cost: 3000, icon: 'TrendingUp', unlocked: false, effect: 'FOREX_HEDGE' },
    { id: 'credit_builder', name: 'Credit Builder', description: 'Passively increases Credit Score by 5 pts per level.', cost: 1500, icon: 'CreditCard', unlocked: false, effect: 'CREDIT_BOOST' },
    { id: 'appraisal_eye', name: 'Gemologist Eye', description: 'Shows true value range for gemstones in Level 6.', cost: 2500, icon: 'Eye', unlocked: false, effect: 'APPRAISAL_EYE' },
];

// DEV MODE ENABLED: Starting with high cash to test all levels
const INITIAL_STATE: PlayerState = {
    name: "Visual Capitalist",
    xp: 0,
    bankBalance: 100000, // TEST MODE: $100k Start to test Level 4/6
    reputation: 80, // High rep to unlock things
    creditScore: 800, // Excellent credit
    stress: 20, // Low initial stress
    level: GameLevel.Intro,
    characterClass: 'NONE',
    mentorPersona: 'GAMER_BRO',
    achievements: [],
    skills: INITIAL_SKILLS,
    inventory: [],
    loans: [],
    // Tracking for Business Plan
    targetIncome: 5000,
    pitchDraft: '',
    forexRate: 83.50, // Base USD to INR
    commodityHoldings: {},
    taxRegime: 'NEW',
    hqUpgrades: []
};

const App: React.FC = () => {
  const [player, setPlayer] = useState<PlayerState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  
  // Random Encounter State
  const [showEncounter, setShowEncounter] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('globalLedgerSave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge skills to ensure new skills appear in old saves
            const mergedSkills = INITIAL_SKILLS.map(s => {
                const existing = parsed.skills?.find((ps: Skill) => ps.id === s.id);
                return existing || s;
            });
            // Ensure fields exist
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

  // Save to local storage
  useEffect(() => {
    if (loaded) {
        localStorage.setItem('globalLedgerSave', JSON.stringify(player));
    }
  }, [player, loaded]);

  // Forex Fluctuation Loop
  useEffect(() => {
      const interval = setInterval(() => {
          setPlayer(prev => {
              // Fluctuate between 82 and 86
              const change = (Math.random() - 0.5) * 0.5;
              const newRate = Math.max(82, Math.min(86, prev.forexRate + change));
              return { ...prev, forexRate: newRate };
          });
      }, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
  }, []);

  const addXP = (amount: number) => {
    if (amount > 0) playSound('COIN');
    setPlayer(prev => ({ ...prev, xp: prev.xp + amount }));
  };
  
  const updateStress = (amount: number) => {
    // Check HQ Buffs
    let finalAmount = amount;
    if (amount > 0 && player.hqUpgrades?.includes('ergonomic')) {
        finalAmount *= 0.85; // 15% reduction
    }
    setPlayer(prev => ({ ...prev, stress: Math.max(0, Math.min(100, prev.stress + finalAmount)) }));
  };

  const updateBank = (amount: number) => {
      if(amount > 0) playSound('COIN');
      setPlayer(prev => ({ ...prev, bankBalance: prev.bankBalance + amount }));
  };
  
  const updateReputation = (amount: number) => {
      setPlayer(prev => ({ ...prev, reputation: Math.max(0, Math.min(100, prev.reputation + amount)) }));
  };

  const onTakeLoan = (loan: Loan) => {
      playSound('SUCCESS');
      setPlayer(prev => ({
          ...prev,
          loans: [...prev.loans, loan],
          // Taking a loan dips credit slightly temporarily
          creditScore: Math.max(300, prev.creditScore - 10)
      }));
  }

  const selectMentor = (p: MentorPersona) => {
      playSound('CLICK');
      setPlayer(prev => ({ ...prev, mentorPersona: p, level: GameLevel.ClassSelection }));
  }

  const selectClass = (c: CharacterClass) => {
      playSound('LEVEL_UP');
      // Add class specific starter items
      let starterItems: InventoryItem[] = [];
      if (c === 'SAAS_FOUNDER') {
          starterItems.push({ id: 'corp_card', name: 'Corporate Card', description: 'Builds credit if paid monthly.', icon: 'CreditCard' });
      }

      setPlayer(prev => ({ 
          ...prev, 
          characterClass: c, 
          level: GameLevel.Level1, 
          inventory: [...prev.inventory, ...starterItems]
      }));
  }

  const unlockItem = (item: InventoryItem) => {
    playSound('SUCCESS');
    setPlayer(prev => {
        // Prevent dupes
        if (prev.inventory.some(i => i.id === item.id)) return prev;
        return { ...prev, inventory: [...prev.inventory, item] };
    });
  };

  const removeItem = (id: string) => {
      setPlayer(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
  };
  
  const useItem = (item: InventoryItem) => {
      if (item.id === 'corp_card') {
          playSound('COIN');
          // Simulate paying off bill
          alert("You paid your corporate card bill in full. Credit Score +5.");
          setPlayer(p => ({ ...p, creditScore: Math.min(850, p.creditScore + 5) }));
      }
  }

  const unlockSkill = (skillId: string) => {
      setPlayer(prev => {
          const skill = prev.skills.find(s => s.id === skillId);
          if (!skill || prev.xp < skill.cost) {
              playSound('ERROR');
              return prev;
          }
          
          playSound('LEVEL_UP');
          let creditBoost = 0;
          if (skill.effect === 'CREDIT_BOOST') creditBoost = 20;

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
  }

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

  const setTaxRegime = (regime: 'NEW' | 'OLD') => {
      setPlayer(prev => ({ ...prev, taxRegime: regime }));
  };

  const advanceLevel = () => {
    playSound('LEVEL_UP');
    setPlayer(prev => {
        const levels = Object.values(GameLevel);
        const currentIndex = levels.indexOf(prev.level);
        
        let nextIndex = currentIndex + 1;
        
        // Handling Flow manually to be safe
        if (prev.level === GameLevel.Intro) return { ...prev, level: GameLevel.MentorSelection };
        if (prev.level === GameLevel.MentorSelection) return { ...prev, level: GameLevel.ClassSelection };
        if (prev.level === GameLevel.ClassSelection) return { ...prev, level: GameLevel.Level1 };

        const nextLevel = levels[nextIndex] || GameLevel.Victory;
        return { ...prev, level: nextLevel };
    });
  };

  const resetGame = () => {
      if(confirm("Reset all progress?")) {
          setPlayer(INITIAL_STATE);
          localStorage.removeItem('globalLedgerSave');
      }
  };

  // Warp Logic
  const handleJumpLevel = (level: GameLevel) => {
      playSound('CLICK');
      setPlayer(prev => ({ ...prev, level }));
  };

  if (!loaded) return null;

  const renderLevel = () => {
    switch (player.level) {
      case GameLevel.Intro:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in fade-in duration-1000">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-slate-900 tracking-tighter">
              THE GLOBAL<br/>LEDGER
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">
              Real-Life RPG. From India to the US Market.<br/>
              Level up from Novice to Global Financial Architect.
            </p>
            <button 
              onClick={() => { playSound('CLICK'); advanceLevel(); }}
              className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-lg rounded overflow-hidden transition-all"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-3">Start Game <Play fill="black" /></span>
            </button>
          </div>
        );
      case GameLevel.MentorSelection:
          return <MentorSelector onSelect={selectMentor} />;
      case GameLevel.ClassSelection:
          return <ClassSelector onSelect={selectClass} />;
      case GameLevel.Level1:
        return (
            <Level1_Foundations 
                onComplete={advanceLevel} 
                addXP={addXP} 
                mentorPersona={player.mentorPersona} 
                updateStress={updateStress} 
                initialTaxRegime={player.taxRegime}
                onTaxRegimeChange={setTaxRegime}
                updateBank={updateBank} // Pass updateBank for seed capital transfer
            />
        );
      case GameLevel.Level2:
        return (
            <Level2_Corporate 
                onComplete={advanceLevel} 
                addXP={addXP} 
                characterClass={player.characterClass} 
                unlockItem={unlockItem} 
                mentorPersona={player.mentorPersona} 
                updateBank={updateBank}
                inventory={player.inventory}
                reputation={player.reputation}
                updateReputation={updateReputation}
                bankBalance={player.bankBalance}
                forexRate={player.forexRate}
                stress={player.stress} // Pass stress for energy mechanic
            />
        );
      case GameLevel.Level3:
        return (
            <Level3_Tax 
                onComplete={advanceLevel} 
                addXP={addXP} 
                unlockItem={unlockItem} 
                mentorPersona={player.mentorPersona} 
                globalTaxRegime={player.taxRegime}
                forexRate={player.forexRate}
                updateBank={updateBank}
                bankBalance={player.bankBalance}
                reputation={player.reputation} // Pass reputation for invoice cap
            />
        );
      case GameLevel.Level4:
        return (
            <Level4_Investing 
                onComplete={advanceLevel} 
                addXP={addXP} 
                mentorPersona={player.mentorPersona} 
                updateBank={updateBank} 
                bankBalance={player.bankBalance} 
            />
        );
      case GameLevel.Level5:
        return (
            <Level5_Funding 
                onComplete={advanceLevel} 
                addXP={addXP} 
                mentorPersona={player.mentorPersona} 
                creditScore={player.creditScore}
                updateBank={updateBank}
                onTakeLoan={onTakeLoan}
                bankBalance={player.bankBalance}
            />
        );
      case GameLevel.Level6: 
        return (
            <Level6_Commodities 
                onComplete={advanceLevel} 
                addXP={addXP} 
                mentorPersona={player.mentorPersona} 
                updateBank={updateBank}
                unlockItem={unlockItem}
                inventory={player.inventory}
                removeItem={removeItem}
                bankBalance={player.bankBalance}
            />
        );
      case GameLevel.FinalBoss:
        return (
            <FinalBoss 
                onComplete={advanceLevel} 
                addXP={addXP} 
                mentorPersona={player.mentorPersona} 
                playerState={player} 
            />
        );
      case GameLevel.Victory:
        return (
          <VictoryScreen 
            player={player} 
            onReset={resetGame} 
            onSandbox={() => setPlayer(p => ({...p, level: GameLevel.Sandbox}))} 
          />
        );
      case GameLevel.Sandbox:
          return <GigSimulator onBack={() => setPlayer(p => ({...p, level: GameLevel.Victory}))} />;
      default:
        return <div>Unknown Level</div>;
    }
  };

  return (
    <GameLayout 
        player={player} 
        onUnlockSkill={unlockSkill} 
        onUseItem={useItem}
        onJumpLevel={handleJumpLevel}
        onPurchaseHQ={purchaseHQ}
    >
      <AchievementManager player={player} onUnlock={unlockAchievement} />
      {showEncounter && (
          <RandomEncounter 
            currentLevel={player.level} 
            onComplete={() => {
                setShowEncounter(false);
                addXP(50);
            }} 
          />
      )}
      {renderLevel()}
    </GameLayout>
  );
};

export default App;
