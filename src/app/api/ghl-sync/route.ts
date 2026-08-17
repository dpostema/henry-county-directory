/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
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

    const ghlAccessToken = process.env.GHL_ACCESS_TOKEN;
    const ghlLocationId = process.env.GHL_LOCATION_ID || "mock-location-id";
    const isMock = !ghlAccessToken;

    const syncedList: string[] = [];
    const errors: string[] = [];

    for (const bus of businesses) {
      const contactPayload = {
        name: bus.name,
        companyName: bus.name,
        email: bus.email || undefined,
        phone: bus.phone || undefined,
        address1: bus.address || undefined,
        tags: ["unclaimed-listing", "directory-template"],
        locationId: ghlLocationId,
      };

      if (isMock) {
        // Mock Mode: Simulates successful sync response
        console.log(`[GHL SYNC MOCK] Synced Contact: ${bus.name} (Email: ${bus.email}) to Location: ${ghlLocationId}`);
        syncedList.push(`${bus.name} (Simulated Sync)`);
      } else {
        // Real Mode: Calls the actual GoHighLevel V2 REST endpoint
        try {
          const res = await fetch("https://services.leadconnectorhq.com/contacts/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ghlAccessToken}`,
              Version: "2021-04-15",
            },
            body: JSON.stringify(contactPayload),
          });

          const resData = await res.json();

          if (!res.ok) {
            console.error(`[GHL SYNC ERROR] Code ${res.status}:`, resData);
            errors.push(`${bus.name}: [GHL API Error] ${JSON.stringify(resData)}`);
          } else {
            console.log(`[GHL SYNC SUCCESS] Synced ${bus.name} with GHL Contact ID: ${resData.contact?.id}`);
            syncedList.push(`${bus.name} (GHL ID: ${resData.contact?.id || "unknown"})`);
          }
        } catch (err: any) {
          console.error(`[GHL SYNC HTTP EXCEPTION] ${bus.name}:`, err.message);
          errors.push(`${bus.name}: [HTTP Exception] ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isMock
        ? "Mock Sync complete (No GHL_ACCESS_TOKEN loaded). Listings logged to server console."
        : "GoHighLevel contact synchronization completed.",
      syncedCount: syncedList.length,
      syncedList,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
