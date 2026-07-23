ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'claimed_unverified';
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'verified_pending_upgrade';
