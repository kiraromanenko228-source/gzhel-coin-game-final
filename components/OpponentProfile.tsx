import React from 'react';
import { Player } from '../types';

interface OpponentProfileProps {
  player: Player;
  isCurrentTurn?: boolean;
}

export const OpponentProfile: React.FC<OpponentProfileProps> = ({ player, isCurrentTurn }) => {
  return (
    <div className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 border ${isCurrentTurn ? 'bg-slate-800 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-slate-900 border-slate-700 opacity-80'}`}>
      <div className="relative">
        <img 
          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${player.avatarSeed}`} 
          alt={player.name}
          className="w-20 h-20 rounded-full border-2 border-slate-600 bg-slate-800"
        />
        {isCurrentTurn && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
        )}
      </div>
      <h3 className="mt-2 font-bold text-lg text-white">{player.name}</h3>
      <div className="flex items-center gap-1 text-yellow-400 font-mono">
        <span>$</span>
        <span className="text-xl">{player.balance.toLocaleString()}</span>
      </div>
      {player.isAi && (
        <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Бот</span>
      )}
    </div>
  );
};