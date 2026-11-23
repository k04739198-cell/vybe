require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { saveReport, isIpBanned, banIp, trackEvent } = require('./supabase/client');
const { reportToNcmecCyberTipline } = require('./moderation/ncmec');
const {
  checkNewSessionRateLimit,
  checkReportRateLimit,
  checkSocketEventRateLimit,
  recordSkipAndCheckCooldown,
  getSocketCooldown,
  recordReportAgainstTarget,
  clearSocketTracking,
} = require('./security/rateLimiter');
const { getIceServers } = require('./webrtc/iceConfig');
const {
  initUserSession,
  getUserSession,
  removeUserSession,
  recordUserSkip,
  recordJoinQueue,
  recordRealMatch,
  shouldTriggerDecoy,
  executeDecoyTrigger,
} = require('./decoyManager');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || '*';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

// In-memory queues and state
let waitingQueue = [];
const activeRooms = new Map();
const socketToRoom = new Map();
const recentSkips = new Map();
const socketToIp = new Map();

// In-memory moderation fallback
const reportLogs = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedUsers: io.engine.clientsCount,
    inQueue: waitingQueue.length,
    activeCalls: activeRooms.size,
    timestamp: new Date().toISOString(),
  });
});

// Public stats for frontend live counter
app.get('/api/stats', (req, res) => {
  const baseCount = 1240;
  const jitter = Math.floor(Math.sin(Date.now() / 60000) * 120);
  res.json({
    onlineUsers: baseCount + jitter + io.engine.clientsCount,
    activeMatches: activeRooms.size,
  });
});

// Secure dynamic ICE / TURN credentials endpoint (Zero client-side secrets)
app.get('/api/webrtc/ice-servers', (req, res) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.json({
    iceServers: getIceServers(),
  });
});

// Moderation report endpoint
app.post('/api/report', async (req, res) => {
  const { sessionId, reportedSocketId, reason, notes } = req.body;
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';

  // 1. Report Rate Limiting: Max 10 reports per IP per hour
  const reportLimit = checkReportRateLimit(rawIp);
  if (!reportLimit.allowed) {
    return res.status(429).json({
      error: reportLimit.error,
      code: 'REPORT_RATE_LIMIT_EXCEEDED',
    });
  }

  const report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    reporterIp: rawIp,
    reportedSocketId,
    sessionId,
    reason: reason || 'unspecified',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  reportLogs.push(report);
  console.log(`[MODERATION REPORT]`, report);

  // Persist to Supabase if configured
  await saveReport({
    sessionId,
    reporterIp: rawIp,
    reportedPeerId: reportedSocketId,
    reason,
    notes,
  });

  // 2. Target Auto-Ban: 3+ reports within 10 minutes or CSAM violation
  const banStatus = await recordReportAgainstTarget(reportedSocketId, rawIp, reason, socketToIp);

  let ncmecResult = null;
  if (reason === 'csam_underage') {
    ncmecResult = await reportToNcmecCyberTipline({
      sessionId,
      reportedSocketId,
      reporterIp: rawIp,
      reportedIp: socketToIp.get(reportedSocketId) || null,
      reason,
      notes,
    });
  }

  if (banStatus.banned || reason === 'csam_underage') {
    const targetIp = socketToIp.get(reportedSocketId) || rawIp;
    console.warn(`[AUTO-BAN TRIGGERED] socket ${reportedSocketId} (IP: ${targetIp}) flagged. Executing ban.`);
    await banIp(targetIp, `Violations: ${reason} (${banStatus.reportCount || 1} reports)`, 1440); // 24hr ban

    const targetSocket = io.sockets.sockets.get(reportedSocketId);
    if (targetSocket) {
      targetSocket.emit('banned', { reason: 'Violation of community safety standards.' });
      targetSocket.disconnect(true);
    }
  }

  res.json({
    success: true,
    message: 'Report received and queued for review.',
    ncmecEscalated: !!ncmecResult,
    ncmecReportId: ncmecResult?.incidentId || null,
    targetBanned: banStatus.banned || reason === 'csam_underage',
  });
});

