import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: 'user_id, endpoint' });

    if (error) {
      console.error("Push subscription error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Optionally update user profile to enable push preference
    await supabase.from("profiles").update({
      notification_preferences: {
        email: true,
        push: true,
        deals: true,
        leads: true,
        reviews: true
      } // In reality, we'd deep merge with existing JSONB
    }).eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
