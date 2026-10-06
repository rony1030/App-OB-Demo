-- Migration: Investor Email OTP Challenges, Sessions and Audit
-- Description: Supports passwordless 6-char alphanumeric OTP auth for investor portal (/inversionista)
-- Security: RLS enabled on all tables, only accessible via service_role.

CREATE TABLE IF NOT EXISTS public.investor_otp_challenges (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    contact_id BIGINT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    client_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_investor_otp_challenges_email ON public.investor_otp_challenges (lower(email));
CREATE INDEX IF NOT EXISTS idx_investor_otp_challenges_expires ON public.investor_otp_challenges (expires_at);

CREATE TABLE IF NOT EXISTS public.investor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id BIGINT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_agent TEXT,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_investor_sessions_token_hash ON public.investor_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_investor_sessions_contact_id ON public.investor_sessions (contact_id);
CREATE INDEX IF NOT EXISTS idx_investor_sessions_expires_at ON public.investor_sessions (expires_at);

CREATE TABLE IF NOT EXISTS public.investor_email_change_audit (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    old_email TEXT,
    new_email TEXT NOT NULL,
    changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verification_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_investor_email_change_audit_contact ON public.investor_email_change_audit (contact_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.investor_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_email_change_audit ENABLE ROW LEVEL SECURITY;

-- Deny public access. Only service_role bypasses RLS by default or explicit policies can be set.
-- By having RLS enabled and 0 public/anon policies, anon/authenticated clients cannot read/write directly.
