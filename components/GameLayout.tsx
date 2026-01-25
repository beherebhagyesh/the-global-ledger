
import React, { useState, useEffect } from 'react';
import { Trophy, Activity, Target, Brain, Menu, X, ChevronLeft, ChevronRight, TrendingUp, Backpack, Calculator, Wallet, Star, Zap, Globe, Building2, CreditCard, Container, HeartPulse, Coffee, Laptop, Home, Building, ChevronsRight, LayoutGrid } from 'lucide-react';
import { PlayerState, GameLevel, Skill, HQUpgrade } from '../types';
import { Inventory } from './Inventory';
import { RateCalculator } from './RateCalculator';
import { SkillTree } from './SkillTree';
import { HQBuilder } from './HQBuilder';

interface GameLayoutProps {
  player: PlayerState;
  children: React.ReactNode;
  onUnlockSkill: (id: string) => void;
  onUseItem?: (item: any) => void;
  onJumpLevel: (level: GameLevel) => void;
  onPurchaseHQ: (upgrade: HQUpgrade) => void;
}

const LevelItem = ({ current, level, label, icon: Icon, collapsed, onClick }: { current: GameLevel, level: GameLevel, label: string, icon: any, collapsed: boolean, onClick: () => void }) => {
  
  const isActive = current === level;
  let statusClass = "text-slate-500 hover:bg-slate-800 hover:text-emerald-400 cursor-pointer border-l-2 border-transparent hover:border-emerald-500/50";
  
  if (isActive) {
      statusClass = "text-emerald-400 font-bold bg-emerald-400/10 border-l-2 border-emerald-400 cursor-default";
  }

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 text-sm transition-all mb-1 rounded-r text-left group ${statusClass} ${collapsed ? 'justify-center px-0 border-l-0' : ''}`}
      title={isActive ? "Current Level" : `Warp to ${label}`}
    >
      <Icon size={20} className={`shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
      {!collapsed && (
          <div className="flex justify-between items-center w-full">
              <span className="whitespace-nowrap overflow-hidden">{label}</span>
              {!isActive && <ChevronsRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />}
          </div>
      )}
    </button>
  );
};

