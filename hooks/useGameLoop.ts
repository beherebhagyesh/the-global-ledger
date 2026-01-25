
import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GameLevel } from '../types';

export const useGameLoop = () => {
    const {
        player,
        updateStress,
        updateForex,
        updateBank
    } = useGame();

    useEffect(() => {
        // 1. Forex Fluctuation (Every 5s)
        const forexInterval = setInterval(() => {
            const change = (Math.random() - 0.5) * 0.5;
            const newRate = Math.max(82, Math.min(86, player.forexRate + change));
            updateForex(newRate);
        }, 5000);

        // 2. Stress Recovery (Every 15s)
        const stressInterval = setInterval(() => {
            if (player.stress > 0) {
                updateStress(-1);
            }
        }, 15000);

        return () => {
            clearInterval(forexInterval);
            clearInterval(stressInterval);
        };
    }, [
        player.forexRate,
        player.stress,
        updateForex,
        updateStress
    ]);
};
