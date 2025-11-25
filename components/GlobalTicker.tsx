

import React, { useEffect, useState, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { PublicGameLog } from '../types';

interface VisibleItem extends PublicGameLog {
  uid: string; // Unique ID for keying in React (handling re-adds if ever needed)
}

const TickerItem = React.memo(({ log, topLeaderId, onComplete }: { log: VisibleItem; topLeaderId: string | null; onComplete: (id: string) => void }) => {
  // Dynamic duration calculation:
  // We want constant speed regardless of screen width.
  // Speed = 100 pixels per second (approx)
  // Distance = Window Width + ~300px (safety buffer for item width)
  const duration = (window.innerWidth + 300) / 70; // 70px/s speed
  
  const isTop1 = topLeaderId && log.playerId === topLeaderId;

  return (
    <div 
      className="absolute top-0 flex items-center py-2 select-none h-10 will-change-transform"
      style={{ 
        animation: `ticker-flow ${duration}s linear forwards`,
        left: 0, // Base position handled by keyframes (translateX)
        width: 'max-content'
      }}
      onAnimationEnd={() => onComplete(log.uid)}
    >
        <div className={`relative p-[1px] rounded-full mr-2 ${log.result === 'WIN' ? 'bg-gradient-to-tr from-green-400 to-green-600 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-600'}`}>
            <img 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${log.playerAvatar}`} 
                className={`w-6 h-6 rounded-full bg-slate-900 ${isTop1 ? 'border border-yellow-400' : ''}`}
                alt="Av"
            />
            {isTop1 && <div className="absolute -top-2 -right-1 text-[8px] animate-bounce">👑</div>}
        </div>
        <div className={`flex flex-col justify-center px-2 py-0.5 rounded-lg border backdrop-blur-md ${isTop1 ? 'bg-yellow-900/30 border-yellow-500/50 shadow-[0_0_5px_rgba(234,179,8,0.2)]' : 'bg-slate-900/50 border-slate-700/50'}`}>
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-bold leading-none max-w-[120px] truncate ${isTop1 ? 'text-yellow-400' : 'text-slate-300'}`}>{log.playerName}</span>
               <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded border border-yellow-500/30">Lvl {log.playerLevel || 1}</span>
            </div>
            <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-mono font-black ${log.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                    {log.result === 'WIN' ? '+' : '-'}{log.amount.toLocaleString()}
                 </span>
                 <span className={`text-[8px] opacity-60 uppercase ${log.type === 'PVP' ? 'text-blue-300' : 'text-slate-500'}`}>
                    {log.type === 'PVP' ? 'PvP' : 'Game'}
                 </span>
            </div>
        </div>
    </div>
  );
});

export const GlobalTicker: React.FC = () => {
  // Queue holds items waiting to be shown
  const queue = useRef<PublicGameLog[]>([]);
  // Displayed holds items currently animating on screen
  const [displayedItems, setDisplayedItems] = useState<VisibleItem[]>([]);
  const [topLeaderId, setTopLeaderId] = useState<string | null>(null);
  
  const processedIds = useRef(new Set<string>()); 
  const mountTime = useRef(Date.now());
  const lastSpawnTime = useRef(0);

  // 1. Subscribe to Firebase Data
  useEffect(() => {
    const unsub = firebaseService.subscribeToGameLogs((fetchedLogs) => {
        // Chronological order (Oldest -> Newest)
        const chronological = [...fetchedLogs].reverse(); 
        
        const newItems = chronological.filter(l => {
            // CRITICAL: Only accept logs created AFTER the component mounted
            // This prevents old history from showing on reload.
            const isNew = l.timestamp > mountTime.current;
            const notProcessed = !processedIds.current.has(l.id);
            return isNew && notProcessed;
        });
        
        if (newItems.length > 0) {
            newItems.forEach(l => {
                processedIds.current.add(l.id);
                queue.current.push(l);
            });
        }
    });

    const unsubLeaders = firebaseService.subscribeToLeaders((leaders) => {
        if (leaders.length > 0) {
            setTopLeaderId(leaders[0].id);
        }
    });

    return () => { unsub(); unsubLeaders(); };
  }, []);

  // 2. Manager Loop: Checks queue and spawns items with delay
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        // Delay between items (ms). 
        // 2000ms ensures they don't overlap visually on most screens.
        // If many items come in, they will form a neat line.
        const spawnDelay = 2500; 

        if (queue.current.length > 0 && (now - lastSpawnTime.current > spawnDelay)) {
            const nextLog = queue.current.shift();
            if (nextLog) {
                const item: VisibleItem = { ...nextLog, uid: nextLog.id + Math.random() };
                setDisplayedItems(prev => [...prev, item]);
                lastSpawnTime.current = now;
            }
        }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, []);

  const handleAnimationComplete = (uid: string) => {
      setDisplayedItems(prev => prev.filter(i => i.uid !== uid));
  };

  return (
    <div 
        className="w-full bg-[#020617]/80 backdrop-blur-sm border-b border-white/5 h-12 flex items-center relative z-40 shrink-0 pointer-events-none overflow-hidden"
    >
        {/* Soft Gradient Masks for Smooth Fade In/Out */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#020617] via-[#020617]/90 to-transparent z-20"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#020617] via-[#020617]/90 to-transparent z-20"></div>

        {/* Container */}
        <div className="w-full h-full relative">
            {displayedItems.map((item) => (
                <TickerItem 
                    key={item.uid} 
                    log={item} 
                    topLeaderId={topLeaderId}
                    onComplete={handleAnimationComplete} 
                />
            ))}
            
            {/* Placeholder if empty (Optional, strictly asked for empty start, but kept minimal) */}
            {displayedItems.length === 0 && queue.current.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-700 font-mono tracking-widest animate-pulse">
                    LIVE FEED
                </div>
            )}
        </div>
    </div>
  );
};