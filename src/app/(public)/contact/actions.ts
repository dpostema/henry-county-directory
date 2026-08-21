"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/utils/rateLimit";
import { dispatchGhlWebhook } from "@/services/ghl";

export async function submitContactForm(formData: FormData) {
  const headersList = await headers();
  const ip = (headersList.get("x-forwarded-for") || "127.0.0.1").split(",")[0];
  const allowed = await checkRateLimit(ip, "submit_contact", 5, 300); // 5 per 5 min
  if (!allowed) return { error: "Too many messages sent. Please wait a few minutes." };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { error: "Name, email, and message are required." };
  }

  try {
    // Send to GHL
    await dispatchGhlWebhook({
      event: "general-contact",
      name,
      email,
      phone: phone || undefined,
      tags: ["general-contact", "directory-template"],
      subject,
      message,
      source: "Contact Page",
    });

    return { success: "Your message has been sent successfully! We will get back to you soon." };
  } catch (err) {
    console.error("[SUBMIT CONTACT ERROR]", err);
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
