# Vybe — Full Build Plan

Nov 22, 2026 · @ka

## Product Overview

Vybe is a no-login random video chat platform built for South Asia — clean, fast, and premium-feeling, in the vein of Instagram's visual language. Users open the app, tap once, and immediately start scrolling through live strangers via video. No account, no profile, no friction.

The core loop is the scroll — not a "Next" button like old Omegle, but a swipe-native experience where each face is a moment. During cold start, AI-generated decoy clips play briefly to simulate platform activity and create the hook that keeps new users waiting patiently for real matches.

**What we are building:**

- A web-first random video chat app (PWA, mobile-optimised)
- 18+ adult platform, South Asia focus (India, Pakistan, Bangladesh, Sri Lanka, Nepal)
- Ad-monetised from day one (mainstream + adult-adjacent networks)
- Legally compliant from the ground up — CSAM detection, abuse reporting, 18+ gate

**Core decisions locked:**

| Decision | Choice | Reason |
| --- | --- | --- |
| Name | Vybe | Short, global, no trademark conflict |
| Login | None | Zero friction entry |
| Geography | South Asia first | Simpler compliance, big TAM |
| Monetisation | Ads | Earn from day one, no paywall |
| Platform | Web-first PWA | No app store gatekeeping |
| Stack | Next.js + Node + WebRTC | Free, reliable, Antigravity-friendly |

## Phase 0 — Legal & Compliance (Before Any Code)

This phase is non-negotiable. Everything here must exist before Vybe accepts a single real user. Most of it is free or near-free to implement.

**0.1 — Terms of Service & Privacy Policy**

- Must explicitly state: 18+ only, no CSAM, no solicitation, no illegal content
- Must include a data handling clause (even with no login, IP addresses are data)
- Use a lawyer-drafted template or a service like Termly (\~$10/month) to generate India/South Asia compliant versions
- Add a POCSO compliance clause specific to Indian law

**0.2 — Age Gate**

- A single checkbox on entry: "I confirm I am 18 or older"
- Not bulletproof, but legally significant — shifts liability to the user if they lie
- Store the confirmation timestamp in session (no account needed)
- Design it to feel native, not like a warning screen

**0.3 — NCMEC CyberTipline Integration**

