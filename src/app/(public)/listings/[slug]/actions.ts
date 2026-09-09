"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimit";
import { callOpenAI } from "@/utils/ai";
import { sendEmail } from "@/utils/email";
import { generateEmailHtml } from "@/utils/email-template";
import { siteConfig } from "@/config/site";

export async function submitLead(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0].trim();
  const allowed = await checkRateLimit(ip, "submit_lead", 5, 300); // 5 leads per 5 min
  if (!allowed) return { error: "Too many messages sent. Please wait a few minutes." };

  const supabase = await createClient();

  const businessId = formData.get("businessId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;

  if (!businessId || !name || !email || !message) {
    return { error: "Name, email, and message are required." };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Rules-based classification fallback
    let aiTag = "General Inquiry";
    let priority = "medium";

    const lowerMsg = message.toLowerCase();
    if (
      lowerMsg.includes("price") ||
      lowerMsg.includes("quote") ||
      lowerMsg.includes("cost") ||
      lowerMsg.includes("estimate") ||
      lowerMsg.includes("book") ||
      lowerMsg.includes("appointment") ||
      lowerMsg.includes("buy")
    ) {
      aiTag = "High Intent";
      priority = "high";
    } else if (
      lowerMsg.includes("job") ||
      lowerMsg.includes("hiring") ||
      lowerMsg.includes("career") ||
      lowerMsg.includes("resume")
    ) {
      aiTag = "Employment Inquiry";
      priority = "low";
    }

    // Gemini-based classification override if key is set
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `Classify this customer message sent to a local business directory. Return exactly a JSON object matching this schema:
  {"tag": "High Intent" | "Employment Inquiry" | "General Inquiry", "priority": "high" | "medium" | "low"}.
  Do not include any explanation, markdown formatting, or other text.
  Message: "${message}"`;
        const responseText = await callOpenAI(prompt, "You are a professional business lead triage assistant. Categorize lead intent strictly.");
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        if (parsed.tag && parsed.priority) {
          aiTag = parsed.tag;
          priority = parsed.priority;
        }
      } catch (err) {
        console.error("[OPENAI LEAD CLASSIFICATION ERROR]", err);
      }
    }

    const { error } = await supabase.from("leads").insert({
      business_id: businessId,
      visitor_id: user?.id || null,
      name,
      email,
      phone: phone || null,
      message,
      status: "new",
      ai_tag: aiTag,
      priority,
    });

    if (error) {
      console.error("[SUBMIT LEAD DB ERROR]", error);
      return { error: "Failed to send message. Please try again later." };
    }

    // Sync to GoHighLevel (GHL)
    try {
      const { dispatchGhlWebhook } = await import("@/services/ghl");
      await dispatchGhlWebhook({
        email,
        name,
        phone: phone || undefined,
        event: "business-lead",
        source: "Directory Listing",
        tags: ["business-lead", aiTag, priority],
        businessId,
        message
      });
    } catch (ghlErr) {
      console.error("[SUBMIT LEAD GHL ERROR]", ghlErr);
    }

    // Send email notification to business owner
    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("email, name")
        .eq("id", businessId)
        .single();

      if (business?.email) {
        await sendEmail({
          to: business.email,
          subject: `New Lead for ${business.name}: ${aiTag}`,
          html: generateEmailHtml(siteConfig.name, `
            <h3>You have a new lead!</h3>
            <p>Someone reached out to your business from your directory listing.</p>
            <div class="box">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            </div>
            <p><strong>Message:</strong></p>
            <div class="box">
              ${message}
            </div>
          `)
        });
      }
    } catch (emailErr) {
      console.error("[SUBMIT LEAD EMAIL ERROR]", emailErr);
    }

    return { success: "Your message has been sent to the business owner!" };
  } catch (err) {
    console.error("[SUBMIT LEAD UNEXPECTED ERROR]", err);
    return { error: "An unexpected network error occurred. Please try again." };
  }
}

