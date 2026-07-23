-- ============================================================================
-- HENRY COUNTY DIRECTORY — DUMMY DATA SEED SCRIPT
-- Execute this SQL in Supabase SQL Editor to populate dummy profiles & businesses
-- ============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, icon)
VALUES
  ('11111111-1111-4111-a111-111111111111', 'Medicals & Healthcare', 'medicals', 'Activity'),
  ('22222222-2222-4222-a222-222222222222', 'Automotive & Repair', 'automotive', 'Car'),
  ('33333333-3333-4333-a333-333333333333', 'Foods & Dining', 'foods', 'Utensils'),
  ('44444444-4444-4444-a444-444444444444', 'Home Services & Contracting', 'services', 'Home'),
  ('55555555-5555-4555-a555-555555555555', 'Professional & Legal Services', 'professional', 'Briefcase'),
  ('66666666-6666-4666-a666-666666666666', 'Beauty & Personal Care', 'beauty-spa', 'Sparkles'),
  ('77777777-7777-4777-a777-777777777777', 'Retail & Shopping', 'shopping', 'ShoppingBag'),
  ('88888888-8888-4888-a888-888888888888', 'Fitness & Sports', 'fitness', 'Dumbbell')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 2. SEED CITIES
INSERT INTO public.cities (id, name, slug, state)
VALUES
  ('a1111111-1111-4111-b111-111111111111', 'McDonough', 'mcdonough', 'GA'),
  ('a2222222-2222-4222-b222-222222222222', 'Stockbridge', 'stockbridge', 'GA'),
  ('a3333333-3333-4333-b333-333333333333', 'Hampton', 'hampton', 'GA'),
  ('a4444444-4444-4444-b444-444444444444', 'Locust Grove', 'locust-grove', 'GA'),
  ('a5555555-5555-4555-b555-555555555555', 'Flippen', 'flippen', 'GA'),
  ('a6666666-6666-4666-b666-666666666666', 'Blacksville', 'blacksville', 'GA')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state;

