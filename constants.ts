
import { Player, ShopItem, Quest, Achievement } from './types';

// --- CONFIGURATION ---
export const ADMIN_TELEGRAM_ID = 1440424474; 

// --- FIREBASE CONFIGURATION ---
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD33Zy5U1ooJ46NAQCYmdlfHRcV9gi64kc",
  authDomain: "gzhelcoin-online.firebaseapp.com",
  databaseURL: "https://gzhelcoin-online-default-rtdb.firebaseio.com",
  projectId: "gzhelcoin-online",
  storageBucket: "gzhelcoin-online.firebasestorage.app",
  messagingSenderId: "906548989366",
  appId: "1:906548989366:web:a599e5edbe3aea720fc517",
  measurementId: "G-W96FR9XZQS"
};

export const INITIAL_BALANCE = 1000;
export const WIN_COEFFICIENT = 1.9; 
export const MIN_BET = 10;
export const BASE_WIN_CHANCE = 0.50; // 50% Win Chance (Fair)

// --- BONUS CONFIG ---
export const HOURLY_BONUS_AMOUNT = 100;
export const HOURLY_BONUS_COOLDOWN_MS = 60 * 60 * 1000; // 1 Hour

export const ANIMATION_DURATION_MS = 2500; 

// --- ECONOMY 2.0 (UPDATED XP) ---
// Fixed XP Rewards to prevent inflation
export const XP_FIXED_WIN = 150;
export const XP_FIXED_LOSS = 50;
export const XP_PVP_BONUS_FLAT = 50; // Flat bonus for playing PvP
export const MAX_XP_PER_GAME = 50000; // Safety cap per single game (mostly for Oracle buff)

// Progressive Leveling System (Extended to 50) - SUPER ACCESSIBLE VERSION
// Level 50 = 1,000,000 XP
export const LEVEL_THRESHOLDS = [
  0,        // Lvl 1
  100,      // Lvl 2
  500,      // Lvl 3
  1500,     // Lvl 4
  3000,     // Lvl 5
  5000,     // Lvl 6
  8000,     // Lvl 7
  12000,    // Lvl 8
  18000,    // Lvl 9
  25000,    // Lvl 10 (Master)
  35000,    // Lvl 11
  45000,    // Lvl 12
  60000,    // Lvl 13
  80000,    // Lvl 14
  100000,   // Lvl 15
  125000,   // Lvl 16
  150000,   // Lvl 17
  180000,   // Lvl 18
  210000,   // Lvl 19
  250000,   // Lvl 20 (Silver)
  290000,   // Lvl 21
  330000,   // Lvl 22
  380000,   // Lvl 23
  430000,   // Lvl 24
  480000,   // Lvl 25
  540000,   // Lvl 26
  600000,   // Lvl 27
  660000,   // Lvl 28
  720000,   // Lvl 29
  780000,   // Lvl 30 (Gold)
  840000,   // Lvl 31
  900000,   // Lvl 32
  960000,   // Lvl 33
  970000,   // Lvl 34
  980000,   // Lvl 35
  990000,   // Lvl 36
  995000,   // Lvl 37
  1000000,  // Lvl 38
  1005000,  // Lvl 39
  1010000,  // Lvl 40 (Titan)
  1015000,  // Lvl 41
  1020000,  // Lvl 42
  1025000,  // Lvl 43
  1030000,  // Lvl 44
  1035000,  // Lvl 45
  1040000,  // Lvl 46
  1045000,  // Lvl 47
  1050000,  // Lvl 48
  1055000,  // Lvl 49
  1060000   // Lvl 50 (MAX) - Around 1M XP Base
];

export const MAX_LEVEL = 50;

export const DAILY_LOGIN_REWARDS = [
  { day: 1, money: 100, xp: 50 },
  { day: 2, money: 200, xp: 100 },
  { day: 3, money: 500, xp: 150 },
  { day: 4, money: 800, xp: 200 },
  { day: 5, money: 1200, xp: 300 },
  { day: 6, money: 2000, xp: 400 },
  { day: 7, money: 5000, xp: 1000 } // Big jackpot
];

