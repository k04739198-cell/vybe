/**
 * Cloudflare Worker: UK Geo-Block & Regional Compliance Guard
 *
 * Enforces Phase 0.6 of the Vybe build plan:
 * Under the UK Online Safety Act, random video chat platforms face stringent statutory
 * age assurance requirements. Until Vybe implements third-party biometric/credit-card
 * age assurance, UK visitors are blocked from entering active sessions.
 */

export default {
  async fetch(request, env, ctx) {
    const country = request.cf?.country || '';

    // If UK visitor, intercept and render regulatory compliance notice
    if (country === 'GB') {
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vybe — Region Notice</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0B0B0F;
      color: #F9FAFB;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .card {
      max-width: 480px;
      background: #14141E;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 36px 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(124, 58, 237, 0.2);
      border: 1px solid rgba(124, 58, 237, 0.4);
      color: #A855F7;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 12px 0;
    }
    p {
      font-size: 13px;
      color: #9CA3AF;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .notice {
      font-size: 11px;
      color: #6B7280;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Regulatory Notice</div>
    <h1>Vybe is Not Available in the UK</h1>
    <p>
      Vybe is currently tailored exclusively for South Asian audiences (India, Pakistan, Bangladesh, Sri Lanka, Nepal). Due to statutory age-assurance mandates under the UK Online Safety Act, service is currently restricted for visitors originating from the United Kingdom.
    </p>
    <div class="notice">
      Reference: UK Online Safety Act 2023 · Status Code: 451 Unavailable For Legal Reasons
    </div>
  </div>
</body>
</html>`,
        {
          status: 451,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      );
    }

    // Pass all other traffic directly to origin (Vercel Next.js)
    return fetch(request);
  },
};