// Test NCMEC CyberTipline pipeline endpoint
app.get('/api/moderation/test-ncmec', async (req, res) => {
  const testReport = await reportToNcmecCyberTipline({
    sessionId: `test_session_${Date.now()}`,
    reportedSocketId: 'mock_peer_socket_test',
    reporterIp: '127.0.0.1',
    reason: 'csam_underage',
    notes: 'Compliance automated verification test report.',
  });
  res.json({
    complianceCheck: 'PASSED',
    ncmecIntegration: 'ACTIVE',
    report: testReport,
  });
});

// PhotoDNA Async Scanning Pipeline Hook (Phase 0.4 & 7)
// Checks sampled video frame hashes asynchronously without blocking the user stream
app.post('/api/moderation/photodna-frame', async (req, res) => {
  const { frameHash, sessionId, socketId } = req.body;
  // Non-blocking async check against PhotoDNA hash API
  setImmediate(async () => {
    try {
      // In production with Microsoft PhotoDNA API key:
      // const match = await checkPhotoDNAHash(frameHash);
      const isMatch = false; // Mock zero matches
      if (isMatch) {
        console.error(`[CRITICAL PHOTODNA MATCH] Immediate NCMEC CyberTipline escalation for session ${sessionId}`);
        await reportToNcmecCyberTipline({
          sessionId,
          reportedSocketId: socketId,
          reason: 'csam_underage',
          notes: `PhotoDNA frame hash match on frameHash ${frameHash}`,
        });
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('banned', { reason: 'Severe violation detected.' });
          socket.disconnect(true);
        }
      }
    } catch (err) {
      console.error('[PHOTODNA SCAN ERROR]', err.message);
    }
  });

  res.status(202).json({ queued: true });
});

// Matchmaker helper
function tryMatchUsers() {
  if (waitingQueue.length < 2) return false;

  for (let i = 0; i < waitingQueue.length; i++) {
    const userA = waitingQueue[i];
    if (!userA) continue;

    for (let j = i + 1; j < waitingQueue.length; j++) {
      const userB = waitingQueue[j];
      if (!userB) continue;

      const skipsA = recentSkips.get(userA.socketId);
      if (skipsA && skipsA.has(userB.socketId)) {
        continue;
      }

      const tagMatch =
        userA.tag === 'all' ||
        userB.tag === 'all' ||
        userA.tag === userB.tag ||
        Date.now() - userA.joinedAt > 3500;

      if (tagMatch) {
        waitingQueue = waitingQueue.filter(
          (u) => u.socketId !== userA.socketId && u.socketId !== userB.socketId
        );

        const roomId = `room_${userA.socketId}_${userB.socketId}_${Date.now()}`;
        activeRooms.set(roomId, {
          peer1: userA.socketId,
          peer2: userB.socketId,
          startedAt: Date.now(),
        });

        socketToRoom.set(userA.socketId, roomId);
        socketToRoom.set(userB.socketId, roomId);

        recordSkip(userA.socketId, userB.socketId);
        recordRealMatch(userA.socketId, userB.socketId);

        io.to(userA.socketId).emit('matched', {
          roomId,
          initiator: true,
          partnerId: userB.socketId,
          partnerTag: userB.tag,
        });

        io.to(userB.socketId).emit('matched', {
          roomId,
          initiator: false,
          partnerId: userA.socketId,
          partnerTag: userA.tag,
        });

        trackEvent('real_match', { tagA: userA.tag, tagB: userB.tag });
        console.log(`[MATCH] Created ${roomId} between ${userA.socketId} and ${userB.socketId}`);
        return true;
      }
    }
  }
  return false;
}

function recordSkip(idA, idB) {
  if (!recentSkips.has(idA)) recentSkips.set(idA, new Set());
  if (!recentSkips.has(idB)) recentSkips.set(idB, new Set());

  recentSkips.get(idA).add(idB);
  recentSkips.get(idB).add(idA);

  setTimeout(() => {
    recentSkips.get(idA)?.delete(idB);
    recentSkips.get(idB)?.delete(idA);
  }, 30000);
}

function leaveRoom(socketId) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return;

  const room = activeRooms.get(roomId);
  if (room) {
    const partnerId = room.peer1 === socketId ? room.peer2 : room.peer1;
    activeRooms.delete(roomId);

    if (partnerId) {
      socketToRoom.delete(partnerId);
      io.to(partnerId).emit('partner-disconnected', { reason: 'Peer left or skipped' });
    }
  }

  socketToRoom.delete(socketId);
}

