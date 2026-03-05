
import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GameLevel } from '../types';
import { Level1_Foundations } from './Level1_Foundations';
import { Level2_Corporate } from './Level2_Corporate';
import { Level3_Tax } from './Level3_Tax';
import { Level4_Investing } from './Level4_Investing';
import { Level5_Funding } from './Level5_Funding';
import { Level6_Commodities } from './Level6_Commodities';
import { FinalBoss } from './FinalBoss';
import { VictoryScreen } from './VictoryScreen';
import { GigSimulator } from './GigSimulator';
import { MentorSelector } from './MentorSelector';
import { ClassSelector } from './ClassSelector';
import { Play } from 'lucide-react';

export const LevelDispatcher: React.FC = () => {
    const {
        player, addXP, updateBank, updateReputation, updateStress,
        unlockItem, removeItem, advanceLevel, setTaxRegime,
        onTakeLoan, setMentor, setClass, resetGame, jumpToLevel
    } = useGame();

    const renderLevel = () => {
        switch (player.level) {
            case GameLevel.Intro:
                return (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in fade-in duration-1000">
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-slate-900 tracking-tighter">
                            THE GLOBAL<br />LEDGER
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">
                            Real-Life RPG. From India to the US Market.<br />
                            Level up from Novice to Global Financial Architect.
                        </p>
                        <button
                            onClick={advanceLevel}
                            className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-lg rounded overflow-hidden transition-all"
                        >
                            <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center gap-3">Start Game <Play fill="black" /></span>
                        </button>
                    </div>
                );
            case GameLevel.MentorSelection:
                return <MentorSelector onSelect={setMentor} />;
            case GameLevel.ClassSelection:
                return <ClassSelector onSelect={setClass} />;
            case GameLevel.Level1:
                return (
                    <Level1_Foundations
                        onComplete={advanceLevel}
                        addXP={addXP}
                        mentorPersona={player.mentorPersona}
                        updateStress={updateStress}
                        initialTaxRegime={player.taxRegime}
                        onTaxRegimeChange={setTaxRegime}
                        updateBank={updateBank}
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
                        stress={player.stress}
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
                        reputation={player.reputation}
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
                        onSandbox={() => jumpToLevel(GameLevel.Sandbox)}
                    />
                );
            case GameLevel.Sandbox:
                return <GigSimulator onBack={() => jumpToLevel(GameLevel.Victory)} />;
            default:
                return <div>Unknown Level</div>;
        }
    };

    return <>{renderLevel()}</>;
};
