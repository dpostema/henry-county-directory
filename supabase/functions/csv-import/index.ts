import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

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
        i++;
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
  return "services";
}

const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  mcdonough: { lat: 33.4473, lon: -84.1469 },
  stockbridge: { lat: 33.5443, lon: -84.2339 },
  hampton: { lat: 33.3854, lon: -84.2863 },
  "locust-grove": { lat: 33.3457, lon: -84.1169 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { csvText } = await req.json();

    if (!csvText) {
      return new Response(JSON.stringify({ error: "CSV text is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: "CSV must contain headers and data." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
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

    const { data: categories } = await supabase.from("categories").select("*");
    const { data: cities } = await supabase.from("cities").select("*");

    const categoryMap = new Map(categories?.map((c) => [c.slug, c.id]));
    const cityMap = new Map(cities?.map((c) => [c.slug, c.id]));

    let importedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = row[nameIdx];
      if (!name) {
        errors.push(`Row ${r}: Missing name.`);
        continue;
      }

      const address = addressIdx !== -1 ? row[addressIdx] : "";
      const phone = phoneIdx !== -1 ? row[phoneIdx] : "";
      const email = emailIdx !== -1 ? row[emailIdx] : "";
      const website = websiteIdx !== -1 ? row[websiteIdx] : "";
      const description = descIdx !== -1 ? row[descIdx] : "";
      const explicitCategory = catIdx !== -1 ? row[catIdx]?.toLowerCase() : "";
      const cityVal = cityIdx !== -1 ? row[cityIdx]?.toLowerCase() : "";

      let matchedCategorySlug = explicitCategory;
      if (!categoryMap.has(matchedCategorySlug)) {
        matchedCategorySlug = guessCategory(name, description);
      }
      const categoryId = categoryMap.get(matchedCategorySlug) || null;

      const matchedCitySlug = slugify(cityVal);
      const cityId = cityMap.get(matchedCitySlug) || null;

      const cityCoords = CITY_COORDINATES[matchedCitySlug] || CITY_COORDINATES["mcdonough"];
      const jitterLat = cityCoords.lat + (Math.random() - 0.5) * 0.006;
      const jitterLon = cityCoords.lon + (Math.random() - 0.5) * 0.006;

      const baseSlug = slugify(name);
      const uniqueSuffix = Math.random().toString(36).slice(2, 6);
      const finalSlug = `${baseSlug}-${uniqueSuffix}`;

      const { data: dups } = await supabase
        .from("businesses")
        .select("id, name")
        .ilike("name", name)
        .limit(1);

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
          latitude: jitterLat,
          longitude: jitterLon,
          category_id: categoryId,
          city_id: cityId,
          verification_level: "unverified",
          status: "unclaimed",
          plan_tier: "free",
          is_featured: false,
          source: "cold_import",
        })
        .select("id")
        .single();

      if (insertError) {
        errors.push(`Row ${r} (${name}): ${insertError.message}`);
        continue;
      }

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

    return new Response(
      JSON.stringify({ success: true, importedCount, duplicateCount, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
