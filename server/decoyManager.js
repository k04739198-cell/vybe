// ==============================================================================
// Vybe Decoy Placement System (Server-Side Matchmaking Queue Handler)
// ==============================================================================

const DECOY_CLIPS = [
  '/v/a7f3k.mp4',
  '/v/b8x2m.mp4',
  '/v/c9q4w.mp4',
  '/v/d3n6y.mp4',
  '/v/e5t8r.mp4',
  '/v/f2k7p.mp4',
  '/v/g4m1z.mp4',
  '/v/h6w9s.mp4',
  '/v/j8c3v.mp4',
  '/v/k1b5n.mp4',
  '/v/l3x7q.mp4',
  '/v/m5z2k.mp4',
  '/v/n7w4t.mp4',
  '/v/p9r6m.mp4',
  '/v/q2y8b.mp4',
  '/v/r4k1p.mp4',
  '/v/s6m3z.mp4',
  '/v/t8w5v.mp4',
  '/v/u1q7x.mp4',
  '/v/v3b9r.mp4',
  '/v/w5p2k.mp4',
  '/v/x7n4m.mp4',
  '/v/y9z6q.mp4',
  '/v/z2t8w.mp4',
];

// In-memory user session state: socketId -> session
const userSessions = new Map();

/**
 * Initialize a new user session state when socket joins
 */
function initUserSession(socketId) {
  // Comfort stage: pick one random swipe number in [11, 20]
  const comfortSwipe = Math.floor(Math.random() * (20 - 11 + 1)) + 11;
  // Flow stage: pick one random swipe number in [21, 40]
  const flowSwipe = Math.floor(Math.random() * (40 - 21 + 1)) + 21;

  const session = {
    socketId,
    swipeCount: 1, // Starts at Swipe 1 (Cold open)
    decoyCount: 0, // Hard capped at 3
    lastWasDecoy: false, // Prevents back-to-back decoys
    usedDecoyClips: [], // Array of clip filenames already shown this session
    comfortDecoySwipe: comfortSwipe,
    flowDecoySwipe: flowSwipe,
    hasStarted: false,
    skipPending: false,
  };

  userSessions.set(socketId, session);
  return session;
}

function getUserSession(socketId) {
  return userSessions.get(socketId) || initUserSession(socketId);
}

function removeUserSession(socketId) {
  userSessions.delete(socketId);
}

/**
 * Increments swipeCount when user explicitly skips/swipes
 */
function recordUserSkip(socketId) {
  const session = getUserSession(socketId);
  session.swipeCount += 1;
  session.skipPending = true;
  return session;
}

/**
 * Handle entering the matchmaking queue:
 * Sets swipe 1 on initial entry, or increments swipe count if retrying after decoy
 */
function recordJoinQueue(socketId) {
  const session = getUserSession(socketId);
  if (!session.hasStarted) {
    session.hasStarted = true;
    session.swipeCount = 1;
    session.skipPending = false;
  } else if (!session.skipPending) {
    // Retrying after a decoy finished automatically without manual skip button
    session.swipeCount += 1;
  } else {
    session.skipPending = false;
  }
  return session;
}

/**
 * Resets lastWasDecoy flag when a real peer connection is established
 */
function recordRealMatch(socketIdA, socketIdB) {
  const sessionA = userSessions.get(socketIdA);
  if (sessionA) sessionA.lastWasDecoy = false;

  const sessionB = userSessions.get(socketIdB);
  if (sessionB) sessionB.lastWasDecoy = false;
}

/**
 * Decoy trigger decision logic
 *
 * Hard Rules (none ever break):
 * 1. Max 3 decoys total per session regardless of swipe count
 * 2. Never two decoys back to back under any circumstance
 * 3. If a real user is available, always serve the real user (caller guarantees queue is empty)
 * 4. Never show the same decoy clip twice in the same session
 * 5. Show text "just missed them — keep going" for 1 second after clip
 *
 * Placement Table:
 * - Swipe 1: Always trigger a decoy if queue is empty
 * - Swipes 2–10: No decoys at all — real matchmaking only
 * - Swipes 11–20: Trigger only on exact comfortDecoySwipe (max 1)
 * - Swipes 21–40: Trigger only on exact flowDecoySwipe (max 1)
 * - Swipes 41+: Zero decoys — real matchmaking only
 */
function shouldTriggerDecoy(session) {
  // Hard Rule 1: Max 3 decoys total per session
  if (session.decoyCount >= 3) return false;

  // Hard Rule 2: Never two decoys back to back
  if (session.lastWasDecoy) return false;

  const swipe = session.swipeCount;

  // Cold open: Swipe 1
  if (swipe === 1) return true;

  // Validation: Swipes 2–10 -> No decoys at all
  if (swipe >= 2 && swipe <= 10) return false;

  // Comfort: Swipes 11–20 -> Max 1, trigger only on exact random swipe
  if (swipe >= 11 && swipe <= 20) {
    return swipe === session.comfortDecoySwipe;
  }

  // Flow: Swipes 21–40 -> Max 1, trigger only on exact random swipe
  if (swipe >= 21 && swipe <= 40) {
    return swipe === session.flowDecoySwipe;
  }

  // Power user: Swipe 41+ -> Zero decoys
  return false;
}

/**
 * Pick an unused decoy clip for this session and mark state
 */
function executeDecoyTrigger(session) {
  // Hard Rule 4: Never show the same decoy clip twice in the same session
  const unusedClips = DECOY_CLIPS.filter((clip) => !session.usedDecoyClips.includes(clip));
  const pool = unusedClips.length > 0 ? unusedClips : DECOY_CLIPS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedClip = pool[randomIndex];

  session.usedDecoyClips.push(selectedClip);
  session.decoyCount += 1;
  session.lastWasDecoy = true;

  return selectedClip;
}

module.exports = {
  DECOY_CLIPS,
  initUserSession,
  getUserSession,
  removeUserSession,
  recordUserSkip,
  recordJoinQueue,
  recordRealMatch,
  shouldTriggerDecoy,
  executeDecoyTrigger,
};