const HQWidget = ({ level, netWorth, collapsed }: { level: GameLevel, netWorth: number, collapsed: boolean }) => {
    // Determine HQ Visual
    let icon = Coffee;
    let label = "Internet Cafe";
    let color = "text-slate-400";

    const levels = Object.values(GameLevel);
    const idx = levels.indexOf(level);

    if (idx >= levels.indexOf(GameLevel.Level2)) { icon = Laptop; label = "Co-Working Desk"; color = "text-blue-400"; }
    if (idx >= levels.indexOf(GameLevel.Level3)) { icon = Home; label = "Home Office"; color = "text-emerald-400"; }
    if (idx >= levels.indexOf(GameLevel.Level4)) { icon = Building; label = "Private Cabin"; color = "text-purple-400"; }
    if (idx >= levels.indexOf(GameLevel.Level5)) { icon = Building2; label = "Tech Park Floor"; color = "text-orange-400"; }
    if (idx >= levels.indexOf(GameLevel.Level6)) { icon = Trophy; label = "Skyscraper Penthouse"; color = "text-yellow-400"; }

    const IconComp = icon;

    if (collapsed) {
        return (
            <div className="w-full flex justify-center py-4 border-b border-slate-800" title={`HQ: ${label}`}>
                <IconComp size={24} className={color} />
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border-y border-slate-800 p-4 mb-4">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Headquarters</p>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-700 ${color}`}>
                    <IconComp size={24} />
                </div>
                <div>
                    <p className={`font-bold text-sm ${color}`}>{label}</p>
                    <p className="text-[10px] text-slate-500">Upgrade via Leveling</p>
                </div>
            </div>
        </div>
    );
}

export const GameLayout: React.FC<GameLayoutProps> = ({ player, children, onUnlockSkill, onUseItem, onJumpLevel, onPurchaseHQ }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isHQBuilderOpen, setIsHQBuilderOpen] = useState(false);

  // Handle responsiveness
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex overflow-hidden relative">
      
      {/* Mobile Header / Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-30 justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-400" size={24} />
          <span className="font-bold tracking-wider text-emerald-400">GLOBAL LEDGER</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="bg-slate-800 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 text-xs font-mono text-emerald-400">
                <Wallet size={12} /> ${player.bankBalance.toLocaleString()}
            </div>
            <button onClick={() => setIsInventoryOpen(true)} className="p-2 text-slate-300 relative">
                <Backpack size={24} />
                {player.inventory.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>}
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-300">
                <Menu size={24} />
            </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Drawers/Modals */}
      <Inventory items={player.inventory} isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} onUse={onUseItem} />
      {isCalculatorOpen && <RateCalculator onClose={() => setIsCalculatorOpen(false)} />}
      {isSkillTreeOpen && <SkillTree player={player} onClose={() => setIsSkillTreeOpen(false)} onUnlock={onUnlockSkill} />}
      {isHQBuilderOpen && <HQBuilder player={player} onClose={() => setIsHQBuilderOpen(false)} onPurchase={onPurchaseHQ} />}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-50 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 md:w-20 -translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Activity className="text-emerald-400 shrink-0 animate-pulse" />
              <span className="font-bold text-lg tracking-wider text-emerald-400 uppercase whitespace-nowrap">Global Ledger</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
               <Activity className="text-emerald-400 shrink-0" />
            </div>
          )}
          
          {/* Desktop Collapse Button */}
          {!isMobile && isSidebarOpen && (
             <button onClick={toggleSidebar} className="text-slate-500 hover:text-white">
               <ChevronLeft size={20} />
             </button>
          )}
        </div>

        {/* Desktop Expand Button (When closed) */}
        {!isMobile && !isSidebarOpen && (
            <button onClick={toggleSidebar} className="w-full py-4 flex justify-center text-slate-500 hover:text-white border-b border-slate-800">
                <ChevronRight size={20} />
            </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
           <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400">
             <X />
           </button>
        )}

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-0 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* HQ Visualizer */}
          <HQWidget level={player.level} netWorth={player.bankBalance} collapsed={!isSidebarOpen} />

          {/* Stats Section */}
          <div className="mb-8 px-3">
            {isSidebarOpen && <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Character Stats</h3>}
            
            <div className={`bg-slate-800 rounded-lg border border-slate-700 transition-all ${isSidebarOpen ? 'p-4' : 'p-2'}`}>
              {isSidebarOpen ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold truncate">{player.name}</span>
                    <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded shrink-0">
                      Lvl {Object.values(GameLevel).indexOf(player.level)}
                    </span>
                  </div>
                  {player.characterClass !== 'NONE' && (
                     <div className="text-xs text-slate-400 mb-2 font-mono uppercase tracking-tight">Class: {player.characterClass.replace('_', ' ')}</div>
                  )}
                   
                   {/* Global Bank Balance Desktop */}
                   <div className="flex items-center justify-between bg-slate-950 rounded p-2 border border-slate-700 mb-2">
                      <span className="text-xs text-slate-500 uppercase">Bank</span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">${player.bankBalance.toLocaleString()}</span>
                   </div>

                   {/* Credit Score System */}
                   <div className="flex items-center justify-between bg-slate-950 rounded p-2 border border-slate-700 mb-2" title="CIBIL/FICO Score">
                      <span className="text-xs text-slate-500 uppercase flex items-center gap-1"><CreditCard size={10} /> Credit</span>
                      <span className={`font-mono font-bold text-sm ${player.creditScore >= 750 ? 'text-green-400' : player.creditScore >= 650 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {player.creditScore}
                      </span>
                   </div>
                   
                   {/* Financial Stress Meter */}
                   <div className="flex items-center justify-between bg-slate-950 rounded p-2 border border-slate-700 mb-2" title="Stress Level">
                      <span className="text-xs text-slate-500 uppercase flex items-center gap-1"><HeartPulse size={10} /> Stress</span>
                      <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${player.stress > 70 ? 'bg-red-500' : player.stress > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                style={{ width: `${player.stress}%` }}
                              ></div>
                          </div>
                          <span className={`font-mono font-bold text-xs ${player.stress > 70 ? 'text-red-400' : 'text-slate-400'}`}>{player.stress}%</span>
                      </div>
                   </div>

                   {/* Active Loans */}
                   {player.loans && player.loans.length > 0 && (
                        <div className="bg-red-900/10 border border-red-900/30 rounded p-2 mb-2">
                            <span className="text-[10px] text-red-400 font-bold block mb-1">DEBT ALERT</span>
                            <div className="text-xs text-slate-300 flex justify-between">
                                <span>Balance:</span>
                                <span>-${player.loans.reduce((acc, l) => acc + l.remainingBalance, 0).toLocaleString()}</span>
                            </div>
                        </div>
                   )}
                   
                   {/* Forex Rate Ticker */}
                   <div className="flex items-center justify-between bg-slate-950 rounded p-2 border border-slate-700 mb-2" title="Current USD to INR Rate">
                      <span className="text-xs text-slate-500 uppercase flex items-center gap-1"><Globe size={10} /> Forex</span>
                      <span className="text-cyan-400 font-mono font-bold text-sm">₹{player.forexRate.toFixed(2)}</span>
                   </div>

                   {/* Reputation System */}
                    <div className="flex items-center justify-between bg-slate-950 rounded p-2 border border-slate-700 mb-2">
                      <span className="text-xs text-slate-500 uppercase flex items-center gap-1"><Star size={10} /> Reputation</span>
                      <span className="text-yellow-400 font-mono font-bold text-sm">{player.reputation}/100</span>
                   </div>

                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min(100, (player.xp / 10000) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-emerald-400 mono">{player.xp} XP</p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                   <div className="text-[10px] font-bold text-emerald-400">LVL {Object.values(GameLevel).indexOf(player.level)}</div>
                   <div className="w-1 h-8 bg-slate-700 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 w-full transition-all" style={{ height: `${Math.min(100, (player.xp / 10000) * 100)}%` }}></div>
                   </div>
                </div>
              )}
            </div>

             {/* Desktop Actions */}
             {isSidebarOpen && (
                 <div className="space-y-2 mt-4">
                    <button 
                        onClick={() => setIsInventoryOpen(true)}
                        className="w-full flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                    >
                        <Backpack size={16} /> <span className="text-xs font-bold uppercase">Inventory</span>
                    </button>
                    <button 
                        onClick={() => setIsSkillTreeOpen(true)}
                        className="w-full flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 transition-colors"
                    >
                        <Zap size={16} /> <span className="text-xs font-bold uppercase">Skills</span>
                    </button>
                    <button 
                        onClick={() => setIsHQBuilderOpen(true)}
                        className="w-full flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 transition-colors"
                    >
                        <LayoutGrid size={16} /> <span className="text-xs font-bold uppercase">HQ Upgrades</span>
                    </button>
                     <button 
                        onClick={() => setIsCalculatorOpen(true)}
                        className="w-full flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                    >
                        <Calculator size={16} /> <span className="text-xs font-bold uppercase">Rate Calc</span>
                    </button>
                 </div>
             )}

             {/* Achievements (Desktop Expanded Only) */}
            {isSidebarOpen && player.achievements.length > 0 && (
                <div className="mt-4 space-y-2 animate-in slide-in-from-left">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recent Badges</h3>
                {player.achievements.slice(-3).map((ach, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                    <Trophy size={12} />
                    <span className="truncate capitalize">{ach.replace('_', ' ')}</span>
                    </div>
                ))}
                </div>
            )}
          </div>

          {/* Navigation Menu */}
          <div className="space-y-1 px-3">
            {isSidebarOpen && <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Navigation (Dev Mode)</h3>}
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.Level1)} current={player.level} level={GameLevel.Level1} label="Foundations" icon={Brain} />
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.Level2)} current={player.level} level={GameLevel.Level2} label="Corp Engine" icon={Activity} />
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.Level3)} current={player.level} level={GameLevel.Level3} label="Tax Bridge" icon={Target} />
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.Level4)} current={player.level} level={GameLevel.Level4} label="Investing" icon={TrendingUp} />
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.Level5)} current={player.level} level={GameLevel.Level5} label="Fundraising" icon={Building2} />
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.Level6)} current={player.level} level={GameLevel.Level6} label="Commodities" icon={Container} />
            <LevelItem collapsed={!isSidebarOpen} onClick={() => onJumpLevel(GameLevel.FinalBoss)} current={player.level} level={GameLevel.FinalBoss} label="Client Pitch" icon={Trophy} />
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 h-full overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pt-16 md:pt-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none fixed"></div>
        <div className="p-4 md:p-8 max-w-6xl mx-auto relative z-0 min-h-full flex flex-col justify-center">
          {children}
        </div>
      </main>
    </div>
  );
};
