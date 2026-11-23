'use client';

import React, { useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Shield,
  Zap,
  Globe2,
  Lock,
} from 'lucide-react';
import { InterestTag } from '@/lib/types';
import FaqSection from './FaqSection';

interface EntryScreenProps {
  onStart: (tag: InterestTag) => void;
  selectedTag: InterestTag;
  onSelectTag: (tag: InterestTag) => void;
  localStream: MediaStream | null;
  onOpenTerms: () => void;
  onlineCount: number;
  onRequestPermissions: () => void;
  permissionDenied: boolean;
}

const INTEREST_CHIPS: { id: InterestTag; label: string; icon: string; badge?: string }[] = [
  { id: 'all', label: 'All Vybers', icon: '⚡' },
  { id: 'chat', label: 'Chill Chat', icon: '💬' },
  { id: 'flirt', label: 'Flirt & Vibes', icon: '🔥' },
  { id: '18+', label: '18+ Only', icon: '🔞', badge: 'ADULT' },
  { id: 'music', label: 'Music Jam', icon: '🎵' },
  { id: 'gaming', label: 'Gamers', icon: '🎮' },
  { id: 'desi', label: 'Desi Vibes', icon: '✨' },
];

export default function EntryScreen({
  onStart,
  selectedTag,
  onSelectTag,
  localStream,
  onlineCount,
  onRequestPermissions,
  permissionDenied,
}: EntryScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col justify-between p-5 md:p-8 bg-[#0B0B0F] text-white overflow-y-auto overflow-x-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 right-0 w-80 h-80 rounded-full bg-fuchsia-600/15 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Logo mark */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 shadow-lg shadow-violet-600/30">
            <span className="text-xl font-black text-white">v</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-violet-300 bg-clip-text text-transparent">
                vybe
              </span>
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium -mt-0.5">South Asia Live</p>
          </div>
        </div>

        {/* Live online pill */}
        <div className="glass-pill flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-gray-200">
            {onlineCount.toLocaleString()} <span className="text-gray-400 font-normal">live</span>
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex flex-col items-center max-w-md w-full mx-auto my-auto text-center py-4">
        {/* Camera Preview / Permission Prompt Box */}
        <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-3xl overflow-hidden border border-white/10 bg-[#14141E] shadow-2xl flex items-center justify-center group mb-6">
          {localStream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-gray-300">
                <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                  <Camera className="h-3 w-3" />
                  <span>Ready</span>
                </span>
                <span className="text-gray-400 text-[10px]">Self Preview</span>
              </div>
            </>
          ) : permissionDenied ? (
            <div className="p-4 flex flex-col items-center space-y-2">
              <CameraOff className="h-8 w-8 text-rose-500" />
              <p className="text-xs font-semibold text-rose-400">Camera Access Denied</p>
              <p className="text-[11px] text-gray-400 leading-snug">
                Please allow camera permissions in your browser settings to vybe.
              </p>
              <button
                onClick={onRequestPermissions}
                className="mt-1 px-3 py-1 rounded-lg bg-white/10 text-[11px] text-white hover:bg-white/20 transition-colors"
              >
                Retry Permission
              </button>
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-gray-200">Camera & Mic Required</p>
              <p className="text-[11px] text-gray-400 leading-snug">
                Preview yourself before matching with strangers
              </p>
              <button
                onClick={onRequestPermissions}
                className="mt-1 px-3.5 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-md shadow-violet-600/30 transition-all active:scale-95"
              >
                Enable Camera
              </button>
            </div>
          )}
        </div>

        {/* Headline */}
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
          Every stranger is a <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Vybe</span> away
        </h1>
        <p className="mt-1.5 text-xs md:text-sm text-gray-400">
          No sign up. Instant live video. Swipe to meet South Asia.
        </p>

        {/* Interest Tag Chips */}
        <div className="mt-6 w-full">
          <p className="text-left text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1 flex items-center justify-between">
            <span>Select Matching Vibe</span>
            <span className="text-[10px] text-violet-400 font-normal">Optional filter</span>
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {INTEREST_CHIPS.map((chip) => {
              const active = selectedTag === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => onSelectTag(chip.id)}
                  className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/40 border border-white/20 scale-105'
                      : 'bg-[#181824] hover:bg-[#202030] text-gray-300 border border-white/5'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                  {chip.badge && (
                    <span className="text-[9px] bg-red-500/30 text-red-300 px-1 py-0.2 rounded font-mono font-bold">
                      {chip.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary CTA: Start Vybing */}
        <div className="mt-7 w-full">
          <button
            onClick={() => onStart(selectedTag)}
            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-extrabold text-base tracking-wide shadow-xl glow-btn transition-all duration-300 active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <span>Start Scrolling</span>
            <Zap className="h-5 w-5 fill-white" />
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-500">
            Swipe up through live faces — just like Reels
          </p>
        </div>

        {/* Trust & Safety Pills */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-[11px] text-gray-400">
          <span className="flex items-center space-x-1">
            <Lock className="h-3 w-3 text-violet-400" />
            <span>Peer-to-Peer</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>18+ Safe Gate</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Globe2 className="h-3 w-3 text-fuchsia-400" />
            <span>South Asia</span>
          </span>
        </div>
      </main>

      {/* SEO FAQ Section */}
      <FaqSection />

      {/* Footer */}
      <footer className="relative z-10 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-4 text-[11px] text-gray-500">
        <div className="flex items-center space-x-2">
          <span>© 2026 Vybe. All rights reserved.</span>
          <span>•</span>
          <a href="/terms" className="text-violet-400 hover:underline">
            Terms of Service
          </a>
          <span>•</span>
          <a href="/privacy" className="text-violet-400 hover:underline">
            Privacy Policy
          </a>
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-3 text-[10px]">
          <span>India</span>
          <span>•</span>
          <span>Pakistan</span>
          <span>•</span>
          <span>Bangladesh</span>
          <span>•</span>
          <span>Sri Lanka</span>
          <span>•</span>
          <span>Nepal</span>
        </div>
      </footer>
    </div>
  );
}
