-- Migration: Rate Limiting
-- Create a table for rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip_address text NOT NULL,
    endpoint text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    PRIMARY KEY (ip_address, endpoint)
);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_ip_address text,
    p_endpoint text,
    p_max_requests integer,
    p_window_seconds integer
) RETURNS boolean AS $$
DECLARE
    v_current_count integer;
    v_window_start timestamp with time zone;
BEGIN
    -- Check if a record exists
    SELECT request_count, window_start INTO v_current_count, v_window_start
    FROM public.rate_limits
    WHERE ip_address = p_ip_address AND endpoint = p_endpoint;

    -- If no record exists, insert and return true (allowed)
    IF v_current_count IS NULL THEN
        INSERT INTO public.rate_limits (ip_address, endpoint, request_count, window_start)
        VALUES (p_ip_address, p_endpoint, 1, now());
        RETURN true;
    END IF;

    -- If record exists, check if window has expired
    IF now() > v_window_start + (p_window_seconds || ' seconds')::interval THEN
        -- Window expired, reset count and window
        UPDATE public.rate_limits
        SET request_count = 1, window_start = now()
        WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
        RETURN true;
    END IF;

    -- Window has not expired, check if limit exceeded
    IF v_current_count >= p_max_requests THEN
        RETURN false; -- Limit exceeded (blocked)
    ELSE
        -- Limit not exceeded, increment count
        UPDATE public.rate_limits
        SET request_count = request_count + 1
        WHERE ip_address = p_ip_address AND endpoint = p_endpoint;
        RETURN true; -- Allowed
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
