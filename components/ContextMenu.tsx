
import React, { useRef, useState, useLayoutEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  actions: {
    openFiles: () => void;
    openFolder: () => void;
    openOnline: () => void;
    restart: () => void;
    stop: () => void;
    setSpeed: (speed: number) => void;
    currentSpeed: number;
    toggleSub: () => void;
    isSubOn: boolean;
    openSettings: () => void;
    openFeedback: () => void;
    openSystemInfo: () => void;
  };
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, isOpen, onClose, actions }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [lockedPos, setLockedPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const menuW = menu.offsetWidth;
      const menuH = menu.offsetHeight;

      let finalX = x;
      let finalY = y;

      if (x + menuW > screenW) finalX = x - menuW;
      if (y + menuH > screenH) finalY = y - menuH;

      setLockedPos({ x: finalX, y: finalY });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const MenuItem = ({ label, onClick, hasSub, subId, active }: any) => (
    <div 
      className="relative"
      onMouseEnter={() => setActiveSub(subId || null)}
    >
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (!hasSub) { 
            onClick(); 
            onClose(); 
          } 
        }}
        className={`w-full flex items-center justify-between px-3.5 py-1.5 text-left active:scale-[0.96] active:bg-rose-500/20
          ${active ? 'text-rose-500' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
      >
        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
          {label}
        </span>
        {hasSub && <span className="text-[8px] ml-4 opacity-30">›</span>}
      </button>

      {hasSub && activeSub === subId && (
        <div className="absolute left-full top-[-4px] ml-1 min-w-[130px] glass-dark border border-white/10 rounded-xl py-1 shadow-2xl">
           {subId === 'speed' && [0.5, 1, 1.5, 2].map(s => (
             <button 
               key={s} 
               onClick={() => { actions.setSpeed(s); onClose(); }}
               className={`w-full px-4 py-1.5 text-[9px] font-bold text-left active:scale-95
                 ${actions.currentSpeed === s ? 'text-rose-500 bg-rose-500/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
             >
               {s}x playback speed
             </button>
           ))}
           {subId === 'subs' && (
             <button 
               onClick={() => { actions.toggleSub(); onClose(); }}
               className={`w-full px-4 py-1.5 text-[9px] font-bold text-left active:scale-95
                 ${actions.isSubOn ? 'text-rose-500 bg-rose-500/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
             >
               {actions.isSubOn ? 'Hide captions' : 'Show captions'}
             </button>
           )}
        </div>
      )}
    </div>
  );

  const Separator = () => <div className="h-[1px] bg-white/5 my-1 mx-2" />;

  return (
    <div 
      ref={menuRef}
      style={{ 
        position: 'fixed',
        left: `${lockedPos.x}px`,
        top: `${lockedPos.y}px`,
      }}
      className="z-[300] min-w-[150px] glass-dark border border-white/10 rounded-2xl py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] select-none pointer-events-auto"
      onMouseLeave={() => setActiveSub(null)}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem label="Open file" onClick={actions.openFiles} />
      <MenuItem label="Open folder" onClick={actions.openFolder} />
      <MenuItem label="Remote stream" onClick={actions.openOnline} />
      
      <Separator />
      
      <MenuItem label="Reset player" onClick={actions.restart} />
      <MenuItem label="Playback rate" hasSub subId="speed" />
      <MenuItem label="Subtitles" hasSub subId="subs" />
      
      <Separator />
      
      <MenuItem label="Control center" onClick={actions.openSettings} />
      <MenuItem label="Lumina feedback" onClick={actions.openFeedback} />
      <MenuItem label="System info" onClick={actions.openSystemInfo} />
      
      <Separator />
      
      <MenuItem label="Disconnect flow" onClick={actions.stop} active />
    </div>
  );
};

export default ContextMenu;
