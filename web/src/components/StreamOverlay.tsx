'use client';

import React, { useEffect, useState, useRef } from 'react';

interface StreamOverlayProps {
  clipUrl?: string | null;
  onPreviewFinished: () => void;
  onSkip?: () => void;
}

const PREVIEW_CLIPS = [
  '/v/a7f3k.mp4',
  '/v/b8x2m.mp4',
  '/v/c9q4w.mp4',
  '/v/d3n6y.mp4',
  '/v/e5t8r.mp4',
  '/v/f2k7p.mp4',
  '/v/g4m1z.mp4',
  '/v/h6w9s.mp4',
  '/v/j8c3v.mp4',
  '/v/k1b5n.mp4',
  '/v/l3x7q.mp4',
  '/v/m5z2k.mp4',
  '/v/n7w4t.mp4',
  '/v/p9r6m.mp4',
  '/v/q2y8b.mp4',
  '/v/r4k1p.mp4',
  '/v/s6m3z.mp4',
  '/v/t8w5v.mp4',
  '/v/u1q7x.mp4',
  '/v/v3b9r.mp4',
  '/v/w5p2k.mp4',
  '/v/x7n4m.mp4',
  '/v/y9z6q.mp4',
  '/v/z2t8w.mp4',
];

let lastPlayedClip: string | null = null;

function pickRandomClip(): string {
  const available = PREVIEW_CLIPS.filter((c) => c !== lastPlayedClip);
  const selected = available[Math.floor(Math.random() * available.length)] || PREVIEW_CLIPS[0];
  lastPlayedClip = selected;
  return selected;
}

export default function StreamOverlay({ clipUrl: serverClipUrl, onPreviewFinished }: StreamOverlayProps) {
  const [clipUrl] = useState<string>(() => serverClipUrl || pickRandomClip());
  const activeClip = serverClipUrl || clipUrl;
  const [stage, setStage] = useState<'playing' | 'missed'>('playing');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishedRef = useRef(false);

  // Transition from playing to "just missed them"
  const handleClipEnd = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setStage('missed');
  };

  // When stage switches to 'missed', show text for 1 second, then retry matchmaking
  useEffect(() => {
    if (stage === 'missed') {
      const timer = setTimeout(() => {
        onPreviewFinished();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, onPreviewFinished]);

  // Safety fallback: if video doesn't fire ended within 5 seconds, finish clip
  useEffect(() => {
    if (stage === 'playing') {
      const safetyTimer = setTimeout(() => {
        handleClipEnd();
      }, 5000);
      return () => clearTimeout(safetyTimer);
    }
  }, [stage]);

  // Attempt to play on mount (ensuring mobile browser starts playback immediately)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Silently handled
      });
    }
  }, [activeClip]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* Fullscreen Video - object-fit: cover, fills full screen on mobile with NO black bars */}
      <video
        ref={videoRef}
        src={activeClip}
        autoPlay
        playsInline
        muted
        preload="auto"
        onEnded={handleClipEnd}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          stage === 'missed' ? 'opacity-30 blur-sm scale-105' : 'opacity-100 scale-100'
        }`}
        style={{ objectFit: 'cover' }}
      />

      {/* Live subtle vignette filter */}
      <div className="absolute inset-0 live-stream-overlay pointer-events-none z-10" />

      {/* "just missed them — keep going" overlay */}
      {stage === 'missed' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="px-6 py-4 rounded-3xl bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl">
            <p className="text-lg md:text-xl font-bold tracking-tight text-white lowercase">
              just missed them — keep going
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
