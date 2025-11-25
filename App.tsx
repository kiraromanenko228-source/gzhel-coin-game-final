
import React, { useState, useEffect, useRef } from 'react';
import { 
  Tab,
  Player, 
  CoinSide, 
  ChatMessage,
  Leader,
  PvpRoom,
  GameHistoryItem,
  ShopItem,
  Quest,
  SkinId,
  ActiveBuffs
} from './types';
import { 
  INITIAL_BALANCE, 
  WIN_COEFFICIENT,
  MIN_BET, 
  ANIMATION_DURATION_MS,
  ACHIEVEMENTS_LIST,
  ADMIN_TELEGRAM_ID,
  HOURLY_BONUS_AMOUNT,
  HOURLY_BONUS_COOLDOWN_MS,
  SHOP_ITEMS,
  LEVEL_THRESHOLDS,
  XP_PER_WIN,
  XP_PER_LOSS,
  XP_PER_PVP_WIN,
  DAILY_QUEST_TEMPLATES,
  DAILY_LOGIN_REWARDS,
  BASE_WIN_CHANCE,
  QUEST_INFO_TEXT,
  MAX_LEVEL,
  SOUNDS
} from './constants';
import { Coin } from './components/Coin';
import { GlobalTicker } from './components/GlobalTicker';
import { soundManager } from './services/soundService';
import { firebaseService } from './services/firebaseService';
import { onValue } from 'firebase/database';

// Key for saving player state
const STORAGE_KEY = 'gzhel_player_reset_v8_final'; 

// --- UTILS ---
const safeStorage = {
    getItem: (key: string) => {
        try { return localStorage.getItem(key); } catch(e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch(e) {}
    }
};

// Update: Leveling now based on Lifetime XP (totalXp) if available
const getXpForLevel = (level: number) => {
    if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return LEVEL_THRESHOLDS[level - 1];
};

const calculateLevelFromXp = (xp: number): number => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    // Hard Cap at Max Level
    if (level > MAX_LEVEL) level = MAX_LEVEL;
    return level;
};

// --- ICONS ---
const GameIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
);
const MultiIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const ChatIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"/></svg>
);
const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const LeaderIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const ShopIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

// --- HELPER COMPONENTS ---
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [showInteract, setShowInteract] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create local audio instance for full control
    try {
        audioRef.current = new Audio(SOUNDS.INTRO);
        audioRef.current.loop = false;
        audioRef.current.volume = 0.6;
        
        // Safety: Catch unsupported source error
        audioRef.current.onerror = (e) => {
            console.warn("Intro audio failed to load - check source URL");
        };

        // Attempt autoplay
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((e) => {
                if (e.name === 'AbortError') return; // Ignore interruption
                if (e.name === 'NotSupportedError') return; // Ignore bad source
                console.log("Autoplay blocked or aborted");
                setShowInteract(true);
            });
        }
    } catch (e) {
        console.warn("Audio init failed:", e);
    }

    // 8 Seconds Total Duration
    // 80ms interval * 100 steps = 8000ms
    const interval = setInterval(() => {
        setProgress(p => {
            if (p >= 100) {
                clearInterval(interval);
                
                // Stop music immediately upon completion
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                
                // Small delay before unmount
                setTimeout(onComplete, 500); 
                return 100;
            }
            return p + 1;
        });
    }, 80); 
    
    // Cleanup on unmount
    return () => { 
        clearInterval(interval); 
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);
  
  const handleInteract = () => {
      setShowInteract(false);
      if (audioRef.current) {
          const p = audioRef.current.play();
          if (p !== undefined) {
              p.catch(e => {
                  if (e.name === 'AbortError') return;
                  if (e.name === 'NotSupportedError') return;
                  console.error("Play error", e);
              });
          }
      }
      soundManager.unlockAudio(); // Also unlock global manager
  };

  return (
    <div 
        className="fixed inset-0 z-[200] bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e3a8a] flex flex-col items-center justify-center overflow-hidden" 
        onClick={handleInteract}
    >
        {/* Animated Background Patterns (Gzhel Style) */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] border-[40px] border-dashed border-blue-600/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
             <div className="absolute top-[-40%] left-[-40%] w-[180%] h-[180%] border-[20px] border-blue-400/10 rounded-full animate-[spin_45s_linear_infinite_reverse]"></div>
             <div className="absolute top-[-30%] left-[-30%] w-[160%] h-[160%] border-[60px] border-double border-white/5 rounded-full animate-[spin_80s_linear_infinite]"></div>
        </div>
        
        {/* Glowing Center Piece */}
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
            <div className="relative mb-10 group">
                {/* Rotating Ring */}
                <div className="absolute inset-[-20px] rounded-full border-t-4 border-l-4 border-transparent border-t-blue-500 border-l-cyan-400 animate-spin w-[180px] h-[180px] shadow-[0_0_50px_rgba(59,130,246,0.5)]"></div>
                
                {/* Logo */}
                <div className="w-36 h-36 rounded-full bg-[#020617] flex items-center justify-center border-4 border-blue-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-900/20 animate-pulse"></div>
                    <span className="text-8xl font-gzhel text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] relative z-10">G</span>
                </div>
            </div>

            <h1 className="text-5xl font-gzhel text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white tracking-[0.2em] mb-4 drop-shadow-xl text-center font-black">
                GZHELCOIN
            </h1>
            
            <div className="mb-12">
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 italic tracking-wide animate-pulse">
                    "Стань богаче Толмаса"
                </span>
            </div>

            {/* Percentage Display */}
            <div className="text-blue-300 font-mono font-bold text-lg mb-2 tracking-widest drop-shadow-md">
                {progress}%
            </div>

            {/* Deluxe Loading Bar */}
            <div className="w-72 h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/10 relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
               <div 
                   className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-white rounded-full transition-all duration-75 ease-linear shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                   style={{ width: `${progress}%` }}
               ></div>
            </div>
            
            <div className="mt-4 text-blue-400 font-mono text-xs tracking-[0.3em]">
                {progress < 100 ? 'INITIALIZING...' : 'READY'}
            </div>
            
            {showInteract && (
                <div className="mt-8 text-slate-500 text-[10px] animate-bounce bg-black/50 px-3 py-1 rounded-full border border-slate-700">
                    Нажмите на экран для звука
                </div>
            )}
        </div>
    </div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
             <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                 <h2 className="text-2xl font-bold text-red-500 mb-2">{title}</h2>
                 <p className="text-slate-300 text-sm mb-6 leading-relaxed">{message}</p>
                 <div className="flex gap-3">
                     <button onClick={onCancel} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">Отмена</button>
                     <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-500">Подтвердить</button>
                 </div>
             </div>
        </div>
    )
}

const LevelInfoModal = ({ level, xp, totalXp, onClose }: { level: number, xp: number, totalXp: number, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
                 <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-white">Уровни и Опыт</h2>
                     <button onClick={onClose} className="text-slate-400 text-2xl">&times;</button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                     <div className="text-center mb-4">
                         <div className="text-sm text-slate-400">Текущий Опыт (Баланс)</div>
                         <div className="text-2xl font-black text-white mb-2">{xp.toLocaleString()} XP</div>
                         <div className="text-sm text-slate-500">Общий Опыт (Прогресс)</div>
                         <div className="text-xl font-bold text-yellow-500">{totalXp.toLocaleString()} XP</div>
                         <div className="text-xs text-slate-600 mt-1">Максимальный Уровень: {MAX_LEVEL}</div>
                     </div>
                     {LEVEL_THRESHOLDS.map((thresh, idx) => {
                         const lvl = idx + 1;
                         const isReached = level >= lvl;
                         const isNext = level + 1 === lvl;
                         return (
                             <div key={idx} className={`flex justify-between p-3 rounded-lg border ${isReached ? 'bg-green-900/20 border-green-500/50' : isNext ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-950 border-slate-800'}`}>
                                 <div className="font-bold text-white">Уровень {lvl}</div>
                                 <div className="font-mono text-slate-400">{thresh.toLocaleString()} XP</div>
                             </div>
                         )
                     })}
                 </div>
             </div>
        </div>
    )
}

const AchievementToast = ({ achievement, visible }: { achievement: any, visible: boolean }) => {
  if (!achievement) return null;
  return (
    <div className={`fixed top-12 left-4 right-4 z-[100] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
       <div className="bg-slate-900 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)] rounded-2xl p-4 flex items-center gap-4">
          <div className="text-4xl animate-bounce">{achievement.icon}</div>
          <div>
             <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">Достижение!</div>
             <div className="text-white font-bold">{achievement.title}</div>
             <div className="text-[10px] text-green-400 font-mono mt-1">+{achievement.reward?.money} ₽ • +{achievement.reward?.xp} XP</div>
          </div>
       </div>
    </div>
  );
};

const QuestToast = ({ text, rewardMoney, visible }: { text: string, rewardMoney: number, visible: boolean }) => {
    return (
      <div className={`fixed top-12 left-4 right-4 z-[100] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
         <div className="bg-slate-900 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] rounded-2xl p-4 flex items-center gap-4">
            <div className="text-4xl">📜</div>
            <div>
               <div className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Задание Выполнено!</div>
               <div className="text-white font-bold">{text}</div>
               <div className="text-[10px] text-yellow-400 font-mono mt-1">+{rewardMoney} ₽</div>
            </div>
         </div>
      </div>
    );
};

// Level Up Notification
const LevelUpModal = ({ level, reward, onClose }: { level: number, reward: {money: number, item?: string}, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in" onClick={onClose}>
             <div className="relative" onClick={e => e.stopPropagation()}>
                 <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
                 <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-pop-in text-center relative z-10">
                     <div className="text-6xl mb-4 animate-bounce">⭐</div>
                     <h2 className="text-3xl font-black text-white mb-2 italic">LEVEL UP!</h2>
                     <div className="text-5xl font-gzhel text-yellow-400 mb-6 drop-shadow-md">{level}</div>
                     
                     <div className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                         <div className="text-slate-400 text-xs uppercase font-bold mb-2">Награды за уровень</div>
                         <div className="text-2xl font-black text-green-400 mb-1">+{reward.money.toLocaleString()} ₽</div>
                         {reward.item && <div className="text-sm font-bold text-blue-300">+ {reward.item}</div>}
                     </div>
                     
                     <button onClick={onClose} className="mt-6 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95">
                         ОТЛИЧНО!
                     </button>
                 </div>
             </div>
             <Confetti />
        </div>
    )
}

const LoginBonusModal = ({ 
    streak, 
    reward, 
    onClaim 
}: { 
    streak: number, 
    reward: { money: number, xp: number }, 
    onClaim: () => void 
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center animate-pop-in">
                <div className="text-5xl mb-4">📅</div>
                <h2 className="text-2xl font-bold text-white mb-2">Ежедневный Бонус</h2>
                <div className="text-slate-400 text-sm mb-6 text-center">Заходите каждый день чтобы увеличить награду!</div>
                
                <div className="flex gap-1 mb-6 w-full justify-center">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <div key={day} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border ${day === streak ? 'bg-yellow-500 text-black border-yellow-300 scale-110 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : day < streak ? 'bg-green-600 text-white border-green-500' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                            {day < streak ? '✓' : day}
                        </div>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-500/30 rounded-xl p-6 w-full text-center mb-6">
                    <div className="text-slate-400 text-xs uppercase font-bold mb-2">Ваша Награда</div>
                    <div className="text-3xl font-black text-white mb-1">+{reward.money} ₽</div>
                    <div className="text-yellow-500 font-bold">+{reward.xp} XP</div>
                </div>

                <button 
                    onClick={onClaim}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition-transform active:scale-95"
                >
                    ЗАБРАТЬ
                </button>
            </div>
        </div>
    )
};

const AnimatedBalance = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  useEffect(() => { setDisplay(value); }, [value]);
  return <>{Math.floor(display).toLocaleString()} ₽</>;
};

const Confetti = () => {
  const pieces = Array.from({ length: 50 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      animationDuration: `${2 + Math.random() * 2}s`,
      animationDelay: `${Math.random() * 1}s`,
      backgroundColor: ['#fbbf24', '#3b82f6', '#ef4444', '#ffffff'][Math.floor(Math.random() * 4)]
    } as React.CSSProperties;
    return <div key={i} className="confetti" style={style} />;
  });
  return <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">{pieces}</div>;
};

