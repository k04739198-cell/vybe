const { io } = require('socket.io-client');
const assert = require('assert');

async function runTest() {
  console.log('--- Starting Integration Test with Live Signalling Server ---');
  const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✓ Connected to server, socketId:', socket.id);
      resolve();
    });
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 3000);
  });

  // --- Step 1: Cold Open (Swipe 1) -> Must trigger decoy ---
  console.log('\n[Step 1] Requesting join-queue for Swipe 1 (Cold Open)...');
  const step1Promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Step 1 timeout')), 3000);
    socket.once('trigger-decoy', (data) => {
      clearTimeout(timeout);
      console.log('✓ Received trigger-decoy for Swipe 1:', data);
      assert(data.clipUrl && data.clipUrl.startsWith('/decoys/'), 'Must have valid decoy clip URL');
      assert.strictEqual(data.swipeCount, 1, 'swipeCount must be 1');
      assert.strictEqual(data.decoyCount, 1, 'decoyCount must be 1');
      resolve(data);
    });
    socket.once('queue-waiting', () => {
      clearTimeout(timeout);
      reject(new Error('Step 1 should NOT be queue-waiting, it must be decoy!'));
    });
  });

  socket.emit('join-queue', { tag: 'all' });
  const step1Data = await step1Promise;

  // --- Step 2: Advance to Swipe 2 (Validation 2–10) -> Must NOT trigger decoy, must emit queue-waiting ---
  console.log('\n[Step 2] Simulating decoy finished -> retrying matchmaking (Swipe 2: Validation)...');
  const step2Promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Step 2 timeout')), 3000);
    socket.once('queue-waiting', (data) => {
      clearTimeout(timeout);
      console.log('✓ Received queue-waiting for Swipe 2 (Validation stage):', data);
      assert.strictEqual(data.swipeCount, 2, 'swipeCount must be 2');
      assert.strictEqual(data.decoyCount, 1, 'decoyCount must stay 1');
      resolve(data);
    });
    socket.once('trigger-decoy', (data) => {
      clearTimeout(timeout);
      reject(new Error(`Step 2 received decoy when it should be Validation stage! ${JSON.stringify(data)}`));
    });
  });

  socket.emit('join-queue', { tag: 'all' });
  await step2Promise;

  // --- Step 3: User skips while in queue (Swipe 3: Validation) -> Must emit queue-waiting ---
  console.log('\n[Step 3] Simulating user skip -> joining queue for Swipe 3 (Validation)...');
  const step3Promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Step 3 timeout')), 3000);
    socket.once('queue-waiting', (data) => {
      clearTimeout(timeout);
      console.log('✓ Received queue-waiting for Swipe 3 (Validation stage):', data);
      assert.strictEqual(data.swipeCount, 3, 'swipeCount must be 3');
      assert.strictEqual(data.decoyCount, 1, 'decoyCount must stay 1');
      resolve(data);
    });
    socket.once('trigger-decoy', (data) => {
      clearTimeout(timeout);
      reject(new Error(`Step 3 received decoy in Validation stage! ${JSON.stringify(data)}`));
    });
  });

  socket.emit('skip');
  socket.emit('join-queue', { tag: 'all' });
  await step3Promise;

  socket.disconnect();
  console.log('\n✓ ALL LIVE INTEGRATION TESTS PASSED PERFECTLY!');
}

runTest().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