export const SHOP_ITEMS: ShopItem[] = [
  // --- CONSUMABLES (CHEAPER) ---
  {
    id: 'XP_BOOST',
    name: 'Мудрость Старца',
    description: 'Удваивает опыт (XP) за следующую игру.',
    price: 150, 
    icon: '📜',
    type: 'XP_BOOST',
    minLevel: 1
  },
  {
    id: 'WHISPER',
    name: 'Шепот Ангела',
    description: 'Дает подсказку о следующем броске (Шанс 80%).',
    price: 300,
    icon: '👼',
    type: 'HINT',
    minLevel: 2
  },
  {
    id: 'INSURANCE',
    name: 'Страховка',
    description: 'PvP: Вернет 50% ставки при проигрыше.',
    price: 800,
    icon: '🛡️',
    type: 'INSURANCE',
    minLevel: 3
  },
  {
    id: 'CRITICAL',
    name: 'Клевер Удачи',
    description: 'PvP: Шанс 10% выиграть x5 вместо x2.',
    price: 1500,
    icon: '🍀',
    type: 'CRITICAL',
    minLevel: 4
  },
  {
    id: 'SHADOW',
    name: 'Плащ Тени',
    description: 'PvP: Скрывает Ник, Аватар, Уровень и Баланс.',
    price: 2500,
    icon: '🥷',
    type: 'PVP_TRICK',
    minLevel: 5
  },
  {
    id: 'HORSESHOE',
    name: 'Золотая Подкова',
    description: 'PvP: Увеличивает выигрыш до x2.8.',
    price: 4000,
    icon: '🐴',
    type: 'MULTIPLIER',
    minLevel: 6
  },
  
  // --- UNFAIR (Mid-Tier) ---
  {
    id: 'SAFETY',
    name: 'Амулет Сохранения',
    description: 'Ваш стрик побед не сбрасывается при проигрыше.',
    price: 6000,
    icon: '🛡️',
    type: 'UNFAIR',
    minLevel: 8
  },
  {
    id: 'CHEATER',
    name: 'Шулерские Кости',
    description: 'Solo: Шанс 60%. PvP: Повышает шанс победы на +10%.',
    price: 10000,
    icon: '🎲',
    type: 'UNFAIR',
    minLevel: 10
  },
  {
    id: 'VAMPIRISM',
    name: 'Вампиризм',
    description: 'PvP: При победе вы получаете +10% от ставки сверху.',
    price: 15000,
    icon: '🧛',
    type: 'UNFAIR',
    minLevel: 12
  },
  {
    id: 'PANDORA',
    name: 'Сундук Пандоры',
    description: '50% Шанс получить 50,000 XP или потерять 25,000 XP.',
    price: 2000, 
    icon: '📦',
    type: 'GAMBLE',
    minLevel: 5
  },

  // --- GOD TIER ITEMS (Rebalanced High Prices) ---
  // Reduced to make them accessible but still require levels
  {
    id: 'MAGNET',
    name: 'Магнит Победы',
    description: 'Solo: Шанс 90%. PvP: Повышает шанс победы на +30%.',
    price: 25000,
    icon: '🧲',
    type: 'GOD_MODE',
    minLevel: 15
  },
  {
    id: 'ORACLE',
    name: 'Глаз Оракула',
    description: 'Solo: Точный прогноз. PvP: Повышает шанс победы на +45%.',
    price: 50000,
    icon: '🔮',
    type: 'GOD_MODE',
    minLevel: 25
  },
  {
    id: 'REVERSE',
    name: 'Реверс Времени',
    description: 'Solo/PvP: 100% возврат денег при проигрыше.',
    price: 30000, 
    icon: '↩️',
    type: 'GOD_MODE',
    minLevel: 30
  },
  
  // --- ULTRA HIGH TIER ---
  {
    id: 'PHOENIX',
    name: 'Феникс',
    description: 'PvP/Solo: 33% шанс воскреснуть после проигрыша (Возврат ставки).',
    price: 10000, 
    icon: '🔥',
    type: 'GOD_MODE',
    minLevel: 35
  },
  {
    id: 'TITAN',
    name: 'Титан',
    description: 'PvP: Если выигрываете, множитель становится x3.5.',
    price: 75000,
    icon: '⚡',
    type: 'GOD_MODE',
    minLevel: 40
  },
  {
    id: 'GODS_EYE',
    name: 'Глаз Бога',
    description: 'PvP: Вы видите выбор соперника до броска.',
    price: 150000,
    icon: '🧿',
    type: 'GOD_MODE',
    minLevel: 50
  },

  // --- SKINS ---
  {
    id: 'SKIN_GOLD',
    name: 'Монета Олигарха',
    description: 'Тяжелый золотой блеск. Показывает статус.',
    price: 5000,
    icon: '🪙',
    type: 'SKIN',
    minLevel: 7,
    skinId: 'GOLD'
  },
  {
    id: 'SKIN_NEON',
    name: 'Кибер-Рубль',
    description: 'Светится в темноте. Для ночных игроков.',
    price: 10000,
    icon: '🔮',
    type: 'SKIN',
    minLevel: 10,
    skinId: 'NEON'
  }
];

