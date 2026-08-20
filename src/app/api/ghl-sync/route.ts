/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient, getAdminUser } from "@/utils/supabase/server";

export async function POST() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch unclaimed listings from cold imports
    const { data: businesses, error: dbError } = await supabase
      .from("businesses")
      .select("id, name, email, phone, address")
      .eq("status", "unclaimed")
      .eq("source", "cold_import");

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unclaimed cold-import businesses found to sync.",
        syncedCount: 0,
      });
    }

    const webhookUrl = process.env.GHL_WEBHOOK_UNCLAIMED_LISTING;
    const isMock = !webhookUrl;

    const syncedList: string[] = [];
    const errors: string[] = [];

    const { dispatchGhlWebhook } = await import("@/services/ghl");

    for (const bus of businesses) {
      if (isMock) {
        // Mock Mode
        console.log(`[GHL SYNC MOCK] Synced Contact: ${bus.name} (Email: ${bus.email})`);
        syncedList.push(`${bus.name} (Simulated Sync)`);
      } else {
        await dispatchGhlWebhook({
          email: bus.email || undefined,
          name: bus.name,
          phone: bus.phone || undefined,
          event: "unclaimed-listing",
          source: "Manual Batch Sync",
          tags: ["unclaimed-listing", "directory-template"]
        });
        syncedList.push(`${bus.name} (Webhook Fired)`);
      }
    }

    return NextResponse.json({
      success: true,
      message: isMock
        ? "Mock Sync complete (No GHL_WEBHOOK_UNCLAIMED_LISTING loaded). Listings logged to server console."
        : "GoHighLevel contact synchronization webhooks fired.",
      syncedCount: syncedList.length,
      syncedList,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
