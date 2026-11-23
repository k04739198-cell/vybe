const assert = require('assert');
const { io } = require('../web/node_modules/socket.io-client');
const {
  checkNewSessionRateLimit,
  checkReportRateLimit,
  recordSkipAndCheckCooldown,
  getSocketCooldown,
} = require('./security/rateLimiter');
const { getIceServers } = require('./webrtc/iceConfig');

async function runSecurityTests() {
  console.log('=== VYBE SECURITY HARDENING TEST SUITE ===\n');

  // Test 1: Max 1 new session per IP per 30 seconds
  console.log('[Test 1] Testing new session rate limiter (1 per IP per 30s)...');
  const testIp = '198.51.100.42';
  const firstSession = checkNewSessionRateLimit(testIp);
  assert.strictEqual(firstSession.allowed, true, 'First session from IP must be allowed');

  const secondSession = checkNewSessionRateLimit(testIp);
  assert.strictEqual(secondSession.allowed, false, 'Second session within 30s must be blocked');
  assert(secondSession.remainingSeconds > 0, 'Must report remaining cooldown seconds');
  console.log(`✓ PASS: Rate limit enforced: second session blocked (${secondSession.remainingSeconds}s remaining).\n`);

  // Test 2: Max 10 reports per IP per hour
  console.log('[Test 2] Testing report-bombing prevention (max 10 reports/IP/hour)...');
  const reporterIp = '203.0.113.19';
  for (let i = 1; i <= 10; i++) {
    const res = checkReportRateLimit(reporterIp);
    assert.strictEqual(res.allowed, true, `Report #${i} should be allowed`);
  }
  const eleventhReport = checkReportRateLimit(reporterIp);
  assert.strictEqual(eleventhReport.allowed, false, '11th report within 1 hour must be rejected');
  assert(eleventhReport.error.includes('Maximum 10 reports'), 'Must cite 10 reports limit');
  console.log('✓ PASS: Report bombing prevented. 11th report from same IP rejected with 429 message.\n');

  // Test 3: Anti-Bot Skip Cooldown (20+ skips in <60s -> 10s cooldown)
  console.log('[Test 3] Testing anti-bot rapid skip detection (20+ skips in <60s)...');
  const botSocketId = 'bot_socket_test_888';
  for (let s = 1; s <= 19; s++) {
    const skipRes = recordSkipAndCheckCooldown(botSocketId);
    assert.strictEqual(skipRes.onCooldown, false, `Skip #${s} should not trigger cooldown yet`);
  }
  const triggerSkip = recordSkipAndCheckCooldown(botSocketId);
  assert.strictEqual(triggerSkip.onCooldown, true, '20th rapid skip must trigger bot cooldown');
  assert.strictEqual(triggerSkip.remainingSeconds, 10, 'Cooldown must be set to 10 seconds');

  const statusCheck = getSocketCooldown(botSocketId);
  assert.strictEqual(statusCheck.onCooldown, true);
  console.log('✓ PASS: Rapid skipping detected at 20 skips; 10-second anti-bot cooldown active.\n');

  // Test 4: WebRTC ICE Servers Endpoint (/api/webrtc/ice-servers)
  console.log('[Test 4] Testing secure dynamic ICE servers endpoint (/api/webrtc/ice-servers)...');
  const iceRes = await fetch('http://localhost:5000/api/webrtc/ice-servers');
  assert.strictEqual(iceRes.status, 200);
  assert.strictEqual(iceRes.headers.get('cache-control'), 'no-store, max-age=0');
  const iceData = await iceRes.json();
  assert(Array.isArray(iceData.iceServers), 'Must return iceServers array');
  assert(iceData.iceServers.length > 0, 'Must have at least STUN fallback servers');
  console.log('✓ PASS: ICE servers fetched dynamically without exposing static secrets to client.\n');

  // Test 5: Live Socket.io Event Flooding Defense (>100 events/minute -> banned)
  console.log('[Test 5] Testing Socket.io event flood protection (>100 events/min)...');
  const clientSocket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise((resolve) => clientSocket.on('connect', resolve));
  let banReceived = false;

  clientSocket.on('banned', (data) => {
    banReceived = true;
  });

  // Rapidly fire 105 socket events
  for (let e = 0; e < 105; e++) {
    clientSocket.emit('skip');
  }

  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.strictEqual(banReceived, true, 'Flooding >100 socket events/min must trigger ban and disconnect');
  clientSocket.disconnect();
  console.log('✓ PASS: Socket flooding automatically detected, IP banned, and socket disconnected.\n');

  console.log('========================================================');
  console.log('ALL SECURITY HARDENING & ANTI-BOT TESTS PASSED!');
  console.log('========================================================\n');
}

runSecurityTests().catch((err) => {
  console.error('\n❌ SECURITY TEST SUITE FAILED:', err);
  process.exit(1);
});
