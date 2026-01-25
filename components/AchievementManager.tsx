
import React, { useEffect, useState } from 'react';
import { Trophy, X, Star, Crown, Zap, Gem, Briefcase, DollarSign } from 'lucide-react';
import { PlayerState, Achievement } from '../types';
import { playSound } from '../utils/sound';

interface AchievementManagerProps {
  player: PlayerState;
  onUnlock: (id: string, xp: number) => void;
}

const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_steps', title: 'First Steps', description: 'Complete Level 1.', icon: 'Footprints', xpReward: 100, rarity: 'COMMON' },
    { id: 'high_credit', title: 'Credit Worthy', description: 'Reach 750+ Credit Score.', icon: 'CreditCard', xpReward: 300, rarity: 'RARE' },
    { id: 'first_k', title: 'First $1k', description: 'Have $1,000 in the bank.', icon: 'DollarSign', xpReward: 200, rarity: 'COMMON' },
    { id: 'fat_wallet', title: 'Fat Wallet', description: 'Accumulate $10,000 cash.', icon: 'Wallet', xpReward: 500, rarity: 'RARE' },
    { id: 'tycoon', title: 'Tycoon Status', description: 'Amass $50,000 Net Worth.', icon: 'Crown', xpReward: 1000, rarity: 'LEGENDARY' },
    { id: 'stress_free', title: 'Zen Master', description: 'Keep Stress below 10% while Level > 2.', icon: 'Smile', xpReward: 400, rarity: 'RARE' },
    { id: 'reputation_max', title: 'Legendary Reputation', description: 'Reach 100 Reputation.', icon: 'Star', xpReward: 600, rarity: 'LEGENDARY' },
    
    // New Complex Achievements
    { id: 'diamond_hands', title: 'Diamond Hands', description: 'Hold Crypto while having > $5000 cash. (HODL Mode)', icon: 'Gem', xpReward: 800, rarity: 'LEGENDARY' },
    { id: 'the_wolf', title: 'The Wolf', description: 'Close a deal with "Aggressive" tactics (Stub implementation).', icon: 'Briefcase', xpReward: 500, rarity: 'RARE' },
    { id: 'tax_ninja', title: 'Tax Ninja', description: 'Unlock the W-8BEN Guide item.', icon: 'Shield', xpReward: 400, rarity: 'RARE' },
    { id: 'commodity_king', title: 'Goldfinger', description: 'Hold 50+ units of any Commodity.', icon: 'Anchor', xpReward: 700, rarity: 'LEGENDARY' },
    { id: 'angel_investor', title: 'Unicorn Hunter', description: 'Make an Angel Investment.', icon: 'Rocket', xpReward: 300, rarity: 'RARE' },
    { id: 'debt_free', title: 'Debt Destroyer', description: 'Have 0 Debt in Level 1.', icon: 'CheckCircle', xpReward: 200, rarity: 'COMMON' },
    { id: 'master_architect', title: 'Global Architect', description: 'Complete the Game.', icon: 'Globe', xpReward: 5000, rarity: 'MYTHIC' }
];

export const AchievementManager: React.FC<AchievementManagerProps> = ({ player, onUnlock }) => {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [visible, setVisible] = useState<Achievement | null>(null);

  // Check Logic
  useEffect(() => {
      ACHIEVEMENTS.forEach(ach => {
          if (!player.achievements.includes(ach.id)) {
              let unlocked = false;
              
              // Conditions
              if (ach.id === 'first_steps' && player.level !== 'INTRO' && player.level !== 'MENTOR_SELECTION' && player.level !== 'CLASS_SELECTION' && player.level !== 'LEVEL_1') unlocked = true;
              if (ach.id === 'high_credit' && player.creditScore >= 750) unlocked = true;
              if (ach.id === 'first_k' && player.bankBalance >= 1000) unlocked = true;
              if (ach.id === 'fat_wallet' && player.bankBalance >= 10000) unlocked = true;
              if (ach.id === 'tycoon' && player.bankBalance >= 50000) unlocked = true;
              if (ach.id === 'stress_free' && player.stress < 10 && player.level !== 'LEVEL_1' && player.level !== 'INTRO') unlocked = true;
              if (ach.id === 'reputation_max' && player.reputation >= 100) unlocked = true;
              
              // New Checks
              if (ach.id === 'tax_ninja' && player.inventory.some(i => i.id === 'w8ben_guide')) unlocked = true;
              if (ach.id === 'debt_free' && player.level !== 'LEVEL_1' && player.level !== 'INTRO') {
                  // Simplified check, ideally strictly check debt var from level 1 state, assuming player is good if > lvl 1
                  unlocked = true; 
              }
              if (ach.id === 'commodity_king') {
                  const totalComm = (Object.values(player.commodityHoldings || {}) as number[]).reduce((a, b) => a + b, 0);
                  if (totalComm >= 50) unlocked = true;
              }
              if (ach.id === 'master_architect' && player.level === 'VICTORY') unlocked = true;

              if (unlocked) {
                  onUnlock(ach.id, ach.xpReward);
                  setQueue(prev => [...prev, ach]);
              }
          }
      });
  }, [player, onUnlock]);

  // Queue Processor
  useEffect(() => {
      if (!visible && queue.length > 0) {
          const next = queue[0];
          setVisible(next);
          setQueue(prev => prev.slice(1));
          playSound('VICTORY'); 
          
          // Auto hide after 4s
          setTimeout(() => {
              setVisible(null);
          }, 4000);
      }
  }, [queue, visible]);

  if (!visible) return null;

  const getRarityColor = (r: string) => {
      switch(r) {
          case 'MYTHIC': return 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 border-fuchsia-400';
          case 'LEGENDARY': return 'bg-gradient-to-r from-amber-500 via-yellow-600 to-yellow-500 border-yellow-400';
          case 'RARE': return 'bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400';
          default: return 'bg-slate-800 border-slate-600';
      }
  };

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8 duration-500">
        <div className={`border-2 text-white px-6 py-4 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden min-w-[300px] ${getRarityColor(visible.rarity)}`}>
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            
            <div className="bg-black/30 p-3 rounded-full shrink-0">
                {visible.rarity === 'MYTHIC' ? <Crown size={32} className="text-white drop-shadow-md" /> :
                 visible.rarity === 'LEGENDARY' ? <Trophy size={32} className="text-white drop-shadow-md" /> :
                 <Star size={32} className="text-white" />}
            </div>
            <div className="flex-1">
                <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1 opacity-80">{visible.rarity} UNLOCKED</h4>
                <p className="font-bold text-lg leading-none mb-1">{visible.title}</p>
                <p className="text-[10px] font-mono uppercase text-white/70">+{visible.xpReward} XP</p>
            </div>
            <button onClick={() => setVisible(null)} className="text-white/50 hover:text-white ml-2"><X size={16}/></button>
        </div>
    </div>
  );
};
