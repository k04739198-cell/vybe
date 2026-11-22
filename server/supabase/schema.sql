-- ==============================================================================
-- Vybe Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Moderation Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    reporter_ip_hash TEXT NOT NULL,
    reported_peer_id TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (
        'csam_underage',
        'harassment_bullying',
        'unwanted_nudity',
        'spam_bot',
        'violence_threats',
        'unspecified'
    )),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for repeat offender detection (3 reports within 10 minutes)
CREATE INDEX IF NOT EXISTS idx_reports_reported_peer ON public.reports (reported_peer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);

-- 2. Banned IPs / Device Fingerprints Table
CREATE TABLE IF NOT EXISTS public.banned_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    banned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    banned_until TIMESTAMPTZ, -- NULL means permanent ban
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_banned_ips_hash ON public.banned_ips (ip_hash) WHERE is_active = true;

-- 3. Video Sessions Analytics Table (Zero PII stored)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    peer1_id TEXT,
    peer2_id TEXT,
    interest_tag TEXT DEFAULT 'all',
    duration_seconds INTEGER DEFAULT 0,
    ended_reason TEXT, -- 'skipped', 'disconnected', 'reported'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_room_id ON public.sessions (room_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions (created_at DESC);

-- 4. Custom Platform Analytics Events (Cold-start decoys, skips, ad impressions)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_name TEXT NOT NULL, -- e.g. 'decoy_triggered', 'real_match', 'ad_impression', 'age_verified'
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events (event_name, created_at DESC);

-- 5. Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Service role has full access (server backend)
CREATE POLICY "Service role full access on reports" ON public.reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on banned_ips" ON public.banned_ips
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on sessions" ON public.sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on analytics" ON public.analytics_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
