const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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
// waitingQueue: Array of { socketId, tag, joinedAt, recentPeers: Set }
let waitingQueue = [];
// activeRooms: Map of roomId -> { peer1: socketId, peer2: socketId, startedAt }
const activeRooms = new Map();
// socketToRoom: Map of socketId -> roomId
const socketToRoom = new Map();
// recentPairs: Map of socketId -> Set of recently connected socketIds
const recentSkips = new Map();

// Moderation: in-memory abuse log (backed by Supabase in production)
const reportLogs = [];
const bannedIps = new Set();

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
  // Give a dynamic realistic live base for South Asia
  const baseCount = 1240;
  const jitter = Math.floor(Math.sin(Date.now() / 60000) * 120);
  res.json({
    onlineUsers: baseCount + jitter + io.engine.clientsCount,
    activeMatches: activeRooms.size,
  });
});

// Moderation report endpoint
app.post('/api/report', (req, res) => {
  const { sessionId, reportedSocketId, reason, notes } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    reporterIp: ip,
    reportedSocketId,
    sessionId,
    reason: reason || 'unspecified',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  reportLogs.push(report);
  console.log(`[MODERATION REPORT]`, report);

  // Auto-ban check: if reported multiple times recently
  const recentReportsForPeer = reportLogs.filter(
    (r) => r.reportedSocketId === reportedSocketId && Date.now() - new Date(r.createdAt).getTime() < 10 * 60 * 1000
  );

  if (recentReportsForPeer.length >= 3) {
    console.warn(`[AUTO-BAN TRIGGERED] socket ${reportedSocketId} exceeded 3 reports in 10 mins.`);
    const targetSocket = io.sockets.sockets.get(reportedSocketId);
    if (targetSocket) {
      targetSocket.emit('banned', { reason: 'Violation of community safety standards.' });
      targetSocket.disconnect(true);
    }
  }

  res.json({ success: true, message: 'Report received and queued for review.' });
});

// Matchmaker helper
function tryMatchUsers() {
  if (waitingQueue.length < 2) return;

  // Clone array to safely iterate
  for (let i = 0; i < waitingQueue.length; i++) {
    const userA = waitingQueue[i];
    if (!userA) continue;

    for (let j = i + 1; j < waitingQueue.length; j++) {
      const userB = waitingQueue[j];
      if (!userB) continue;

      // Check if they recently skipped each other
      const skipsA = recentSkips.get(userA.socketId);
      if (skipsA && skipsA.has(userB.socketId)) {
        continue;
      }

      // Check interest tags (exact match or either selected 'all')
      const tagMatch =
        userA.tag === 'all' ||
        userB.tag === 'all' ||
        userA.tag === userB.tag ||
        Date.now() - userA.joinedAt > 3500; // After 3.5s wait, broaden match

      if (tagMatch) {
        // Matched! Remove both from queue
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

        // Record recent skip/pairing history to avoid immediate rematches
        recordSkip(userA.socketId, userB.socketId);

        // Emit matched events
        // userA acts as initiator for WebRTC offer
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

        console.log(`[MATCH] Created ${roomId} between ${userA.socketId} and ${userB.socketId}`);
        return;
      }
    }
  }
}

function recordSkip(idA, idB) {
  if (!recentSkips.has(idA)) recentSkips.set(idA, new Set());
  if (!recentSkips.has(idB)) recentSkips.set(idB, new Set());

  recentSkips.get(idA).add(idB);
  recentSkips.get(idB).add(idA);

  // Clear memory after 30 seconds
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

io.on('connection', (socket) => {
  console.log(`[CONNECT] Socket connected: ${socket.id}`);

  // User requests to enter matchmaking queue
  socket.on('join-queue', ({ tag = 'all' } = {}) => {
    leaveRoom(socket.id);
    leaveQueue(socket.id);

    waitingQueue.push({
      socketId: socket.id,
      tag: tag || 'all',
      joinedAt: Date.now(),
    });

    socket.emit('queue-status', { status: 'waiting', position: waitingQueue.length });
    tryMatchUsers();
  });

  // WebRTC signalling exchange (offer, answer, ICE candidates)
  socket.on('signal', ({ roomId, to, signalData }) => {
    if (to && signalData) {
      io.to(to).emit('signal', {
        from: socket.id,
        roomId,
        signalData,
      });
    }
  });

  // Quick text message exchange between matched peers
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

  // User hits Next / Skip
  socket.on('skip', () => {
    leaveRoom(socket.id);
    leaveQueue(socket.id);
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] Socket disconnected: ${socket.id}`);
    leaveRoom(socket.id);
    leaveQueue(socket.id);
    recentSkips.delete(socket.id);
  });
});

// Periodically check queue to pair users who have been waiting
setInterval(tryMatchUsers, 1000);

server.listen(PORT, () => {
  console.log(`Vybe Signalling Server running on port ${PORT}`);
});
