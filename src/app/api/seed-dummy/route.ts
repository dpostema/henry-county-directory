/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Ensure Categories
    const categories = [
      { name: "Medicals & Healthcare", slug: "medicals", icon: "Activity" },
      { name: "Automotive & Repair", slug: "automotive", icon: "Car" },
      { name: "Foods & Dining", slug: "foods", icon: "Utensils" },
      { name: "Home Services & Contracting", slug: "services", icon: "Home" },
      { name: "Professional & Legal Services", slug: "professional", icon: "Briefcase" },
      { name: "Beauty & Personal Care", slug: "beauty-spa", icon: "Sparkles" },
      { name: "Retail & Shopping", slug: "shopping", icon: "ShoppingBag" },
      { name: "Fitness & Sports", slug: "fitness", icon: "Dumbbell" },
    ];

    for (const cat of categories) {
      await supabase.from("categories").upsert(cat, { onConflict: "slug" });
    }

    // 2. Ensure Cities
    const cities = [
      { name: "McDonough", slug: "mcdonough", state: "GA" },
      { name: "Stockbridge", slug: "stockbridge", state: "GA" },
      { name: "Hampton", slug: "hampton", state: "GA" },
      { name: "Locust Grove", slug: "locust-grove", state: "GA" },
      { name: "Flippen", slug: "flippen", state: "GA" },
      { name: "Blacksville", slug: "blacksville", state: "GA" },
    ];

    for (const city of cities) {
      await supabase.from("cities").upsert(city, { onConflict: "slug" });
    }

    // Fetch IDs
    const { data: dbCategories } = await supabase.from("categories").select("*");
    const { data: dbCities } = await supabase.from("cities").select("*");

    const catMap = new Map((dbCategories || []).map((c) => [c.slug, c.id]));
    const cityMap = new Map((dbCities || []).map((c) => [c.slug, c.id]));

    // Sign up / Sign in Demo Owner user session
    const demoEmail = "demo.owner@henrycounty.com";
    const demoPassword = "DemoPassword123!";

    const { data: signUpData } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          full_name: "Ginette Sarclay",
          role: "owner",
        },
      },
    });

    let ownerId = signUpData?.user?.id;
    if (!ownerId) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      ownerId = signInData?.user?.id;
    }

    // 3. Seed Businesses
    const dummyListings = [
      {
        name: "McDonough Family Dental Care",
        slug: "mcdonough-family-dental-care",
        owner_id: ownerId || null,
        category_id: catMap.get("medicals"),
        city_id: cityMap.get("mcdonough"),
        address: "125 Sabot Way, McDonough, GA 30253",
        phone: "(770) 555-0210",
        email: "info@mcdonoughdental.com",
        website: "https://mcdonoughdental.com",
        description: "Premier dental clinic offering comprehensive oral healthcare, teeth whitening, clear aligners, and family dentistry in Henry County.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "pro",
        is_featured: true,
        rating_avg: 4.9,
        review_count: 42,
      },
      {
        name: "Stockbridge Auto Repair & Diagnostics",
        slug: "stockbridge-auto-repair-diagnostics",
        owner_id: ownerId || null,
        category_id: catMap.get("automotive"),
        city_id: cityMap.get("stockbridge"),
        address: "480 North Henry Blvd, Stockbridge, GA 30281",
        phone: "(770) 555-0220",
        email: "service@stockbridgeauto.com",
        website: "https://stockbridgeauto.com",
        description: "Certified ASE mechanics providing engine diagnostics, transmission service, brake overhauls, and oil changes.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "enterprise",
        is_featured: true,
        rating_avg: 4.8,
        review_count: 58,
      },
      {
        name: "Hampton Coffee Depot & Bakery",
        slug: "hampton-coffee-depot-bakery",
        owner_id: ownerId || null,
        category_id: catMap.get("foods"),
        city_id: cityMap.get("hampton"),
        address: "12 Cherry St, Hampton, GA 30228",
        phone: "(770) 555-0230",
        email: "hello@hamptoncoffee.com",
        website: "https://hamptoncoffee.com",
        description: "Cozy neighborhood coffee lounge serving specialty espresso drinks, fresh cinnamon rolls, and quiet work spaces.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "featured",
        is_featured: true,
        rating_avg: 4.95,
        review_count: 37,
      },
      {
        name: "Southern Classic Smokehouse BBQ",
        slug: "southern-classic-smokehouse-bbq",
        owner_id: ownerId || null,
        category_id: catMap.get("foods"),
        city_id: cityMap.get("mcdonough"),
        address: "85 Jonesboro Rd, McDonough, GA 30253",
        phone: "(770) 555-0240",
        email: "bbq@southernclassic.com",
        website: "https://southernclassicbbq.com",
        description: "Slow-smoked hickory BBQ ribs, pulled pork, brisket, fried okra, and full event catering services.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "enterprise",
        is_featured: true,
        rating_avg: 4.9,
        review_count: 73,
      },
      {
        name: "Eagle's Landing Heating & Air",
        slug: "eagles-landing-heating-air",
        owner_id: ownerId || null,
        category_id: catMap.get("services"),
        city_id: cityMap.get("stockbridge"),
        address: "110 Rock Quarry Rd, Stockbridge, GA 30281",
        phone: "(770) 555-0250",
        email: "support@eagleslandinghvac.com",
        website: "https://eagleslandinghvac.com",
        description: "Trusted HVAC technicians offering emergency air conditioning repair, furnace replacements, and duct purification.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "enterprise",
        is_featured: true,
        rating_avg: 4.85,
        review_count: 31,
      },
      {
        name: "Henry County Day Spa & Wellness",
        slug: "henry-county-day-spa-wellness",
        owner_id: ownerId || null,
        category_id: catMap.get("beauty-spa"),
        city_id: cityMap.get("mcdonough"),
        address: "210 Keys Ferry St, McDonough, GA 30253",
        phone: "(770) 555-0260",
        email: "spa@henrywellness.com",
        website: "https://henrywellness.com",
        description: "Relaxing day spa offering therapeutic massages, deep cleansing facials, manicure spa treatments, and sauna sessions.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "pro",
        is_featured: false,
        rating_avg: 4.75,
        review_count: 24,
      },
      {
        name: "Locust Grove Animal Hospital",
        slug: "locust-grove-animal-hospital",
        owner_id: ownerId || null,
        category_id: catMap.get("medicals"),
        city_id: cityMap.get("locust-grove"),
        address: "3850 Highway 42, Locust Grove, GA 30248",
        phone: "(770) 555-0270",
        email: "care@locustgrovevet.com",
        website: "https://locustgrovevet.com",
        description: "Compassionate pet healthcare, routine checkups, dental scaling, pet surgery, and indoor boarding kennels.",
        verification_level: "verified",
        status: "claimed",
        plan_tier: "pro",
        is_featured: false,
        rating_avg: 4.92,
        review_count: 48,
      },
      {
        name: "Locust Grove Hardware & Supply",
        slug: "locust-grove-hardware-supply",
        category_id: catMap.get("shopping"),
        city_id: cityMap.get("locust-grove"),
        address: "3700 Highway 42, Locust Grove, GA 30248",
        phone: "(770) 555-0290",
        email: "sales@locustgrovehardware.com",
        website: "https://locustgrovehardware.com",
        description: "Local hardware store stocking lawn mowers, building materials, plumbing supplies, paint mixing, and key cutting.",
        verification_level: "unverified",
        status: "unclaimed",
        plan_tier: "free",
        is_featured: false,
        rating_avg: 4.6,
        review_count: 14,
      },
    ];

    let insertedCount = 0;
    const errors: string[] = [];
    for (const b of dummyListings) {
      const { error } = await supabase
        .from("businesses")
        .insert(b as any);
      if (!error) {
        insertedCount++;
      } else {
        errors.push(`${b.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded dummy data into Supabase!`,
      categoriesSeeded: dbCategories?.length || 0,
      citiesSeeded: dbCities?.length || 0,
      businessesProcessed: insertedCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
