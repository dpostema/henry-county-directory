import { createClient } from "@/utils/supabase/server";

/**
 * Checks if the given IP address has exceeded the rate limit for a specific endpoint.
 * Requires the `check_rate_limit` RPC function and `rate_limits` table in Supabase.
 *
 * @param ip_address The IP address of the client
 * @param endpoint The identifier for the endpoint/action being rate-limited
 * @param max_requests The maximum number of allowed requests within the window
 * @param window_seconds The time window in seconds
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  ip_address: string,
  endpoint: string,
  max_requests: number = 5,
  window_seconds: number = 60
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_ip_address: ip_address,
    p_endpoint: endpoint,
    p_max_requests: max_requests,
    p_window_seconds: window_seconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error);
    // Fail closed or fail open? Usually fail open is better for UX, 
    // but fail closed is better for security. Let's fail open on DB errors.
    return true; 
  }

  return data as boolean;
}
