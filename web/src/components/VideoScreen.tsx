'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  Flag,
  X,
  Send,
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import { ConnectionStatus, ChatMessage, InterestTag } from '@/lib/types';
import DecoyOverlay from './DecoyOverlay';
import AdCard from './AdCard';
import SwipeVideoFeed from './SwipeVideoFeed';

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
  currentDecoyClip?: string | null;
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
  currentDecoyClip,
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
  const [sessionNonce, setSessionNonce] = useState(0);

  // Unique key that changes when the displayed card should change
  const cardKey = useMemo(() => {
    if (showAdCard) return `ad-${sessionNonce}`;
    if (status === 'decoy') return `decoy-${sessionNonce}`;
    if (remoteStream) return `peer-${remoteStream.id}`;
    return `search-${status}-${sessionNonce}`;
  }, [showAdCard, status, remoteStream, sessionNonce]);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // Handle swipe next — either dismiss ad or skip to next peer
  const handleSwipeNext = () => {
    setSessionNonce((n) => n + 1);
    if (showAdCard) {
      onDismissAd();
    } else {
      onSkip();
    }
  };

  const handleDecoyFinishedInternal = () => {
    setSessionNonce((n) => n + 1);
    onDecoyFinished();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Render the current fullscreen card content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderCardContent = () => {
    // ── Ad interstitial card ──
    if (showAdCard) {
      return <AdCard onDismiss={onDismissAd} />;
    }

    // ── Decoy cold-start card ──
    if (status === 'decoy') {
      return (
        <DecoyOverlay
          key={`decoy-inst-${sessionNonce}`}
          clipUrl={currentDecoyClip}
          onDecoyFinished={handleDecoyFinishedInternal}
          onSkip={handleSwipeNext}
        />
      );
    }

    // ── Live peer connection card ──
    if (remoteStream) {
      return (
        <div className="relative w-full h-full bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Live vignette overlay */}
          <div className="absolute inset-0 live-stream-overlay pointer-events-none" />
        </div>
      );
    }

    // ── Searching / Matching card ──
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B0B0F] overflow-hidden">
        {/* Animated background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full border border-violet-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-60 h-60 rounded-full border border-violet-500/15 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="absolute w-40 h-40 rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Center orb */}
        <div className="relative mb-6 z-10">
          <div className="absolute -inset-4 rounded-full bg-violet-600/25 blur-2xl animate-pulse" />
          <div className="relative h-28 w-28 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-600/40 border border-white/10">
            <Sparkles className="h-12 w-12 text-white animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <h2 className="relative z-10 text-2xl md:text-3xl font-black text-white tracking-tight">
          Finding your next Vybe...
        </h2>
        <p className="relative z-10 mt-2 text-sm text-gray-400 max-w-xs">
          {currentTag !== 'all'
            ? `Matching #${currentTag} in South Asia`
            : 'Connecting you with South Asia'}
        </p>

        {/* Swipe hint */}
        <div className="relative z-10 mt-10 flex flex-col items-center space-y-2 text-gray-500">
          <ChevronUp className="h-5 w-5 animate-bounce" />
          <span className="text-xs font-medium tracking-wide">Swipe up to skip</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      {/* ━━━ SWIPEABLE CARD FEED ━━━ */}
      <SwipeVideoFeed
        onSwipeNext={handleSwipeNext}
        cardKey={cardKey}
        enabled={!showAdCard || true}
      >
        {renderCardContent()}
      </SwipeVideoFeed>

      {/* ━━━ OVERLAY HUD (always on top of the feed) ━━━ */}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 pt-5 md:p-6 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-center space-x-2.5 pointer-events-auto">
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
                  {remoteStream ? 'Live' : 'Matching'}
                </span>
              </span>
            </div>
            {partnerTag && (
              <span className="text-[10px] text-violet-300 font-semibold">#{partnerTag}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto" data-no-swipe>
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
          >
            <Flag className="h-3.5 w-3.5 fill-red-400/30" />
            <span>Report</span>
          </button>
          <button
            onClick={onLeave}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Self-View PIP */}
      <div className="absolute top-20 right-4 z-30 w-24 h-36 md:w-32 md:h-44 rounded-2xl overflow-hidden border-2 border-white/20 bg-black/80 shadow-2xl shadow-black/80 pointer-events-none">
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

      {/* Chat Messages (floating, left-aligned) */}
      {messages.length > 0 && (
        <div className="absolute left-4 bottom-44 z-30 max-w-[70%] space-y-1.5 pointer-events-none">
          {messages.slice(-3).map((msg) => (
            <div
              key={msg.id}
              className={`p-2.5 rounded-2xl text-xs backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300 ${
                msg.sender === 'me'
                  ? 'ml-auto bg-violet-600/80 text-white rounded-br-sm'
                  : 'bg-black/70 text-gray-200 border border-white/10 rounded-bl-sm'
              }`}
            >
              <span className="font-bold text-[10px] block opacity-60 mb-0.5">
                {msg.sender === 'me' ? 'You' : 'Stranger'}
              </span>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Controls Dock */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-6 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        data-no-swipe
      >
        {/* Quick Chat Strip */}
        <form onSubmit={handleSend} className="mb-3 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Say something..."
            maxLength={120}
            className="flex-1 px-4 py-2.5 rounded-full bg-black/50 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 backdrop-blur-md"
            data-no-swipe
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white transition-all shadow-md shadow-violet-600/30"
            data-no-swipe
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-95 ${
              isAudioMuted
                ? 'bg-rose-600/80 border-rose-500 text-white'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
            data-no-swipe
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-95 ${
              isVideoMuted
                ? 'bg-rose-600/80 border-rose-500 text-white'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
            }`}
            data-no-swipe
          >
            {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          <button
            onClick={onFlipCamera}
            className="p-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white backdrop-blur-md transition-all active:scale-95"
            data-no-swipe
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        </div>

        {/* Swipe-up reminder text */}
        <p className="mt-3 text-center text-[10px] text-gray-500 tracking-wide font-medium flex items-center justify-center space-x-1.5">
          <ChevronUp className="h-3 w-3" />
          <span>Scroll up for next Vybe</span>
        </p>
      </div>
    </div>
  );
}
