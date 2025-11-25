
import React from 'react';
import { CoinSide, SkinId } from '../types';

interface CoinProps {
  flipping: boolean;
  result: CoinSide | null;
  skinId?: SkinId;
}

export const Coin: React.FC<CoinProps> = ({ flipping, result, skinId = 'DEFAULT' }) => {
  let animationClass = '';
  let staticStyle = {};
  
  if (flipping) {
    if (result === CoinSide.HEADS) {
      animationClass = 'animate-flip-heads';
    } else if (result === CoinSide.TAILS) {
      animationClass = 'animate-flip-tails';
    }
  } else {
    if (result === CoinSide.HEADS) {
      staticStyle = { transform: 'rotateY(0deg)' };
    } else if (result === CoinSide.TAILS) {
      staticStyle = { transform: 'rotateY(180deg)' };
    }
  }

  // --- SKIN STYLES ---
  let mainColor = 'bg-blue-900';
  let secondaryColor = 'bg-slate-300';
  let borderColor = 'border-blue-900';
  let accentColor = 'border-white';
  let textColor = 'text-blue-900';
  let textColorBack = 'text-white';
  let glowEffect = '';

  if (skinId === 'GOLD') {
      mainColor = 'bg-yellow-600';
      secondaryColor = 'bg-yellow-200';
      borderColor = 'border-yellow-700';
      accentColor = 'border-yellow-200';
      textColor = 'text-yellow-900';
      textColorBack = 'text-yellow-100';
  } else if (skinId === 'NEON') {
      mainColor = 'bg-fuchsia-900';
      secondaryColor = 'bg-purple-500';
      borderColor = 'border-cyan-500';
      accentColor = 'border-cyan-400';
      textColor = 'text-fuchsia-900';
      textColorBack = 'text-cyan-400';
      glowEffect = 'shadow-[0_0_30px_rgba(34,211,238,0.6)]';
  }

  // Thickness Layers - Optimized to 12 for better iOS performance
  const layers = Array.from({ length: 12 }).map((_, i) => {
    const z = (i - 6) * 1.5; 
    const color = i % 2 === 0 ? mainColor : secondaryColor;
    return (
      <div 
        key={i}
        className={`absolute inset-0 rounded-full ${color} border ${borderColor}`}
        style={{ transform: `translateZ(${z}px)` }}
      />
    );
  });

  return (
    <div className="relative w-44 h-44 sm:w-64 sm:h-64 perspective-1000 mx-auto my-6">
      <div 
        className={`w-full h-full relative transform-style-3d ${animationClass}`}
        style={!flipping ? staticStyle : undefined}
      >
        {layers}

        {/* HEADS FACE (Front) */}
        <div 
          className={`absolute inset-0 rounded-full backface-hidden flex items-center justify-center bg-white shadow-inner border-[4px] ${borderColor} ${glowEffect}`}
          style={{ transform: 'translateZ(9px)' }}
        >
           <div className={`absolute inset-1 rounded-full border-4 border-double ${skinId === 'NEON' ? 'border-cyan-500' : 'border-slate-200'}`}></div>
           
           <div className={`flex flex-col items-center justify-center ${textColor}`}>
              <span className={`text-7xl font-gzhel drop-shadow-md select-none ${skinId === 'NEON' ? 'text-cyan-500 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]' : ''}`}>О</span>
              <span className="text-[10px] font-bold tracking-[0.3em] mt-2 select-none opacity-70">GZHELCOIN</span>
           </div>
           
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent rounded-full pointer-events-none"></div>
        </div>

        {/* TAILS FACE (Back) */}
        <div 
          className={`absolute inset-0 rounded-full backface-hidden flex items-center justify-center ${mainColor} shadow-inner border-[4px] ${accentColor} ${glowEffect}`}
          style={{ transform: 'rotateY(180deg) translateZ(9px)' }}
        >
           <div className={`absolute inset-1 rounded-full border-4 border-double ${skinId === 'NEON' ? 'border-fuchsia-400' : 'border-white/50'}`}></div>
           
           <div className={`flex flex-col items-center justify-center ${textColorBack}`}>
              <span className={`text-7xl font-gzhel drop-shadow-md select-none ${skinId === 'NEON' ? 'text-fuchsia-300' : ''}`}>Р</span>
              <span className="text-[10px] font-bold tracking-[0.3em] mt-2 select-none opacity-70">GZHELCOIN</span>
           </div>

           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-full pointer-events-none"></div>
        </div>
      </div>
      
      {/* Floor Shadow */}
      <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black/40 blur-xl rounded-[100%] transition-all duration-300 ${flipping ? 'scale-50 opacity-20' : 'scale-100 opacity-60'}`} />
    </div>
  );
};
