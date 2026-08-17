/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

// Helper to initialize direct admin/service client if key is present, fallback to standard server client
async function getSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (serviceKey) {
    return createDirectClient(url, serviceKey);
  }
  return await createServerClient();
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Simple state machine CSV parser to support quoted fields
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip second quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(entry.trim());
      entry = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(entry.trim());
      result.push(row);
      row = [];
      entry = "";
    } else {
      entry += char;
    }
  }

  if (entry || row.length > 0) {
    row.push(entry.trim());
    result.push(row);
  }

  return result.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

// Category keyword guessing lists
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  foods: ["restaurant", "food", "bakery", "cafe", "kitchen", "diner", "grill", "sushi", "pizza", "burger", "sweets", "cake", "coffee", "pastry"],
  hotels: ["hotel", "motel", "inn", "stay", "lodge", "suite", "resort"],
  jobs: ["recruitment", "agency", "career", "hiring", "staffing"],
  medicals: ["medical", "clinic", "hospital", "doctor", "dentist", "therapy", "pharmacy", "health", "care", "eye", "pediatric", "dental"],
  services: ["repair", "plumbing", "roofing", "cleaning", "delivery", "transport", "packing", "legal", "consulting", "accounting", "tech", "solutions", "it"],
  shopping: ["shop", "store", "shoes", "boutique", "wear", "outlet", "market", "grocery", "supermarket", "gift", "jewelry", "hardware"],
  automotive: ["car", "auto", "tire", "transmission", "garage", "vehicle", "collision", "towing", "repair"],
};

function guessCategory(name: string, description: string): string {
  const content = `${name} ${description}`.toLowerCase();
  for (const [categorySlug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => content.includes(kw))) {
      return categorySlug;
    }
  }
  return "services"; // default fallback
}

// ${siteConfig.region.name} Geocode reference centers
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  mcdonough: { lat: 33.4473, lon: -84.1469 },
  stockbridge: { lat: 33.5443, lon: -84.2339 },
  hampton: { lat: 33.3854, lon: -84.2863 },
  "locust-grove": { lat: 33.3457, lon: -84.1169 },
};

export async function POST(req: Request) {
  try {
    const { csvText } = await req.json();

    if (!csvText) {
      return NextResponse.json({ error: "CSV text is required." }, { status: 400 });
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV must contain headers and at least one data row." }, { status: 400 });
    }

    const headers = rows[0].map((h) => h.toLowerCase());
    const nameIdx = headers.indexOf("name");
    const addressIdx = headers.indexOf("address");
    const phoneIdx = headers.indexOf("phone");
    const emailIdx = headers.indexOf("email");
    const websiteIdx = headers.indexOf("website");
    const descIdx = headers.indexOf("description");
    const catIdx = headers.indexOf("category");
    const cityIdx = headers.indexOf("city");
    const imgUrlIdx = headers.indexOf("image_url");

    if (nameIdx === -1) {
      return NextResponse.json({ error: "CSV headers must contain 'name'." }, { status: 400 });
    }

    const supabase = await getSupabaseClient();

    // Fetch preloaded cities and categories for constraint mapping
    const { data: categories } = await supabase.from("categories").select("*");
    const { data: cities } = await supabase.from("cities").select("*");

    const categoryMap = new Map(categories?.map((c) => [c.slug, c.id]));
    const cityMap = new Map(cities?.map((c) => [c.slug, c.id]));

    let importedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    // Parse each row
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = row[nameIdx];
      if (!name) {
        errors.push(`Row ${r}: Missing name. Skipped.`);
        continue;
      }

      const address = addressIdx !== -1 ? row[addressIdx] : "";
      const phone = phoneIdx !== -1 ? row[phoneIdx] : "";
      const email = emailIdx !== -1 ? row[emailIdx] : "";
      const website = websiteIdx !== -1 ? row[websiteIdx] : "";
      const description = descIdx !== -1 ? row[descIdx] : "";
      const explicitCategory = catIdx !== -1 ? row[catIdx]?.toLowerCase() : "";
      const cityVal = cityIdx !== -1 ? row[cityIdx]?.toLowerCase() : "";
      const imageUrl = imgUrlIdx !== -1 && row[imgUrlIdx] ? row[imgUrlIdx] : null;

      // 1. Map category (guess if missing or invalid)
      let matchedCategorySlug = explicitCategory;
      if (!categoryMap.has(matchedCategorySlug)) {
        matchedCategorySlug = guessCategory(name, description);
      }
      const categoryId = categoryMap.get(matchedCategorySlug) || null;

      // 2. Map city
      const matchedCitySlug = slugify(cityVal);
      const cityId = cityMap.get(matchedCitySlug) || null;

      // Create unique slug
      const baseSlug = slugify(name);
      const uniqueSuffix = Math.random().toString(36).slice(2, 6);
      const finalSlug = `${baseSlug}-${uniqueSuffix}`;

      // 4. Duplicate name check
      const { data: dups } = await supabase
        .from("businesses")
        .select("id, name")
        .ilike("name", name)
        .limit(1);

      // Insert new listing
      const { data: newBus, error: insertError } = await supabase
        .from("businesses")
        .insert({
          name,
          slug: finalSlug,
          description: description || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
          website: website || null,
          category_id: categoryId,
          city_id: cityId,
          cover_image_url: imageUrl,
          media: imageUrl ? [{ url: imageUrl }] : null,
          verification_level: "unverified",
          status: "unclaimed",
          plan_tier: "free",
          is_featured: false,
        })
        .select("id")
        .single();

      if (insertError) {
        errors.push(`Row ${r} (${name}): ${insertError.message}`);
        continue;
      }

      // If duplicate detected, flag it
      if (dups && dups.length > 0 && newBus) {
        duplicateCount++;
        await supabase.from("duplicate_flags").insert({
          business_a_id: dups[0].id,
          business_b_id: newBus.id,
          confidence_score: 0.9,
          status: "pending",
        });
      }

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      duplicateCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
