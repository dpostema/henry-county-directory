import { Resend } from "resend";
import { siteConfig } from "@/config/site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY || !resend) {
    console.warn("[EMAIL MOCK] Missing RESEND_API_KEY. Simulated email send:");
    console.warn(`To: ${to}`);
    console.warn(`Subject: ${subject}`);
    return { success: true };
  }

  try {
    const fromEmail = process.env.RESEND_DOMAIN_NAME?.trim() || `${siteConfig.name} <onboarding@resend.dev>`;
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[RESEND ERROR]", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("[RESEND EXCEPTION]", error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
