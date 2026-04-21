/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const Logo = ({ variant = 'default', size = 'md' }: { variant?: 'default' | 'white' | 'dark', size?: 'sm' | 'md' | 'lg' }) => {
  const isWhite = variant === 'white';
  
  // Official Colors from Lagos de Torca Branding (Flat & Professional)
  const colors = {
    cyan: isWhite ? 'rgba(255,255,255,0.9)' : '#00A3E0',
    blue: isWhite ? 'rgba(255,255,255,0.7)' : '#005CAB',
    navy: isWhite ? '#FFFFFF' : '#002855',
    deepNavy: isWhite ? '#FFFFFF' : '#001A33',
    red: isWhite ? '#FFFFFF' : '#E4002B',
    yellow: isWhite ? '#FFFFFF' : '#FFCD00'
  };

  const svgSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  return (
    <div className="flex items-center transition-all duration-300">
      <div className={`relative ${svgSizes[size]} flex-shrink-0 group mr-4`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-sm transform group-hover:scale-105 transition-transform duration-500">
          {/* GEOMETRIC TINGUA (OFFICIAL FLAT ORIGAMI DESIGN) */}
          
          {/* Main Body - Large Navy Triangle */}
          <path d="M22 65 L55 80 L70 35 L45 42 Z" fill={colors.navy} />
          
          {/* Head - Dark Navy Triangle pointing right */}
          <path d="M70 35 L85 28 L75 18 Z" fill={colors.deepNavy} />
          
          {/* Beak - Yellow Triangle */}
          <path d="M85 28 L94 32 L85 34 Z" fill={colors.yellow} />
          
          {/* Red Crest on head */}
          <path d="M78 18 L84 19 L81 25 Z" fill={colors.red} />
          
          {/* Primary Wing - Cyan Triangle Layer */}
          <path d="M15 48 L45 42 L55 60 L24 64 Z" fill={colors.cyan} />
          
          {/* Inner Wing Shadow - Medium Blue Layer */}
          <path d="M45 42 L70 35 L55 60 Z" fill={colors.blue} opacity="0.9" />
          
          {/* Tail - Navy triangle at the bottom left */}
          <path d="M12 88 L25 70 L18 82 Z" fill={colors.navy} opacity="0.8" />
        </svg>
      </div>
      
      <div className="flex flex-col leading-tight select-none">
        <span className={`tracking-[0.4em] uppercase font-bold sm:inline hidden ${isWhite ? 'text-white/60' : 'text-[#00A3E0]'}`} style={{ fontSize: size === 'lg' ? '1.2rem' : size === 'md' ? '0.7rem' : '0.5rem' }}>
          LAGOS DE
        </span>
        <span className={`font-black tracking-tighter ${isWhite ? 'text-white' : 'text-[#002855]'}`} style={{ fontSize: size === 'lg' ? '4.5rem' : size === 'md' ? '2.5rem' : '1.5rem' }}>
          TORCA
        </span>
      </div>
    </div>
  );
};
