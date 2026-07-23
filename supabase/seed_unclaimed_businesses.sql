-- ============================================================================
-- HENRY COUNTY DIRECTORY — UNCLAIMED BUSINESSES SEED SCRIPT
-- Execute this SQL query in Supabase SQL Editor to add unclaimed businesses
-- ============================================================================

-- Ensure latitude & longitude columns exist
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

INSERT INTO public.businesses (
  id, name, slug, owner_id, category_id, city_id, address, phone, email, website, description,
  verification_level, status, plan_tier, is_featured, rating_avg, review_count, latitude, longitude
)
VALUES
  (
    'c0000008-0000-4000-a000-000000000008',
    'Locust Grove Hardware & Supply',
    'locust-grove-hardware-supply',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'shopping' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'locust-grove' LIMIT 1),
    '3700 Highway 42, Locust Grove, GA 30248',
    '(770) 555-0290',
    'sales@locustgrovehardware.com',
    'https://locustgrovehardware.com',
    'Local hardware store stocking lawn mowers, building materials, plumbing supplies, paint mixing, and key cutting.',
    'unverified', 'unclaimed', 'free', false, 4.60, 14, 33.3450, -84.1100
  ),
  (
    'c0000009-0000-4000-a000-000000000009',
    'Blacksville Farm Fresh Market',
    'blacksville-farm-fresh-market',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'shopping' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'blacksville' LIMIT 1),
    '520 Blacksville Rd, McDonough, GA 30253',
    '(770) 555-0310',
    'info@blacksvillemarket.com',
    'https://blacksvillemarket.com',
    'Family-owned farm stand offering locally grown Georgia peaches, fresh heirloom tomatoes, raw honey, and homemade preserves.',
    'unverified', 'unclaimed', 'free', false, 4.80, 19, 33.4210, -84.1350
  ),
  (
    'c0000010-0000-4000-a000-000000000010',
    'Flippen Auto Detail & Hand Wash',
    'flippen-auto-detail-hand-wash',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'automotive' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'flippen' LIMIT 1),
    '140 Flippen Rd, Stockbridge, GA 30281',
    '(770) 555-0320',
    'contact@flippenautodetail.com',
    'https://flippenautodetail.com',
    'Premium hand car wash, ceramic coating protection, paint correction, and interior steam detailing services.',
    'unverified', 'unclaimed', 'free', false, 4.70, 11, 33.5110, -84.2100
  ),
  (
    'c0000011-0000-4000-a000-000000000011',
    'McDonough Small Engine Repair',
    'mcdonough-small-engine-repair',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'services' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'mcdonough' LIMIT 1),
    '310 Industrial Blvd, McDonough, GA 30253',
    '(770) 555-0330',
    'service@mcdonoughengine.com',
    'https://mcdonoughengine.com',
    'Specializing in lawn mower tune-ups, generator service, chainsaw chain sharpening, and small power engine maintenance.',
    'unverified', 'unclaimed', 'free', false, 4.55, 8, 33.4390, -84.1480
  ),
  (
    'c0000012-0000-4000-a000-000000000012',
    'Stockbridge Pet Grooming Salon',
    'stockbridge-pet-grooming-salon',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'services' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'stockbridge' LIMIT 1),
    '225 Davidson Pkwy, Stockbridge, GA 30281',
    '(770) 555-0340',
    'booking@stockbridgegrooming.com',
    'https://stockbridgegrooming.com',
    'Gentle dog wash baths, breed haircuts, nail trimming, ear cleaning, and deshedding treatment for pets.',
    'unverified', 'unclaimed', 'free', false, 4.85, 22, 33.5390, -84.2290
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  status = 'unclaimed',
  verification_level = 'unverified';
