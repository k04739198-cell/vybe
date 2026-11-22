'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  Flag,
  X,
  FastForward,
  Send,
  Sparkles,
} from 'lucide-react';
import { ConnectionStatus, ChatMessage, InterestTag } from '@/lib/types';
import DecoyOverlay from './DecoyOverlay';
import AdCard from './AdCard';

interface VideoScreenProps {
  status: ConnectionStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  currentTag: InterestTag;
  partnerTag: string | null;
  messages: ChatMessage[];
  showAdCard: boolean;
  onSkip: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onFlipCamera: () => void;
  onOpenReport: () => void;
  onLeave: () => void;
  onSendMessage: (text: string) => void;
  onDismissAd: () => void;
  onDecoyFinished: () => void;
}

export default function VideoScreen({
  status,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoMuted,
  currentTag,
  partnerTag,
  messages,
  showAdCard,
  onSkip,
  onToggleAudio,
  onToggleVideo,
  onFlipCamera,
  onOpenReport,
  onLeave,
  onSendMessage,
  onDismissAd,
  onDecoyFinished,
}: VideoScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [inputText, setInputText] = useState('');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Swipe up gesture handler to skip to next stranger
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    // Swipe up threshold: 75px
    if (deltaY > 75) {
      onSkip();
    }
    setTouchStartY(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[100dvh] bg-[#0B0B0F] overflow-hidden select-none flex flex-col justify-between"
    >
      {/* 1. Remote Stranger Video Stream OR Decoy OR Ad Card */}
      <div className="absolute inset-0 w-full h-full bg-black z-0">
        {showAdCard ? (
          <AdCard onDismiss={onDismissAd} />
        ) : status === 'decoy' ? (
          <DecoyOverlay onDecoyFinished={onDecoyFinished} onSkip={onSkip} />
        ) : remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Searching / Matching Screen */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-[#1A1428] via-[#0E0C17] to-[#0B0B0F]">
            <div className="relative mb-6">
              {/* Radar pulse rings */}
              <div className="absolute -inset-8 rounded-full bg-violet-600/20 blur-xl animate-ping" />
              <div className="absolute -inset-4 rounded-full border border-violet-500/30 animate-pulse" />
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-600/40">
                <Sparkles className="h-10 w-10 text-white animate-spin" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Finding someone nearby...
            </h2>
            <p className="mt-2 text-xs md:text-sm text-gray-400 max-w-xs">
              Filtering South Asia queue {currentTag !== 'all' ? `for #${currentTag}` : ''}...
            </p>

            <button
              onClick={onSkip}
              className="mt-6 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all flex items-center space-x-2 active:scale-95"
            >
              <span>Instant Next</span>
              <FastForward className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Live subtle vignette filter */}
      <div className="absolute inset-0 live-stream-overlay pointer-events-none z-10" />

      {/* 2. Top HUD Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 pt-5 md:p-6">
        {/* Brand & Status */}
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-md">
            <span className="text-lg font-black text-white">v</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black tracking-tight text-white">vybe</span>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    remoteStream ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-gray-300 font-medium">
                  {remoteStream ? 'Connected' : 'Matching'}
                </span>
              </span>
            </div>
            {partnerTag && (
              <span className="text-[10px] text-violet-300 font-semibold">
                #{partnerTag}
              </span>
            )}
          </div>
        </div>

        {/* Top Right Actions: Report + Leave */}
        <div className="flex items-center space-x-2">
          {/* Report Button */}
          <button
            onClick={onOpenReport}
            title="Report User"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
          >
            <Flag className="h-3.5 w-3.5 fill-red-400/30" />
            <span>Report</span>
          </button>

          {/* Leave Button */}
          <button
            onClick={onLeave}
            title="Exit Session"
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Self-View PIP (Picture-in-Picture) */}
      <div className="absolute top-20 right-4 z-20 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-2 border-white/20 bg-black/80 shadow-2xl shadow-black/80 backdrop-blur-md">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] text-gray-300">
          <span>You</span>
          <div className="flex items-center space-x-1">
            {isAudioMuted && <MicOff className="h-2.5 w-2.5 text-rose-400" />}
            {isVideoMuted && <VideoOff className="h-2.5 w-2.5 text-rose-400" />}
          </div>
        </div>
      </div>

      {/* 4. Chat Overlay (Recent floating messages) */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-4 pb-2 max-w-sm pointer-events-none">
        <div className="space-y-1.5">
          {messages.slice(-3).map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-xl text-xs max-w-[85%] backdrop-blur-md animate-in slide-in-from-bottom-2 ${
                msg.sender === 'me'
                  ? 'ml-auto bg-violet-600/80 text-white'
                  : 'bg-black/70 text-gray-200 border border-white/10'
              }`}
            >
              <span className="font-bold text-[10px] block opacity-70 mb-0.5">
                {msg.sender === 'me' ? 'You' : 'Stranger'}
              </span>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bottom Controls Bar */}
      <div className="relative z-20 p-4 pb-6 md:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Quick Chat Strip */}
        <form onSubmit={handleSend} className="mb-3 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Send a quick message..."
            maxLength={120}
            className="flex-1 px-4 py-2 rounded-full bg-black/60 border border-white/15 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-all shadow-md shadow-violet-600/30"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between space-x-3">
          {/* Left tools: Mute, Cam, Flip */}
          <div className="flex items-center space-x-2">
            {/* Audio Mute Button */}
            <button
              onClick={onToggleAudio}
              className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-95 ${
                isAudioMuted
                  ? 'bg-rose-600/80 border-rose-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
              }`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Video Toggle Button */}
            <button
              onClick={onToggleVideo}
              className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-95 ${
                isVideoMuted
                  ? 'bg-rose-600/80 border-rose-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
              }`}
              title={isVideoMuted ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            {/* Flip Camera Button */}
            <button
              onClick={onFlipCamera}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md transition-all active:scale-95"
              title="Flip Camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>

          {/* Primary Skip CTA: Next Vybe */}
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-violet-600/40 glow-btn transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <span>Next Vybe</span>
            <FastForward className="h-4 w-4 fill-white" />
          </button>
        </div>

        {/* Swipe Hint */}
        <p className="mt-2.5 text-center text-[10px] text-gray-500 tracking-wide font-medium">
          Swipe up or tap Next Vybe to skip
        </p>
      </div>
    </div>
  );
}
