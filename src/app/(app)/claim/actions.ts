"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { checkRateLimit } from "@/utils/rateLimit";
import { sendEmail } from "@/utils/email";

// Helper to mask email for security
function maskEmail(email: string): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
  const [domainName, domainExt] = domain.split(".");
  const maskedDomain = domainName.length > 2 ? `${domainName.slice(0, 2)}***` : `${domainName}***`;
  return `${maskedName}@${maskedDomain}.${domainExt || "com"}`;
}

// Helper to mask phone for security
function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  return `${cleaned.slice(0, 3)}-***-**${cleaned.slice(-2)}`;
}

export async function sendOTPAction(businessId: string, channel: "email" | "phone") {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];
  const allowed = await checkRateLimit(ip, "send_otp", 3, 300); // 3 per 5 minutes
  if (!allowed) return { error: "Too many OTP requests. Please try again later." };

  const supabase = await createClient();

  // 1. Fetch business
  const { data: business, error: busError } = await supabase
    .from("businesses")
    .select("id, email, phone, name")
    .eq("id", businessId)
    .single();

  if (busError || !business) {
    return { error: "Business not found." };
  }

  const targetValue = channel === "email" ? business.email : business.phone;
  if (!targetValue) {
    return { error: `No ${channel} on file for this business. Please use the fallback review route.` };
  }

  // 2. Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  // 3. Insert OTP Code
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: otpError } = await adminClient.from("otp_codes").insert({
    email: channel === "email" ? targetValue : null,
    phone: channel === "phone" ? targetValue : null,
    code,
    expires_at: expiresAt,
    verified: false,
  });

  if (otpError) {
    return { error: otpError.message };
  }

  // 4. Send Email via Resend
  if (channel === "email") {
    await sendEmail({
      to: targetValue,
      subject: `Your Verification Code for ${business.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Contact Ownership</h2>
          <p>Here is your 6-digit verification code to claim <strong>${business.name}</strong>:</p>
          <div style="background-color: #f4f5f7; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes.</p>
        </div>
      `,
    });
  } else {
    console.log(`\n======================================================`);
    console.log(`[CLAIM OTP SYSTEM] SMS Verification Code for "${business.name}" (${targetValue}): ${code}`);
    console.log(`======================================================\n`);
  }

  return {
    success: `An OTP code has been sent to ${channel === "email" ? maskEmail(targetValue) : maskPhone(targetValue)
      }.`,
    targetValue,
  };
}

export async function verifyOTPAction(businessId: string, targetValue: string, code: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to claim a business." };
  }

  if (!code) {
    return { error: "Verification code is required." };
  }

  // 1. Look up unverified active code
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: records, error: fetchError } = await adminClient
    .from("otp_codes")
    .select("*")
    .or(`email.eq.${targetValue},phone.eq.${targetValue}`)
    .eq("verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (fetchError || !records || records.length === 0) {
    return { error: "No active verification code found." };
  }

  const match = records.find((r) => r.code === code);
  if (!match) {
    return { error: "Invalid verification code." };
  }

  // 2. Mark OTP verified
  await adminClient.from("otp_codes").update({ verified: true }).eq("id", match.id);

  // 3. Check entitlements limit
  const { getOwnerBusinessLimit } = await import("@/utils/entitlements");
  const limitCheck = await getOwnerBusinessLimit(user.id, supabase);
  if (!limitCheck.canAdd) {
    return { error: `Verification successful! However, you have reached your limit of ${limitCheck.maxAllowed} businesses. Please upgrade your plan in your dashboard first to complete this claim.` };
  }

  // 4. Bind business ownership
  const { error: claimError } = await adminClient
    .from("businesses")
    .update({
      owner_id: user.id,
      status: "claimed",
      verification_level: "verified",
    })
    .eq("id", businessId);

  if (claimError) {
    return { error: claimError.message };
  }

  revalidatePath("/", "layout");
  return { success: "Business claimed successfully! You are now the verified owner.", pendingUpgrade: !limitCheck.canAdd };
}

export async function submitFallbackClaimAction(
  businessId: string,
  fullName: string,
  phone: string,
  email: string,
  notes: string
) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];
  const allowed = await checkRateLimit(ip, "submit_claim", 5, 3600); // 5 per hour
  if (!allowed) return { error: "Too many claim requests. Please try again later." };

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to file a claim." };
  }

  if (!fullName || !phone || !email) {
    return { error: "Full name, email, and phone are required." };
  }

  const { getOwnerBusinessLimit } = await import("@/utils/entitlements");
  const limitCheck = await getOwnerBusinessLimit(user.id, supabase);

  if (!limitCheck.canAdd) {
    return { error: `You have reached your limit of ${limitCheck.maxAllowed} businesses for your current plan. Please upgrade to claim more.` };


    // 1. Insert fallback claim request
    const { error: requestError } = await supabase.from("claim_requests").insert({
      business_id: businessId,
      user_id: user.id,
      full_name: fullName,
      phone,
      email,
      notes: notes || null,
      status: "pending",
    });

    if (requestError) {
      return { error: requestError.message };
    }

    // 2. Place business into "soft-claim" state (owner can edit basic details immediately)
    const adminClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: softClaimError } = await adminClient
      .from("businesses")
      .update({
        owner_id: user.id,
        status: "claimed_unverified",
      })
      .eq("id", businessId);

    if (softClaimError) {
      return { error: softClaimError.message };
    }

    revalidatePath("/", "layout");
    return {
      success: "Claim request submitted! You have been granted soft-claim access to edit details while admin review is pending.",
    };
  }
