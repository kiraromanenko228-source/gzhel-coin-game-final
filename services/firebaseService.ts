

import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  update, 
  query,
  orderByChild,
  limitToLast,
  remove,
  get
} from 'firebase/database';
import { FIREBASE_CONFIG } from '../constants';
import { PvpRoom, Player, CoinSide, Leader, PublicGameLog } from '../types';

class FirebaseService {
  private db: any = null;
  private isInitialized = false;

  constructor() {
    if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL) {
      try {
        const app = initializeApp(FIREBASE_CONFIG);
        this.db = getDatabase(app);
        this.isInitialized = true;
      } catch (e) {
        console.error("Firebase init error", e);
      }
    }
  }

  get isOnline() {
    return this.isInitialized;
  }

  // --- GAME LOGS (GLOBAL TICKER) ---
  logGameResult(log: Omit<PublicGameLog, 'id'> & { playerId?: string }) {
      if (!this.db) return;
      const logsRef = ref(this.db, 'game_logs');
      const newLogRef = push(logsRef);
      set(newLogRef, {
          ...log,
          timestamp: Date.now()
      });
  }

  subscribeToGameLogs(callback: (logs: PublicGameLog[]) => void) {
      if (!this.db) return () => {};
      const logsRef = ref(this.db, 'game_logs');
      const logsQuery = query(logsRef, limitToLast(10));
      
      return onValue(logsQuery, (snapshot) => {
          const data = snapshot.val();
          if (!data) {
              callback([]);
              return;
          }
          const logs: PublicGameLog[] = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
          }));
          logs.sort((a, b) => b.timestamp - a.timestamp);
          callback(logs);
      });
  }

  // --- ADMIN TOOLS ---
  async resetGlobalState() {
    if (!this.db) return;
    try {
      await set(ref(this.db, 'users'), null);
      await set(ref(this.db, 'rooms'), null);
      await set(ref(this.db, 'chat'), null);
      await set(ref(this.db, 'game_logs'), null);
      await set(ref(this.db, 'system/resetTimestamp'), Date.now());
      console.log("Global State Reset Complete");
    } catch (e) {
      console.error("Reset failed", e);
    }
  }

  async clearChat() {
      if (!this.db) return;
      await set(ref(this.db, 'chat'), null);
  }

  async adminUpdateUser(targetId: string, updates: Partial<Player>) {
      if (!this.db) return;
      const userRef = ref(this.db, `users/${targetId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
          const current = snap.val();
          const newData = { ...current, ...updates };
          await update(userRef, newData);
      } else {
          console.warn("Admin: User not found", targetId);
      }
  }
  
  async getAdmins(): Promise<string[]> {
      if (!this.db) return [];
      const refAdmins = ref(this.db, 'system/admins');
      const snap = await get(refAdmins);
      if (snap.exists()) {
          return Object.values(snap.val());
      }
      return [];
  }
  
  // Real-time listener for admins
  subscribeToAdmins(callback: (admins: string[]) => void) {
      if (!this.db) return () => {};
      const refAdmins = ref(this.db, 'system/admins');
      return onValue(refAdmins, (snapshot) => {
          if (snapshot.exists()) {
              callback(Object.values(snapshot.val()));
          } else {
              callback([]);
          }
      });
  }
  
  async addAdmin(id: string) {
      if (!this.db) return;
      const refAdmins = ref(this.db, 'system/admins');
      const newRef = push(refAdmins);
      await set(newRef, id);
  }

  async removeAdmin(id: string) {
      if (!this.db) return;
      const refAdmins = ref(this.db, 'system/admins');
      const snap = await get(refAdmins);
      if(snap.exists()){
          const data = snap.val();
          // Find key where value === id
          const keyToDelete = Object.keys(data).find(key => data[key] === id);
          if (keyToDelete) {
             await set(ref(this.db, `system/admins/${keyToDelete}`), null);
          }
      }
  }

  subscribeToGlobalReset(callback: (timestamp: number) => void) {
      if (!this.db) return () => {};
      const resetRef = ref(this.db, 'system/resetTimestamp');
      return onValue(resetRef, (snapshot) => {
          callback(snapshot.val() || 0);
      });
  }

  // --- USER SYNC & LEADERS ---
  async getUser(userId: string): Promise<Player | null> {
    if (!this.db) return null;
    try {
        const userRef = ref(this.db, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const u = snapshot.val();
            
            // CRITICAL FIX: Inject ID and Ensure Stats
            u.id = userId; 
            if (!u.stats) {
                u.stats = { totalWins: 0, totalGames: 0, currentWinStreak: 0, maxWinStreak: 0, maxBet: 0, bonusStreak: 0 };
            }
            
            // Safe array conversion
            if (u.history && !Array.isArray(u.history)) u.history = Object.values(u.history);
            if (!u.history) u.history = [];

            if (u.achievements && !Array.isArray(u.achievements)) u.achievements = Object.values(u.achievements);
            if (!u.achievements) u.achievements = [];
            
            if (u.inventory && !Array.isArray(u.inventory)) u.inventory = Object.values(u.inventory);
            if (!u.inventory) u.inventory = [];
            
            if (u.quests && !Array.isArray(u.quests)) u.quests = Object.values(u.quests);
            if (!u.quests) u.quests = [];
            
            if (u.unlockedSkins && !Array.isArray(u.unlockedSkins)) u.unlockedSkins = Object.values(u.unlockedSkins);
            if (!u.unlockedSkins) u.unlockedSkins = ['DEFAULT'];

            if (u.xp === undefined) u.xp = 0;
            // Fix: ensure totalXp exists
            if (u.totalXp === undefined) u.totalXp = u.xp; 
            if (u.level === undefined) u.level = 1;
            if (!u.equippedSkin) u.equippedSkin = 'DEFAULT';
            
            // Login Streak defaults
            if (u.loginStreak === undefined) u.loginStreak = 0;
            if (u.lastLoginDate === undefined) u.lastLoginDate = 0;

            return u as Player;
        }
    } catch (e) {
        console.error("Error getting user", e);
    }
    return null;
  }

  updateUser(player: Player) {
    if (!this.db) return;
    if (!player.id) {
        console.warn("Attempted to update user without ID", player);
        return;
    }

    const userRef = ref(this.db, `users/${player.id}`);
    
    // Validate Stats
    const stats = player.stats || { totalWins: 0, totalGames: 0, currentWinStreak: 0, maxWinStreak: 0, maxBet: 0, bonusStreak: 0 };

    // Explicitly construct object to avoid 'undefined' values which crash Firebase
    const updatePayload = {
      name: player.name || 'Игрок',
      balance: player.balance || 0,
      avatar: player.avatarSeed || 'default', 
      stats: stats,
      achievements: player.achievements || [],
      history: player.history || [],
      xp: player.xp || 0,
      totalXp: player.totalXp || player.xp || 0, // Sync totalXp
      level: player.level || 1,
      inventory: player.inventory || [],
      quests: player.quests || [],
      unlockedSkins: player.unlockedSkins || ['DEFAULT'],
      equippedSkin: player.equippedSkin || 'DEFAULT',
      loginStreak: player.loginStreak || 0,
      lastLoginDate: player.lastLoginDate || 0,
      activeBuffs: player.activeBuffs || null, // Persist buffs
      isAdminGod: player.isAdminGod || false
    };

    update(userRef, updatePayload).catch(err => {
        console.error("Update failed", err, updatePayload);
    });
  }

  subscribeToLeaders(callback: (leaders: Leader[]) => void) {
    if (!this.db) {
        callback([]);
        return () => {};
    }

    const usersRef = ref(this.db, 'users');
    const topUsersQuery = query(usersRef, orderByChild('balance'), limitToLast(50));

    return onValue(topUsersQuery, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            callback([]);
            return;
        }
        
        const leaders: Leader[] = Object.keys(data).map((key) => ({
            id: key,
            name: data[key].name || 'Unknown',
            balance: data[key].balance || 0,
            avatar: data[key].avatar || data[key].avatarSeed || 'default',
            level: data[key].level || 1,
            xp: data[key].xp || 0
        }));

        const filteredLeaders = leaders.filter(l => 
            l.name !== 'Игрок' && 
            !l.name.toLowerCase().includes('player') && 
            l.name !== 'Unknown' &&
            l.balance > 0
        );

        filteredLeaders.sort((a, b) => b.balance - a.balance);
        callback(filteredLeaders);
    });
  }

  // --- CHAT ---
  sendMessage(player: Player, text: string) {
    if (!this.db) return;
    const chatRef = ref(this.db, 'chat');
    const newMsgRef = push(chatRef);
    set(newMsgRef, {
      sender: player.name,
      senderId: player.id, // Save ID to verify identity (Gold name/Crown)
      senderLevel: player.level || 1,
      avatar: player.avatarSeed,
      text: text,
      timestamp: Date.now()
    });
  }

  getChatRef() {
      if(!this.db) return null;
      return ref(this.db, 'chat');
  }

  // --- PVP ROOMS ---
  createRoom(host: Player, bet: number): string {
    if (!this.db) return '';
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    const roomRef = ref(this.db, `rooms/${roomId}`);
    
    // Check for SHADOW buff
    const isSmoked = host.activeBuffs?.shadow;
    const hostBuffs = host.activeBuffs || {};

    set(roomRef, {
        id: roomId,
        hostId: host.id,
        hostName: isSmoked ? 'Неизвестный' : host.name,
        hostAvatar: isSmoked ? 'default' : host.avatarSeed,
        hostLevel: isSmoked ? -1 : (host.level || 1),
        hostSkin: host.equippedSkin || 'DEFAULT', 
        hostBuffs: hostBuffs,
        hostIsGod: host.isAdminGod || false,
        betAmount: bet,
        status: 'WAITING',
        createdAt: Date.now()
    });
    return roomId;
  }

  cancelRoom(roomId: string) {
    if (!this.db) return;
    const roomRef = ref(this.db, `rooms/${roomId}`);
    remove(roomRef);
  }

  async joinRoom(roomId: string, guest: Player): Promise<boolean> {
    if (!this.db) return false;
    const roomRef = ref(this.db, `rooms/${roomId}`);
    
    const isSmoked = guest.activeBuffs?.shadow;
    const guestBuffs = guest.activeBuffs || {};

    return new Promise((resolve) => {
        onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.status === 'WAITING') {
                update(roomRef, {
                    guestId: guest.id,
                    guestName: isSmoked ? 'Неизвестный' : guest.name,
                    guestAvatar: isSmoked ? 'default' : guest.avatarSeed,
                    guestLevel: isSmoked ? -1 : (guest.level || 1),
                    guestSkin: guest.equippedSkin || 'DEFAULT', 
                    guestBuffs: guestBuffs,
                    guestIsGod: guest.isAdminGod || false,
                    status: 'READY'
                });
                resolve(true);
            } else {
                resolve(false);
            }
        }, { onlyOnce: true });
    });
  }

  subscribeToRoom(roomId: string, callback: (room: PvpRoom | null) => void) {
      if (!this.db) return () => {};
      const roomRef = ref(this.db, `rooms/${roomId}`);
      return onValue(roomRef, (snapshot) => callback(snapshot.val()));
  }

  subscribeToLobby(callback: (rooms: PvpRoom[]) => void) {
      if (!this.db) return () => {};
      const roomsRef = ref(this.db, 'rooms');
      
      return onValue(roomsRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) {
              callback([]);
              return;
          }
          const activeRooms: PvpRoom[] = Object.values(data);
          const waiting = activeRooms.filter((r: any) => r.status === 'WAITING');
          waiting.sort((a, b) => b.createdAt - a.createdAt);
          callback(waiting);
      });
  }

  performFlip(roomId: string, side: CoinSide, winProbability: number = 0.5) {
      if (!this.db) return;
      
      const isWin = Math.random() < winProbability;
      const result = isWin ? side : (side === CoinSide.HEADS ? CoinSide.TAILS : CoinSide.HEADS);
      const roomRef = ref(this.db, `rooms/${roomId}`);
      
      update(roomRef, {
          status: 'FLIPPING',
          selectedSide: side,
          result: result
      });
      
      setTimeout(() => {
          update(roomRef, { status: 'FINISHED' });
      }, 3000);
  }
}

export const firebaseService = new FirebaseService();