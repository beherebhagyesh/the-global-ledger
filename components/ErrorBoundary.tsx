
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border-2 border-red-500/50 backdrop-blur-sm animate-in zoom-in">
                    <div className="p-4 bg-red-900/20 rounded-full border border-red-500 text-red-400 mb-6">
                        <ShieldAlert size={48} />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Temporal Anomaly Detected</h2>
                    <p className="text-slate-400 mb-8 max-w-md text-center">
                        The ledger has encountered a critical structural failure. Our AI advisers suggest a temporal reset to stabilize the simulation.
                    </p>

                    <div className="bg-black/40 p-4 rounded-lg border border-slate-800 w-full max-w-lg mb-8">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Technical Error</p>
                        <p className="text-xs font-mono text-red-300 break-words">{this.state.error?.message || "Unknown ledger corruption"}</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all border border-red-400"
                        >
                            <RotateCcw size={18} /> Forced Reset
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 border border-slate-600 transition-all"
                        >
                            <Home size={18} /> Return to HQ
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
