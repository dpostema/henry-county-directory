import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tebpopsoyhdrrztbdexm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYnBvcHNveWhkcnJ6dGJkZXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzE0ODEsImV4cCI6MjA5OTgwNzQ4MX0.COPdUrf_fncOJfn9XwwJ5YC5kmB8rVYkAZHSi_ZF-q8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedData() {
  console.log("🌱 Starting Henry County Directory Dummy Data Seed...");

  // 1. Seed Categories
  const categories = [
    { name: "Medical & Healthcare", slug: "medicals", icon: "Activity" },
    { name: "Automotive & Repair", slug: "automotive", icon: "Car" },
    { name: "Food & Dining", slug: "foods", icon: "Utensils" },
    { name: "Home Services & Contracting", slug: "home-services", icon: "Home" },
    { name: "Professional & Legal Services", slug: "professional-services", icon: "Briefcase" },
    { name: "Beauty & Personal Care", slug: "beauty-spa", icon: "Sparkles" },
    { name: "Retail & Shopping", slug: "retail-shopping", icon: "ShoppingBag" },
    { name: "Fitness & Sports", slug: "fitness-sports", icon: "Dumbbell" }
  ];

  console.log("📦 Seeding categories...");
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .upsert(categories, { onConflict: "slug" })
    .select();

  if (catError) {
    console.error("❌ Categories seed error:", catError.message);
  } else {
    console.log(`✅ ${catData?.length || 0} Categories seeded/updated.`);
  }

  // 2. Seed Cities
  const cities = [
    { name: "McDonough", slug: "mcdonough", state: "GA" },
    { name: "Stockbridge", slug: "stockbridge", state: "GA" },
    { name: "Hampton", slug: "hampton", state: "GA" },
    { name: "Locust Grove", slug: "locust-grove", state: "GA" },
    { name: "Flippen", slug: "flippen", state: "GA" },
    { name: "Blacksville", slug: "blacksville", state: "GA" }
  ];

  console.log("🏙️ Seeding cities...");
  const { data: cityData, error: cityError } = await supabase
    .from("cities")
    .upsert(cities, { onConflict: "slug" })
    .select();

  if (cityError) {
    console.error("❌ Cities seed error:", cityError.message);
  } else {
    console.log(`✅ ${cityData?.length || 0} Cities seeded/updated.`);
  }

  // Get Map lookup for IDs
  const catMap = Object.fromEntries((catData || []).map((c) => [c.slug, c.id]));
  const cityMap = Object.fromEntries((cityData || []).map((c) => [c.slug, c.id]));

  // 3. Seed Businesses
  const dummyBusinesses = [
    {
      name: "McDonough Dental Care",
      slug: "mcdonough-dental-care",
      category_id: catMap["medicals"],
      city_id: cityMap["mcdonough"],
      address: "125 Sabot Way, McDonough, GA 30253",
      phone: "770-555-0210",
      email: "info@mcdonoughdental.com",
      website: "https://mcdonoughdental.com",
      description: "Professional dental clinic offering comprehensive family oral care, cosmetic whitening, teeth scaling, and emergency implants in Henry County.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: true,
      rating_avg: 4.90,
      review_count: 38,
      latitude: 33.4473,
      longitude: -84.1469
    },
    {
      name: "Stockbridge Auto Repair & Diagnostics",
      slug: "stockbridge-auto-repair",
      category_id: catMap["automotive"],
      city_id: cityMap["stockbridge"],
      address: "480 North Henry Blvd, Stockbridge, GA 30281",
      phone: "770-555-0220",
      email: "service@stockbridgeauto.com",
      website: "https://stockbridgeauto.com",
      description: "Full service automotive repair facility specializing in engine diagnostics, transmission overhauls, brake installations, and oil service.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "enterprise",
      is_featured: true,
      rating_avg: 4.85,
      review_count: 52,
      latitude: 33.5443,
      longitude: -84.2338
    },
    {
      name: "Hampton Coffee Depot & Bakery",
      slug: "hampton-coffee-depot",
      category_id: catMap["foods"],
      city_id: cityMap["hampton"],
      address: "12 Cherry St, Hampton, GA 30228",
      phone: "770-555-0230",
      email: "hello@hamptoncoffee.com",
      website: "https://hamptoncoffee.com",
      description: "Cozy artisanal coffee shop serving locally roasted espresso blends, house-baked breakfast pastries, and high-speed Wi-Fi workspaces.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "featured",
      is_featured: true,
      rating_avg: 4.95,
      review_count: 44,
      latitude: 33.3832,
      longitude: -84.2849
    },
    {
      name: "Southern Classic BBQ & Smokehouse",
      slug: "southern-classic-bbq",
      category_id: catMap["foods"],
      city_id: cityMap["mcdonough"],
      address: "85 Jonesboro Rd, McDonough, GA 30253",
      phone: "770-555-0240",
      email: "catering@southernclassicbbq.com",
      website: "https://southernclassicbbq.com",
      description: "Award-winning Georgia smoked meats, hickory pulled pork, slow-roasted ribs, homemade mac & cheese, and event catering.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "enterprise",
      is_featured: true,
      rating_avg: 4.92,
      review_count: 67,
      latitude: 33.4498,
      longitude: -84.1520
    },
    {
      name: "Eagle's Landing Heating & Air",
      slug: "eagles-landing-hvac",
      category_id: catMap["home-services"],
      city_id: cityMap["stockbridge"],
      address: "110 Rock Quarry Rd, Stockbridge, GA 30281",
      phone: "770-555-0250",
      email: "contact@eagleslandinghvac.com",
      website: "https://eagleslandinghvac.com",
      description: "Licensed 24/7 emergency HVAC repair, air conditioning installation, furnace maintenance, and duct purification across Henry County.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "enterprise",
      is_featured: true,
      rating_avg: 4.88,
      review_count: 29,
      latitude: 33.5281,
      longitude: -84.2250
    },
    {
      name: "Henry County Wellness & Day Spa",
      slug: "henry-county-wellness-spa",
      category_id: catMap["beauty-spa"],
      city_id: cityMap["mcdonough"],
      address: "210 Keys Ferry St, McDonough, GA 30253",
      phone: "770-555-0260",
      email: "relax@henrywellnessspa.com",
      website: "https://henrywellnessspa.com",
      description: "Luxury medical spa providing therapeutic deep tissue massages, hydrafacials, body contouring, and skin rejuvenation treatments.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: false,
      rating_avg: 4.78,
      review_count: 19,
      latitude: 33.4465,
      longitude: -84.1435
    },
    {
      name: "Locust Grove Animal Hospital",
      slug: "locust-grove-animal-hospital",
      category_id: catMap["medicals"],
      city_id: cityMap["locust-grove"],
      address: "3850 Highway 42, Locust Grove, GA 30248",
      phone: "770-555-0270",
      email: "care@locustgrovevet.com",
      website: "https://locustgrovevet.com",
      description: "Full-service veterinary clinic dedicated to small animal wellness exams, vaccinations, surgical procedures, and boarding.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: false,
      rating_avg: 4.91,
      review_count: 31,
      latitude: 33.3440,
      longitude: -84.1080
    },
    {
      name: "Stockbridge Family Law & Mediation",
      slug: "stockbridge-family-law",
      category_id: catMap["professional-services"],
      city_id: cityMap["stockbridge"],
      address: "150 Country Club Dr, Stockbridge, GA 30281",
      phone: "770-555-0280",
      email: "consult@stockbridgelawyers.com",
      website: "https://stockbridgelawyers.com",
      description: "Experienced legal representation for family law, estate planning, probate, business incorporation, and civil mediation.",
      verification_level: "verified",
      status: "claimed",
      plan_tier: "pro",
      is_featured: false,
      rating_avg: 4.82,
      review_count: 15,
      latitude: 33.5350,
      longitude: -84.2180
    }
  ];

  console.log("🏢 Seeding business listings...");
  const { data: busData, error: busError } = await supabase
    .from("businesses")
    .upsert(dummyBusinesses, { onConflict: "slug" })
    .select();

  if (busError) {
    console.error("❌ Businesses seed error:", busError.message);
  } else {
    console.log(`✅ ${busData?.length || 0} Businesses seeded/updated.`);
  }

  // 4. Seed Dummy Leads
  if (busData && busData.length > 0) {
    const firstBusId = busData[0].id;
    const leads = [
      {
        business_id: firstBusId,
        full_name: "Sarah Jenkins",
        email: "sarah.jenkins@gmail.com",
        phone: "770-555-9012",
        message: "Hi! I would like to schedule an appointment for next Tuesday morning.",
        status: "new"
      },
      {
        business_id: firstBusId,
        full_name: "David Miller",
        email: "dmiller@yahoo.com",
        phone: "678-555-4321",
        message: "Could you please send me a price estimate for family consultation?",
        status: "contacted"
      }
    ];

    console.log("📩 Seeding dummy leads...");
    const { error: leadError } = await supabase.from("leads").insert(leads);
    if (leadError) {
      console.log("ℹ️ Leads note:", leadError.message);
    } else {
      console.log("✅ Dummy leads inserted successfully.");
    }
  }

  console.log("\n🎉 Dummy data seeding completed cleanly!");
}

seedData().catch((err) => {
  console.error("Fatal seed error:", err);
});
