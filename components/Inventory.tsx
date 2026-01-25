
import React from 'react';
import { InventoryItem } from '../types';
import { FileText, Download, Lock, Zap, MousePointer, Diamond, Info } from 'lucide-react';

interface InventoryProps {
  items: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onUse?: (item: InventoryItem) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, isOpen, onClose, onUse }) => {
  if (!isOpen) return null;

  const handleDownload = (item: InventoryItem) => {
      alert(`Downloading ${item.name}...\n\n(In a real app, this would trigger a file download for: ${item.id}.pdf)`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative w-80 bg-slate-900 h-full border-l border-slate-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        <h2 className="text-xl font-bold text-slate-200 mb-6 uppercase tracking-wider flex items-center gap-2">
             Backpack <span className="bg-emerald-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full">{items.length}</span>
        </h2>

        <div className="space-y-4">
            {items.length === 0 && (
                <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                    <Lock className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items acquired yet.</p>
                    <p className="text-xs">Complete levels to unlock tools.</p>
                </div>
            )}

            {items.map((item) => (
                <div key={item.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors group">
                    <div className="flex items-start gap-3">
                        <div className="bg-slate-700 p-2 rounded text-emerald-400 group-hover:text-white transition-colors">
                            {item.rarity ? <Diamond size={20} className={item.rarity === 'LEGENDARY' ? 'text-amber-400' : 'text-emerald-400'} /> : <FileText size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-200">{item.name}</h3>
                            <p className="text-xs text-slate-500 mb-3">{item.description}</p>
                            
                            {item.buff && (
                                <div className="mb-3 flex items-center gap-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                    <Zap size={10} /> {item.buff}
                                </div>
                            )}

                             {item.value && (
                                <div className="mb-3 flex items-center gap-1 text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                    <Info size={10} /> Value: ${item.value.toLocaleString()}
                                </div>
                            )}

                            <div className="flex gap-2">
                                {item.rarity ? (
                                    // Gemstone / Commodity
                                    <span className="text-[10px] uppercase font-bold text-slate-600 border border-slate-800 px-2 py-1 rounded">
                                        Rare Item
                                    </span>
                                ) : (
                                    // File Asset
                                    <button 
                                        onClick={() => handleDownload(item)}
                                        className="text-[10px] bg-slate-900 text-slate-400 hover:text-emerald-400 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-slate-700 hover:border-emerald-500"
                                    >
                                        <Download size={10} /> Asset
                                    </button>
                                )}
                                
                                {item.id === 'corp_card' && onUse && (
                                     <button 
                                        onClick={() => onUse(item)}
                                        className="text-[10px] bg-purple-900/30 text-purple-300 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors border border-purple-700"
                                     >
                                         <MousePointer size={10} /> Pay Bill
                                     </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