export const DAILY_QUEST_TEMPLATES = [
  { id: 'WIN_3', title: 'Победить 3 раза', target: 3, rewardXp: 200, rewardMoney: 150 },
  { id: 'PLAY_10', title: 'Сыграть 10 игр', target: 10, rewardXp: 300, rewardMoney: 250 },
  { id: 'WIN_PVP', title: 'Выиграть в PvP', target: 1, rewardXp: 500, rewardMoney: 500 },
  { id: 'BET_TOTAL', title: 'Поставить 5000₽ (сумма)', target: 5000, rewardXp: 400, rewardMoney: 300 },
  // New Quests
  { id: 'LOSE_3', title: 'Проиграть 3 раза (Не сдавайся!)', target: 3, rewardXp: 150, rewardMoney: 100 },
  { id: 'WIN_STREAK_3', title: 'Серия побед: 3', target: 3, rewardXp: 400, rewardMoney: 300 },
  { id: 'PLAY_PVP_5', title: 'Сыграть 5 PvP дуэлей', target: 5, rewardXp: 600, rewardMoney: 400 },
  { id: 'BIG_BET', title: 'Сделать ставку 1000₽+', target: 1, rewardXp: 300, rewardMoney: 200 }
];

export const QUEST_INFO_TEXT = `
📝 Ежедневные Задания:

• Задания обновляются каждые 24 часа.
• За выполнение вы получаете Опыт (XP) и Деньги (₽).
• Прогресс сохраняется автоматически.
`;

