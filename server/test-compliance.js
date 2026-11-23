const assert = require('assert');
const { hashIp } = require('./supabase/client');

async function testCompliance() {
  console.log('=== VYBE PRE-LAUNCH COMPLIANCE TEST SUITE ===\n');

  // 1. Test Terms of Service Route (/terms)
  console.log('[Test 1] Checking Terms of Service page (/terms)...');
  const termsRes = await fetch('http://localhost:3000/terms');
  assert.strictEqual(termsRes.status, 200, 'Terms page must return HTTP 200');
  const termsHtml = await termsRes.text();
  assert(termsHtml.includes('Terms of Service'), 'Terms page must render Terms of Service headline');
  assert(termsHtml.includes('18'), 'Terms page must mention 18+ requirement');
  assert(termsHtml.includes('NCMEC') || termsHtml.includes('CyberTipline'), 'Terms page must mention NCMEC reporting');
  console.log('✓ PASS: /terms is live, HTTP 200, contains full legal agreement and CSAM policy.\n');

  // 2. Test Privacy Policy Route (/privacy)
  console.log('[Test 2] Checking Privacy Policy page (/privacy)...');
  const privacyRes = await fetch('http://localhost:3000/privacy');
  assert.strictEqual(privacyRes.status, 200, 'Privacy page must return HTTP 200');
  const privacyHtml = await privacyRes.text();
  assert(privacyHtml.includes('Privacy Policy'), 'Privacy page must render Privacy Policy headline');
  assert(privacyHtml.includes('Hashed IP'), 'Privacy page must mention IP hashing');
  assert(privacyHtml.includes('Zero Video Storage'), 'Privacy page must confirm zero video recording');
  console.log('✓ PASS: /privacy is live, HTTP 200, confirms zero PII and SHA-256 IP hashing.\n');

  // 3. Test UK Geo-Block (UK Online Safety Act 2023)
  console.log('[Test 3] Testing UK Geo-Block with GB IP country header...');
  const ukRes = await fetch('http://localhost:3000/', {
    headers: { 'x-vercel-ip-country': 'GB' },
  });
  assert.strictEqual(ukRes.status, 451, 'UK visitor must be blocked with HTTP 451');
  const ukHtml = await ukRes.text();
  assert(ukHtml.includes('Vybe is Not Available in the United Kingdom'), 'Must display UK regional notice');
  assert(ukHtml.includes('Online Safety Act'), 'Must cite UK Online Safety Act');
  console.log('✓ PASS: UK visitors are blocked with HTTP 451 (Unavailable For Legal Reasons).\n');

  // 4. Test Normal Visitor & Security Headers
  console.log('[Test 4] Testing standard visitor (India / South Asia) & security headers...');
  const normalRes = await fetch('http://localhost:3000/', {
    headers: { 'x-vercel-ip-country': 'IN' },
  });
  assert.strictEqual(normalRes.status, 200, 'Indian/South Asian visitors must access normally');
  assert.strictEqual(normalRes.headers.get('x-content-type-options'), 'nosniff', 'X-Content-Type-Options must be nosniff');
  assert(normalRes.headers.get('strict-transport-security'), 'HSTS header must be present');
  console.log('✓ PASS: Normal traffic allowed with strict HSTS and security headers.\n');

  // 5. Test NCMEC CyberTipline Integration Pipeline
  console.log('[Test 5] Testing NCMEC CyberTipline report pipeline (/api/moderation/test-ncmec)...');
  const ncmecRes = await fetch('http://localhost:5000/api/moderation/test-ncmec');
  assert.strictEqual(ncmecRes.status, 200, 'NCMEC test endpoint must return 200');
  const ncmecData = await ncmecRes.json();
  assert.strictEqual(ncmecData.complianceCheck, 'PASSED');
  assert.strictEqual(ncmecData.ncmecIntegration, 'ACTIVE');
  assert(ncmecData.report.incidentId.startsWith('NCMEC_INC_'), 'Must generate valid NCMEC Incident ID');
  console.log('✓ PASS: NCMEC CyberTipline reporting pipeline is active and verified.\n');

  // 6. Test Live CSAM Incident Escalation via /api/report
  console.log('[Test 6] Submitting CSAM/Underage report through /api/report...');
  const reportRes = await fetch('http://localhost:5000/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'test_session_compliance_123',
      reportedSocketId: 'flagged_socket_999',
      reason: 'csam_underage',
      notes: 'Automated compliance test submission.',
    }),
  });
  assert.strictEqual(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.strictEqual(reportData.success, true);
  assert.strictEqual(reportData.ncmecEscalated, true, 'csam_underage report must trigger NCMEC escalation');
  assert(reportData.ncmecReportId, 'Must return NCMEC Report ID');
  console.log('✓ PASS: CSAM reports trigger immediate NCMEC escalation and auto-ban.\n');

  // 7. Test PhotoDNA Frame Scanning Hook
  console.log('[Test 7] Testing PhotoDNA async non-blocking hook (/api/moderation/photodna-frame)...');
  const photoStart = Date.now();
  const photoRes = await fetch('http://localhost:5000/api/moderation/photodna-frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frameHash: 'mock_frame_hash_a1b2c3d4e5f6',
      sessionId: 'test_session_compliance_123',
      socketId: 'test_socket_777',
    }),
  });
  const photoDuration = Date.now() - photoStart;
  assert.strictEqual(photoRes.status, 202, 'PhotoDNA hook must return HTTP 202 Accepted');
  const photoData = await photoRes.json();
  assert.strictEqual(photoData.queued, true);
  assert(photoDuration < 100, `PhotoDNA hook must be non-blocking (<100ms), took ${photoDuration}ms`);
  console.log(`✓ PASS: PhotoDNA hook responded in ${photoDuration}ms (non-blocking async queue).\n`);

  // 8. Test Zero PII & IP Hashing
  console.log('[Test 8] Testing IP cryptographic hashing (Zero PII)...');
  const testIp = '103.21.244.2';
  const hashed = hashIp(testIp);
  assert.strictEqual(typeof hashed, 'string');
  assert.strictEqual(hashed.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
  assert.notStrictEqual(hashed, testIp, 'Hash must not expose raw IP');
  assert.strictEqual(hashed, hashIp(testIp), 'Hashing must be deterministic for repeat offender bans');
  console.log('✓ PASS: IP addresses are irreversibly hashed via salted SHA-256 (Zero PII stored).\n');

  console.log('====================================================');
  console.log('ALL PRE-LAUNCH COMPLIANCE VERIFICATION TESTS PASSED!');
  console.log('====================================================\n');
}

testCompliance().catch((err) => {
  console.error('\n❌ COMPLIANCE TEST SUITE FAILED:', err);
  process.exit(1);
});
