"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimit";
import { callOpenAI } from "@/utils/ai";
import { sendEmail } from "@/utils/email";
import { generateEmailHtml } from "@/utils/email-template";

export async function submitLead(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];
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
    const ghlAccessToken = process.env.GHL_ACCESS_TOKEN;
    const ghlLocationId = process.env.GHL_LOCATION_ID || "mock-location-id";

    if (ghlAccessToken) {
      try {
        await fetch("https://services.leadconnectorhq.com/contacts/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ghlAccessToken}`,
            Version: "2021-04-15",
          },
          body: JSON.stringify({
            name,
            email,
            phone: phone || undefined,
            tags: ["lead-submission", "henry-county-directory"],
            locationId: ghlLocationId,
          }),
        });
        console.log(`[GHL LEAD SYNC] Synced lead for ${name} to GHL Location ${ghlLocationId}`);
      } catch (err: any) {
        console.error("[GHL LEAD SYNC ERROR]", err.message);
      }
    } else {
      console.log(`[GHL LEAD SYNC MOCK] Synced lead for ${name} (${email}) to Location ${ghlLocationId}`);
    }

    // Send email notification to business owner
    const { data: business } = await supabase
      .from("businesses")
      .select("email, name")
      .eq("id", businessId)
      .single();

    if (business?.email) {
      await sendEmail({
        to: business.email,
        subject: `New Lead for ${business.name}: ${aiTag}`,
        html: generateEmailHtml("Henry County Directory", `
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

    return { success: "Your message has been sent to the business owner!" };
  } catch (err) {
    console.error("[SUBMIT LEAD UNEXPECTED ERROR]", err);
    return { error: "An unexpected network error occurred. Please try again." };
  }
}

export async function submitReview(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];
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
    const { data: business } = await supabase
      .from("businesses")
      .select("email, name")
      .eq("id", businessId)
      .single();

    if (business?.email) {
      await sendEmail({
        to: business.email,
        subject: `New Review for ${business.name}`,
        html: generateEmailHtml("Henry County Directory", `
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

    revalidatePath(`/listings/${slug}`);
    return { success: "Review submitted successfully!" };
  } catch (err) {
    console.error("[SUBMIT REVIEW UNEXPECTED ERROR]", err);
    return { error: "An unexpected network error occurred. Please try again." };
  }
}

export async function submitQuestion(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];
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

    const { data: business } = await supabase
      .from("businesses")
      .select("email, name")
      .eq("id", businessId)
      .single();

    if (business?.email) {
      await sendEmail({
        to: business.email,
        subject: `New Question for ${business.name}`,
        html: generateEmailHtml("Henry County Directory", `
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

    revalidatePath(`/listings/${slug}`);
    return { success: "Question submitted! The owner will respond shortly." };
  } catch (err) {
    console.error("[SUBMIT QUESTION UNEXPECTED ERROR]", err);
    return { error: "An unexpected network error occurred. Please try again." };
  }
}
