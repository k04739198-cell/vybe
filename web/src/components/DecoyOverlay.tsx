'use client';

import React, { useEffect, useState, useRef } from 'react';

interface DecoyOverlayProps {
  clipUrl?: string | null;
  onDecoyFinished: () => void;
  onSkip?: () => void;
}

const DECOY_CLIPS = [
  '/decoys/Person_on_video_call_c49ac2fc_gwr_video_mvp_part1.mp4',
  '/decoys/Person_on_video_call_c49ac2fc_gwr_video_mvp_part2.mp4',
  '/decoys/Person_sitting_at_desk_5622e3b2_1080p_gwr_video_mvp_part1.mp4',
  '/decoys/Person_sitting_at_desk_5622e3b2_1080p_gwr_video_mvp_part2.mp4',
  '/decoys/Person_sitting_on_video_call_09bb8c3a_1080p_gwr_video_mvp_part1.mp4',
  '/decoys/Person_sitting_on_video_call_09bb8c3a_1080p_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_relaxing_in_bedroom_04246398_1080p_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_relaxing_in_bedroom_04246398_1080p_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_relaxing_in_bedroom_9452e94f_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_relaxing_in_bedroom_9452e94f_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_sitting_on_bed_6fed24eb_1080p_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_sitting_on_bed_6fed24eb_1080p_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_sitting_on_bed_c2b3dbb6_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_sitting_on_bed_c2b3dbb6_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_sitting_on_bed_d2a225e7_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_sitting_on_bed_d2a225e7_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_sitting_on_bed_d96936d7_1080p_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_sitting_on_bed_d96936d7_1080p_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_sitting_on_bed_ee6f657a_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_sitting_on_bed_ee6f657a_gwr_video_mvp_part2.mp4',
  '/decoys/Woman_sitting_on_bed_relaxing_e51e92cb_1080p_gwr_video_mvp_part1.mp4',
  '/decoys/Woman_sitting_on_bed_relaxing_e51e92cb_1080p_gwr_video_mvp_part2.mp4',
  '/decoys/Young_person_looking_at_camera_25828d7d_gwr_video_mvp_part1.mp4',
  '/decoys/Young_person_looking_at_camera_25828d7d_gwr_video_mvp_part2.mp4',
];

// Module-level tracker to guarantee no back-to-back repeated clips
let lastPlayedClip: string | null = null;

function pickRandomClip(): string {
  const available = DECOY_CLIPS.filter((c) => c !== lastPlayedClip);
  const selected = available[Math.floor(Math.random() * available.length)] || DECOY_CLIPS[0];
  lastPlayedClip = selected;
  return selected;
}

export default function DecoyOverlay({ clipUrl: serverClipUrl, onDecoyFinished }: DecoyOverlayProps) {
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
        onDecoyFinished();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, onDecoyFinished]);

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
      videoRef.current.play().catch((err) => {
        console.warn('Decoy autoplay prevented or stalled:', err);
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
