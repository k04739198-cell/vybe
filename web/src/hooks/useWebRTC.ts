'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConnectionStatus, ChatMessage, InterestTag, ReportReason } from '@/lib/types';

// Free high-reliability Google STUN servers
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useWebRTC() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [currentTag, setCurrentTag] = useState<InterestTag>('all');
  const [partnerTag, setPartnerTag] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [partnerSocketId, setPartnerSocketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [skipCount, setSkipCount] = useState(0);
  const [showAdCard, setShowAdCard] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1420);

  const socketRef = useRef<Socket | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const matchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const findNextMatchRef = useRef<((tag?: InterestTag) => void) | null>(null);

  // Sync ref with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Clean up WebRTC peer connection
  const closePeerConnection = useCallback(() => {
    if (peerConnRef.current) {
      peerConnRef.current.ontrack = null;
      peerConnRef.current.onicecandidate = null;
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    setRemoteStream(null);
    setCurrentRoomId(null);
    setPartnerSocketId(null);
    setPartnerTag(null);
    setMessages([]);
  }, []);

  // Request Camera & Mic
  const initLocalStream = useCallback(async () => {
    try {
      setStatus('requesting-permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      setStatus('idle');
      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      setStatus('permission-denied');
      return null;
    }
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Vybe Signalling Server:', socket.id);
    });

    socket.on('queue-status', (data) => {
      console.log('Queue status:', data);
    });

    // When server detects matchmaking queue is empty, trigger decoy immediately
    socket.on('queue-empty', () => {
      console.log('Server indicated queue is empty -> activating decoy clip');
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
        matchTimeoutRef.current = null;
      }
      setStatus('decoy');
    });

    // Partner matched
    socket.on('matched', async ({ roomId, initiator, partnerId, partnerTag: pTag }) => {
      console.log(`Matched in room ${roomId}. Initiator: ${initiator}`);
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
        matchTimeoutRef.current = null;
      }

      setCurrentRoomId(roomId);
      setPartnerSocketId(partnerId);
      setPartnerTag(pTag);
      setStatus('connecting');

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnRef.current = pc;

      // Add local stream tracks to PC
      const activeStream = localStreamRef.current;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          pc.addTrack(track, activeStream);
        });
      }

      // Handle remote incoming track
      pc.ontrack = (event) => {
        console.log('Received remote stream track:', event.streams[0]);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setStatus('connected');
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('signal', {
            roomId,
            to: partnerId,
            signalData: { type: 'candidate', candidate: event.candidate },
          });
        }
      };

      // If initiator, generate WebRTC offer
      if (initiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', {
            roomId,
            to: partnerId,
            signalData: { type: 'offer', sdp: offer },
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    });

    // Handle signalling payload
    socket.on('signal', async ({ from, roomId, signalData }) => {
      const pc = peerConnRef.current;
      if (!pc) return;

      try {
        if (signalData.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('signal', {
            roomId,
            to: from,
            signalData: { type: 'answer', sdp: answer },
          });
        } else if (signalData.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        } else if (signalData.type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        }
      } catch (err) {
        console.error('Error handling signalling data:', err);
      }
    });

    // Partner skipped or disconnected
    socket.on('partner-disconnected', () => {
      console.log('Partner disconnected, finding next...');
      closePeerConnection();
      findNextMatchRef.current?.();
    });

    // Text messages
    socket.on('receive-message', ({ text, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_${Math.random()}`,
          sender: 'stranger',
          text,
          timestamp,
        },
      ]);
    });

    // Fetch public stats
    const fetchStats = async () => {
      try {
        const res = await fetch(`${SOCKET_SERVER_URL}/api/stats`);
        if (res.ok) {
          const data = await res.json();
          if (data.onlineUsers) setOnlineCount(data.onlineUsers);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 15000);

    return () => {
      clearInterval(statsInterval);
      if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
      socket.disconnect();
    };
  }, [closePeerConnection]);

  // Find next match
  const findNextMatch = useCallback(
    (tag?: InterestTag, isUserSkip: boolean = false) => {
      closePeerConnection();
      const activeTag = tag || currentTag;
      setCurrentTag(activeTag);

      // Only increment skip counter if user explicitly skipped (not automatic decoy transition)
      if (isUserSkip) {
        setSkipCount((prev) => {
          const newCount = prev + 1;
          if (newCount > 0 && newCount % 5 === 0) {
            setShowAdCard(true);
          }
          return newCount;
        });
      }

      setStatus('waiting-in-queue');

      if (socketRef.current) {
        socketRef.current.emit('join-queue', { tag: activeTag });
      }

      // Cold start decoy fallback: if no peer found within 1.2s, trigger decoy
      if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
      matchTimeoutRef.current = setTimeout(() => {
        console.log('Matchmaking queue timeout reached -> triggering Decoy cold start');
        setStatus('decoy');
      }, 1200);
    },
    [closePeerConnection, currentTag]
  );

  useEffect(() => {
    findNextMatchRef.current = findNextMatch;
  }, [findNextMatch]);

  // Skip current session
  const skipCurrent = useCallback(() => {
    if (socketRef.current && currentRoomId) {
      socketRef.current.emit('skip', { roomId: currentRoomId });
    }
    closePeerConnection();
    findNextMatch(undefined, true);
  }, [closePeerConnection, currentRoomId, findNextMatch]);

  // Send quick chat text message
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !currentRoomId || !socketRef.current) return;

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'me',
        text: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMsg]);

      socketRef.current.emit('send-message', {
        roomId: currentRoomId,
        message: text.trim(),
      });
    },
    [currentRoomId]
  );

  // Toggle Mute Audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newEnabled = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = newEnabled));
        setIsAudioMuted(!newEnabled);
      }
    }
  }, []);

  // Toggle Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newEnabled = !videoTracks[0].enabled;
        videoTracks.forEach((t) => (t.enabled = newEnabled));
        setIsVideoMuted(!newEnabled);
      }
    }
  }, []);

  // Flip Camera (Front / Back on mobile)
  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: true,
      });

      // Replace tracks in existing peer connection
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (peerConnRef.current && newVideoTrack) {
        const sender = peerConnRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old tracks
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }

      setLocalStream(newStream);
      setFacingMode(nextMode);
    } catch (err) {
      console.warn('Camera flip not supported or available:', err);
    }
  }, [facingMode]);

  // Report user
  const reportUser = useCallback(
    async (reason: ReportReason, notes?: string) => {
      try {
        await fetch(`${SOCKET_SERVER_URL}/api/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentRoomId,
            reportedSocketId: partnerSocketId,
            reason,
            notes,
          }),
        });
      } catch (err) {
        console.error('Error submitting report:', err);
      }
      skipCurrent();
    },
    [currentRoomId, partnerSocketId, skipCurrent]
  );

  const dismissAdCard = useCallback(() => {
    setShowAdCard(false);
  }, []);

  return {
    status,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    facingMode,
    currentTag,
    partnerTag,
    messages,
    skipCount,
    showAdCard,
    onlineCount,
    initLocalStream,
    findNextMatch,
    skipCurrent,
    sendMessage,
    toggleAudio,
    toggleVideo,
    flipCamera,
    reportUser,
    dismissAdCard,
    onDecoyFinished: () => findNextMatch(currentTag),
  };
}
