import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: businesses, error: dbError } = await supabase
      .from("businesses")
      .select("id, name, email, phone, address")
      .eq("status", "unclaimed")
      .eq("source", "cold_import");

    if (dbError) throw dbError;

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No contacts to sync.", syncedCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const ghlAccessToken = Deno.env.get("GHL_ACCESS_TOKEN");
    const ghlLocationId = Deno.env.get("GHL_LOCATION_ID") || "mock-location-id";
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
        tags: ["unclaimed-listing", "henry-county-directory"],
        locationId: ghlLocationId,
      };

      if (isMock) {
        console.log(`[GHL SYNC MOCK] Synced ${bus.name} to GHL Location ID ${ghlLocationId}`);
        syncedList.push(bus.name);
      } else {
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
            errors.push(`${bus.name}: ${JSON.stringify(resData)}`);
          } else {
            syncedList.push(`${bus.name} (GHL ID: ${resData.contact?.id})`);
          }
        } catch (err: any) {
          errors.push(`${bus.name}: ${err.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isMock ? "Simulated sync completed." : "Sync completed.",
        syncedCount: syncedList.length,
        syncedList,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