// Purchase Notification Component
const PurchaseNotification: React.FC<{ text: string }> = ({ text }) => (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-6 py-2 rounded-full font-bold shadow-xl animate-fade-in-up z-[90] backdrop-blur-sm pointer-events-none whitespace-nowrap">
        {text}
    </div>
);


const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GAME);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false); // For reset modal
  
  // Admin Confirmation States
  const [showConfirmClearChat, setShowConfirmClearChat] = useState(false);
  const [showConfirmGlobalReset, setShowConfirmGlobalReset] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLoginBonus, setShowLoginBonus] = useState<{show: boolean, streak: number, reward: {money: number, xp: number}} | null>(null);
  const [showQuestInfo, setShowQuestInfo] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{level: number, reward: {money: number, item?: string}} | null>(null);
  
  const [purchaseNotifs, setPurchaseNotifs] = useState<{id: number, text: string}[]>([]);
  const [buffNotif, setBuffNotif] = useState<string | null>(null);

  // Admin Panel State
  const [adminTargetId, setAdminTargetId] = useState('');
  const [adminAmount, setAdminAmount] = useState('');
  const [allowedAdmins, setAllowedAdmins] = useState<string[]>([]);

  // New Player State Structure
  const [player, setPlayer] = useState<Player>({
    id: 'user-' + Math.floor(Math.random()*10000),
    name: 'Игрок',
    balance: INITIAL_BALANCE,
    xp: 0,
    totalXp: 0,
    level: 1,
    avatarSeed: 'hero',
    stats: { totalWins: 0, totalGames: 0, currentWinStreak: 0, maxWinStreak: 0, maxBet: 0, bonusStreak: 0 },
    achievements: [],
    history: [],
    inventory: [],
    quests: [],
    activeBuffs: { insurance: false, horseshoe: false, whisperResult: null, xpBoost: false, critical: false, shadow: false, magnet: false, oracle: false, reverse: false, cheater: false, safety: false, vampirism: false, phoenix: false, titan: false },
    lastBonusClaim: 0,
    unlockedSkins: ['DEFAULT'],
    equippedSkin: 'DEFAULT',
    loginStreak: 1,
    lastLoginDate: Date.now(),
    isAdminGod: false
  });
  
  const playerRef = useRef(player);
  
  useEffect(() => {
      playerRef.current = player;
  }, [player]);
  
  const [activeAchievement, setActiveAchievement] = useState<any>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  
  const [activeQuestToast, setActiveQuestToast] = useState<{text: string, reward: number} | null>(null);

  const [betAmount, setBetAmount] = useState<string>('100');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<CoinSide | null>(null);
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [flipCount, setFlipCount] = useState(0); 
  
  // Single Player Result Animations
  const [showSingleWin, setShowSingleWin] = useState(false);
  const [singleWinAmount, setSingleWinAmount] = useState(0);
  const [showSingleLoss, setShowSingleLoss] = useState(false);
  const [singleLossAmount, setSingleLossAmount] = useState(0);

  // Online State
  const [pvpMode, setPvpMode] = useState<'MENU' | 'CREATE' | 'JOIN' | 'LOBBY' | 'GAME'>('MENU');
  const [roomCode, setRoomCode] = useState('');
  const [activeRoom, setActiveRoom] = useState<PvpRoom | null>(null);
  const [pvpResult, setPvpResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [lobbyRooms, setLobbyRooms] = useState<PvpRoom[]>([]);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Bonus Timer State
  const [timeToNextBonus, setTimeToNextBonus] = useState<number>(0);

  const handleGlobalClick = () => {
    soundManager.unlockAudio();
  };

  // PvP Result Cleanup
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pvpResult) {
      timer = setTimeout(() => {
          setPvpMode('MENU');
          setActiveRoom(null);
          setPvpResult(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [pvpResult]);
  
  // --- DAILY QUESTS & INIT ---
  const generateDailyQuests = (): Quest[] => {
      // Pick 3 random quests from a LARGER pool of templates
      const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3).map(t => ({
          ...t,
          progress: 0,
          completed: false,
          lastUpdated: Date.now()
      }));
  };

  const updateQuestProgress = (p: Player, type: 'WIN' | 'PLAY' | 'BET' | 'PVP' | 'LOSE' | 'STREAK' | 'PLAY_PVP', amount: number = 1): Player => {
      const updatedQuests = (p.quests || []).map(q => {
          if (q.completed) return q;
          
          let progress = q.progress;
          if (q.id === 'WIN_3' && type === 'WIN') progress += amount;
          if (q.id === 'PLAY_10' && type === 'PLAY') progress += amount;
          if (q.id === 'BET_TOTAL' && type === 'BET') progress += amount;
          if (q.id === 'WIN_PVP' && type === 'PVP') progress += amount;
          
          // New Quests Logic
          if (q.id === 'LOSE_3' && type === 'LOSE') progress += amount;
          if (q.id === 'WIN_STREAK_3' && type === 'STREAK') progress = amount;
          if (q.id === 'PLAY_PVP_5' && type === 'PLAY_PVP') progress += amount;
          if (q.id === 'BIG_BET' && type === 'BET' && amount >= 1000) progress = 1;

          if (progress >= q.target && !q.completed) {
              const template = DAILY_QUEST_TEMPLATES.find(t => t.id === q.id);
              if (template) {
                  // Add Rewards (Use addXp to handle leveling correctly)
                  p = addXp(template.rewardXp, p);
                  p.balance += (template.rewardMoney || 0);
                  setActiveQuestToast({ text: template.title, reward: template.rewardMoney || 0 });
                  setTimeout(() => setActiveQuestToast(null), 3000);
              }
              
              if(soundEnabled) soundManager.play('MATCH_FOUND');
              return { ...q, progress, completed: true };
          }
          return { ...q, progress };
      });
      return { ...p, quests: updatedQuests };
  };

  useEffect(() => {
    const timer = setInterval(() => {
        const last = player.lastBonusClaim || 0;
        const diff = Date.now() - last;
        if (diff < HOURLY_BONUS_COOLDOWN_MS) {
            setTimeToNextBonus(HOURLY_BONUS_COOLDOWN_MS - diff);
        } else {
            setTimeToNextBonus(0);
        }
    }, 1000);
    return () => clearInterval(timer);
  }, [player.lastBonusClaim]);

  // Check Login Streak
  const checkDailyLogin = (p: Player) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastLogin = new Date(p.lastLoginDate || 0);
      const lastLoginStart = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()).getTime();
      
      const oneDay = 24 * 60 * 60 * 1000;
      const diff = todayStart - lastLoginStart;

      if (diff >= oneDay) {
          // It's a new day!
          let newStreak = p.loginStreak || 0;
          
          if (diff < oneDay * 2) {
              newStreak += 1;
          } else {
              newStreak = 1;
          }
          
          if (newStreak > 7) newStreak = 1; 
          
          const reward = DAILY_LOGIN_REWARDS.find(r => r.day === newStreak) || DAILY_LOGIN_REWARDS[0];
          
          setShowLoginBonus({
              show: true,
              streak: newStreak,
              reward: { money: reward.money, xp: reward.xp }
          });
      }
  };

  const claimDailyLogin = () => {
      if (!showLoginBonus) return;
      
      let p = { ...player };
      p.balance += showLoginBonus.reward.money;
      p.loginStreak = showLoginBonus.streak;
      p.lastLoginDate = Date.now();
      
      p = addXp(showLoginBonus.reward.xp, p);

      setPlayer(p);
      firebaseService.updateUser(p);
      if(soundEnabled) soundManager.play('WIN');
      setShowLoginBonus(null);
  };

  const showToast = (text: string) => {
      const notifId = Date.now();
      setPurchaseNotifs(prev => [...prev, { id: notifId, text }]);
      setTimeout(() => {
          setPurchaseNotifs(prev => prev.filter(n => n.id !== notifId));
      }, 2000);
  };

  // Initialize App
  useEffect(() => {
    const initApp = async () => {
        try { soundManager.loadAll(); } catch(e) {}

        let currentPlayer = { ...player };
        
        // --- ADMIN / PREVIEW MODE LOGIC ---
        let tgId: string | undefined;
        let tgUser: any;

        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            tg.disableVerticalSwipes?.();
            tg.setHeaderColor?.('#020617');
            tg.setBackgroundColor?.('#020617');

            tgUser = tg.initDataUnsafe?.user;
            tgId = tgUser?.id.toString();

            // PREVIEW MODE HACK
            if (!tg.initData) {
                console.log("Running in Preview Mode - Auto Admin");
                tgId = ADMIN_TELEGRAM_ID.toString();
            }
        }
        
        if (tgId) {
            // Subscribe to real-time admin updates
            firebaseService.subscribeToAdmins((admins) => {
                 setAllowedAdmins(admins);
                 
                 // CRITICAL FIX: Use the tgId determined in this scope if possible, 
                 // otherwise fall back to player ref. This solves race condition on init.
                 const currentId = tgId || playerRef.current.id;
                 const isGod = String(currentId) === String(ADMIN_TELEGRAM_ID);

                 // Real-time check
                 if (currentId && !admins.includes(currentId) && !isGod) {
                      setIsAdmin(false);
                      setShowAdminModal(false);
                 } else if (currentId && (admins.includes(currentId) || isGod)) {
                      setIsAdmin(true);
                      setAdminTargetId(currentId);
                 }
            });

            // Force Admin for Owner in Preview Mode immediately (fixes button missing bug)
            if (tgId === String(ADMIN_TELEGRAM_ID)) {
                setIsAdmin(true);
            }

            const remoteData = await firebaseService.getUser(tgId);
            
            if (remoteData) {
                 currentPlayer = {
                     ...remoteData,
                     id: tgId, 
                     name: tgUser?.first_name || remoteData.name || 'Игрок',
                     avatarSeed: tgUser?.id?.toString() || tgId,
                     history: Array.isArray(remoteData.history) ? remoteData.history : [],
                     achievements: Array.isArray(remoteData.achievements) ? remoteData.achievements : [],
                     inventory: Array.isArray(remoteData.inventory) ? remoteData.inventory : [],
                     quests: Array.isArray(remoteData.quests) ? remoteData.quests : [],
                     unlockedSkins: Array.isArray(remoteData.unlockedSkins) ? remoteData.unlockedSkins : ['DEFAULT'],
                     xp: remoteData.xp || 0,
                     totalXp: remoteData.totalXp || remoteData.xp || 0, // Ensure totalXp exists
                     level: remoteData.level || 1,
                     loginStreak: remoteData.loginStreak || 0,
                     lastLoginDate: remoteData.lastLoginDate || 0,
                     isAdminGod: remoteData.isAdminGod || false
                 };

                 // CHECK QUEST ROTATION (24 Hours)
                 if (!currentPlayer.quests || currentPlayer.quests.length === 0) {
                     currentPlayer.quests = generateDailyQuests();
                 } else {
                     const lastUpdate = currentPlayer.quests[0]?.lastUpdated || 0;
                     if (Date.now() - lastUpdate > 24 * 60 * 60 * 1000) {
                         currentPlayer.quests = generateDailyQuests();
                     }
                 }
            } else {
                 currentPlayer = {
                     ...currentPlayer,
                     id: tgId, 
                     name: tgUser?.first_name || 'Игрок',
                     avatarSeed: tgUser?.id?.toString() || tgId,
                     quests: generateDailyQuests()
                 };
            }
        }
        
        if (!Array.isArray(currentPlayer.inventory)) currentPlayer.inventory = [];
        if (!Array.isArray(currentPlayer.activeBuffs)) currentPlayer.activeBuffs = { insurance: false, horseshoe: false, xpBoost: false, critical: false, shadow: false, magnet: false, oracle: false, reverse: false, cheater: false, safety: false, vampirism: false, phoenix: false, titan: false };

        checkDailyLogin(currentPlayer);

        setPlayer(currentPlayer);
        playerRef.current = currentPlayer;
        
        if (firebaseService.isOnline) {
            const chatRef = firebaseService.getChatRef();
            if (chatRef) {
                onValue(chatRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const msgs = Object.keys(data).map(key => ({
                            id: key,
                            ...data[key]
                        }));
                        setChatMessages(msgs.slice(-50));
                        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    } else {
                        setChatMessages([]);
                    }
                });
            }
            firebaseService.subscribeToLeaders(setLeaders);
            firebaseService.subscribeToLobby(setLobbyRooms);
            
            if (currentPlayer.id) {
                firebaseService.updateUser(currentPlayer);
            }
        }
        
        setIsLoaded(true);
    };

    initApp();
  }, []);

  // --- REFINED LEVELING LOGIC ---
  const addXp = (amount: number, currentP: Player) => {
      let p = { ...currentP };
      
      // Apply XP Boost if active
      if (p.activeBuffs?.xpBoost) {
          amount *= 2;
      }
      
      // Increase both Spendable XP and Lifetime XP
      p.xp += amount;
      p.totalXp = (p.totalXp ?? p.xp) + amount; // Ensure totalXp tracks correctly
      
      // Calculate level based on LIFETIME XP (totalXp), so spending money doesn't lower level
      const currentLevel = p.level;
      const calculatedLevel = calculateLevelFromXp(p.totalXp);
      
      // Only level UP, never down (though totalXp shouldn't decrease)
      if (calculatedLevel > currentLevel) {
          p.level = calculatedLevel;
          
          // Level Up Reward Logic
          const levelRewardMoney = calculatedLevel * 1000;
          let extraItem = '';
          
          // Give a small random item for leveling up
          if (Math.random() > 0.5) {
              const freeItems = ['XP_BOOST', 'WHISPER', 'INSURANCE'];
              const randomItemId = freeItems[Math.floor(Math.random() * freeItems.length)];
              const existingItemIndex = p.inventory.findIndex(i => i.itemId === randomItemId);
              if (existingItemIndex >= 0) {
                  p.inventory[existingItemIndex].count += 1;
              } else {
                  p.inventory.push({ itemId: randomItemId, count: 1 });
              }
              const itemDef = SHOP_ITEMS.find(i => i.id === randomItemId);
              extraItem = itemDef?.name || '';
          }

          p.balance += levelRewardMoney;
          setLevelUpData({ level: p.level, reward: { money: levelRewardMoney, item: extraItem }});
          
          if(soundEnabled) soundManager.play('WIN');
      }
      return p;
  };

  const handleClaimBonus = () => {
      if (timeToNextBonus > 0) return;
      
      let newPlayer = { ...player };
      newPlayer.balance += HOURLY_BONUS_AMOUNT;
      newPlayer.lastBonusClaim = Date.now();
      newPlayer.stats.bonusStreak = (newPlayer.stats.bonusStreak || 0) + 1;
      
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      if(soundEnabled) soundManager.play('WIN');
      
      // Visual Feedback
      showToast(`+${HOURLY_BONUS_AMOUNT} ₽`);
  };

  const handleUseItem = (itemId: string) => {
      if (isFlipping) return; 
      
      // 1. Check if we are toggling OFF an active buff
      const currentBuffs = { ...player.activeBuffs } as any;
      const keyMap: Record<string, string> = {
          'INSURANCE': 'insurance',
          'HORSESHOE': 'horseshoe',
          'XP_BOOST': 'xpBoost',
          'CRITICAL': 'critical',
          'SHADOW': 'shadow',
          'MAGNET': 'magnet',
          'ORACLE': 'oracle',
          'REVERSE': 'reverse',
          'CHEATER': 'cheater',
          'SAFETY': 'safety',
          'VAMPIRISM': 'vampirism',
          'PHOENIX': 'phoenix',
          'TITAN': 'titan',
          'GODS_EYE': 'godsEye',
          'WHISPER': 'whisperResult'
      };

      const buffKey = keyMap[itemId];
      
      // If it's a toggleable buff and it is ACTIVE
      if (buffKey && currentBuffs[buffKey]) {
          // DEACTIVATE LOGIC
          const newBuffs: any = { ...currentBuffs }; // Explicitly cast to any to allow dynamic assignment
          newBuffs[buffKey] = false;
          if (buffKey === 'whisperResult') newBuffs[buffKey] = null; // Special case

          const newInventory = [...player.inventory];
          const invIndex = newInventory.findIndex(i => i.itemId === itemId);
          
          if (invIndex >= 0) {
              newInventory[invIndex].count += 1;
          } else {
              newInventory.push({ itemId: itemId, count: 1 });
          }

          const updatedPlayer = { ...player, inventory: newInventory, activeBuffs: newBuffs as ActiveBuffs };
          setPlayer(updatedPlayer);
          firebaseService.updateUser(updatedPlayer);
          showToast(`Деактивировано`);
          return;
      }

      // 2. ACTIVATE LOGIC
      const invIndex = player.inventory.findIndex(i => i.itemId === itemId);
      if (invIndex === -1) return;
      if (player.inventory[invIndex].count <= 0) return;

      const newInventory = [...player.inventory];
      newInventory[invIndex].count -= 1;
      if (newInventory[invIndex].count === 0) newInventory.splice(invIndex, 1);

      let newBuffs = { ...player.activeBuffs } as Partial<ActiveBuffs>;
      let message = '';
      let itemName = '';
      let updatedPlayer = { ...player };

      // Consumable Item Logic (Instant, cannot be toggled)
      if (itemId === 'PANDORA') {
          const outcome = Math.random();
          if (outcome < 0.5) {
              updatedPlayer = addXp(50000, updatedPlayer);
              message = '🎁 Пандора: Вы получили 50,000 XP!';
          } else {
              updatedPlayer.xp = Math.max(0, updatedPlayer.xp - 25000);
              message = '💀 Пандора: Вы потеряли 25,000 XP...';
          }
          itemName = 'Сундук Пандоры';
          updatedPlayer.inventory = newInventory;
          setPlayer(updatedPlayer);
          firebaseService.updateUser(updatedPlayer);
          showToast(message);
          return;
      }
      
      // Buff Activation
      if (itemId === 'WHISPER') {
           // Instant effect (Show hint), but technically stored as 'whisperResult'. 
           // Can't really refund a hint once seen. So we treat as consumable.
          const prediction = Math.random() > 0.5 ? CoinSide.HEADS : CoinSide.TAILS;
          newBuffs.whisperResult = prediction;
          itemName = 'Шепот Ангела';
          message = `👼 Шепот: "Я чувствую, что выпадет ${prediction === CoinSide.HEADS ? 'ОРЁЛ' : 'РЕШКА'}..."`;
          setHintMessage(message);
          setTimeout(() => setHintMessage(null), 4000);
      } else {
          // Standard Toggleable Buffs
          if (itemId === 'INSURANCE') itemName = 'Страховка';
          else if (itemId === 'HORSESHOE') itemName = 'Золотая Подкова';
          else if (itemId === 'XP_BOOST') itemName = 'Мудрость Старца';
          else if (itemId === 'CRITICAL') itemName = 'Клевер Удачи';
          else if (itemId === 'SHADOW') itemName = 'Плащ Тени';
          else if (itemId === 'MAGNET') itemName = 'Магнит Победы';
          else if (itemId === 'ORACLE') { itemName = 'Глаз Оракула'; setHintMessage("🔮 Оракул: Я гарантирую точный результат при броске."); }
          else if (itemId === 'REVERSE') itemName = 'Реверс Времени';
          else if (itemId === 'CHEATER') itemName = 'Шулерские Кости';
          else if (itemId === 'SAFETY') itemName = 'Амулет Сохранения';
          else if (itemId === 'VAMPIRISM') itemName = 'Вампиризм';
          else if (itemId === 'PHOENIX') itemName = 'Феникс';
          else if (itemId === 'TITAN') itemName = 'Титан';
          else if (itemId === 'GODS_EYE') itemName = 'Глаз Бога';
          
          if (buffKey) (newBuffs as any)[buffKey] = true;
      }

      updatedPlayer = { ...player, inventory: newInventory, activeBuffs: newBuffs as ActiveBuffs };
      setPlayer(updatedPlayer);
      if(soundEnabled) soundManager.play('CLICK');
      
      if (itemName) showToast(`Активировано: ${itemName}`);
  };

  const handleBuyItem = (item: ShopItem) => {
      if (player.level < item.minLevel) { alert(`Нужен уровень ${item.minLevel}`); return; }
      if (player.xp < item.price) { if(soundEnabled) soundManager.play('ERROR'); return; }

      let newPlayer = { ...player };
      // Spend Currency XP Only
      newPlayer.xp -= item.price;
      // Do NOT touch totalXp, so level is preserved!
      
      if (item.type === 'SKIN' && item.skinId) {
          if (newPlayer.unlockedSkins.includes(item.skinId)) return;
          newPlayer.unlockedSkins.push(item.skinId);
          alert('Скин разблокирован! Выберите его в магазине.');
      } else {
          const existingItemIndex = newPlayer.inventory.findIndex(i => i.itemId === item.id);
          if (existingItemIndex >= 0) {
              newPlayer.inventory[existingItemIndex].count += 1;
          } else {
              newPlayer.inventory.push({ itemId: item.id, count: 1 });
          }
      }
      
      showToast(`+1 ${item.name}`);

      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      if(soundEnabled) soundManager.play('BUY');
  };

  const handleEquipSkin = (skinId: SkinId) => {
      const newPlayer = { ...player, equippedSkin: skinId };
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
  };
  
  // --- ADMIN ACTIONS ---
  const handleAdminGive = async (type: 'MONEY' | 'XP') => {
      if (!adminAmount || !adminTargetId) return;
      const amount = parseInt(adminAmount);
      if (isNaN(amount)) return;

      const updateLocalPlayer = (p: Player, val: number, field: 'balance' | 'xp') => {
          let cloned = { ...p };
          if (field === 'balance') cloned.balance = val;
          if (field === 'xp') {
              // Admin Sets Spendable XP
              cloned.xp = val;
              // Also update Total XP to match so Level matches
              cloned.totalXp = val; 
              cloned.level = calculateLevelFromXp(val); 
          }
          return cloned;
      };

      if (adminTargetId === player.id) {
          const newPlayer = updateLocalPlayer(player, amount, type === 'MONEY' ? 'balance' : 'xp');
          setPlayer(newPlayer);
          firebaseService.updateUser(newPlayer);
          alert(`Установлено ${amount} ${type}. Level updated to ${newPlayer.level}`);
      } else {
          const targetUser = await firebaseService.getUser(adminTargetId);
          if (targetUser) {
              const updates: Partial<Player> = {};
              if (type === 'MONEY') updates.balance = amount;
              if (type === 'XP') {
                  updates.xp = amount;
                  updates.totalXp = amount;
                  updates.level = calculateLevelFromXp(amount);
              }
              await firebaseService.adminUpdateUser(adminTargetId, updates);
              alert(`Установлено ${amount} ${type} игроку ${targetUser.name}`);
          } else {
              alert('Игрок не найден');
          }
      }
  };

  const handleToggleGodMode = () => {
      const newStatus = !player.isAdminGod;
      const newPlayer = { ...player, isAdminGod: newStatus };
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      alert(`GOD MODE: ${newStatus ? 'ON' : 'OFF'}`);
  };

  const handleAddAdmin = async (id: string) => {
      await firebaseService.addAdmin(id);
      alert('Admin Added');
  };

  const handleRemoveAdmin = async (id: string) => {
      if (id === String(ADMIN_TELEGRAM_ID)) {
          alert("Cannot remove the Owner.");
          return;
      }
      await firebaseService.removeAdmin(id);
      alert('Admin Removed');
  };
  
  // Handlers for Confirmation Modals
  const handleClearChatRequest = () => {
      setShowConfirmClearChat(true);
  };

  const executeClearChat = async () => {
      await firebaseService.clearChat();
      setShowConfirmClearChat(false);
      showToast("Чат успешно очищен");
  };

  const handleGlobalResetRequest = () => {
      setShowConfirmGlobalReset(true);
  };

  const executeGlobalReset = async () => {
      await firebaseService.resetGlobalState();
      window.location.reload();
  };
  
  const handleSelfReset = () => {
      setShowConfirmReset(false);
      const newPlayer: Player = {
          ...player,
          balance: INITIAL_BALANCE,
          xp: 0,
          totalXp: 0,
          level: 1,
          stats: { totalWins: 0, totalGames: 0, currentWinStreak: 0, maxWinStreak: 0, maxBet: 0, bonusStreak: 0 },
          achievements: [],
          history: [],
          inventory: [],
          quests: generateDailyQuests(),
          unlockedSkins: ['DEFAULT'],
          equippedSkin: 'DEFAULT',
          loginStreak: 1,
          lastLoginDate: Date.now()
      };
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      alert('Профиль успешно сброшен.');
  };

  // --- GAMEPLAY ---

  const handleFlip = (side: CoinSide) => {
    const bet = parseInt(betAmount) || 0;
    if (isFlipping) return;
    if (bet > player.balance || bet < MIN_BET) { if(soundEnabled) soundManager.play('ERROR'); return; }

    const buffs = player.activeBuffs || { insurance: false, horseshoe: false, xpBoost: false, critical: false, shadow: false, magnet: false, oracle: false, reverse: false, cheater: false, safety: false, vampirism: false, phoenix: false, titan: false };

    if (buffs.magnet) setBuffNotif("🧲 Магнит: Шанс 90%");
    if (buffs.cheater) setBuffNotif("🎲 Кости: Шанс 60%");
    if (buffs.oracle) setBuffNotif("🔮 Оракул: Шанс 100%");
    setTimeout(() => setBuffNotif(null), 3000);

    setShowSingleWin(false);
    setShowSingleLoss(false);
    
    // Haptic
    try { window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium'); } catch(e){}
    
    setIsFlipping(true);
    setSelectedSide(side);
    setFlipCount(c => c + 1);

    // WIN LOGIC
    let currentWinChance = BASE_WIN_CHANCE;
    if (buffs.cheater) currentWinChance = 0.60; 
    if (buffs.magnet) currentWinChance = 0.90; 
    if (buffs.oracle) currentWinChance = 1.0; 
    
    if (player.isAdminGod) currentWinChance = 1.0;

    const isWin = Math.random() < currentWinChance;
    
    const resultSide = isWin ? side : (side === CoinSide.HEADS ? CoinSide.TAILS : CoinSide.HEADS);
    setFlipResult(resultSide);

    setTimeout(() => {
      if(soundEnabled) soundManager.play('COIN_LAND');
      let newPlayer = { ...playerRef.current };
      
      // Consume Buffs
      newPlayer.activeBuffs = { insurance: false, horseshoe: false, whisperResult: null, xpBoost: false, critical: false, shadow: false, magnet: false, oracle: false, reverse: false, cheater: false, safety: false, vampirism: false, phoenix: false, titan: false };
      
      let xpGained = 0;
      let profit = 0;

      if (isWin) {
          let multiplier = WIN_COEFFICIENT;
          if (buffs.horseshoe) multiplier = 2.8;
          
          let isCrit = false;
          if (buffs.critical && Math.random() < 0.1) {
              multiplier = 5.0;
              isCrit = true;
          }

          profit = Math.floor(bet * multiplier) - bet;
          newPlayer.balance += profit;
          
          xpGained = XP_PER_WIN;
          newPlayer.stats.totalWins += 1;
          newPlayer.stats.currentWinStreak += 1;
          
          newPlayer = addToHistory(newPlayer, {
              id: Date.now().toString(),
              type: 'SOLO',
              result: 'WIN',
              amount: profit,
              timestamp: Date.now()
          });

          if(soundEnabled) soundManager.play('WIN');
          setSingleWinAmount(profit);
          setShowSingleWin(true);
          if (isCrit) alert("🔥 КРИТИЧЕСКИЙ УДАР! x5 🔥");
          
          newPlayer = updateQuestProgress(newPlayer, 'WIN');
          newPlayer = updateQuestProgress(newPlayer, 'STREAK', newPlayer.stats.currentWinStreak);
      } else {
          let loss = bet;
          let message = '';
          
          if (buffs.reverse) {
              loss = 0; 
              message = "↩️ РЕВЕРС: Время перемотано! Деньги возвращены.";
          } else if (buffs.phoenix && Math.random() < 0.33) {
              loss = 0;
              message = "🔥 ФЕНИКС: Вы восстали из пепла! Ставка возвращена.";
          } else if (buffs.insurance) {
              loss = Math.floor(bet * 0.5);
          }

          if (message) alert(message);
          
          newPlayer.balance -= loss;
          
          xpGained = XP_PER_LOSS;
          
          if (buffs.oracle && !isWin) {
             xpGained += bet; 
          }

          if (!buffs.safety) {
              newPlayer.stats.currentWinStreak = 0;
          }

          newPlayer = addToHistory(newPlayer, {
              id: Date.now().toString(),
              type: 'SOLO',
              result: 'LOSS',
              amount: loss,
              timestamp: Date.now()
          });

          if(soundEnabled) soundManager.play('LOSE');
          setSingleLossAmount(loss);
          setShowSingleLoss(true);
          
          newPlayer = updateQuestProgress(newPlayer, 'LOSE');
      }

      firebaseService.logGameResult({
        playerName: newPlayer.name,
        playerAvatar: newPlayer.avatarSeed,
        playerId: newPlayer.id, 
        playerLevel: newPlayer.level, 
        amount: isWin ? profit : (buffs.reverse ? 0 : (buffs.insurance ? Math.floor(bet*0.5) : bet)),
        type: 'SOLO',
        result: isWin ? 'WIN' : 'LOSS',
        timestamp: Date.now()
      });
      
      newPlayer.stats.totalGames += 1;
      newPlayer.stats.maxBet = Math.max(newPlayer.stats.maxBet, bet);
      
      newPlayer = addXp(xpGained, newPlayer);
      newPlayer = updateQuestProgress(newPlayer, 'PLAY');
      newPlayer = updateQuestProgress(newPlayer, 'BET', bet);

      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      checkAchievements(newPlayer);

      setTimeout(() => {
          setShowSingleWin(false);
          setShowSingleLoss(false);
          setHintMessage(null);
      }, 2500);

      setIsFlipping(false);
    }, ANIMATION_DURATION_MS);
  };
  
  const resolvePvpGame = (room: PvpRoom, isHost: boolean) => {
      const currentPlayerState = playerRef.current;
      const buffs = currentPlayerState.activeBuffs || {};

      const didHostWin = room.result === room.selectedSide;
      const didIWin = isHost ? didHostWin : !didHostWin;
      const opponentName = isHost ? room.guestName : room.hostName;
      
      let winPayout = Math.floor(room.betAmount * WIN_COEFFICIENT);
      if (didIWin) {
          if (buffs.horseshoe) winPayout = Math.floor(room.betAmount * 2.8);
          if (buffs.magnet) winPayout = Math.floor(room.betAmount * 4.0);
          if (buffs.cheater) winPayout = Math.floor(room.betAmount * 2.5); 
          if (buffs.titan) winPayout = Math.floor(room.betAmount * 3.5); 
          if (buffs.critical && Math.random() < 0.1) winPayout = Math.floor(room.betAmount * 5.0);
          if (buffs.vampirism) winPayout += Math.floor(room.betAmount * 0.1); 
      }
      
      if (isHost) {
        const profit = Math.floor(room.betAmount * WIN_COEFFICIENT) - room.betAmount; 
        firebaseService.logGameResult({
            playerName: room.hostName,
            playerAvatar: room.hostAvatar,
            playerId: room.hostId, 
            playerLevel: room.hostLevel === -1 ? 1 : (room.hostLevel || 1),
            amount: didHostWin ? profit : room.betAmount,
            type: 'PVP',
            result: didHostWin ? 'WIN' : 'LOSS',
            timestamp: Date.now()
        });
        if (room.guestId) {
             const guestWins = !didHostWin;
             setTimeout(() => {
                 firebaseService.logGameResult({
                    playerName: room.guestName || 'Соперник',
                    playerAvatar: room.guestAvatar || 'default',
                    playerId: room.guestId, 
                    playerLevel: room.guestLevel === -1 ? 1 : (room.guestLevel || 1),
                    amount: guestWins ? profit : room.betAmount,
                    type: 'PVP',
                    result: guestWins ? 'WIN' : 'LOSS',
                    timestamp: Date.now()
                 });
             }, 100);
        }
      }

      let newPlayer = { ...currentPlayerState };
      
      newPlayer.activeBuffs = { insurance: false, horseshoe: false, whisperResult: null, xpBoost: false, critical: false, shadow: false, magnet: false, oracle: false, reverse: false, cheater: false, safety: false, vampirism: false, phoenix: false, titan: false };
      
      let xpGained = XP_PER_LOSS;

      if (didIWin) {
          newPlayer.balance += winPayout;
          newPlayer.stats.totalWins += 1;
          newPlayer.stats.currentWinStreak += 1;
          xpGained = XP_PER_PVP_WIN;
          
          const profit = winPayout - room.betAmount;
          newPlayer = addToHistory(newPlayer, {
              id: room.id,
              type: 'PVP_WIN',
              result: 'WIN',
              amount: profit, 
              timestamp: Date.now(),
              opponentName: opponentName
          });
          
          if(soundEnabled) soundManager.play('WIN');
          setPvpResult('WIN');
          newPlayer = updateQuestProgress(newPlayer, 'PVP');
          newPlayer = updateQuestProgress(newPlayer, 'WIN');
          newPlayer = updateQuestProgress(newPlayer, 'STREAK', newPlayer.stats.currentWinStreak);
      } else {
          let lossAmount = room.betAmount;
          let message = '';
          
          if (buffs.reverse) {
              newPlayer.balance += room.betAmount; 
              lossAmount = 0;
              message = "↩️ РЕВЕРС: PvP Дуэль отменена для вашего баланса.";
          } else if (buffs.phoenix && Math.random() < 0.33) {
              newPlayer.balance += room.betAmount;
              lossAmount = 0;
              message = "🔥 ФЕНИКС: Вы восстали из пепла! Ставка возвращена.";
          } else if (buffs.insurance) {
              const refund = Math.floor(room.betAmount * 0.5);
              newPlayer.balance += refund; 
              lossAmount -= refund;
          }

          if (message) alert(message);
          
          if (buffs.oracle) {
              xpGained += room.betAmount; 
          }

          if (!buffs.safety) {
              newPlayer.stats.currentWinStreak = 0;
          }

          newPlayer = addToHistory(newPlayer, {
            id: room.id,
            type: 'PVP_LOSS',
            result: 'LOSS',
            amount: lossAmount,
            timestamp: Date.now(),
            opponentName: opponentName
          });
          if(soundEnabled) soundManager.play('LOSE');
          setPvpResult('LOSS');
          
          newPlayer = updateQuestProgress(newPlayer, 'LOSE');
      }
      
      newPlayer = addXp(xpGained, newPlayer);
      newPlayer = updateQuestProgress(newPlayer, 'PLAY');
      newPlayer = updateQuestProgress(newPlayer, 'PLAY_PVP', 1);
      
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      checkAchievements(newPlayer);
  };

  const haptic = (type: 'impact' | 'notification' | 'error') => {
    try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
           if (type === 'impact') window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
           if (type === 'notification') window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
           if (type === 'error') window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
    } catch(e) {}
  };

  const checkAchievements = (newPlayer: Player) => {
     if (!newPlayer || !newPlayer.stats) return;
     const currentAchievements = Array.isArray(newPlayer.achievements) ? [...newPlayer.achievements] : [];
     let achievementUnlocked = false;
     let updatedAchievements = [...currentAchievements];
     let updatedPlayer = { ...newPlayer };

     ACHIEVEMENTS_LIST.forEach(ach => {
         if (!currentAchievements.includes(ach.id)) {
             try {
                 if (ach.condition(updatedPlayer)) {
                     updatedAchievements.push(ach.id);
                     setActiveAchievement(ach);
                     setShowAchievement(true);
                     achievementUnlocked = true;
                     
                     updatedPlayer.balance += (ach.reward?.money || 0);
                     updatedPlayer = addXp((ach.reward?.xp || 0), updatedPlayer);
                     
                     setTimeout(() => setShowAchievement(false), 4000);
                     if(soundEnabled) soundManager.play('MATCH_FOUND');
                 }
             } catch (e) {}
         }
     });

     if (achievementUnlocked) {
         updatedPlayer.achievements = updatedAchievements;
         setPlayer(updatedPlayer);
         firebaseService.updateUser(updatedPlayer);
     }
  };

  const addToHistory = (p: Player, item: GameHistoryItem): Player => {
      const currentHistory = Array.isArray(p.history) ? p.history : [];
      const newHistory = [item, ...currentHistory].slice(0, 50);
      return { ...p, history: newHistory };
  };

  // --- PVP HANDLERS ---
  const handleCreateRoom = () => {
      const bet = parseInt(betAmount) || 0;
      if (bet > player.balance || bet < MIN_BET) return;
      const newPlayer = { ...player, balance: player.balance - bet };
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      const code = firebaseService.createRoom(newPlayer, bet);
      setRoomCode(code);
      setPvpMode('LOBBY');
      subscribeToRoomUpdates(code);
  };

  const handleJoinRoom = async (room: PvpRoom) => {
      if (player.balance < room.betAmount) { if(soundEnabled) soundManager.play('ERROR'); return; }
      const newPlayer = { ...player, balance: player.balance - room.betAmount };
      setPlayer(newPlayer);
      firebaseService.updateUser(newPlayer);
      const success = await firebaseService.joinRoom(room.id, newPlayer);
      if (success) {
          setRoomCode(room.id);
          setPvpMode('LOBBY');
          subscribeToRoomUpdates(room.id);
      } else {
          setPlayer(p => {
              const refunded = { ...p, balance: p.balance + room.betAmount };
              firebaseService.updateUser(refunded);
              return refunded;
          });
          alert('Комната недоступна');
      }
  };

  const calculatePvpWinChance = (room: PvpRoom, selectedSide: CoinSide): number => {
      let hostChance = 0.5;
      
      const hostBuffs = (room.hostBuffs || {}) as Partial<ActiveBuffs>;
      const guestBuffs = (room.guestBuffs || {}) as Partial<ActiveBuffs>;

      if (hostBuffs.magnet) hostChance += 0.30;
      if (hostBuffs.cheater) hostChance += 0.10;
      if (hostBuffs.oracle) hostChance += 0.45;

      if (guestBuffs.magnet) hostChance -= 0.30;
      if (guestBuffs.cheater) hostChance -= 0.10;
      if (guestBuffs.oracle) hostChance -= 0.45;

      if (room.hostIsGod) return 1.0; 
      if (room.guestIsGod) return 0.0; 

      if (hostChance > 0.95) hostChance = 0.95;
      if (hostChance < 0.05) hostChance = 0.05;

      return hostChance;
  }

  const handleHostFlip = (side: CoinSide) => {
      if (!activeRoom) return;
      // Guard: Ensure room is ready and prevent double taps
      if (activeRoom.status !== 'READY') return;
      if (isFlipping) return; 

      const winProbability = calculatePvpWinChance(activeRoom, side);
      firebaseService.performFlip(activeRoom.id, side, winProbability);
      setIsFlipping(true); // Optimistic UI update to prevent double clicks
  }

  const subscribeToRoomUpdates = (code: string) => {
      const unsub = firebaseService.subscribeToRoom(code, (roomData) => {
          if (roomData) {
              setActiveRoom(roomData);
              if (roomData.status === 'FLIPPING') { 
                  setPvpMode('GAME'); 
                  setFlipCount(c => c+1); 
                  setIsFlipping(true); 
              }
              if (roomData.status === 'FINISHED') { 
                  setIsFlipping(false); 
                  resolvePvpGame(roomData, roomData.hostId === playerRef.current.id); 
                  unsub(); 
              }
          } else {
              setPvpMode('MENU');
              unsub();
          }
      });
  };

  const handleCancelRoom = () => {
      if (activeRoom && activeRoom.hostId === player.id) {
          firebaseService.cancelRoom(activeRoom.id);
          const newPlayer = { ...player, balance: player.balance + activeRoom.betAmount };
          setPlayer(newPlayer);
          firebaseService.updateUser(newPlayer);
          setPvpMode('MENU');
          setActiveRoom(null);
      }
  };

  const handleAdminReset = async () => {
    if(confirm('ВНИМАНИЕ! Сброс базы данных.')) {
      await firebaseService.resetGlobalState();
      window.location.reload();
    }
  };

  // --- RENDERERS ---

  const renderAdminModal = () => {
      if (!showAdminModal) return null;
      return (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 animate-fade-in overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-red-900/50 pb-4">
                  <h2 className="text-2xl font-black text-red-500 flex items-center gap-2">
                      <span className="text-3xl">☣️</span> ADMIN PANEL
                  </h2>
                  <button onClick={() => setShowAdminModal(false)} className="bg-slate-800 px-4 py-2 rounded-lg text-white font-bold">Close</button>
              </div>

              <div className="space-y-6">
                  {/* GOD MODE */}
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                      <div>
                          <div className="text-white font-bold">GOD MODE (100% Win)</div>
                          <div className="text-xs text-slate-500">You will never lose.</div>
                      </div>
                      <button 
                        onClick={handleToggleGodMode}
                        className={`px-6 py-2 rounded-lg font-black transition-all ${player.isAdminGod ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-slate-800 text-slate-500'}`}
                      >
                          {player.isAdminGod ? 'ENABLED' : 'DISABLED'}
                      </button>
                  </div>

                  {/* RESOURCES */}
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-4">
                      <div className="text-slate-400 font-bold text-xs uppercase">Set Resources</div>
                      <div className="flex gap-2">
                          <input 
                            value={adminTargetId} 
                            onChange={e => setAdminTargetId(e.target.value)}
                            placeholder="User ID (Default: Self)" 
                            className="bg-slate-950 border border-slate-700 p-3 rounded-lg text-white w-full text-sm font-mono"
                          />
                      </div>
                      <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={adminAmount} 
                            onChange={e => setAdminAmount(e.target.value)}
                            placeholder="Amount" 
                            className="bg-slate-950 border border-slate-700 p-3 rounded-lg text-white w-full font-mono font-bold"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => handleAdminGive('MONEY')} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold">SET BALANCE</button>
                          <button onClick={() => handleAdminGive('XP')} className="bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-lg font-bold">SET XP</button>
                      </div>
                  </div>

                  {/* ADMIN MANAGEMENT */}
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-4">
                      <div className="text-slate-400 font-bold text-xs uppercase">Manage Admins</div>
                      <div className="flex gap-2">
                          <input 
                             id="newAdminId"
                             placeholder="Telegram User ID to Add"
                             className="bg-slate-950 border border-slate-700 p-3 rounded-lg text-white w-full text-sm"
                          />
                          <button 
                             onClick={() => {
                                 const el = document.getElementById('newAdminId') as HTMLInputElement;
                                 if(el.value) { handleAddAdmin(el.value); el.value = ''; }
                             }}
                             className="bg-green-600 px-4 rounded-lg font-bold text-white"
                          >
                             ADD
                          </button>
                      </div>
                      <div className="space-y-2">
                          {allowedAdmins.map(id => (
                              <div key={id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                                  <span className="text-xs font-mono text-slate-300">{id}</span>
                                  {id !== String(ADMIN_TELEGRAM_ID) ? (
                                      <button onClick={() => handleRemoveAdmin(id)} className="text-red-500 font-bold text-xs bg-red-900/10 px-2 py-1 rounded hover:bg-red-900/30">REMOVE</button>
                                  ) : (
                                      <span className="text-xs text-yellow-500 font-bold">OWNER</span>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* DANGER ZONE */}
                  <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl space-y-2">
                      <div className="text-red-500 font-bold text-xs uppercase mb-2">Danger Zone</div>
                      <button onClick={handleClearChatRequest} className="w-full bg-slate-800 text-slate-300 py-3 rounded-lg font-bold hover:bg-slate-700">
                          Clear Chat
                      </button>
                      <button onClick={handleGlobalResetRequest} className="w-full bg-red-900 text-white py-4 rounded-xl font-black tracking-widest hover:bg-red-800 border border-red-700">
                          ☢️ RESET ALL TO START ☢️
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  const renderGameTab = () => {
    // Progress calculation using totalXp to show level progress correctly
    const nextLevelXp = getXpForLevel(player.level + 1); 
    const currentLevelBaseXp = getXpForLevel(player.level);
    const totalProgressNeeded = nextLevelXp - currentLevelBaseXp;
    const currentProgress = (player.totalXp || 0) - currentLevelBaseXp;
    
    // Safety clamp
    let xpProgress = Math.min((currentProgress / totalProgressNeeded) * 100, 100);
    if (xpProgress < 0) xpProgress = 0;
    
    // Max Level Check
    const isMaxLevel = player.level >= MAX_LEVEL;
    if (isMaxLevel) xpProgress = 100;

    const bonusAvailable = timeToNextBonus === 0;
    
    // Render Quest Info Modal Content
    const renderQuestInfoContent = () => {
        if (!showQuestInfo) return null;
        const lastUpdate = player.quests[0]?.lastUpdated || Date.now();
        const nextUpdate = new Date(lastUpdate + 24 * 60 * 60 * 1000);
        const nextUpdateString = nextUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowQuestInfo(false)}>
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-bold text-lg mb-2">О Заданиях</h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{QUEST_INFO_TEXT}</p>
                  
                  <div className="mt-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">🕒 Обновление заданий в:</div>
                      <div className="text-xl font-mono text-white">{nextUpdateString}</div>
                  </div>

                  <button onClick={() => setShowQuestInfo(false)} className="w-full mt-4 bg-slate-800 text-white py-2 rounded-lg font-bold">Понятно</button>
              </div>
          </div>
        );
    };

    return (
    <div className="flex flex-col h-full p-2 overflow-y-auto no-scrollbar pb-[80px] relative">
      
      {/* HEADER: Balance & Level & Bonus */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex justify-between items-center mb-2 shrink-0 mt-2 relative overflow-hidden">
          <div className="z-10">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Баланс</div>
            <div className="text-3xl font-black text-white"><AnimatedBalance value={player.balance} /></div>
          </div>
          
          <div className="flex flex-col items-end gap-2 z-10">
              <div 
                className="text-right cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowLevelModal(true)}
              >
                  <div className={`text-xs font-bold ${isMaxLevel ? 'text-purple-400 animate-pulse' : 'text-yellow-500'} flex items-center justify-end gap-1`}>
                    <span>{isMaxLevel ? '👑' : '⭐'}</span>
                    <span>Lvl {player.level}</span>
                  </div>
                  <div className="w-24 h-2 bg-slate-800 rounded-full mt-1 border border-slate-700">
                      <div className={`h-full rounded-full transition-all duration-300 ${isMaxLevel ? 'bg-purple-500' : 'bg-yellow-500'}`} style={{width: `${xpProgress}%`}}></div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{isMaxLevel ? 'MAX LEVEL' : `${(player.totalXp || 0).toLocaleString()} / ${nextLevelXp.toLocaleString()}`}</div>
              </div>
              
              <button 
                  onClick={handleClaimBonus}
                  disabled={!bonusAvailable}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all ${bonusAvailable ? 'bg-green-600/20 border-green-500 text-green-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              >
                  <span>🎁</span>
                  {bonusAvailable ? <span>ЗАБРАТЬ</span> : <span>{Math.ceil(timeToNextBonus / 60000)} МИН</span>}
              </button>
          </div>
      </div>

      <div className="mb-2 px-1">
          <div className="flex justify-between items-center mb-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                  Задания 
                  <button onClick={() => setShowQuestInfo(true)} className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center">?</button>
              </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {player.quests.map(q => (
                  <div key={q.id} className={`shrink-0 p-2 rounded-lg border flex items-center gap-2 ${q.completed ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="text-xs">{q.completed ? '✅' : '📜'}</div>
                      <div>
                          <div className={`text-[10px] font-bold whitespace-nowrap ${q.completed ? 'text-green-400' : 'text-slate-300'}`}>{DAILY_QUEST_TEMPLATES.find(t=>t.id===q.id)?.title}</div>
                          <div className="text-[8px] text-slate-500">{q.progress} / {q.target}</div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
      
      {renderQuestInfoContent()}

      {player.inventory.length > 0 && (
          <div className="mb-4">
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 px-1">Инвентарь</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                  {player.inventory.map((inv, idx) => {
                      const itemDef = SHOP_ITEMS.find(i => i.id === inv.itemId);
                      if (!itemDef) return null;
                      let isActive = false;
                      if (inv.itemId === 'INSURANCE' && player.activeBuffs?.insurance) isActive = true;
                      if (inv.itemId === 'HORSESHOE' && player.activeBuffs?.horseshoe) isActive = true;
                      if (inv.itemId === 'XP_BOOST' && player.activeBuffs?.xpBoost) isActive = true;
                      if (inv.itemId === 'CRITICAL' && player.activeBuffs?.critical) isActive = true;
                      if (inv.itemId === 'SHADOW' && player.activeBuffs?.shadow) isActive = true;
                      if (inv.itemId === 'MAGNET' && player.activeBuffs?.magnet) isActive = true;
                      if (inv.itemId === 'ORACLE' && player.activeBuffs?.oracle) isActive = true;
                      if (inv.itemId === 'REVERSE' && player.activeBuffs?.reverse) isActive = true;
                      if (inv.itemId === 'CHEATER' && player.activeBuffs?.cheater) isActive = true;
                      if (inv.itemId === 'SAFETY' && player.activeBuffs?.safety) isActive = true;
                      if (inv.itemId === 'VAMPIRISM' && player.activeBuffs?.vampirism) isActive = true;
                      if (inv.itemId === 'PHOENIX' && player.activeBuffs?.phoenix) isActive = true;
                      if (inv.itemId === 'TITAN' && player.activeBuffs?.titan) isActive = true;
                      
                      return (
                          <button 
                            key={idx} 
                            onClick={() => handleUseItem(inv.itemId)}
                            disabled={isFlipping}
                            className={`relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${isActive ? 'bg-blue-900 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700 active:scale-95'}`}
                          >
                              <div className="text-2xl">{itemDef.icon}</div>
                              <div className="absolute -top-2 -right-2 bg-slate-950 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-slate-700">{inv.count}</div>
                          </button>
                      )
                  })}
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
        {hintMessage && (
            <div className="absolute top-0 z-30 bg-slate-800/90 text-yellow-300 px-4 py-2 rounded-full border border-yellow-500/30 text-xs font-bold animate-fade-in-up backdrop-blur-md shadow-lg">
                {hintMessage}
            </div>
        )}
        
        {buffNotif && (
             <div className="absolute top-8 z-30 bg-purple-900/80 text-purple-200 px-4 py-1 rounded-full border border-purple-500/30 text-[10px] font-bold animate-pulse backdrop-blur-sm">
                {buffNotif}
            </div>
        )}

        {showSingleWin && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-pop-in pointer-events-none backdrop-blur-sm bg-black/20">
              <Confetti />
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_20px_rgba(234,179,8,1)]">
                  ПОБЕДА
              </div>
              <div className="text-4xl font-mono text-green-400 font-bold mt-2 text-shadow">
                  +{singleWinAmount.toLocaleString()} ₽
              </div>
              <div className="text-sm font-bold text-yellow-500 mt-1">+{XP_PER_WIN} XP</div>
           </div>
        )}
        {showSingleLoss && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-shake pointer-events-none backdrop-blur-sm bg-red-900/10">
              <div className="text-6xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                  💔
              </div>
              <div className="text-4xl font-mono text-red-500 font-bold mt-2">
                  -{singleLossAmount.toLocaleString()} ₽
              </div>
              <div className="text-sm font-bold text-slate-500 mt-1">+{XP_PER_LOSS} XP</div>
           </div>
        )}

        <Coin key={flipCount} flipping={isFlipping} result={flipResult} skinId={player.equippedSkin} />
      </div>

      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 mt-auto shrink-0">
        <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 mb-3 px-3">
           <span className="text-slate-500 font-bold">₽</span>
           <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="bg-transparent text-center w-full text-xl font-black text-white p-3 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleFlip(CoinSide.HEADS)} disabled={isFlipping} className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 active:border-white font-black text-white transition-all">ОРЁЛ</button>
          <button onClick={() => handleFlip(CoinSide.TAILS)} disabled={isFlipping} className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 active:border-blue-500 font-black text-blue-400 transition-all">РЕШКА</button>
        </div>
      </div>
    </div>
  )};

  const ItemCard: React.FC<{ item: ShopItem }> = ({ item }) => {
      const locked = player.level < item.minLevel;
      const canAfford = player.xp >= item.price;
      const [purchasing, setPurchasing] = useState(false);
      const [purchaseSuccess, setPurchaseSuccess] = useState(false);
      
      let buttonText = `${item.price.toLocaleString()} XP`;
      let action: () => void = () => {
          setPurchasing(true);
          handleBuyItem(item);
          setTimeout(() => {
             setPurchasing(false);
             setPurchaseSuccess(true);
             setTimeout(() => setPurchaseSuccess(false), 1500);
          }, 300);
      };

      let isDisabled = locked || !canAfford || purchasing;
      let buttonClass = canAfford && !locked ? 'bg-blue-600 text-white active:scale-95' : 'bg-slate-800 text-slate-500';

      if (item.type === 'SKIN' && item.skinId) {
          const owned = player.unlockedSkins.includes(item.skinId);
          const equipped = player.equippedSkin === item.skinId;
          if (owned) {
              buttonText = equipped ? 'НАДЕТО' : 'НАДЕТЬ';
              action = () => handleEquipSkin(item.skinId!);
              isDisabled = equipped;
              buttonClass = equipped ? 'bg-green-900/50 text-green-400 border border-green-900' : 'bg-blue-600 text-white';
          }
      }

      return (
          <div className={`bg-slate-900 p-4 rounded-xl border ${locked ? 'border-slate-800 opacity-60' : 'border-slate-700'} flex items-center justify-between relative overflow-hidden transition-all duration-300 ${purchaseSuccess ? 'border-green-500 bg-green-900/10' : ''}`}>
              {/* Success Flash Overlay */}
              {purchaseSuccess && (
                  <div className="absolute inset-0 bg-green-500/20 z-10 animate-pulse flex items-center justify-center">
                      <div className="text-green-400 font-black text-2xl drop-shadow-md animate-pop-in">КУПЛЕНО</div>
                      <Confetti />
                  </div>
              )}
              
              <div className="flex items-center gap-3 relative z-0">
                  <div className={`text-3xl bg-slate-800 w-12 h-12 flex items-center justify-center rounded-lg transition-transform ${purchaseSuccess ? 'scale-110 rotate-12' : ''}`}>{item.icon}</div>
                  <div>
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      <div className="text-[10px] text-slate-400 max-w-[150px] leading-tight">{item.description}</div>
                      {locked && <div className="text-[9px] text-red-500 font-bold mt-1">Требуется уровень {item.minLevel}</div>}
                  </div>
              </div>
              <button 
                onClick={action}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all relative z-0 ${buttonClass} ${purchasing ? 'opacity-50' : ''}`}
              >
                  {purchasing ? '...' : buttonText}
              </button>
          </div>
      );
  };

  const renderShopTab = () => {
      const consumables = SHOP_ITEMS.filter(i => i.type !== 'SKIN' && i.type !== 'GOD_MODE' && i.type !== 'UNFAIR' && i.type !== 'GAMBLE');
      const unfair = SHOP_ITEMS.filter(i => i.type === 'UNFAIR');
      const gamble = SHOP_ITEMS.filter(i => i.type === 'GAMBLE');
      const skins = SHOP_ITEMS.filter(i => i.type === 'SKIN');
      const godItems = SHOP_ITEMS.filter(i => i.type === 'GOD_MODE');

      return (
      <div className="flex flex-col h-full p-4 overflow-y-auto pb-[80px]">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-[#020617]/95 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 border-b border-slate-800/50 mb-4">
              <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 rounded-2xl border border-indigo-500/30 relative overflow-hidden flex justify-between items-center">
                  <div className="relative z-10">
                      <div className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Доступный Опыт</div>
                      <div className="text-2xl font-black text-white">{player.xp.toLocaleString()} XP</div>
                  </div>
                  <div className="text-4xl">🔮</div>
              </div>
          </div>
          
          <div className="space-y-6">
               {godItems.length > 0 && (
                  <div>
                      <h3 className="text-yellow-500 font-black uppercase text-xs mb-3 px-1 animate-pulse">👑 Легендарные Артефакты</h3>
                      <div className="grid gap-3">
                          {godItems.map(item => <ItemCard key={item.id} item={item} />)}
                      </div>
                  </div>
              )}
              
               {unfair.length > 0 && (
                  <div>
                      <h3 className="text-red-500 font-black uppercase text-xs mb-3 px-1">🎭 Грязные Приемы</h3>
                      <div className="grid gap-3">
                          {unfair.map(item => <ItemCard key={item.id} item={item} />)}
                      </div>
                  </div>
              )}
              
              {gamble.length > 0 && (
                  <div>
                      <h3 className="text-purple-500 font-black uppercase text-xs mb-3 px-1">📦 Риск</h3>
                      <div className="grid gap-3">
                          {gamble.map(item => <ItemCard key={item.id} item={item} />)}
                      </div>
                  </div>
              )}

              <div>
                  <h3 className="text-slate-500 font-bold uppercase text-xs mb-3 px-1">⚡ Усиления</h3>
                  <div className="grid gap-3">
                      {consumables.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
              </div>

              <div>
                  <h3 className="text-slate-500 font-bold uppercase text-xs mb-3 px-1">🎨 Стиль</h3>
                  <div className="grid gap-3">
                      {skins.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
              </div>
          </div>
      </div>
  )};

  const renderMultiplayerTab = () => {
    // ... (Existing multiplayer render logic, updated to use player.totalXp if desired, or keep as is)
    // To match the new state structure, just ensure player.level is accessed correctly, which it is.
    
    // Calculate display level for myself
    const myLevelTitle = player.activeBuffs?.shadow ? '???' : `Lvl ${player.level}`;

    return (
      <div className="flex flex-col h-full items-center justify-start p-4 pb-[80px] relative w-full overflow-hidden mt-2">
        <div className="w-full bg-slate-900 rounded-xl p-3 border border-slate-800 flex justify-between items-center mb-4 shrink-0">
             <div className="flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Ваш Баланс</span>
                <span className="text-xl font-bold text-white"><AnimatedBalance value={player.balance} /></span>
             </div>
             <div className="text-right">
                 <span className={`text-xs font-bold ${player.activeBuffs?.shadow ? 'text-slate-500' : 'text-yellow-500'}`}>{myLevelTitle}</span>
                 {player.activeBuffs?.shadow && <span className="ml-1">🥷</span>}
             </div>
        </div>

        {/* INVENTORY QUICK ACCESS FOR PVP */}
        {player.inventory.length > 0 && pvpMode !== 'GAME' && (
            <div className="w-full mb-4">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 px-1">Инвентарь (PvP)</div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
                    {player.inventory.map((inv, idx) => {
                        const itemDef = SHOP_ITEMS.find(i => i.id === inv.itemId);
                        if (!itemDef) return null;
                        
                        // Filter useful items for PvP
                        const isUseful = ['INSURANCE', 'HORSESHOE', 'XP_BOOST', 'CRITICAL', 'SHADOW', 'GOD_MODE', 'PVP_TRICK', 'MULTIPLIER', 'UNFAIR'].includes(itemDef.type);
                        if (!isUseful) return null;

                        let isActive = false;
                        if (inv.itemId === 'INSURANCE' && player.activeBuffs?.insurance) isActive = true;
                        if (inv.itemId === 'HORSESHOE' && player.activeBuffs?.horseshoe) isActive = true;
                        if (inv.itemId === 'XP_BOOST' && player.activeBuffs?.xpBoost) isActive = true;
                        if (inv.itemId === 'CRITICAL' && player.activeBuffs?.critical) isActive = true;
                        if (inv.itemId === 'SHADOW' && player.activeBuffs?.shadow) isActive = true;
                        if (inv.itemId === 'MAGNET' && player.activeBuffs?.magnet) isActive = true;
                        if (inv.itemId === 'ORACLE' && player.activeBuffs?.oracle) isActive = true;
                        if (inv.itemId === 'REVERSE' && player.activeBuffs?.reverse) isActive = true;
                        if (inv.itemId === 'SAFETY' && player.activeBuffs?.safety) isActive = true;
                        if (inv.itemId === 'VAMPIRISM' && player.activeBuffs?.vampirism) isActive = true;
                        if (inv.itemId === 'CHEATER' && player.activeBuffs?.cheater) isActive = true;
                        if (inv.itemId === 'PHOENIX' && player.activeBuffs?.phoenix) isActive = true;
                        if (inv.itemId === 'TITAN' && player.activeBuffs?.titan) isActive = true;
                        
                        return (
                            <button 
                            key={idx} 
                            onClick={() => handleUseItem(inv.itemId)}
                            disabled={isActive}
                            className={`relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${isActive ? 'bg-blue-900 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700 active:scale-95'}`}
                            >
                                <div className="text-2xl">{itemDef.icon}</div>
                                <div className="absolute -top-2 -right-2 bg-slate-950 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-slate-700">{inv.count}</div>
                            </button>
                        )
                    })}
                </div>
            </div>
        )}

        {pvpMode === 'MENU' && (
            <div className="w-full flex flex-col h-full overflow-hidden">
               <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-4 shrink-0">
                  <h3 className="text-lg font-bold text-white mb-2 text-center">Создать Игру</h3>
                  <div className="flex gap-2">
                     <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="bg-slate-950 w-full p-3 rounded-xl text-center font-bold text-white" placeholder="Ставка" />
                     <button onClick={handleCreateRoom} className="bg-blue-600 text-white px-6 rounded-xl font-bold whitespace-nowrap">СОЗДАТЬ</button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                   <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Активные Столы</h3>
                   {lobbyRooms.length === 0 ? (
                       <div className="text-center text-slate-600 mt-10 p-10 border-2 border-dashed border-slate-800 rounded-2xl">
                           Нет активных игр. <br/> Создай свою!
                       </div>
                   ) : (
                       <div className="space-y-3">
                           {lobbyRooms.map(room => (
                               <div key={room.id} className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${room.hostAvatar}`} className="w-10 h-10 rounded-full bg-slate-900" />
                                       <div>
                                           <div className="font-bold text-white text-sm">{room.hostName}</div>
                                           <div className="text-blue-400 font-mono text-xs">{room.betAmount} ₽ <span className="text-yellow-500 ml-1 text-[10px]">{room.hostLevel === -1 ? '???' : `Lvl ${room.hostLevel || 1}`}</span></div>
                                       </div>
                                   </div>
                                   {room.hostId !== player.id && (
                                       <button onClick={() => handleJoinRoom(room)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">ИГРАТЬ</button>
                                   )}
                                   {room.hostId === player.id && (
                                        <div className="text-xs text-yellow-500 font-bold px-3 py-1 bg-yellow-500/10 rounded-lg">Ваша игра</div>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}
               </div>
            </div>
        )}
        {pvpMode === 'LOBBY' && (
            <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="text-slate-400 mb-2 uppercase tracking-widest text-xs">Ожидание соперника...</div>
                <div className="flex items-center justify-center gap-6 mb-12 scale-90 sm:scale-100">
                    <div className="flex flex-col items-center relative">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeRoom?.hostAvatar}`} className="w-20 h-20 rounded-full border-4 border-blue-500 bg-slate-900 shadow-[0_0_30px_rgba(59,130,246,0.5)]"/>
                        <div className="mt-3 font-bold text-white">{activeRoom?.hostName}</div>
                        <div className="text-yellow-500 text-[10px] font-bold mt-1 bg-slate-800 px-2 rounded-full border border-slate-700">{activeRoom?.hostLevel === -1 ? '???' : `Lvl ${activeRoom?.hostLevel || 1}`}</div>
                    </div>
                    <div className="text-4xl font-black text-slate-700 italic">VS</div>
                    <div className="flex flex-col items-center relative">
                        {activeRoom?.guestId ? (
                            <>
                             <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeRoom.guestAvatar}`} className="w-20 h-20 rounded-full border-4 border-red-500 bg-slate-900 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pop-in"/>
                             <div className="mt-3 font-bold text-white">{activeRoom.guestName}</div>
                             <div className="text-yellow-500 text-[10px] font-bold mt-1 bg-slate-800 px-2 rounded-full border border-slate-700">{activeRoom?.guestLevel === -1 ? '???' : `Lvl ${activeRoom?.guestLevel || 1}`}</div>
                            </>
                        ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center animate-pulse bg-slate-900">
                                <span className="text-slate-500 font-bold text-2xl">?</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* HOST CONTROLS - ONLY SHOW IF GUEST IS PRESENT AND STATUS READY */}
                {activeRoom?.hostId === player.id && activeRoom?.guestId && (
                    <div className="animate-fade-in-up w-full max-w-xs">
                        <div className="text-center text-slate-400 text-xs mb-4">Выберите сторону, чтобы начать</div>
                        <div className="flex gap-3">
                            <button onClick={() => handleHostFlip(CoinSide.HEADS)} className="flex-1 bg-slate-800 border-2 border-slate-600 hover:border-blue-500 active:bg-blue-600 py-4 rounded-xl font-black text-white transition-all">ОРЁЛ</button>
                            <button onClick={() => handleHostFlip(CoinSide.TAILS)} className="flex-1 bg-slate-800 border-2 border-slate-600 hover:border-blue-500 active:bg-blue-600 py-4 rounded-xl font-black text-white transition-all">РЕШКА</button>
                        </div>
                    </div>
                )}
                {/* WAITING MESSAGE */}
                {activeRoom?.hostId === player.id && !activeRoom?.guestId && (
                    <div className="flex flex-col items-center">
                         <div className="text-yellow-500 font-bold animate-pulse mb-4">Ожидание игрока...</div>
                         <button onClick={handleCancelRoom} className="text-red-500 text-sm border border-red-900/50 px-4 py-2 rounded-lg hover:bg-red-900/20">Отменить игру</button>
                    </div>
                )}
            </div>
        )}
        {pvpMode === 'GAME' && (
             <div className="flex flex-col items-center justify-center relative w-full h-full">
                 
                 {/* SIDE INDICATOR TEXT FOR CLARITY */}
                 {activeRoom?.selectedSide && (
                     <div className="absolute top-4 left-0 right-0 flex flex-col items-center z-10">
                         {activeRoom.hostId === player.id ? (
                             <div className="bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full border border-blue-500/30 text-xs font-bold backdrop-blur-sm">
                                 Вы выбрали: <span className="text-white uppercase">{activeRoom.selectedSide === CoinSide.HEADS ? 'Орёл' : 'Решка'}</span>
                             </div>
                         ) : (
                             <div className="flex flex-col items-center gap-1">
                                 <div className="bg-slate-800/50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold">
                                     Хост выбрал: {activeRoom.selectedSide === CoinSide.HEADS ? 'Орёл' : 'Решка'}
                                 </div>
                                 <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded-full border border-red-500/30 text-xs font-bold backdrop-blur-sm animate-pulse">
                                     Вы играете за: <span className="text-white uppercase">{activeRoom.selectedSide === CoinSide.HEADS ? 'РЕШКУ' : 'ОРЛА'}</span>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}

                 <Coin 
                    flipping={isFlipping} 
                    result={activeRoom?.result || null} 
                    skinId={activeRoom?.hostId === player.id ? activeRoom?.hostSkin : activeRoom?.guestSkin}
                 />
                 {pvpResult && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-fade-in backdrop-blur-md">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none"></div>
                       {pvpResult === 'WIN' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent animate-pulse-glow pointer-events-none"></div>}
                       {pvpResult === 'WIN' && <Confetti />}

                       <div className="z-10 flex flex-col items-center animate-pop-in">
                           <div className={`text-6xl md:text-8xl font-black mb-6 tracking-tighter ${pvpResult === 'WIN' ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]' : 'text-slate-500'}`}>
                               {pvpResult === 'WIN' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
                           </div>
                           <div className={`text-5xl md:text-7xl font-mono font-black ${pvpResult === 'WIN' ? 'text-green-400 drop-shadow-lg' : 'text-red-500'}`}>
                               {pvpResult === 'WIN' ? `+ ${Math.floor((activeRoom?.betAmount || 0) * 1.9).toLocaleString()} ₽` : `- ${(activeRoom?.betAmount || 0).toLocaleString()} ₽`}
                           </div>
                           <div className="mt-4 text-yellow-500 font-bold">+{pvpResult === 'WIN' ? XP_PER_PVP_WIN : XP_PER_LOSS} XP</div>
                       </div>
                    </div>
                 )}
             </div>
        )}
      </div>
  )};

  const renderProfileTab = () => {
      // Correctly Identify Top 1
      const isTop1 = leaders.length > 0 && leaders[0].id === player.id;
      
      return (
    <div className="flex flex-col h-full p-4 overflow-y-auto pb-[80px]">
       <div className={`bg-slate-900 p-6 rounded-2xl border ${isTop1 ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-slate-800'} flex flex-col items-center mb-4 relative mt-2`}>
          <button onClick={() => setShowSettings(true)} className="absolute top-4 right-4 text-slate-400"><SettingsIcon/></button>
          <div className="relative">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${player.avatarSeed}`} className={`w-24 h-24 rounded-full bg-slate-800 border-4 ${isTop1 ? 'border-yellow-400' : 'border-blue-900'} mb-4`} />
              {isTop1 && <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce">👑</div>}
              <div className="absolute bottom-4 right-0 bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded border border-white">LVL {player.level}</div>
          </div>
          <h2 className={`text-2xl font-bold mb-1 ${isTop1 ? 'text-yellow-400' : 'text-white'}`}>{player.name}</h2>
          <div className={`text-sm font-bold text-slate-400 flex items-center gap-1 mb-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800`}>
               Уровень {player.level}
          </div>
          <div className="text-blue-400 font-mono text-xl">{player.balance.toLocaleString()} ₽</div>
          <div className="text-[10px] text-slate-600 mt-1">{player.totalXp?.toLocaleString()} Lifetime XP</div>
          {isAdmin && <div className="text-[10px] text-red-500 font-bold mt-1 tracking-widest bg-red-900/10 px-2 py-0.5 rounded border border-red-900/50">ADMIN USER</div>}
       </div>

       <div className="grid grid-cols-2 gap-3 mb-4">
           <button onClick={() => setShowHistoryModal(true)} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center hover:bg-slate-800 active:scale-95 transition-transform">
               <HistoryIcon />
               <span className="text-xs font-bold mt-2 text-slate-400">История Игр</span>
           </button>
           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
               <span className="text-xl font-black text-white">{player.stats.totalWins}</span>
               <span className="text-xs font-bold mt-1 text-slate-500">Побед</span>
           </div>
       </div>

       {/* RESET PROFILE BUTTON */}
       <button 
            onClick={() => setShowConfirmReset(true)}
            className="w-full bg-slate-800 border border-red-500/20 text-red-400 py-3 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 hover:bg-red-900/10"
       >
           ⚠️ Сбросить Прогресс
       </button>
       
       {/* ADMIN BUTTON */}
       {isAdmin && (
           <button 
             onClick={() => setShowAdminModal(true)}
             className="w-full bg-red-900/10 border border-red-500/30 text-red-500 py-3 rounded-xl font-bold mb-4 flex items-center justify-center gap-2"
           >
              <span>☣️</span> ОТКРЫТЬ ADMIN PANEL
           </button>
       )}
       
       <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-3 pl-2">Достижения</h3>
       <div className="space-y-2">
          {ACHIEVEMENTS_LIST.map(ach => {
              const unlocked = player.achievements.includes(ach.id);
              return (
                  <div key={ach.id} className={`p-3 rounded-xl border flex gap-3 ${unlocked ? 'bg-slate-900 border-yellow-500/30' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}>
                      <div className="text-2xl">{ach.icon}</div>
                      <div className="w-full">
                          <div className="flex justify-between items-start">
                              <div className="text-white font-bold text-sm">{ach.title}</div>
                              {ach.reward && unlocked && <div className="text-[9px] text-green-400 font-mono">Completed</div>}
                              {ach.reward && !unlocked && <div className="text-[9px] text-slate-500">+{ach.reward.money}₽ / +{ach.reward.xp}XP</div>}
                          </div>
                          <div className="text-slate-500 text-xs">{ach.description}</div>
                      </div>
                  </div>
              )
          })}
       </div>
    </div>
  )};

  const renderHistoryModal = () => {
    if (!showHistoryModal) return null;
    const historyList = Array.isArray(player.history) ? player.history : [];
    return (
        <div className="fixed inset-0 z-[70] bg-[#020617] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0">
                <h2 className="text-xl font-bold text-white">История Игр</h2>
                <button 
                    onClick={() => setShowHistoryModal(false)} 
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold active:bg-slate-700"
                >
                    Закрыть
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar">
               {historyList.length === 0 ? (
                   <div className="text-center text-slate-500 mt-20">История пуста</div>
               ) : (
                   <div className="space-y-3">
                       {historyList.map((game, idx) => (
                           <div key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                   <div className={`w-2 h-10 rounded-full ${game.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                   <div>
                                       <div className="text-white font-bold text-sm">
                                           {game.type === 'SOLO' ? 'Одиночная' : 'PvP Дуэль'}
                                       </div>
                                       <div className="text-slate-500 text-[10px]">
                                           {new Date(game.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                           {game.opponentName && ` • vs ${game.opponentName}`}
                                       </div>
                                   </div>
                               </div>
                               <div className={`font-mono font-bold ${game.result === 'WIN' ? 'text-green-400' : 'text-red-500'}`}>
                                   {game.result === 'WIN' ? '+' : '-'}{game.amount.toLocaleString()} ₽
                               </div>
                           </div>
                       ))}
                   </div>
               )}
            </div>
        </div>
    );
  };

  const renderLeaderTab = () => (
    <div className="flex flex-col h-full p-4 overflow-y-auto pb-[80px]">
       <h2 className="text-2xl font-gzhel text-white mb-6 mt-2">Топ Игроков</h2>
       {leaders.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
               <div className="text-4xl mb-2">🏆</div>
               <div>Список пуст</div>
           </div>
       ) : (
           <div className="space-y-3">
              {leaders.map((leader, idx) => (
                 <div key={idx} className={`flex items-center p-3 rounded-xl border relative ${idx === 0 ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-slate-900 border-slate-800'}`}>
                    <div className={`w-8 h-8 flex items-center justify-center font-black rounded-full mr-3 ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</div>
                    
                    <div className="relative mr-3">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${leader.avatar}`} className={`w-10 h-10 rounded-full bg-slate-800 border ${idx === 0 ? 'border-yellow-400' : 'border-slate-700'}`} />
                        {idx === 0 && <div className="absolute -top-3 -right-2 text-xl animate-bounce">👑</div>}
                    </div>

                    <div className="flex-1">
                        <div className={`font-bold text-white ${idx === 0 ? 'text-yellow-400' : ''}`}>{leader.name}</div>
                        <div className="text-[10px] text-yellow-500/80 font-bold bg-slate-950 px-2 py-0.5 rounded w-fit mt-1 border border-slate-800">Lvl {leader.level || 1}</div>
                    </div>
                    <div className="font-mono text-blue-400">{leader.balance.toLocaleString()} ₽</div>
                 </div>
              ))}
           </div>
       )}
    </div>
  );

  const renderChatTab = () => {
    // Identify Top 1 Player
    const topLeaderId = leaders.length > 0 ? leaders[0].id : null;

    return (
    <div className="flex flex-col h-full pb-[60px]">
       <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar mt-2">
          {chatMessages.map((msg) => {
               const isTop1 = topLeaderId && msg.senderId === topLeaderId;
               return (
               <div key={msg.id} className={`flex ${msg.sender === player.name ? 'justify-end' : 'justify-start'}`}>
                 <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.sender === player.name ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'} ${isTop1 ? 'border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : ''}`}>
                   <div className="font-bold text-[10px] opacity-70 mb-1 flex items-center gap-1">
                       {isTop1 && <span className="text-sm">👑</span>}
                       <span className={isTop1 ? 'text-yellow-300' : ''}>{msg.sender}</span>
                       <span className={`bg-black/20 px-1 rounded text-yellow-500`}>Lvl {msg.senderLevel || 1}</span>
                   </div>
                   {msg.text}
                 </div>
               </div>
          )})}
          <div ref={chatEndRef} />
       </div>
       <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
           <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-950 p-3 rounded-xl text-white" placeholder="Сообщение..." />
           <button onClick={() => { if(chatInput) { firebaseService.sendMessage(player, chatInput); setChatInput(''); } }} className="bg-blue-600 text-white p-3 rounded-xl">→</button>
       </div>
    </div>
  )};

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#020617]" onClick={handleGlobalClick}>
      {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
          <>
            <GlobalTicker />
            <AchievementToast achievement={activeAchievement} visible={showAchievement} />
            {activeQuestToast && <QuestToast text={activeQuestToast.text} rewardMoney={activeQuestToast.reward} visible={!!activeQuestToast} />}
            {showHistoryModal && renderHistoryModal()}
            {showLevelModal && <LevelInfoModal level={player.level} xp={player.xp} totalXp={player.totalXp || player.xp} onClose={() => setShowLevelModal(false)} />}
            {showAdminModal && renderAdminModal()}
            
            {/* LEVEL UP MODAL */}
            {levelUpData && (
                <LevelUpModal 
                   level={levelUpData.level} 
                   reward={levelUpData.reward} 
                   onClose={() => setLevelUpData(null)} 
                />
            )}
            
            {showConfirmReset && (
                <ConfirmModal 
                    title="Сброс Прогресса"
                    message="Вы действительно хотите удалить весь прогресс? Это действие нельзя отменить. Вы потеряете уровень, инвентарь и баланс."
                    onConfirm={handleSelfReset}
                    onCancel={() => setShowConfirmReset(false)}
                />
            )}
            
            {/* ADMIN CONFIRMATION MODALS */}
            {showConfirmClearChat && (
                <ConfirmModal 
                    title="Очистка Чата"
                    message="Вы уверены, что хотите удалить все сообщения чата? Это действие нельзя отменить."
                    onConfirm={executeClearChat}
                    onCancel={() => setShowConfirmClearChat(false)}
                />
            )}

            {showConfirmGlobalReset && (
                <ConfirmModal 
                    title="⚠️ ГЛОБАЛЬНЫЙ СБРОС"
                    message="ВНИМАНИЕ! Это действие полностью удалит ВСЕ данные игры (пользователей, комнаты, историю). Игру придется начинать с нуля. Вы абсолютно уверены?"
                    onConfirm={executeGlobalReset}
                    onCancel={() => setShowConfirmGlobalReset(false)}
                />
            )}
            
            {purchaseNotifs.map(n => <PurchaseNotification key={n.id} text={n.text} />)}

            {showLoginBonus && (
                <LoginBonusModal 
                   streak={showLoginBonus.streak} 
                   reward={showLoginBonus.reward} 
                   onClaim={claimDailyLogin} 
                />
            )}

            {showSettings && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-6">
                        <h2 className="text-white font-bold text-xl mb-4">Настройки</h2>
                        <div className="flex justify-between text-white mb-6">
                            <span>Звук</span>
                            <button onClick={() => setSoundEnabled(!soundEnabled)} className="font-bold text-blue-400">{soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button>
                        </div>
                        <div className="mb-6">
                           <button onClick={() => soundManager.play('WIN')} className="text-xs bg-slate-800 text-blue-400 px-3 py-2 rounded-lg border border-slate-700 hover:border-blue-500 w-full">🔊 Тест звука</button>
                        </div>
                        <button onClick={() => setShowSettings(false)} className="w-full bg-slate-800 text-white p-3 rounded-xl">Закрыть</button>
                    </div>
                </div>
            )}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === Tab.GAME && renderGameTab()}
              {activeTab === Tab.MULTIPLAYER && renderMultiplayerTab()}
              {activeTab === Tab.SHOP && renderShopTab()}
              {activeTab === Tab.LEADERS && renderLeaderTab()}
              {activeTab === Tab.CHAT && renderChatTab()}
              {activeTab === Tab.PROFILE && renderProfileTab()}
            </div>
            <div className="h-[70px] bg-slate-900 border-t border-slate-800 flex justify-between items-center shrink-0 px-2 pb-safe">
                <button onClick={() => setActiveTab(Tab.GAME)} className={`flex flex-col items-center flex-1 ${activeTab===Tab.GAME ? 'text-blue-500':'text-slate-600'}`}><GameIcon active={activeTab===Tab.GAME}/><span className="text-[9px] font-bold mt-1">ИГРА</span></button>
                <button onClick={() => setActiveTab(Tab.MULTIPLAYER)} className={`flex flex-col items-center flex-1 ${activeTab===Tab.MULTIPLAYER ? 'text-blue-500':'text-slate-600'}`}><MultiIcon active={activeTab===Tab.MULTIPLAYER}/><span className="text-[9px] font-bold mt-1">PvP</span></button>
                <button onClick={() => setActiveTab(Tab.SHOP)} className={`flex flex-col items-center flex-1 ${activeTab===Tab.SHOP ? 'text-blue-500':'text-slate-600'}`}><ShopIcon active={activeTab===Tab.SHOP}/><span className="text-[9px] font-bold mt-1">МАГАЗИН</span></button>
                <button onClick={() => setActiveTab(Tab.LEADERS)} className={`flex flex-col items-center flex-1 ${activeTab===Tab.LEADERS ? 'text-blue-500':'text-slate-600'}`}><LeaderIcon active={activeTab===Tab.LEADERS}/><span className="text-[9px] font-bold mt-1">ТОП</span></button>
                <button onClick={() => setActiveTab(Tab.CHAT)} className={`flex flex-col items-center flex-1 ${activeTab===Tab.CHAT ? 'text-blue-500':'text-slate-600'}`}><ChatIcon active={activeTab===Tab.CHAT}/><span className="text-[9px] font-bold mt-1">ЧАТ</span></button>
                <button onClick={() => setActiveTab(Tab.PROFILE)} className={`flex flex-col items-center flex-1 ${activeTab===Tab.PROFILE ? 'text-blue-500':'text-slate-600'}`}><ProfileIcon active={activeTab===Tab.PROFILE}/><span className="text-[9px] font-bold mt-1">Я</span></button>
            </div>
          </>
      )}
    </div>
  );
};

export default App;
