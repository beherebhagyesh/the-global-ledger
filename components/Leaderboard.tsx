import React from 'react';
import { Trophy, TrendingUp, User } from 'lucide-react';

interface LeaderboardProps {
  playerProfit: number;
}

interface LeaderboardEntry {
  name: string;
  profit: number;
  class: string;
  isMe?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ playerProfit }) => {
  // Mock data for simulation
  const leaders: LeaderboardEntry[] = [
    { name: 'CryptoKing_99', profit: 12500, class: 'Tech Nomad' },
    { name: 'Sarah_Designs', profit: 9200, class: 'Creative Agency' },
    { name: 'DevOps_Dave', profit: 8100, class: 'Tech Nomad' },
  ];

  // Insert player into rank
  const allPlayers: LeaderboardEntry[] = [...leaders, { name: 'YOU', profit: playerProfit, class: 'Novice', isMe: true }].sort((a,b) => b.profit - a.profit);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden w-full max-w-md mx-auto mt-8">
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-sm uppercase">
            <Trophy size={14} /> Global Profit Leaderboard
        </h3>
        <span className="text-[10px] text-slate-500">Updated: LIVE</span>
      </div>
      
      <div className="p-2">
        {allPlayers.map((p, i) => (
            <div 
                key={p.name}
                className={`flex items-center justify-between p-2 rounded mb-1 text-sm ${p.isMe ? 'bg-emerald-900/20 border border-emerald-500/30' : 'hover:bg-slate-800'}`}
            >
                <div className="flex items-center gap-3">
                    <span className={`font-mono w-6 text-center ${i === 0 ? 'text-yellow-400 font-bold' : 'text-slate-500'}`}>
                        #{i+1}
                    </span>
                    <div>
                        <p className={`font-bold ${p.isMe ? 'text-white' : 'text-slate-400'}`}>{p.name}</p>
                        <p className="text-[10px] text-slate-600">{p.class}</p>
                    </div>
                </div>
                <div className={`font-mono ${p.isMe ? 'text-emerald-400' : 'text-slate-500'}`}>
                    ${p.profit.toLocaleString()}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};