- Register at [www.missingkids.org/gethelpnow/cybertipline](https://www.missingkids.org/gethelpnow/cybertipline)
- Free for platforms — gives you a reporting pipeline for CSAM
- In the US this is mandatory; for India it demonstrates good faith and protects founders personally under IT Act
- Takes 1–2 weeks to get approved

**0.4 — PhotoDNA Integration**

- Microsoft's free CSAM hash-matching service for platforms
- Apply at [microsoft.com/en-us/photodna](https://www.microsoft.com/en-us/photodna)
- Checks video frames against a known CSAM hash database in real time
- Free for qualifying platforms — apply early as approval takes time

**0.5 — In-App Reporting Button**

- Every video session must have a visible "Report" button
- Reports go to a moderation queue (can be a simple email/Supabase table to start)
- Required in most jurisdictions, signals good faith in any legal proceeding

**0.6 — Geo-block or Restrict UK Users (Day One)**

- UK's Online Safety Act is actively enforcing against random chat platforms right now
- Until Vybe has age assurance infrastructure, the safest move is to geo-block UK IPs
- Simple Cloudflare rule, free, takes 10 minutes
- Revisit when scaling beyond South Asia

**0.7 — Company Registration**

- Register a Private Limited company in India before launch
- Separates founder personal liability from platform liability
- Cost: \~₹7,000–10,000 via Razorpay Rize, Vakilsearch or similar
- Opens up proper GST registration for ad revenue

| Item | Cost | Timeline |
| --- | --- | --- |
| ToS + Privacy Policy | \~₹0–1,000 (template) | Day 1 |
| Age gate (dev work) | ₹0 | 1 hour |
| NCMEC registration | Free | 1–2 weeks |
| PhotoDNA | Free | 2–4 weeks |
| Report button (dev) | ₹0 | 2 hours |
| UK geo-block | Free (Cloudflare) | 10 mins |
| Company registration | \~₹8,000 | 2–4 weeks |

## Phase 1 — MVP Build

The MVP has three distinct parts: the UI shell, the video engine, and the decoy system. Build in this order.

**1.1 — UI Shell (Antigravity's first task)**

The UI is the differentiator. It must feel like Instagram, not Omegle. Key principles:

- Full-screen video feed, face centred, dark background
- Swipe-up / tap-next gesture to move to the next person
- Minimal chrome — only a report button, a mute button, and a subtle Vybe logo
- Bottom of screen: a thin strip for a text message (optional, can be Phase 2)
- Age gate splash screen on first load — single checkbox, clean design, disappears fast
- Entry screen: one button — "Start Vybing" — nothing else

Design reference for Antigravity: think Hinge's video card meets Instagram Stories meets TikTok fullscreen.

**1.2 — Video Engine (WebRTC)**

The technical core. How it works:

1. User opens Vybe → grants camera + mic permission
2. Frontend connects to the signalling server (Socket.io) and says "I am ready"
3. Server matches two waiting users and exchanges WebRTC offer/answer via Socket.io
4. PeerJS handles the peer-to-peer video connection directly between users
5. If no real user is waiting → decoy system kicks in (see 1.3)
6. User taps Next → old connection drops, new matching begins immediately

Antigravity's implementation checklist:

- [ ] Set up Socket.io signalling server on Node.js (Railway or Render)
- [ ] Integrate PeerJS for WebRTC peer connections
- [ ] Deploy coturn STUN/TURN server (handles users behind NAT/firewall) — free on a small VPS
- [ ] Handle camera permission denied gracefully (show a friendly prompt)
- [ ] Mobile-first: test on Android Chrome and iOS Safari before anything else
- [ ] Connection timeout: if no peer found in 8 seconds, trigger decoy

**1.3 — Decoy System**

The cold-start hook. When no real user is available, Vybe plays a pre-recorded clip of an attractive person for 1–3 seconds, then "skips away" as if that person moved on. This creates the illusion of activity and keeps the user scrolling.

Implementation:

- Source 8–12 short clips (3–5 seconds each): either AI-generated faces (HeyGen, D-ID) or consented stock performers. Never use real people without consent.
- Clips play at reduced quality (blurred edges, slight grain) to feel "live"
- After clip ends, UI shows: *"just missed them — keep going"* and immediately starts matching again
- Decoy triggers only when matchmaking queue is empty (server-side check)
- Track decoy-to-real ratio in analytics — when real users exceed 60% of sessions, decoys can be phased out
- Do NOT present decoys as live users in any way that could be legally construed as deception — the "just missed them" framing is the safe angle

**1.4 — Moderation Minimum**

- Report button sends: timestamp, session ID, reporter's hashed IP to a Supabase table
- A repeat-report threshold (3 reports in 10 minutes from different users) auto-bans the session IP temporarily
- One admin dashboard (simple Supabase table view) for Ka to review flagged sessions
- PhotoDNA frame-scanning runs async on the backend (does not delay the user experience)

## Phase 2 — Ad Integration & Monetization

Vybe earns from ads embedded in the scroll experience — not interstitials that interrupt, but placements that feel native to the UI.

**2.1 — Ad Placement Strategy**

Three placement zones:

1. **Between-session banner** — a full-screen ad card appears every 5th skip, styled like a video card in the feed. User swipes it away like any other card.
2. **Bottom strip** — a small native banner at the bottom of the waiting screen (shown while matchmaking)
3. **Exit intent** — when user is about to close the tab, a 5-second rewarded ad plays (optional, Phase 3)

**2.2 — Ad Networks**

Run two networks in parallel from day one:

| Network | Type | CPM (South Asia est.) | Notes |
| --- | --- | --- | --- |
| Google AdSense | Mainstream display | $0.30–$0.80 | Apply after 500+ daily users; may restrict adult-adjacent content |
| ExoClick | Adult-adjacent | $0.80–$2.50 | No approval threshold, works immediately, South Asia inventory strong |
| TrafficJunky | Adult-adjacent | $1.00–$3.00 | Owned by MindGeek, premium rates, apply early |
| PropellerAds | Mainstream/push | $0.50–$1.50 | Good South Asia coverage, easy approval |

Strategy: launch with ExoClick + PropellerAds immediately. Apply for AdSense once traffic is established. Add TrafficJunky when daily users exceed 1,000.

**2.3 — Revenue Projection (Conservative)**

Assumptions: 1,000 daily active users, 15 minutes avg session, 3 ad impressions per session.

| Scenario | DAU | Daily Impressions | CPM | Daily Revenue | Monthly |
| --- | --- | --- | --- | --- | --- |
| Early | 500 | 1,500 | $1.00 | $1.50 | \~$45 |
| Growing | 2,000 | 6,000 | $1.20 | $7.20 | \~$216 |
| Scaled | 10,000 | 30,000 | $1.50 | $45.00 | \~$1,350 |

This is not the ceiling — direct ad deals and a freemium layer unlock much higher ARPU at scale.

**2.4 — Analytics Setup (Free)**

- Google Analytics 4: session length, skip rate, return rate
- Supabase: custom events (decoy triggered, real match, report filed, ad impression)
- Hotjar free tier: watch how users interact with the UI on mobile
- Track the decoy-to-real match ratio daily — this is the platform health metric

## Phase 3 — Interest Matching & Growth

This phase activates only after Vybe has consistent daily traffic (target: 500+ DAU for 2 weeks straight). The goal is to increase session length and return rate by making matches feel less random and more relevant.

**3.1 — Interest Tags at Entry**

One-tap tag selection before the session starts. No typing, no login — just chips:

- Chat | Flirt | 18+ | Music | Gaming | Desi Vibes

Users pick one. The matchmaking server prioritises pairing users with the same tag. Falls back to any user if no tag match found within 5 seconds.

This also solves the legal segmentation problem — the 18+ tag creates a declared adult-only lane, which can be served different ad inventory (higher CPM) and monitored separately.

**3.2 — Basic Matching Algorithm**

Keep it simple at this stage:

1. Tag match — same interest first
2. Geography proximity — South Asia users matched preferentially (lower latency)
3. Recency — users who have been waiting longer get matched first
4. Skip history — avoid re-matching someone a user just skipped (session-level memory only)

No ML needed at this scale. A simple queue with these four rules in priority order handles it cleanly.

**3.3 — Growth Levers**

| Lever | Effort | Expected Impact |
| --- | --- | --- |
| TikTok / Reels content — post funny/interesting Vybe interactions (consented) | Low | High — this is how Omegle got 70M users |
| Refer-a-friend: share a link that opens Vybe directly | Low | Medium |
| Creator program: invite 5–10 influencers to use Vybe live | Medium | High |
| WhatsApp group seeding in college communities | Low | Medium |
| Reddit posts in r/india, r/pakistan, r/bangalore etc. | Low | Low-Medium |

The single highest-leverage growth action: **get one creator to post a Vybe session on Instagram Reels or YouTube Shorts.** One viral video can deliver 50,000 users in a week. Budget for this before launch.

**3.4 — Retention Features (Post-MVP)**

- Text chat alongside video (already in the UI shell, activate it here)
- "Liked" button — user can heart someone, both see it only if mutual (reduces awkwardness)
- Language filter — Hindi / English / Urdu / Bengali preference
- Session replay for moderation (store 30-second rolling buffer server-side, delete unless reported)

## Tech Stack & Infrastructure

Every choice below is free on its starter tier, battle-tested, and chosen to minimise DevOps burden on Antigravity.

| Layer | Tool | Free Tier | Purpose |
| --- | --- | --- | --- |
| Frontend | Next.js 14 | Always free (open source) | App shell, routing, SSR for SEO |
| Styling | Tailwind CSS | Always free | Instagram-style UI, fast to build |
| Video (P2P) | PeerJS + WebRTC | Always free | Peer-to-peer video between users |
| Signalling | Socket.io on Node.js | Always free (self-hosted) | Matchmaking, offer/answer exchange |
| TURN server | coturn on a VPS | \~$5/month (Hetzner VPS) | Routes video for users behind firewalls |
| Backend hosting | Railway | $5 free credit/month | Node.js signalling server |
| Frontend hosting | Vercel | Generous free tier | Next.js deployment, global CDN |
| Database | Supabase | 500MB free | Reports, session logs, admin dashboard |
| Analytics | Google Analytics 4 | Free | Traffic, session data |
| CSAM detection | PhotoDNA (Microsoft) | Free for platforms | Frame scanning against known CSAM hashes |
| CSAM reporting | NCMEC CyberTipline | Free | Mandatory reporting pipeline |
| CDN / Security | Cloudflare | Free tier | DDoS protection, geo-blocking, SSL |
| Domain | Namecheap | \~$15–20/year | vybe.live or vybe.chat |
| Decoy clips | HeyGen / D-ID | \~$30–50 one-time | Generate 10 AI face clips |

**Total month-one infrastructure cost: \~$20–30**

**Architecture in plain words:**

User opens Vybe on their phone → Cloudflare serves the Next.js app from Vercel → user grants camera access → browser connects to the Socket.io signalling server on Railway → server checks the waiting queue → if another user is waiting, they exchange WebRTC connection details through Socket.io → PeerJS establishes direct video between the two browsers → if no user is waiting, the decoy system serves a clip → user taps Next, the cycle repeats.

All video flows directly between users (peer-to-peer). The server never sees the video — it only handles the introduction. This is the architecture that keeps costs near zero even at scale.

**Antigravity's build order:**

1. Next.js app shell + Tailwind UI (age gate, entry screen, video screen)
2. Socket.io signalling server on Node.js
3. PeerJS WebRTC integration
4. coturn TURN server on a Hetzner VPS
5. Supabase integration for reports
6. Decoy system (clip playback when queue is empty)
7. PhotoDNA frame-scanning hook (async, non-blocking)
8. Report button → Supabase table
9. Cloudflare setup (SSL, UK geo-block, DDoS)
10. Ad network script injection (ExoClick + PropellerAds)

## Domain, Brand & Launch Checklist

**Brand**

- Name: **Vybe**
- Tagline: *Every stranger is a Vybe away*
- Colours: deep black background, electric purple accent (#7C3AED), white text — premium, not sleazy
- Font: Inter or Satoshi — clean, modern, Instagram-adjacent
- Logo: wordmark only for now, lowercase "vybe" with a subtle pulse animation on the dot of the i (or a simple waveform icon)

**Domain — check and register immediately**

- Primary: vybe.live
- Backup 1: vybe.chat
- Backup 2: getvybe.app
- Register on Namecheap, pay for 2 years upfront, enable WHOIS privacy

**Pre-launch checklist (Ka's side)**

- [ ] Register domain today
- [ ] Register Private Limited company (can run 2–3 weeks in parallel)
- [ ] Apply for NCMEC CyberTipline account
- [ ] Apply for PhotoDNA (Microsoft)
- [ ] Set up a business email: hello@vybe.live
- [ ] Create Vybe accounts on Instagram, Twitter/X, YouTube — secure the handle before launch
- [ ] Identify 2–3 college/youth creators in India for the launch push
- [ ] Sign up for ExoClick and PropellerAds ad publisher accounts

**Pre-launch checklist (Antigravity's side)**

- [ ] Set up Next.js project on Vercel
- [ ] Set up Node.js signalling server on Railway
- [ ] Spin up coturn on Hetzner VPS (\~€4/month)
- [ ] Set up Supabase project
- [ ] Set up Cloudflare on the domain (free)
- [ ] Build age gate screen
- [ ] Build entry screen ("Start Vybing" CTA)
- [ ] Build video session screen
- [ ] Integrate Socket.io + PeerJS
- [ ] Build decoy clip playback system
- [ ] Build report button → Supabase
- [ ] Integrate ExoClick ad script
- [ ] Mobile test on Android Chrome + iOS Safari
- [ ] UK geo-block rule on Cloudflare
- [ ] PhotoDNA frame-scan integration

**Launch target: 6–8 weeks from today**

| Week | Milestone |
| --- | --- |
| 1 | Domain registered, company registration started, NCMEC/PhotoDNA applied |
| 2–3 | UI shell complete, signalling server live, basic video working |
| 4 | Decoy system live, report button live, Cloudflare configured |
| 5 | Ad networks integrated, analytics live, internal testing |
| 6 | Creator outreach, soft launch with 50 friends |
| 7–8 | Public launch, first content push on Reels/Shorts |
