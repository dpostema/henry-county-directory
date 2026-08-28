export interface GHLPayload {
  email?: string;
  name?: string;
  phone?: string;
  event: string;
  source?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Fires an event to GoHighLevel via an Inbound Webhook.
 * Maps specific events to their dedicated webhook URLs.
 */
export async function dispatchGhlWebhook(payload: GHLPayload) {
  let webhookUrl: string | undefined;

  switch (payload.event) {
    case "directory-signup":
      webhookUrl = process.env.GHL_WEBHOOK_SIGNUP;
      break;
    case "directory-new-listing":
      webhookUrl = process.env.GHL_WEBHOOK_NEW_LISTING;
      break;
    case "unclaimed-listing":
      webhookUrl = process.env.GHL_WEBHOOK_UNCLAIMED_LISTING;
      break;
    case "directory-subscribed":
      webhookUrl = process.env.GHL_WEBHOOK_SUBSCRIBED;
      break;
    case "directory-unsubscribed":
      webhookUrl = process.env.GHL_WEBHOOK_UNSUBSCRIBED;
      break;
    case "business-lead":
      webhookUrl = process.env.GHL_WEBHOOK_BUSINESS_LEAD;
      break;
    case "general-contact":
      webhookUrl = process.env.GHL_WEBHOOK_CONTACT;
      break;
    case "directory-upgrade":
      webhookUrl = process.env.GHL_WEBHOOK_UPGRADE;
      break;
    case "report-listing":
      webhookUrl = process.env.GHL_WEBHOOK_REPORT_LISTING;
      break;
    default:
      console.log(`[GHL Webhook Skipped] Unknown event type: ${payload.event}`);
      return;
  }
  
  if (!webhookUrl) {
    console.log(`[GHL Webhook Skipped] No Webhook URL provided for event: ${payload.event}. Payload:`, payload);
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Fire and forget, adding timestamp
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
      }),
    });

    if (!res.ok) {
      console.error(`[GHL Webhook Error] Status: ${res.status}`);
    } else {
      console.log(`[GHL Webhook Success] Fired event: ${payload.event}`);
    }
  } catch (err: unknown) {
    console.error("[GHL Webhook Exception]", err instanceof Error ? err.message : String(err));
  }
}
