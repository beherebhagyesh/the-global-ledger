
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';

// --- PORTAL TOOLTIP ENGINE ---
interface PortalTooltipProps {
    children: React.ReactNode;
    title: string;
    desc: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
    className?: string; // For the trigger wrapper
}

export const PortalTooltip: React.FC<PortalTooltipProps> = ({ children, title, desc, position = 'top', className = 'w-full' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;

            // Calculate position based on prop
            if (position === 'top') {
                top = rect.top - 10; // 10px buffer above
                left = rect.left + (rect.width / 2); // Center horizontally
            } else if (position === 'right') {
                top = rect.top + (rect.height / 2); // Center vertically
                left = rect.right + 10; // 10px buffer to right
            } else if (position === 'bottom') {
                top = rect.bottom + 10;
                left = rect.left + (rect.width / 2);
            }

            setCoords({ top, left });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <>
            <div 
                ref={triggerRef} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
                className={className}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div 
                    className="fixed z-[9999] pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95"
                    style={{ 
                        top: coords.top, 
                        left: coords.left,
                        transform: position === 'top' ? 'translate(-50%, -100%)' : 
                                   position === 'right' ? 'translate(0, -50%)' : 
                                   'translate(-50%, 0)'
                    }}
                >
                    <div className="bg-slate-900 border border-slate-600 p-3 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] w-56 relative">
                        <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                            {title}
                        </p>
                        <p className="text-xs text-slate-300 leading-tight shadow-black drop-shadow-md">
                            {desc}
                        </p>
                        
                        {/* CSS Arrow based on position */}
                        <div className={`absolute w-0 h-0 border-4 border-transparent 
                            ${position === 'top' ? 'border-t-slate-600 top-full left-1/2 -translate-x-1/2' : ''}
                            ${position === 'right' ? 'border-r-slate-600 right-full top-1/2 -translate-y-1/2' : ''}
                            ${position === 'bottom' ? 'border-b-slate-600 bottom-full left-1/2 -translate-x-1/2' : ''}
                        `}></div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

interface SmartTooltipProps {
  term: string;
  definition: string;
  children: React.ReactNode;
}

export const SmartTooltip: React.FC<SmartTooltipProps> = ({ term, definition, children }) => {
  return (
    <PortalTooltip title={term} desc={definition} position="top" className="inline-block">
        <span className="underline decoration-dotted decoration-emerald-500/50 underline-offset-4 cursor-help text-emerald-100">
            {children}
        </span>
    </PortalTooltip>
  );
};
