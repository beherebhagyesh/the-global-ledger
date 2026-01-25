import React from 'react';
import { AlertTriangle, RefreshCcw, XOctagon } from 'lucide-react';

interface FailOverlayProps {
  reason: string;
  onRetry: () => void;
  xpLost: number;
}

export const FailOverlay: React.FC<FailOverlayProps> = ({ reason, onRetry, xpLost }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-red-950/90 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="text-center space-y-6 max-w-md p-8 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-500">
        <div className="absolute inset-0 border-4 border-red-600 rounded-3xl opacity-50 animate-pulse pointer-events-none"></div>
        
        <div className="flex justify-center mt-2">
            <XOctagon size={80} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        </div>

        <div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-lg">
                MISSION FAILED
            </h2>
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-xl rotate-1">
                <h3 className="text-red-300 font-bold text-xs uppercase mb-1">Cause of Failure:</h3>
                <p className="text-lg font-mono text-white">{reason}</p>
            </div>
        </div>

        <div className="flex flex-col items-center gap-2">
            <span className="text-red-400 font-mono font-bold text-xl animate-bounce">-{xpLost} XP</span>
            <span className="text-xs text-red-500 uppercase">Penalty Applied</span>
        </div>

        <button 
            onClick={onRetry}
            className="bg-white text-red-900 font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform flex items-center gap-2 mx-auto shadow-xl mb-2"
        >
            <RefreshCcw size={20} /> Respawn & Retry
        </button>
      </div>
    </div>
  );
};