export async function submitReview(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0].trim();
  const allowed = await checkRateLimit(ip, "submit_review", 3, 300); // 3 reviews per 5 min
  if (!allowed) return { error: "Too many reviews submitted. Please wait." };

  const supabase = await createClient();

  const businessId = formData.get("businessId") as string;
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment") as string;
  const slug = formData.get("slug") as string;

  if (!businessId || !rating) {
    return { error: "Rating is required." };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to submit a review." };
    }

    const { error } = await supabase.from("reviews").insert({
      business_id: businessId,
      author_id: user.id,
      rating,
      comment: comment || null,
    });

    if (error) {
      console.error("[SUBMIT REVIEW DB ERROR]", error);
      if (error.code === '23505' || error.message.includes("duplicate")) {
        return { error: "You have already submitted a review for this business." };
      }
      return { error: "Failed to submit review. Please try again later." };
    }

    // Send email notification to business owner
    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("email, name")
        .eq("id", businessId)
        .single();

      if (business?.email) {
        await sendEmail({
          to: business.email,
          subject: `New Review for ${business.name}`,
          html: generateEmailHtml(siteConfig.name, `
            <h3>You received a new ${rating}-star review!</h3>
            <p>Someone recently left a review on your directory listing.</p>
            <div class="box">
              <strong>Comment:</strong><br/>
              ${comment || "No comment left."}
            </div>
            <p>Log in to your dashboard to reply to the review so it appears on your public listing.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Go to Dashboard</a>
          `)
        });
      }
    } catch (emailErr) {
      console.error("[SUBMIT REVIEW EMAIL ERROR]", emailErr);
    }

    revalidatePath(`/listings/${slug}`);
    return { success: "Review submitted successfully!" };
  } catch (err) {
    console.error("[SUBMIT REVIEW UNEXPECTED ERROR]", err);
    return { error: "An unexpected network error occurred. Please try again." };
  }
}

export async function submitQuestion(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0].trim();
  const allowed = await checkRateLimit(ip, "submit_question", 10, 3600); // 10 Qs per hour
  if (!allowed) return { error: "Too many questions submitted. Please try again later." };

  const supabase = await createClient();

  const businessId = formData.get("businessId") as string;
  const question = formData.get("question") as string;
  const slug = formData.get("slug") as string;

  if (!businessId || !question) {
    return { error: "Question is required." };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to ask a question." };
    }

    const { error } = await supabase.from("qna").insert({
      business_id: businessId,
      visitor_id: user.id,
      question,
    });

    if (error) {
      console.error("[SUBMIT QUESTION DB ERROR]", error);
      return { error: "Failed to submit question. Please try again later." };
    }

    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("email, name")
        .eq("id", businessId)
        .single();

      if (business?.email) {
        await sendEmail({
          to: business.email,
          subject: `New Question for ${business.name}`,
          html: generateEmailHtml(siteConfig.name, `
            <h3>Someone asked a question on your listing!</h3>
            <p>A visitor is looking for more information about your business.</p>
            <div class="box">
              <strong>Question:</strong><br/>
              ${question}
            </div>
            <p>Log in to your dashboard to answer it so it appears on your public listing.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Go to Dashboard</a>
          `)
        });
      }
    } catch (emailErr) {
      console.error("[SUBMIT QUESTION EMAIL ERROR]", emailErr);
    }

    revalidatePath(`/listings/${slug}`);
    return { success: "Question submitted! The owner will respond shortly." };
  } catch (err) {
    console.error("[SUBMIT QUESTION UNEXPECTED ERROR]", err);
    return { error: "An unexpected network error occurred. Please try again." };
  }
}

export async function submitListingReport(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0].trim();
  const allowed = await checkRateLimit(ip, "submit_report", 5, 3600); // 5 reports per hour
  if (!allowed) return { error: "Too many reports submitted. Please try again later." };

  const businessId = formData.get("businessId") as string;
  const reason = formData.get("reason") as string;
  const description = formData.get("description") as string;
  const slug = formData.get("slug") as string;
  const businessName = formData.get("businessName") as string;

  if (!businessId || !reason) {
    return { error: "Reason is required." };
  }

  try {
    const { dispatchGhlWebhook } = await import("@/services/ghl");
    await dispatchGhlWebhook({
      event: "report-listing",
      businessId,
      businessName,
      reason,
      description,
      slug,
      source: "Directory Listing",
      tags: ["report-listing", "directory-template"],
    });

    return { success: "Report submitted successfully. Thank you for your help!" };
  } catch (err) {
    console.error("[SUBMIT REPORT ERROR]", err);
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
