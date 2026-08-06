"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { callOpenAI } from "@/utils/ai";
import { sendEmail } from "@/utils/email";
import { generateEmailHtml } from "@/utils/email-template";
export async function updateListingAction(formData: FormData) {
  const supabase = await createClient();

  const businessId = formData.get("businessId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("categoryId") as string;
  const cityId = formData.get("cityId") as string;

  // Compile hours JSON
  const hoursJson: Record<string, any> = {};
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  days.forEach((day) => {
    const isClosed = formData.get(`hours.${day}.closed`) === "true";
    if (isClosed) {
      hoursJson[day] = { closed: true };
    } else {
      const open = formData.get(`hours.${day}.open`) as string;
      const close = formData.get(`hours.${day}.close`) as string;
      hoursJson[day] = {
        open: open || "09:00",
        close: close || "17:00",
      };
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // Update business ensuring RLS checks out or owner_id matches
  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      description: description || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      category_id: categoryId || null,
      city_id: cityId || null,
      hours_json: hoursJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: "Listing updated successfully!" };
}

export async function addListingMediaAction(businessId: string, url: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // Verify ownership first
  const { data: bus } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!bus) return { error: "Unauthorized access." };

  const { error } = await supabase.from("listing_media").insert({
    business_id: businessId,
    url,
    display_order: 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: "Photo added successfully!" };
}

export async function deleteListingMediaAction(mediaId: string, businessId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // Verify ownership
  const { data: bus } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!bus) return { error: "Unauthorized access." };

  const { error } = await supabase.from("listing_media").delete().eq("id", mediaId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: "Photo removed successfully!" };
}

export async function replyToReviewAction(reviewId: string, replyText: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase.from("review_replies").upsert({
    review_id: reviewId,
    author_id: user.id,
    reply: replyText,
  });

  if (error) return { error: error.message };

  // 4. Send email to the reviewer
  const { data: reviewInfo } = await supabase
    .from("reviews")
    .select("author:profiles(email, full_name), business:businesses(name)")
    .eq("id", reviewId)
    .single();

  if ((reviewInfo?.author as any)?.email) {
    const businessName = (reviewInfo.business as any)?.name || "Local Business";
    const authorEmail = (reviewInfo.author as any).email;
    await sendEmail({
      to: authorEmail,
      subject: `Reply to your review from ${businessName}`,
      html: generateEmailHtml(businessName, `
        <h3>${businessName} replied to your review!</h3>
        <p>You recently left a review for ${businessName} on the Henry County Directory. The business owner has sent a response:</p>
        <div class="box">
          <p style="white-space: pre-wrap; font-size: 15px; color: #334155;">${replyText}</p>
        </div>
      `)
    });
  }

  revalidatePath("/dashboard");
  return { success: "Reply saved successfully!" };
}

export async function answerQuestionAction(qnaId: string, answerText: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase
    .from("qna")
    .update({
      answer: answerText,
      answered_by: user.id,
      answered_at: new Date().toISOString(),
    })
    .eq("id", qnaId);

  if (error) return { error: error.message };

  // Send email to the question author
  const { data: qnaInfo } = await supabase
    .from("qna")
    .select("visitor:profiles(email, full_name), business:businesses(name)")
    .eq("id", qnaId)
    .single();

  if ((qnaInfo?.visitor as any)?.email) {
    const businessName = (qnaInfo.business as any)?.name || "Local Business";
    const visitorEmail = (qnaInfo.visitor as any).email;
    await sendEmail({
      to: visitorEmail,
      subject: `${businessName} answered your question`,
      html: generateEmailHtml(businessName, `
        <h3>${businessName} answered your question!</h3>
        <p>You recently asked a question to ${businessName} on the Henry County Directory. The business owner has sent a response:</p>
        <div class="box">
          <p style="white-space: pre-wrap; font-size: 15px; color: #334155;">${answerText}</p>
        </div>
      `)
    });
  }

  revalidatePath("/dashboard");
  return { success: "Question answered successfully!" };
}

export async function updateProfileAction(fullName: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: "Profile updated successfully!" };
}

export async function markLeadStatusAction(leadId: string, status: "new" | "read" | "archived") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: `Lead status updated to ${status}.` };
}

