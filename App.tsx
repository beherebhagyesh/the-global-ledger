
import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameLayout } from './components/GameLayout';
import { LevelDispatcher } from './components/LevelDispatcher';
import { AchievementManager } from './components/AchievementManager';
import { RandomEncounter } from './components/RandomEncounter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useGame } from './contexts/GameContext';
import { useGameLoop } from './hooks/useGameLoop';

const AppContent: React.FC = () => {
    const { player, unlockAchievement } = useGame();

    // Global simulation logic
    useGameLoop();

    return (
        <GameLayout>
            <AchievementManager />
            <RandomEncounter />
            <ErrorBoundary>
                <LevelDispatcher />
            </ErrorBoundary>
        </GameLayout>
    );
};

const App: React.FC = () => {
    return (
        <GameProvider>
            <AppContent />
        </GameProvider>
    );
};

export default App;