'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface DecoyOverlayProps {
  onDecoyFinished: () => void;
  onSkip: () => void;
}

// Sample decoy profiles for South Asia cold-start fallback
const DECOY_PROFILES = [
  {
    name: 'Aanya',
    city: 'Mumbai',
    tag: 'Chat',
    gradient: 'from-purple-900/40 via-indigo-950/60 to-black',
    avatarBg: 'bg-gradient-to-tr from-pink-500 to-violet-600',
    initials: 'A',
    bio: 'vibing to lofi 🎧',
  },
  {
    name: 'Rohit',
    city: 'Delhi',
    tag: 'Music',
    gradient: 'from-blue-900/40 via-slate-950/60 to-black',
    avatarBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600',
    initials: 'R',
    bio: 'guitar & chill 🎸',
  },
  {
    name: 'Zoya',
    city: 'Lahore',
    tag: 'Flirt',
    gradient: 'from-fuchsia-900/40 via-purple-950/60 to-black',
    avatarBg: 'bg-gradient-to-tr from-fuchsia-500 to-rose-600',
    initials: 'Z',
    bio: 'late night conversations ✨',
  },
  {
    name: 'Kavya',
    city: 'Bangalore',
    tag: 'Desi',
    gradient: 'from-amber-900/30 via-stone-950/60 to-black',
    avatarBg: 'bg-gradient-to-tr from-amber-500 to-pink-600',
    initials: 'K',
    bio: 'chai & tech talks ☕',
  },
];

export default function DecoyOverlay({ onDecoyFinished, onSkip }: DecoyOverlayProps) {
  const [stage, setStage] = useState<'playing' | 'missed'>('playing');
  const [profile] = useState(() => DECOY_PROFILES[Math.floor(Math.random() * DECOY_PROFILES.length)]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate live camera wave / subtle movement simulation on canvas
  useEffect(() => {
    let animationFrameId: number;
    let t = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      t += 0.03;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 600);

      // Deep atmospheric background
      const grad = ctx.createRadialGradient(
        width / 2 + Math.sin(t) * 40,
        height / 2 + Math.cos(t * 0.8) * 40,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.45)');
      grad.addColorStop(0.5, 'rgba(30, 20, 50, 0.85)');
      grad.addColorStop(1, '#0B0B0F');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render subtle simulated camera noise / scanline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < height; y += 4) {
        if ((y + Math.floor(t * 10)) % 8 === 0) {
          ctx.fillRect(0, y, width, 1.5);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Cold start lifecycle: 2.8s preview -> "Just missed them" -> continue matching
  useEffect(() => {
    const playTimer = setTimeout(() => {
      setStage('missed');
    }, 2800);

    const finishTimer = setTimeout(() => {
      onDecoyFinished();
    }, 4500);

    return () => {
      clearTimeout(playTimer);
      clearTimeout(finishTimer);
    };
  }, [onDecoyFinished]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black select-none">
      {/* Background canvas stream effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* Simulated Live Vignette & Video Noise */}
      <div className="absolute inset-0 live-stream-overlay pointer-events-none" />

      {stage === 'playing' ? (
        <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500 px-6 text-center">
          {/* Avatar / Portrait Frame with live pulse */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 opacity-75 blur-md animate-pulse" />
            <div
              className={`relative h-32 w-32 md:h-40 md:w-40 rounded-full ${profile.avatarBg} flex items-center justify-center text-white shadow-2xl border-2 border-white/20`}
            >
              <span className="text-5xl md:text-6xl font-extrabold tracking-tight">
                {profile.initials}
              </span>
            </div>
            <div className="absolute bottom-1 right-2 flex items-center space-x-1 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-center space-x-2">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{profile.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                {profile.city}
              </span>
            </div>
            <p className="mt-1 text-xs text-violet-300 font-medium">{profile.bio}</p>
          </div>

          {/* Tag pill */}
          <div className="mt-3 flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-violet-600/30 border border-violet-500/40 text-[11px] font-semibold text-violet-300">
              #{profile.tag}
            </span>
          </div>

          {/* Skip button shortcut */}
          <button
            onClick={onSkip}
            className="mt-8 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/15 transition-all flex items-center space-x-2 active:scale-95"
          >
            <span>Skip</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* Stage: Just Missed Them */
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-90 duration-300 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 mb-4 shadow-xl">
            <Sparkles className="h-8 w-8 text-fuchsia-400 animate-spin" />
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Just missed them!
          </h3>
          <p className="mt-2 text-xs md:text-sm text-gray-400 max-w-xs">
            Connecting you to the next live Vyber in South Asia...
          </p>

          <button
            onClick={onSkip}
            className="mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg shadow-violet-600/40 flex items-center space-x-2 active:scale-95 transition-all"
          >
            <span>Keep Going</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
