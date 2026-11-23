const assert = require('assert');
const {
  initUserSession,
  getUserSession,
  recordUserSkip,
  recordJoinQueue,
  recordRealMatch,
  shouldTriggerDecoy,
  executeDecoyTrigger,
  DECOY_CLIPS,
} = require('./decoyManager');

console.log('--- Testing Decoy Placement Logic ---');

// Test 1: Cold Open (Swipe 1) triggers decoy
const s1 = initUserSession('test_socket_1');
assert.strictEqual(s1.swipeCount, 1);
assert.strictEqual(s1.decoyCount, 0);
assert.strictEqual(s1.lastWasDecoy, false);
assert.strictEqual(shouldTriggerDecoy(s1), true, 'Swipe 1 should trigger decoy');

const clip1 = executeDecoyTrigger(s1);
assert.strictEqual(s1.decoyCount, 1, 'Decoy count should be 1');
assert.strictEqual(s1.lastWasDecoy, true, 'lastWasDecoy should be true');
assert.strictEqual(s1.usedDecoyClips.length, 1);
assert(DECOY_CLIPS.includes(clip1));
console.log('✓ Test 1: Cold Open Swipe 1 triggers decoy');

// Test 2: Never two decoys back to back
assert.strictEqual(shouldTriggerDecoy(s1), false, 'Should never trigger decoy when lastWasDecoy is true');
console.log('✓ Test 2: Never two decoys back-to-back');

// Test 3: Validation Stage (Swipes 2 to 10) never triggers decoys
s1.lastWasDecoy = false; // Even if a real match happened
for (let swipe = 2; swipe <= 10; swipe++) {
  s1.swipeCount = swipe;
  assert.strictEqual(shouldTriggerDecoy(s1), false, `Swipe ${swipe} should NOT trigger decoy`);
}
console.log('✓ Test 3: Validation Swipes 2-10 never trigger decoys');

// Test 4: Comfort Stage (Swipes 11 to 20) triggers ONLY on exact comfortDecoySwipe
assert(s1.comfortDecoySwipe >= 11 && s1.comfortDecoySwipe <= 20);
for (let swipe = 11; swipe <= 20; swipe++) {
  s1.swipeCount = swipe;
  s1.lastWasDecoy = false;
  if (swipe === s1.comfortDecoySwipe) {
    assert.strictEqual(shouldTriggerDecoy(s1), true, `Swipe ${swipe} should trigger comfort decoy`);
  } else {
    assert.strictEqual(shouldTriggerDecoy(s1), false, `Swipe ${swipe} should NOT trigger decoy`);
  }
}
console.log('✓ Test 4: Comfort Stage triggers only on designated random swipe');

// Test 5: Flow Stage (Swipes 21 to 40) triggers ONLY on exact flowDecoySwipe
assert(s1.flowDecoySwipe >= 21 && s1.flowDecoySwipe <= 40);
for (let swipe = 21; swipe <= 40; swipe++) {
  s1.swipeCount = swipe;
  s1.lastWasDecoy = false;
  if (swipe === s1.flowDecoySwipe) {
    assert.strictEqual(shouldTriggerDecoy(s1), true, `Swipe ${swipe} should trigger flow decoy`);
  } else {
    assert.strictEqual(shouldTriggerDecoy(s1), false, `Swipe ${swipe} should NOT trigger decoy`);
  }
}
console.log('✓ Test 5: Flow Stage triggers only on designated random swipe');

// Test 6: Power User Stage (Swipe 41+) never triggers decoys
for (let swipe = 41; swipe <= 60; swipe++) {
  s1.swipeCount = swipe;
  s1.lastWasDecoy = false;
  assert.strictEqual(shouldTriggerDecoy(s1), false, `Swipe ${swipe} should NOT trigger decoy in power user stage`);
}
console.log('✓ Test 6: Power User stage (41+) never triggers decoys');

// Test 7: Hard cap of 3 decoys maximum
const s2 = initUserSession('test_socket_2');
s2.decoyCount = 3;
s2.lastWasDecoy = false;
s2.swipeCount = 1;
assert.strictEqual(shouldTriggerDecoy(s2), false, 'Should not trigger decoy if decoyCount is 3');
s2.swipeCount = s2.comfortDecoySwipe;
assert.strictEqual(shouldTriggerDecoy(s2), false, 'Should not trigger decoy if decoyCount is 3 in comfort stage');
console.log('✓ Test 7: Hard cap of max 3 decoys strictly enforced');

// Test 8: Never show the same decoy clip twice in the same session
const s3 = initUserSession('test_socket_3');
const clipA = executeDecoyTrigger(s3);
const clipB = executeDecoyTrigger(s3);
const clipC = executeDecoyTrigger(s3);
assert.notStrictEqual(clipA, clipB);
assert.notStrictEqual(clipB, clipC);
assert.notStrictEqual(clipA, clipC);
assert.strictEqual(s3.usedDecoyClips.length, 3);
console.log('✓ Test 8: Never shows duplicate decoy clips in the same session');

console.log('\nALL UNIT TESTS PASSED SUCCESSFULLY!');
