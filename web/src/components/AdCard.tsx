'use client';

import React, { useState, useEffect } from 'react';
import { FastForward, Sparkles } from 'lucide-react';

interface AdCardProps {
  onDismiss: () => void;
}

export default function AdCard({ onDismiss }: AdCardProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-[#170E28] via-[#0D0915] to-[#0B0B0F] text-white overflow-hidden select-none">
      {/* Ambient background particles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-300 border border-white/10">
            Sponsored
          </span>
          <span className="text-xs text-gray-400">Vybe Partner</span>
        </div>

        {/* Skip button with countdown */}
        <button
          onClick={onDismiss}
          disabled={secondsRemaining > 0}
          className={`flex items-center space-x-1 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
            secondsRemaining > 0
              ? 'bg-black/40 text-gray-400 border border-white/5 cursor-not-allowed'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/20 active:scale-95'
          }`}
        >
          {secondsRemaining > 0 ? (
            <span>Skip in {secondsRemaining}s</span>
          ) : (
            <>
              <span>Skip Ad</span>
              <FastForward className="h-3.5 w-3.5 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Middle Promo Card Banner */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-sm mx-auto">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-0.5 shadow-2xl shadow-violet-500/30 mb-5 flex items-center justify-center">
          <div className="w-full h-full bg-[#12101C] rounded-[22px] flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-violet-400 animate-pulse" />
          </div>
        </div>

        <h3 className="text-2xl font-black tracking-tight text-white">
          Level Up Your Vibe
        </h3>
        <p className="mt-2 text-xs md:text-sm text-gray-300 leading-relaxed">
          Discover exclusive verified creators, premium live streams, and private community rooms.
        </p>

        <button
          onClick={onDismiss}
          className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs shadow-lg shadow-violet-600/40 hover:opacity-95 transition-all flex items-center justify-center space-x-2"
        >
          <span>Continue</span>
          <FastForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom Ad Network Notice */}
      <div className="relative z-10 text-center">
        <p className="text-[10px] text-gray-500">
          Native Ad Network Slot (ExoClick / PropellerAds Integration)
        </p>
      </div>
    </div>
  );
}
