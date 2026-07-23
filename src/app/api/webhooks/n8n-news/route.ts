import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

// Pull the first markdown H1/H2 if no SEO title is provided.
const firstHeading = (md: string) => {
  const m = md.match(/^\s*#{1,3}\s+(.+)$/m);
  return m ? m[1].trim().replace(/[*_`]+/g, "") : null;
};

// Excerpt = first non-heading paragraph, trimmed to ~220 chars.
const firstParagraph = (md: string) => {
  const blocks = md
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#") && !b.startsWith("<"));
  const raw = blocks[0] ?? "";
  const plain = raw
    .replace(/[*_`]+/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 220 ? plain.slice(0, 217).trimEnd() + "…" : plain;
};

export async function POST(req: Request) {
  const SECRET = process.env.N8N_WEBHOOK_SECRET;

  if (!SECRET) {
    return NextResponse.json({ error: "Server is missing N8N_WEBHOOK_SECRET" }, { status: 500 });
  }

  const presented = req.headers.get("x-ingest-secret") ?? "";
  if (presented !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const markdown = String(body?.blog_markdown ?? "").trim();
  if (!markdown) {
    return NextResponse.json({ error: "Missing blog_markdown" }, { status: 400 });
  }

  const seo = body?.seo ?? {};
  const title: string = String(seo.title || firstHeading(markdown) || "Untitled").trim();
  const slugSource = String(seo.slug || title).trim();
  const slug = slugify(slugSource);
  
  if (!slug) {
    return NextResponse.json({ error: "Could not derive slug" }, { status: 400 });
  }

  const excerpt = String(seo.meta_description || firstParagraph(markdown)).trim();
  const imageUrl = body?.image_url ? String(body.image_url) : null;
  
  // Use the service role key so this server-to-server request bypasses RLS
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const row: any = {
    slug,
    title,
    excerpt,
    content: markdown, 
    cover_image_url: imageUrl,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("articles")
    .upsert(row, { onConflict: "slug" })
    .select()
    .single();

  if (error) {
    console.error("news-ingest insert failed:", error);
    // fallback attempt if `content` column doesn't exist, we just insert the other fields for the time being.
    if (error.message.includes("Could not find the 'content' column")) {
       delete row.content;
       const retry = await sb.from("articles").upsert(row, { onConflict: "slug" }).select().single();
       if (retry.error) {
          return NextResponse.json({ error: `DB error: ${retry.error.message}` }, { status: 500 });
       }
       return NextResponse.json({
         ok: true,
         article: { id: retry.data.id, slug: retry.data.slug, title: retry.data.title },
       });
    }

    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    article: { id: data.id, slug: data.slug, title: data.title },
  });
}