export async function sendReferralAction(referredEmail: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  if (!referredEmail.trim()) return { error: "Referred email is required." };

  const { error } = await supabase.from("referrals").insert({
    referrer_id: user.id,
    referred_email: referredEmail,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: `Referral invitation sent to ${referredEmail}!` };
}

export async function updateBookingStatusAction(bookingId: string, status: "confirmed" | "cancelled") {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { error: error.message };

  // Send email to the booking visitor
  const { data: bookingInfo } = await supabase
    .from("bookings")
    .select("visitor:profiles(email, full_name), business:businesses(name)")
    .eq("id", bookingId)
    .single();

  if ((bookingInfo?.visitor as any)?.email) {
    const businessName = (bookingInfo.business as any)?.name || "Local Business";
    const visitorEmail = (bookingInfo.visitor as any).email;
    const actionText = status === "confirmed" ? "confirmed" : "cancelled";
    
    await sendEmail({
      to: visitorEmail,
      subject: `Booking ${actionText} by ${businessName}`,
      html: generateEmailHtml(businessName, `
        <h3>Your booking request was ${actionText}!</h3>
        <p>The business owner for ${businessName} has ${actionText} your recent booking request.</p>
        ${status === "confirmed" ? `<p>If you need to make changes, please contact the business directly.</p>` : ``}
      `)
    });
  }

  revalidatePath("/dashboard");
  return { success: `Booking status marked as ${status}!` };
}

export async function replyToLeadMessageAction(leadId: string, replyText: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // 1. Fetch current lead message content
  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("message, email, name, business_id, business:businesses(name, plan_tier)")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) {
    return { error: fetchError?.message || "Failed to load lead thread." };
  }

  const { getEntitlements } = await import("@/utils/entitlements");
  const entitlements = getEntitlements((lead.business as any)?.plan_tier);
  if (!entitlements.has_messaging_inbox) {
    return { error: "Your current plan does not support replying to leads. Please upgrade." };
  }

  let thread: any[] = [];
  try {
    const parsed = JSON.parse(lead.message);
    if (Array.isArray(parsed)) {
      thread = parsed;
    } else {
      // Message was singular string, start thread
      thread = [{ sender: "visitor", text: lead.message, time: new Date() }];
    }
  } catch {
    // Parsing failed, message is singular string
    thread = [{ sender: "visitor", text: lead.message, time: new Date() }];
  }

  // 2. Append owner response
  thread.push({
    sender: "owner",
    text: replyText,
    time: new Date().toISOString(),
  });

  // 3. Save thread and mark lead read
  const { error: saveError } = await supabase
    .from("leads")
    .update({
      message: JSON.stringify(thread),
      status: "read",
    })
    .eq("id", leadId);

  if (saveError) return { error: saveError.message };

  // 4. Send email to the lead
  if (lead.email) {
    const businessName = (lead.business as any)?.name || "Local Business";
    await sendEmail({
      to: lead.email,
      subject: `Reply from ${businessName}`,
      html: generateEmailHtml(businessName, `
        <h3>${businessName} replied to your message!</h3>
        <p>You recently reached out via the Henry County Directory. The business owner has sent a response:</p>
        <div class="box">
          <p style="white-space: pre-wrap; font-size: 15px; color: #334155;">${replyText}</p>
        </div>
      `)
    });
  }

  revalidatePath("/dashboard");
  return { success: "Reply saved to thread successfully!", thread };
}

export async function generateAIDescriptionAction(name: string, category: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Graceful fallback description
    return {
      description: `Welcome to ${name}! We are proud to serve the Henry County community with high-quality ${category || "local directory"} services. Our dedicated team is committed to providing outstanding results, custom support, and a premium experience. Call or visit us today to learn more about how we can serve you!`,
    };
  }

  try {
    const prompt = `Write a premium, engaging 3-sentence description for a local business named "${name}" in the category "${category}". Highlight their local community reputation, professional reliability, and top-tier service quality.`;
    const text = await callOpenAI(prompt, "You are a professional marketing copywriter specializing in local businesses.");
    return { description: text };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function generateAIReviewReplyAction(rating: number, comment: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Graceful fallback review reply
    return {
      reply: `Thank you so much for the ${rating}-star review! We are absolutely thrilled to hear about your positive experience and appreciate your support of our local business. We look forward to serving you again in the future!`,
    };
  }

  try {
    const prompt = `Write a short, professional, and appreciative response to a customer's ${rating}-star review that says: "${comment || "No comment left."}". Make it warm, authentic, and thank them for supporting local Henry County business.`;
    const text = await callOpenAI(prompt, "You are a friendly customer success assistant representing a local business owner.");
    return { reply: text };
  } catch (err: any) {
    return { error: err.message };
  }
}