// --- SOUNDS (BASE64 EMBEDDED) ---
export const SOUNDS = {
  CLICK: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMmAMEAAAAAAAVQbAABAA///uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAP8AAA0gAAAAElAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
  COIN_LAND: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMmAMEAAAAAAAVQbAABAA///uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAOYAAA0gAAAAExAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAP8AAA0gAAAAElAAABAAAAAAAAAAABKiAAABAAAAAAAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
  WIN: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a',
  LOSE: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-button.m4a',
  ERROR: 'https://commondatastorage.googleapis.com/codeskulptor-assets/sounddogs/missile.mp3',
  MATCH_FOUND: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a',
  LOADING: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3',
  BUY: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a',
  // Direct Link to reliable audio
  INTRO: 'https://od.lk/d/MTVfNzk0NTY1NDBf/melstroi-pam-pam-pam.mp3'
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'FIRST_WIN',
    title: 'Новичок',
    description: 'Выиграйте свою первую игру',
    icon: '🥉',
    condition: (p: Player) => (p?.stats?.totalWins || 0) >= 1,
    reward: { money: 100, xp: 50 }
  },
  {
    id: 'STREAK_5',
    title: 'Везунчик',
    description: 'Выиграйте 5 раз подряд',
    icon: '🔥',
    condition: (p: Player) => (p?.stats?.maxWinStreak || 0) >= 5,
    reward: { money: 500, xp: 200 }
  },
  {
    id: 'HIGH_ROLLER',
    title: 'Хайроллер',
    description: 'Сделайте ставку 10,000 ₽',
    icon: '💎',
    condition: (p: Player) => (p?.stats?.maxBet || 0) >= 10000,
    reward: { money: 1000, xp: 500 }
  },
  {
    id: 'RICH',
    title: 'Олигарх',
    description: 'Наберите 1,000,000 ₽ на балансе',
    icon: '👑',
    condition: (p: Player) => (p?.balance || 0) >= 1000000,
    reward: { money: 10000, xp: 5000 }
  },
  {
    id: 'EXPERIENCED',
    title: 'Бывалый',
    description: 'Сыграйте 50 игр',
    icon: '🎲',
    condition: (p: Player) => (p?.stats?.totalGames || 0) >= 50,
    reward: { money: 300, xp: 300 }
  },
  {
    id: 'VETERAN',
    title: 'Ветеран',
    description: 'Сыграйте 500 игр',
    icon: '🎖️',
    condition: (p: Player) => (p?.stats?.totalGames || 0) >= 500,
    reward: { money: 2500, xp: 2000 }
  },
  {
    id: 'SNIPER',
    title: 'Снайпер',
    description: 'Выиграйте 10 раз подряд',
    icon: '🎯',
    condition: (p: Player) => (p?.stats?.maxWinStreak || 0) >= 10,
    reward: { money: 5000, xp: 2000 }
  },
  {
    id: 'SOCIAL',
    title: 'Светская Львица',
    description: 'Используйте чат',
    icon: '💬',
    condition: (p: Player) => true, // Manual claim via specific chat action? Or simplistic check
    reward: { money: 100, xp: 50 }
  },
  {
    id: 'WHALE',
    title: 'Кит',
    description: 'Иметь баланс 10 млн ₽',
    icon: '🐳',
    condition: (p: Player) => (p?.balance || 0) >= 10000000,
    reward: { money: 50000, xp: 25000 }
  },
  {
    id: 'LOYAL',
    title: 'Верность',
    description: 'Забрать бонус 3 раза',
    icon: '🤝',
    condition: (p: Player) => (p?.stats?.bonusStreak || 0) >= 3,
    reward: { money: 200, xp: 100 }
  },
  {
    id: 'PVP_WARRIOR',
    title: 'Гладиатор',
    description: 'Выиграйте 10 PvP дуэлей',
    icon: '⚔️',
    condition: (p: Player) => {
      const pvpWins = p?.history?.filter(h => h?.type === 'PVP_WIN').length || 0;
      return pvpWins >= 10;
    },
    reward: { money: 2000, xp: 1000 }
  },
  {
    id: 'LEVEL_10',
    title: 'Мастер',
    description: 'Достигните 10 уровня',
    icon: '⭐',
    condition: (p: Player) => (p?.level || 1) >= 10,
    reward: { money: 1000, xp: 500 }
  },
  {
    id: 'LEVEL_MAX',
    title: 'MAX LEVEL',
    description: 'Достигните 50 уровня (Легенда)',
    icon: '🌟',
    condition: (p: Player) => (p?.level || 1) >= 50,
    reward: { money: 1000000, xp: 500000 }
  },
  {
    id: 'COLLECTOR',
    title: 'Коллекционер',
    description: 'Купите скин',
    icon: '🎨',
    condition: (p: Player) => (p.unlockedSkins.length > 1),
    reward: { money: 500, xp: 200 }
  },
  {
    id: 'GOD_MODE',
    title: 'Божество',
    description: 'Станьте Админом (Шутка)',
    icon: '⚡',
    condition: (p: Player) => (p?.isAdminGod || false),
    reward: { money: 1337, xp: 1337 }
  },
  {
    id: 'TOLMAS_RICHER',
    title: 'Богаче Толмаса',
    description: 'Накопить 50,000 ₽',
    icon: '💰',
    condition: (p: Player) => (p?.balance || 0) >= 50000,
    reward: { money: 10000, xp: 5000 }
  }
];