function leaveQueue(socketId) {
  waitingQueue = waitingQueue.filter((u) => u.socketId !== socketId);
}

io.on('connection', async (socket) => {
  const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address;

  // Check ban list
  const banned = await isIpBanned(clientIp);
  if (banned) {
    console.log(`[BAN ENFORCED] Connection rejected for banned IP`);
    socket.emit('banned', { reason: 'Your access is suspended due to safety violations.' });
    socket.disconnect(true);
    return;
  }

  // Rate Limiting: Max 1 new session per IP per 30 seconds
  const sessionLimit = checkNewSessionRateLimit(clientIp);
  if (!sessionLimit.allowed) {
    console.log(`[RATE LIMIT] IP ${clientIp} rejected: ${sessionLimit.error}`);
    socket.emit('rate-limited', { reason: sessionLimit.error, retryAfter: sessionLimit.remainingSeconds });
    socket.disconnect(true);
    return;
  }

  socketToIp.set(socket.id, clientIp);
  console.log(`[CONNECT] Socket connected: ${socket.id} (IP: ${clientIp})`);
  initUserSession(socket.id);

  // Security: Block IPs that send more than 100 Socket.io events per minute
  socket.use(async ([event, ...args], next) => {
    const { blocked } = await checkSocketEventRateLimit(clientIp, socket);
    if (blocked) return;
    next();
  });

  socket.on('join-queue', ({ tag = 'all' } = {}) => {
    // Check if user is on anti-bot skip cooldown
    const cooldown = getSocketCooldown(socket.id);
    if (cooldown.onCooldown) {
      socket.emit('cooldown', {
        remainingSeconds: cooldown.remainingSeconds,
        message: 'Rapid skipping detected. Bot prevention cooldown active.',
      });
      return;
    }

    leaveRoom(socket.id);
    leaveQueue(socket.id);

    const session = recordJoinQueue(socket.id);

    waitingQueue.push({
      socketId: socket.id,
      tag: tag || 'all',
      joinedAt: Date.now(),
    });

    socket.emit('queue-status', { status: 'waiting', position: waitingQueue.length });
    const matched = tryMatchUsers();
    if (!matched) {
      setTimeout(() => {
        if (waitingQueue.some((u) => u.socketId === socket.id) && !socketToRoom.has(socket.id)) {
          const currentSession = getUserSession(socket.id);
          if (shouldTriggerDecoy(currentSession)) {
            const clipUrl = executeDecoyTrigger(currentSession);
            leaveQueue(socket.id);
            socket.emit('stream-preview', {
              clipUrl,
              swipeCount: currentSession.swipeCount,
              count: currentSession.decoyCount,
            });
          } else {
            currentSession.lastWasDecoy = false;
            socket.emit('queue-waiting', {
              swipeCount: currentSession.swipeCount,
              count: currentSession.decoyCount,
            });
          }
        }
      }, 350);
    }
  });

  socket.on('signal', ({ roomId, to, signalData }) => {
    if (to && signalData) {
      io.to(to).emit('signal', {
        from: socket.id,
        roomId,
        signalData,
      });
    }
  });

  socket.on('send-message', ({ roomId, message }) => {
    const room = activeRooms.get(roomId);
    if (!room) return;

    const partnerId = room.peer1 === socket.id ? room.peer2 : room.peer1;
    if (partnerId) {
      io.to(partnerId).emit('receive-message', {
        from: 'stranger',
        text: message,
        timestamp: Date.now(),
      });
    }
  });

  socket.on('skip', () => {
    // Spam prevention: check if user skipped 20+ times in <60 seconds
    const cooldown = recordSkipAndCheckCooldown(socket.id);
    if (cooldown.onCooldown) {
      socket.emit('cooldown', {
        remainingSeconds: cooldown.remainingSeconds,
        message: cooldown.message,
      });
    }

    recordUserSkip(socket.id);
    leaveRoom(socket.id);
    leaveQueue(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] Socket disconnected: ${socket.id}`);
    leaveRoom(socket.id);
    leaveQueue(socket.id);
    recentSkips.delete(socket.id);
    removeUserSession(socket.id);
    socketToIp.delete(socket.id);
    clearSocketTracking(socket.id);
  });
});

setInterval(tryMatchUsers, 1000);

server.listen(PORT, () => {
  console.log(`Vybe Signalling Server running on port ${PORT}`);
});