-- 3. SEED DUMMY AUTH USERS & PROFILES
-- Insert matching auth.users entries to satisfy foreign key constraints
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'e0000001-0000-4000-a000-000000000001', 'authenticated', 'authenticated', 'admin@henrycounty.com', crypt('Admin123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"System Admin","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000002-0000-4000-a000-000000000002', 'authenticated', 'authenticated', 'ginette.sarclay@mcdonoughdental.com', crypt('Owner123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ginette Sarclay","role":"owner"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000003-0000-4000-a000-000000000003', 'authenticated', 'authenticated', 'marcus.vance@stockbridgeauto.com', crypt('Owner123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Vance","role":"owner"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000004-0000-4000-a000-000000000004', 'authenticated', 'authenticated', 'sarah.jenkins@gmail.com', crypt('User123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins","role":"visitor"}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', 'e0000005-0000-4000-a000-000000000005', 'authenticated', 'authenticated', 'david.miller@yahoo.com', crypt('User123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Miller","role":"visitor"}', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
VALUES
  ('e0000001-0000-4000-a000-000000000001', 'admin@henrycounty.com', 'System Admin', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('e0000002-0000-4000-a000-000000000002', 'ginette.sarclay@mcdonoughdental.com', 'Ginette Sarclay', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
  ('e0000003-0000-4000-a000-000000000003', 'marcus.vance@stockbridgeauto.com', 'Marcus Vance', 'owner', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('e0000004-0000-4000-a000-000000000004', 'sarah.jenkins@gmail.com', 'Sarah Jenkins', 'visitor', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
  ('e0000005-0000-4000-a000-000000000005', 'david.miller@yahoo.com', 'David Miller', 'visitor', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, avatar_url = EXCLUDED.avatar_url;

-- 4. SEED BUSINESSES
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

INSERT INTO public.businesses (
  id, name, slug, owner_id, category_id, city_id, address, phone, email, website, description,
  verification_level, status, plan_tier, is_featured, rating_avg, review_count, latitude, longitude
)
VALUES
  (
    'c0000001-0000-4000-a000-000000000001',
    'McDonough Family Dental Care',
    'mcdonough-family-dental-care',
    (SELECT id FROM public.profiles WHERE email = 'ginette.sarclay@mcdonoughdental.com' LIMIT 1),
    (SELECT id FROM public.categories WHERE slug = 'medicals' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'mcdonough' LIMIT 1),
    '125 Sabot Way, McDonough, GA 30253',
    '(770) 555-0210',
    'info@mcdonoughdental.com',
    'https://mcdonoughdental.com',
    'Premier dental clinic offering comprehensive family oral healthcare, teeth whitening, clear aligners, and dental implants in Henry County.',
    'verified', 'claimed', 'pro', true, 4.90, 42, 33.4473, -84.1469
  ),
  (
    'c0000002-0000-4000-a000-000000000002',
    'Stockbridge Auto Repair & Diagnostics',
    'stockbridge-auto-repair-diagnostics',
    (SELECT id FROM public.profiles WHERE email = 'marcus.vance@stockbridgeauto.com' LIMIT 1),
    (SELECT id FROM public.categories WHERE slug = 'automotive' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'stockbridge' LIMIT 1),
    '480 North Henry Blvd, Stockbridge, GA 30281',
    '(770) 555-0220',
    'service@stockbridgeauto.com',
    'https://stockbridgeauto.com',
    'Certified ASE mechanics providing computer engine diagnostics, transmission service, brake overhauls, and oil changes.',
    'verified', 'claimed', 'enterprise', true, 4.85, 58, 33.5443, -84.2338
  ),
  (
    'c0000003-0000-4000-a000-000000000003',
    'Hampton Coffee Depot & Bakery',
    'hampton-coffee-depot-bakery',
    (SELECT id FROM public.profiles WHERE email = 'ginette.sarclay@mcdonoughdental.com' LIMIT 1),
    (SELECT id FROM public.categories WHERE slug = 'foods' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'hampton' LIMIT 1),
    '12 Cherry St, Hampton, GA 30228',
    '(770) 555-0230',
    'hello@hamptoncoffee.com',
    'https://hamptoncoffee.com',
    'Cozy neighborhood coffee lounge serving specialty espresso drinks, fresh cinnamon rolls, and quiet work spaces.',
    'verified', 'claimed', 'featured', true, 4.95, 37, 33.3832, -84.2849
  ),
  (
    'c0000004-0000-4000-a000-000000000004',
    'Southern Classic Smokehouse BBQ',
    'southern-classic-smokehouse-bbq',
    (SELECT id FROM public.profiles WHERE email = 'marcus.vance@stockbridgeauto.com' LIMIT 1),
    (SELECT id FROM public.categories WHERE slug = 'foods' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'mcdonough' LIMIT 1),
    '85 Jonesboro Rd, McDonough, GA 30253',
    '(770) 555-0240',
    'bbq@southernclassic.com',
    'https://southernclassicbbq.com',
    'Slow-smoked hickory BBQ ribs, pulled pork, brisket, fried okra, and full event catering services.',
    'verified', 'claimed', 'enterprise', true, 4.90, 73, 33.4498, -84.1520
  ),
  (
    'c0000005-0000-4000-a000-000000000005',
    'Eagle''s Landing Heating & Air',
    'eagles-landing-heating-air',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'services' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'stockbridge' LIMIT 1),
    '110 Rock Quarry Rd, Stockbridge, GA 30281',
    '(770) 555-0250',
    'support@eagleslandinghvac.com',
    'https://eagleslandinghvac.com',
    'Trusted HVAC technicians offering emergency air conditioning repair, furnace replacements, and duct purification.',
    'verified', 'claimed', 'enterprise', true, 4.85, 31, 33.5281, -84.2250
  ),
  (
    'c0000006-0000-4000-a000-000000000006',
    'Henry County Day Spa & Wellness',
    'henry-county-day-spa-wellness',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'beauty-spa' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'mcdonough' LIMIT 1),
    '210 Keys Ferry St, McDonough, GA 30253',
    '(770) 555-0260',
    'spa@henrywellness.com',
    'https://henrywellness.com',
    'Relaxing day spa offering therapeutic massages, deep cleansing facials, manicure spa treatments, and sauna sessions.',
    'verified', 'claimed', 'pro', false, 4.75, 24, 33.4465, -84.1435
  ),
  (
    'c0000007-0000-4000-a000-000000000007',
    'Locust Grove Animal Hospital',
    'locust-grove-animal-hospital',
    NULL,
    (SELECT id FROM public.categories WHERE slug = 'medicals' LIMIT 1),
    (SELECT id FROM public.cities WHERE slug = 'locust-grove' LIMIT 1),
    '3850 Highway 42, Locust Grove, GA 30248',
    '(770) 555-0270',
    'care@locustgrovevet.com',
    'https://locustgrovevet.com',
    'Compassionate pet healthcare, routine checkups, dental scaling, pet surgery, and indoor boarding kennels.',
    'verified', 'claimed', 'pro', false, 4.92, 48, 33.3440, -84.1080
  ),
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
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  plan_tier = EXCLUDED.plan_tier,
  is_featured = EXCLUDED.is_featured,
  rating_avg = EXCLUDED.rating_avg,
  review_count = EXCLUDED.review_count;

-- 5. SEED REVIEWS
INSERT INTO public.reviews (id, business_id, author_id, rating, comment)
VALUES
  ('f0000001-0000-4000-a000-000000000001', 'c0000001-0000-4000-a000-000000000001', 'e0000004-0000-4000-a000-000000000004', 5, 'Dr. Sarclay and her staff are wonderful! They made my kids feel so comfortable during their checkup.'),
  ('f0000002-0000-4000-a000-000000000001', 'c0000001-0000-4000-a000-000000000001', 'e0000005-0000-4000-a000-000000000005', 5, 'Super clean office, high-tech equipment, and friendly dental hygienists.'),
  ('f0000003-0000-4000-a000-000000000002', 'c0000002-0000-4000-a000-000000000002', 'e0000004-0000-4000-a000-000000000004', 5, 'Quick brake turnaround and honest pricing. Will definitely bring my truck back here.')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED LEADS
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;

INSERT INTO public.leads (business_id, name, email, phone, message, status)
VALUES
  ('c0000001-0000-4000-a000-000000000001', 'Sarah Jenkins', 'sarah.jenkins@gmail.com', '(770) 555-9012', 'Hi! I would like to schedule a teeth whitening consultation for next Tuesday.', 'new'),
  ('c0000001-0000-4000-a000-000000000001', 'David Miller', 'david.miller@yahoo.com', '(678) 555-4321', 'Do you accept Delta Dental insurance plans for family appointments?', 'contacted'),
  ('c0000002-0000-4000-a000-000000000002', 'Robert Taylor', 'rtaylor@gmail.com', '(404) 555-8811', 'Can I get a quote for replacing front brake pads on a 2021 Ford F-150?', 'new')
ON CONFLICT DO NOTHING;
