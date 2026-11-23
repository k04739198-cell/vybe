// ==============================================================================
// Vybe Security Hardening & Rate Limiting Module
// ==============================================================================

const { banIp, hashIp } = require('../supabase/client');

// In-memory tracking stores
const lastNewSessionByIp = new Map();   // ip -> timestamp (ms)
const reportsByIp = new Map();           // ip -> array of timestamps (ms)
const socketEventsByIp = new Map();      // ip -> array of timestamps (ms)
const skipsBySocket = new Map();         // socketId -> array of timestamps (ms)
const cooldownUntilBySocket = new Map(); // socketId -> timestamp (ms)
const reportsByTarget = new Map();       // targetSocketId -> array of { reporterIp, timestamp }

// Periodic cleanup of stale tracking data (every 5 minutes)
setInterval(() => {
  const now = Date.now();

  // Clean sessions older than 60s
  for (const [ip, time] of lastNewSessionByIp.entries()) {
    if (now - time > 60000) lastNewSessionByIp.delete(ip);
  }

  // Clean report history older than 1 hour
  for (const [ip, times] of reportsByIp.entries()) {
    const valid = times.filter((t) => now - t < 3600000);
    if (valid.length === 0) reportsByIp.delete(ip);
    else reportsByIp.set(ip, valid);
  }

  // Clean event counts older than 1 minute
  for (const [ip, times] of socketEventsByIp.entries()) {
    const valid = times.filter((t) => now - t < 60000);
    if (valid.length === 0) socketEventsByIp.delete(ip);
    else socketEventsByIp.set(ip, valid);
  }

  // Clean skips older than 1 minute
  for (const [socketId, times] of skipsBySocket.entries()) {
    const valid = times.filter((t) => now - t < 60000);
    if (valid.length === 0) skipsBySocket.delete(socketId);
    else skipsBySocket.set(socketId, valid);
  }

  // Clean expired cooldowns
  for (const [socketId, until] of cooldownUntilBySocket.entries()) {
    if (now > until) cooldownUntilBySocket.delete(socketId);
  }

  // Clean target reports older than 10 minutes
  for (const [targetId, reports] of reportsByTarget.entries()) {
    const valid = reports.filter((r) => now - r.timestamp < 600000);
    if (valid.length === 0) reportsByTarget.delete(targetId);
    else reportsByTarget.set(targetId, valid);
  }
}, 300000);

/**
 * 1. Max 1 new session per IP per 30 seconds
 */
function checkNewSessionRateLimit(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { allowed: true };
  }
  const now = Date.now();
  const lastTime = lastNewSessionByIp.get(ip);

  if (lastTime && now - lastTime < 30000) {
    const remainingSeconds = Math.ceil((30000 - (now - lastTime)) / 1000);
    return {
      allowed: false,
      remainingSeconds,
      error: `New session rate limit exceeded. Please wait ${remainingSeconds}s.`,
    };
  }

  lastNewSessionByIp.set(ip, now);
  return { allowed: true };
}

/**
 * 2. Max 10 reports per IP per hour to prevent report-bombing
 */
function checkReportRateLimit(ip) {
  const now = Date.now();
  const times = reportsByIp.get(ip) || [];
  const recentReports = times.filter((t) => now - t < 3600000); // 1 hour

  if (recentReports.length >= 10) {
    return {
      allowed: false,
      error: 'Report limit reached. Maximum 10 reports per IP per hour allowed.',
    };
  }

  recentReports.push(now);
  reportsByIp.set(ip, recentReports);
  return { allowed: true };
}

/**
 * 3. Block IPs that send more than 100 Socket.io events per minute
 */
async function checkSocketEventRateLimit(ip, socket) {
  if (!ip) return { blocked: false };
  const now = Date.now();
  const events = socketEventsByIp.get(ip) || [];
  const recentEvents = events.filter((t) => now - t < 60000); // 1 minute

  recentEvents.push(now);
  socketEventsByIp.set(ip, recentEvents);

  if (recentEvents.length > 100) {
    console.warn(`[SECURITY BAN] IP ${ip} flooded ${recentEvents.length} socket events/min. Banning IP.`);
    await banIp(ip, 'Socket event flooding (>100 events/minute)', 60); // 1-hour ban
    socket.emit('banned', { reason: 'Connection terminated due to automated event flooding.' });
    socket.disconnect(true);
    return { blocked: true };
  }

  return { blocked: false };
}

/**
 * 4. Spam Prevention: If a user skips 20+ times in under 60 seconds,
 *    add a 10-second cooldown before next match.
 */
function recordSkipAndCheckCooldown(socketId) {
  const now = Date.now();
  const skips = skipsBySocket.get(socketId) || [];
  const recentSkips = skips.filter((t) => now - t < 60000); // 60 seconds

  recentSkips.push(now);
  skipsBySocket.set(socketId, recentSkips);

  if (recentSkips.length >= 20) {
    const cooldownUntil = now + 10000; // 10-second cooldown
    cooldownUntilBySocket.set(socketId, cooldownUntil);
    return {
      onCooldown: true,
      remainingSeconds: 10,
      message: 'Rapid skipping detected. Bot prevention cooldown active for 10 seconds.',
    };
  }

  return { onCooldown: false, remainingSeconds: 0 };
}

/**
 * Check if socket is currently within its 10-second cooldown period
 */
function getSocketCooldown(socketId) {
  const now = Date.now();
  const until = cooldownUntilBySocket.get(socketId);
  if (until && now < until) {
    const remainingSeconds = Math.ceil((until - now) / 1000);
    return { onCooldown: true, remainingSeconds };
  }
  return { onCooldown: false, remainingSeconds: 0 };
}

/**
 * 5. Auto-ban IPs that receive 3+ reports within 10 minutes
 */
async function recordReportAgainstTarget(targetSocketId, reporterIp, reason, socketToIpMap) {
  const now = Date.now();
  const reports = reportsByTarget.get(targetSocketId) || [];
  const recent = reports.filter((r) => now - r.timestamp < 600000); // 10 minutes

  recent.push({ reporterIp, reason, timestamp: now });
  reportsByTarget.set(targetSocketId, recent);

  const shouldBan = recent.length >= 3 || reason === 'csam_underage';
  const targetIp = socketToIpMap.get(targetSocketId) || null;

  if (shouldBan && targetIp) {
    const banReason = reason === 'csam_underage'
      ? 'Critical safety violation (CSAM / minor safety)'
      : '3+ abuse reports received within 10 minutes';
    await banIp(targetIp, banReason, 1440); // 24-hour ban
    return { banned: true, reportCount: recent.length, targetIp, banReason };
  }

  return { banned: false, reportCount: recent.length };
}

function clearSocketTracking(socketId) {
  skipsBySocket.delete(socketId);
  cooldownUntilBySocket.delete(socketId);
  reportsByTarget.delete(socketId);
}

module.exports = {
  checkNewSessionRateLimit,
  checkReportRateLimit,
  checkSocketEventRateLimit,
  recordSkipAndCheckCooldown,
  getSocketCooldown,
  recordReportAgainstTarget,
  clearSocketTracking,
};
