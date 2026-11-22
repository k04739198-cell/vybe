const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    console.log('[SUPABASE] Connected to Supabase backend successfully.');
  } catch (err) {
    console.error('[SUPABASE] Initialization error:', err.message);
  }
} else {
  console.log('[SUPABASE] No SUPABASE_URL / KEY detected — running with in-memory store.');
}

/**
 * Hash IP addresses using SHA-256 with an optional salt to preserve user privacy
 * while allowing repeat offender moderation.
 */
function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || 'vybe-salt-2026';
  return crypto.createHash('sha256').update(`${ip}_${salt}`).digest('hex');
}

/**
 * Log a moderation report to Supabase or memory
 */
async function saveReport({ sessionId, reporterIp, reportedPeerId, reason, notes }) {
  const ipHash = hashIp(reporterIp || 'unknown');
  const reportData = {
    session_id: sessionId || null,
    reporter_ip_hash: ipHash,
    reported_peer_id: reportedPeerId,
    reason: reason || 'unspecified',
    notes: notes || '',
    status: 'pending',
  };

  if (supabase) {
    const { data, error } = await supabase.from('reports').insert([reportData]).select();
    if (error) {
      console.error('[SUPABASE ERROR] Failed to save report:', error.message);
    }
    return data ? data[0] : null;
  }
  return { id: `local_${Date.now()}`, ...reportData, created_at: new Date().toISOString() };
}

/**
 * Check if an IP hash is currently banned
 */
async function isIpBanned(rawIp) {
  const ipHash = hashIp(rawIp);
  if (supabase) {
    const { data } = await supabase
      .from('banned_ips')
      .select('id, reason, banned_until')
      .eq('ip_hash', ipHash)
      .eq('is_active', true)
      .maybeSingle();

    if (!data) return false;
    if (data.banned_until && new Date(data.banned_until) < new Date()) {
      return false; // Ban expired
    }
    return true;
  }
  return false;
}

/**
 * Ban an IP hash for a given duration (or permanent)
 */
async function banIp(rawIp, reason, durationMinutes = 60) {
  const ipHash = hashIp(rawIp);
  const bannedUntil = durationMinutes ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString() : null;

  if (supabase) {
    await supabase.from('banned_ips').upsert([
      {
        ip_hash: ipHash,
        reason,
        banned_until: bannedUntil,
        is_active: true,
      },
    ]);
  }
}

/**
 * Track an analytics event (e.g. decoy triggered, real match)
 */
async function trackEvent(eventName, payload = {}) {
  if (supabase) {
    await supabase.from('analytics_events').insert([{ event_name: eventName, payload }]);
  }
}

module.exports = {
  supabase,
  hashIp,
  saveReport,
  isIpBanned,
  banIp,
  trackEvent,
};
