import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight options request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const resendDomainName = Deno.env.get("RESEND_DOMAIN_NAME")?.trim() || "onboarding@resend.dev";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { email, phone, code, action } = await req.json();

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Rate limit check via RPC
    const { data: allowed, error: rlError } = await supabase.rpc("check_rate_limit", {
      p_ip_address: ip,
      p_endpoint: action === "send" ? "edge_otp_send" : "edge_otp_verify",
      p_max_requests: action === "send" ? 5 : 10,
      p_window_seconds: 300,
    });

    if (!rlError && allowed === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    if (action === "send") {
      if (!email && !phone) {
        return new Response(
          JSON.stringify({ error: "Email or phone number is required." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Generate a 6-digit verification code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min expiration

      // Insert the code to the otp_codes table
      const { error } = await supabase
        .from("otp_codes")
        .insert({
          email: email || null,
          phone: phone || null,
          code: generatedCode,
          expires_at: expiresAt,
          verified: false,
        });

      if (error) throw error;

      // Log it to output for testing/mock purposes (simulates SMS/Email delivery)
      console.log(`[OTP SYSTEM] Code for ${email || phone} is: ${generatedCode} (Expires: ${expiresAt})`);

      if (email && resendApiKey) {
        try {
          const { error: resendError } = await resend.emails.send({
            from: resendDomainName,
            to: [email],
            subject: "Your Verification Code",
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #E8505B; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .body { padding: 40px 30px; color: #334155; font-size: 16px; line-height: 1.6; }
    .box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #E8505B; font-size: 24px; letter-spacing: 4px; text-align: center; font-weight: bold; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Henry County Directory</h1>
    </div>
    <div class="body">
      <h3 style="margin-top: 0; color: #0f172a;">Your Verification Code</h3>
      <p>Use the following code to verify your identity. This code will expire in 15 minutes.</p>
      <div class="box">
        ${generatedCode}
      </div>
      <p>If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Henry County Directory. All rights reserved.
    </div>
  </div>
</body>
</html>
            `,
          });

          if (resendError) {
            console.error("[RESEND ERROR]", resendError);
          } else {
            console.log(`[RESEND SUCCESS] Sent OTP to ${email}`);
          }
        } catch (emailErr) {
          console.error("[RESEND EXCEPTION]", emailErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Verification OTP generated and stored." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else if (action === "verify") {
      if ((!email && !phone) || !code) {
        return new Response(
          JSON.stringify({ error: "Target (email/phone) and code are required." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Fetch active codes
      const targetQuery = email ? { email } : { phone };

      const { data: records, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .match(targetQuery)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (!records || records.length === 0) {
        return new Response(
          JSON.stringify({ error: "No active verification code found." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check if code matches
      const matchingRecord = records.find((r) => r.code === code);

      if (!matchingRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Mark the code as verified
      const { error: updateError } = await supabase
        .from("otp_codes")
        .update({ verified: true })
        .eq("id", matchingRecord.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: "OTP verified successfully." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
