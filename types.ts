

export enum Tab {
  GAME = 'GAME',
  MULTIPLAYER = 'MULTIPLAYER',
  LEADERS = 'LEADERS',
  CHAT = 'CHAT',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN' 
}

export enum CoinSide {
  HEADS = 'HEADS', 
  TAILS = 'TAILS'  
}

export interface PlayerStats {
  totalWins: number;
  totalGames: number;
  currentWinStreak: number;
  maxWinStreak: number;
  maxBet: number;
  bonusStreak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; 
  condition: (player: Player) => boolean;
  reward: {
    money: number;
    xp: number;
  };
}

export interface GameHistoryItem {
  id: string;
  type: 'SOLO' | 'PVP_WIN' | 'PVP_LOSS';
  amount: number; // For solo: profit/loss. For PvP: net change.
  result: 'WIN' | 'LOSS';
  timestamp: number;
  opponentName?: string;
}

export interface PublicGameLog {
  id: string;
  playerId?: string; // To identify leader
  playerName: string;
  playerAvatar: string;
  playerLevel: number;
  amount: number;
  type: 'SOLO' | 'PVP';
  result: 'WIN' | 'LOSS';
  timestamp: number;
}

export type ItemType = 'HINT' | 'INSURANCE' | 'MULTIPLIER' | 'PVP_TRICK' | 'SKIN' | 'XP_BOOST' | 'CRITICAL' | 'GOD_MODE' | 'UNFAIR' | 'GAMBLE';

export type SkinId = 'DEFAULT' | 'GOLD' | 'NEON';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number; // Price in XP
  icon: string;
  type: ItemType;
  maxStack?: number; // 1 for skins
  minLevel: number;
  skinId?: SkinId; // Only for type SKIN
}

export interface InventoryItem {
  itemId: string;
  count: number;
}

export interface Quest {
  id: string;
  progress: number;
  target: number;
  completed: boolean;
  lastUpdated: number; // timestamp
  rewardMoney?: number;
}

export interface ActiveBuffs {
  insurance: boolean;
  horseshoe: boolean;
  whisperResult?: CoinSide | null;
  xpBoost: boolean; // Double XP
  critical: boolean; // Chance for 5x win
  shadow: boolean; // Hide stats in PvP
  magnet: boolean; // 90% Win chance (Solo) or 4x Multiplier (PvP)
  oracle: boolean; // See result (Solo) or XP Refund (PvP)
  reverse: boolean; // 100% Refund on Loss
  
  // New Unfair Items
  cheater: boolean; // 60% Win Chance
  safety: boolean; // Keep streak on loss
  vampirism: boolean; // PvP: +10% extra profit
  
  // Ultra High Tier
  phoenix: boolean; // 33% Chance to resurrect
  titan: boolean; // x3.5 PvP Multiplier
  godsEye?: boolean; // See opponent choice
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  xp: number; // Spendable Currency
  totalXp?: number; // Lifetime Progress (For Leveling)
  level: number;
  avatarSeed: string;
  lastBonusClaim?: number; 
  personality?: string;
  isAi?: boolean;
  stats: PlayerStats;
  achievements: string[]; 
  history: GameHistoryItem[];
  inventory: InventoryItem[];
  quests: Quest[];
  // Transient state
  activeBuffs?: ActiveBuffs;
  // Visuals
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  // Retention
  loginStreak: number;
  lastLoginDate: number; // Timestamp of last daily login claim
  
  // Admin
  isAdminGod?: boolean; // 100% Win Rate toggle
}

export interface Transaction {
  id: string;
  type: 'WIN' | 'LOSS' | 'BONUS' | 'PVP_WIN' | 'PVP_LOSS';
  amount: number;
  timestamp: number;
  details?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string; // To identify Top 1
  senderLevel?: number;
  text: string;
  isSystem?: boolean;
  avatar?: string;
  timestamp?: number;
}

export interface Leader {
  id: string;
  name: string;
  balance: number;
  avatar: string;
  level?: number;
  xp?: number;
}

// --- Online Room Types ---
export interface PvpRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostLevel?: number; // If -1, it's hidden (Shadow buff)
  hostSkin?: SkinId; 
  hostBuffs?: ActiveBuffs; // Stored to calculate win chance
  hostIsGod?: boolean; // God Mode Sync
  betAmount: number;
  status: 'WAITING' | 'READY' | 'FLIPPING' | 'FINISHED';
  selectedSide?: CoinSide; // Side selected by HOST
  result?: CoinSide;
  winnerId?: string;
  createdAt: number;
  guestId?: string;
  guestName?: string;
  guestAvatar?: string;
  guestLevel?: number; // If -1, hidden
  guestSkin?: SkinId; 
  guestBuffs?: ActiveBuffs; // Stored to calculate win chance
  guestIsGod?: boolean; // God Mode Sync
}

// Telegram WebApp Types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        version: string;
        isVersionAtLeast: (ver: string) => boolean;
        isVerticalSwipesEnabled?: boolean;
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        initData: string;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}