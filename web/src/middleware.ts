import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // 1. HTTPS enforcement (redirect HTTP to HTTPS in production)
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host');
  if (proto === 'http' && host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // 2. UK Geo-Block (UK Online Safety Act 2023 Compliance)
  // Check Vercel, Cloudflare, and simulated test headers
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    url.searchParams.get('test_geo') ||
    '';

  if (country.toUpperCase() === 'GB' || country.toUpperCase() === 'UK') {
    // Return HTTP 451: Unavailable For Legal Reasons
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vybe — Notice of Regional Unavailability (451)</title>
  <style>
    * { box-sizing: border-box; }
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
      padding: 24px;
    }
    .card {
      max-width: 500px;
      width: 100%;
      background: #14141E;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 28px;
      padding: 40px 28px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.7);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(124, 58, 237, 0.2);
      border: 1px solid rgba(124, 58, 237, 0.4);
      color: #C084FC;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 20px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 14px 0;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 13px;
      color: #9CA3AF;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .notice {
      font-size: 11px;
      color: #6B7280;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 18px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Legal & Regulatory Notice</div>
    <h1>Vybe is Not Available in the United Kingdom</h1>
    <p>
      Vybe is tailored for South Asian audiences (India, Pakistan, Bangladesh, Sri Lanka, Nepal). Under the UK Online Safety Act 2023, random live video services require specialized statutory age-assurance regimes. Service is restricted for visitors originating from the United Kingdom.
    </p>
    <div class="notice">
      HTTP 451: Unavailable For Legal Reasons · Reference: UK Online Safety Act 2023
    </div>
  </div>
</body>
</html>`,
      {
        status: 451,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'no-store, max-age=0',
          'X-Compliance-Block': 'UK-Online-Safety-Act-2023',
        },
      }
    );
  }

  // 3. Security headers for all standard responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|v).*)'],
};
