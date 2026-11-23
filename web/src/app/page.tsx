'use client';

import React, { useState } from 'react';
import AgeGateModal from '@/components/AgeGateModal';
import TermsModal from '@/components/TermsModal';
import ReportModal from '@/components/ReportModal';
import EntryScreen from '@/components/EntryScreen';
import VideoScreen from '@/components/VideoScreen';
import { useWebRTC } from '@/hooks/useWebRTC';
import { InterestTag, ReportReason } from '@/lib/types';
import { webApplicationSchema, faqPageSchema } from '@/lib/structuredData';

export default function Home() {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [view, setView] = useState<'entry' | 'session'>('entry');
  const [selectedTag, setSelectedTag] = useState<InterestTag>('all');

  const {
    status,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    currentTag,
    partnerTag,
    messages,
    showAdCard,
    onlineCount,
    currentPreviewClip,
    cooldownSeconds,
    initLocalStream,
    findNextMatch,
    skipCurrent,
    sendMessage,
    toggleAudio,
    toggleVideo,
    flipCamera,
    reportUser,
    dismissAdCard,
    onPreviewFinished,
  } = useWebRTC();

  const handleStartVybing = async (tag: InterestTag) => {
    let stream = localStream;
    if (!stream) {
      stream = await initLocalStream();
    }
    setView('session');
    findNextMatch(tag);
  };

  const handleLeaveSession = () => {
    setView('entry');
  };

  const handleReportAndSkip = (reason: ReportReason, notes?: string) => {
    reportUser(reason, notes);
    setIsReportOpen(false);
  };

  return (
    <main
      className={`relative w-full h-[100dvh] bg-[#0B0B0F] text-white ${
        view === 'entry' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'
      }`}
    >
      {/* Schema.org Structured Data (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      {/* 18+ Age Gate Splash Modal */}
      {!isAgeVerified && (
        <AgeGateModal
          onVerified={() => setIsAgeVerified(true)}
          onOpenTerms={() => setIsTermsOpen(true)}
        />
      )}

      {/* Terms & Legal Compliance Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onReportAndSkip={handleReportAndSkip}
      />

      {/* View Switcher: Entry Screen vs Video Session */}
      {view === 'entry' ? (
        <EntryScreen
          onStart={handleStartVybing}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          localStream={localStream}
          onOpenTerms={() => setIsTermsOpen(true)}
          onlineCount={onlineCount}
          onRequestPermissions={initLocalStream}
          permissionDenied={status === 'permission-denied'}
        />
      ) : (
        <VideoScreen
          status={status}
          localStream={localStream}
          remoteStream={remoteStream}
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          currentTag={currentTag}
          partnerTag={partnerTag}
          messages={messages}
          showAdCard={showAdCard}
          currentPreviewClip={currentPreviewClip}
          cooldownSeconds={cooldownSeconds}
          onSkip={skipCurrent}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onFlipCamera={flipCamera}
          onOpenReport={() => setIsReportOpen(true)}
          onLeave={handleLeaveSession}
          onSendMessage={sendMessage}
          onDismissAd={dismissAdCard}
          onPreviewFinished={onPreviewFinished}
        />
      )}
    </main>
  );
}
