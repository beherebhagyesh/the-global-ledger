
import React, { useState, useEffect } from 'react';
import { Zap, BrainCircuit } from 'lucide-react';
import { getSpacedRepetitionQuestion } from '../services/geminiService';
import { QuizQuestion, GameLevel } from '../types';
import { useGame } from '../contexts/GameContext';

export const RandomEncounter: React.FC = () => {
    const { player, addXP } = useGame();
    const [question, setQuestion] = useState<QuizQuestion | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const levels = Object.values(GameLevel);
        const levelIndex = levels.indexOf(player.level);

        // Only trigger if we are past Level 1 and randomly
        // For now, let's keep the logic of loading it if level changes
        if (levelIndex > levels.indexOf(GameLevel.Level1)) {
            const loadQ = async () => {
                const q = await getSpacedRepetitionQuestion(levelIndex);
                if (q) {
                    setQuestion(q);
                    setIsOpen(true);
                }
            };
            loadQ();
        }
    }, [player.level]);

    const handleAnswer = (optId: string) => {
        setSelected(optId);
        const isCorrect = question?.options.find(o => o.id === optId)?.isCorrect;
        setResult(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) addXP(50);

        setTimeout(() => {
            setIsOpen(false);
            setQuestion(null);
            setResult(null);
            setSelected(null);
        }, 2500);
    };

    if (!isOpen || !question) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none pb-8 md:pb-12 px-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border-2 border-yellow-400/50 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-500 overflow-hidden">
                <div className="bg-yellow-500 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-sm">
                        <BrainCircuit size={18} /> Memory Check
                    </div>
                    <div className="text-[10px] bg-slate-900 text-yellow-500 px-2 py-0.5 rounded-full">Spaced Repetition</div>
                </div>

                <div className="p-6">
                    <p className="text-slate-200 font-bold mb-4 text-sm">{question.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                        {question.options.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => !result && handleAnswer(opt.id)}
                                disabled={!!result}
                                className={`text-left p-3 rounded-lg text-xs md:text-sm border transition-all
                            ${selected === opt.id
                                        ? (result === 'correct' ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500')
                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}
                        `}
                            >
                                <span className="font-bold mr-2 text-slate-500">{opt.id}.</span> {opt.text}
                            </button>
                        ))}
                    </div>
                    {result === 'correct' && (
                        <div className="mt-2 text-center text-green-400 text-xs font-bold animate-pulse">Memory Retained! +50 XP</div>
                    )}
                    {result === 'wrong' && (
                        <div className="mt-2 text-center text-red-400 text-xs font-bold">Memory Corrupted. Review Level Data.</div>
                    )}
                </div>
            </div>
        </div>
    );
};