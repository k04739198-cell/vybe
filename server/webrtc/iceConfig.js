// ==============================================================================
// Vybe WebRTC ICE / TURN Configuration Service (Zero Client-Side Credentials)
// ==============================================================================

const crypto = require('crypto');

/**
 * Default high-availability Google STUN servers (no credentials required)
 */
const DEFAULT_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * Generate ephemeral, time-limited TURN credentials if coturn / Metered is configured.
 * Credentials are valid for 24 hours. Static keys are NEVER sent to the client.
 */
function getIceServers() {
  const coturnSecret = process.env.COTURN_SECRET;
  const coturnRealm = process.env.COTURN_REALM || 'turn.example.com';
  const coturnHost = process.env.COTURN_HOST;

  // Option A: Self-hosted Coturn with HMAC-SHA1 shared secret (RFC 5766)
  if (coturnSecret && coturnHost) {
    const ttlSeconds = 86400; // 24 hours
    const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
    const username = `${expiry}:vybe_ephemeral_${Math.random().toString(36).substring(7)}`;
    const hmac = crypto.createHmac('sha1', coturnSecret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    return [
      ...DEFAULT_STUN_SERVERS,
      {
        urls: [
          `turn:${coturnHost}:3478?transport=udp`,
          `turn:${coturnHost}:3478?transport=tcp`,
          `turns:${coturnHost}:5349?transport=tcp`,
        ],
        username,
        credential,
      },
    ];
  }

  // Option B: Metered.ca TURN provider credentials configured via env
  const meteredApiKey = process.env.METERED_API_KEY;
  const meteredDomain = process.env.METERED_DOMAIN;
  if (meteredApiKey && meteredDomain) {
    // Ephemeral credentials derived from backend secret
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    const username = `${expiry}:metered_user`;
    const hmac = crypto.createHmac('sha1', meteredApiKey);
    hmac.update(username);
    const credential = hmac.digest('base64');

    return [
      ...DEFAULT_STUN_SERVERS,
      {
        urls: [
          `turn:${meteredDomain}:80?transport=udp`,
          `turn:${meteredDomain}:443?transport=tcp`,
          `turns:${meteredDomain}:443?transport=tcp`,
        ],
        username,
        credential,
      },
    ];
  }

  // Default fallback: STUN servers
  return DEFAULT_STUN_SERVERS;
}

module.exports = {
  getIceServers,
};
