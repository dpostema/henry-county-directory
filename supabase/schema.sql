-- ==========================================
-- HENRY COUNTY DIRECTORY — INITIAL DATABASE SCHEMA
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. ENUMS DEFINITIONS
-- ==========================================

CREATE TYPE public.user_role AS ENUM ('admin', 'owner', 'visitor');
CREATE TYPE public.verification_level AS ENUM ('unverified', 'claimed_unverified', 'verified');
CREATE TYPE public.business_status AS ENUM ('unclaimed', 'claimed', 'suspended');
CREATE TYPE public.plan_tier AS ENUM ('free', 'featured', 'pro', 'enterprise');
CREATE TYPE public.claim_request_status AS ENUM ('pending', 'approved', 'rejected');

-- ==========================================
-- 2. TABLES DEFINITIONS
-- ==========================================

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'visitor'::public.user_role,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT, -- Stores icon name/ref
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cities (Henry County Focus)
CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'GA',
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Businesses
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    hours_json JSONB, -- For hours structure
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    verification_level public.verification_level NOT NULL DEFAULT 'unverified'::public.verification_level,
    status public.business_status NOT NULL DEFAULT 'unclaimed'::public.business_status,
    plan_tier public.plan_tier NOT NULL DEFAULT 'free'::public.plan_tier,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    source TEXT DEFAULT 'organic',
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Listing Media
CREATE TABLE public.listing_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reviews
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Review Replies
CREATE TABLE public.review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE UNIQUE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reply TEXT NOT NULL,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Q&A (Visitor questions, Owner/Admin answers)
CREATE TABLE public.qna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    answered_at TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- new, read, archived
    ai_tag TEXT,
    priority TEXT,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled
    details TEXT,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Favorites
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (visitor_id, business_id)
);

-- Deals/Coupons
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    coupon_code TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Events
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stripe Subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL, -- active, past_due, trialing, cancelled
    plan_tier public.plan_tier NOT NULL DEFAULT 'free'::public.plan_tier,
    current_period_end TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stripe Addon Purchases
CREATE TABLE public.addon_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    addon_type TEXT NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Claim Requests
CREATE TABLE public.claim_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    status public.claim_request_status NOT NULL DEFAULT 'pending'::public.claim_request_status,
    notes TEXT,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Referrals
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referred_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, joined, subscribed
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Articles / Blog
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    image_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published BOOLEAN NOT NULL DEFAULT false,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Best Of Lists
CREATE TABLE public.best_of_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    list_owner_type TEXT NOT NULL DEFAULT 'admin', -- admin, user
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Best Of List Items
CREATE TABLE public.best_of_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES public.best_of_lists(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    rank INTEGER NOT NULL,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(list_id, business_id)
);

-- Analytics Events
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- search, view, click, lead_submit
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin Logs
CREATE TABLE public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Duplicate Flags
CREATE TABLE public.duplicate_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_a_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    business_b_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    confidence_score NUMERIC(3,2) NOT NULL, -- 0.00 to 1.00
    status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved_merged, resolved_dismissed
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom Verification/OTP code storage
CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT,
    email TEXT,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin'::public.user_role 
     FROM public.profiles 
     WHERE id = auth.uid()), 
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'visitor'::public.user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-recalculate business rating (Insert/Update)
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.businesses
  SET 
    rating_avg = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE business_id = NEW.business_id), 0.00),
    review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE business_id = NEW.business_id), 0)
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_inserted_updated
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

-- Trigger: auto-recalculate business rating (Delete)
CREATE OR REPLACE FUNCTION public.update_business_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.businesses
  SET 
    rating_avg = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE business_id = OLD.business_id), 0.00),
    review_count = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE business_id = OLD.business_id), 0)
  WHERE id = OLD.business_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_deleted
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating_on_delete();

-- ==========================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_of_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_of_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- --- public.profiles policies ---
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- --- public.categories policies ---
CREATE POLICY "Categories are readable by everyone" ON public.categories
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON public.categories
    FOR ALL USING (public.is_admin());

-- --- public.cities policies ---
CREATE POLICY "Cities are readable by everyone" ON public.cities
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify cities" ON public.cities
    FOR ALL USING (public.is_admin());

-- --- public.businesses policies ---
CREATE POLICY "Unclaimed or active claimed businesses are readable by everyone" ON public.businesses
    FOR SELECT USING (status != 'suspended'::public.business_status OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Logged in users can insert businesses" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners or admins can update business" ON public.businesses
    FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Only admins can delete business" ON public.businesses
    FOR DELETE USING (public.is_admin());

-- --- public.listing_media policies ---
CREATE POLICY "Media is readable by everyone" ON public.listing_media
    FOR SELECT USING (true);
CREATE POLICY "Owners or admins can manage media" ON public.listing_media
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = listing_media.business_id AND (b.owner_id = auth.uid() OR public.is_admin())
    ));

-- --- public.reviews policies ---
CREATE POLICY "Reviews are readable by everyone" ON public.reviews
    FOR SELECT USING (true);
CREATE POLICY "Logged in users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins can update reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "Authors or admins can delete reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- --- public.review_replies policies ---
CREATE POLICY "Replies are readable by everyone" ON public.review_replies
    FOR SELECT USING (true);
CREATE POLICY "Business owners or admins can reply to reviews" ON public.review_replies
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.reviews r
        JOIN public.businesses b ON r.business_id = b.id
        WHERE r.id = review_replies.review_id AND (b.owner_id = auth.uid() OR public.is_admin())
    ));
CREATE POLICY "Authors or admins can update replies" ON public.review_replies
    FOR UPDATE USING (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Authors or admins can delete replies" ON public.review_replies
    FOR DELETE USING (author_id = auth.uid() OR public.is_admin());

-- --- public.qna policies ---
CREATE POLICY "Q&A is readable by everyone" ON public.qna
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can ask questions" ON public.qna
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Authors, respondents, or admins can update Q&A" ON public.qna
    FOR UPDATE USING (visitor_id = auth.uid() OR answered_by = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can delete Q&A" ON public.qna
    FOR DELETE USING (public.is_admin());

-- --- public.leads policies ---
CREATE POLICY "Business owners or admins can read leads" ON public.leads
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = leads.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Anyone can submit a lead form" ON public.leads
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Business owners or admins can update leads" ON public.leads
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = leads.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Only admins can delete leads" ON public.leads
    FOR DELETE USING (public.is_admin());

-- --- public.bookings policies ---
CREATE POLICY "Bookings readable by visitor, owner, or admin" ON public.bookings
    FOR SELECT USING (visitor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = bookings.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Visitor can create booking" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Bookings managed by visitor, owner, or admin" ON public.bookings
    FOR UPDATE USING (visitor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = bookings.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Only admins can delete bookings" ON public.bookings
    FOR DELETE USING (public.is_admin());

-- --- public.favorites policies ---
CREATE POLICY "Favorites readable by user or admin" ON public.favorites
    FOR SELECT USING (visitor_id = auth.uid() OR public.is_admin());
CREATE POLICY "User can add favorite" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "User can delete favorite" ON public.favorites
    FOR DELETE USING (auth.uid() = visitor_id OR public.is_admin());

-- --- public.deals policies ---
CREATE POLICY "Deals are readable by everyone" ON public.deals
    FOR SELECT USING (true);
CREATE POLICY "Business owners or admins can manage deals" ON public.deals
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = deals.business_id AND (b.owner_id = auth.uid() OR public.is_admin())
    ));

-- --- public.events policies ---
CREATE POLICY "Events are readable by everyone" ON public.events
    FOR SELECT USING (true);
CREATE POLICY "Business owners or admins can manage events" ON public.events
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = events.business_id AND (b.owner_id = auth.uid() OR public.is_admin())
    ));

-- --- public.subscriptions policies ---
CREATE POLICY "Subscriptions readable by owner or admin" ON public.subscriptions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Subscriptions managed by admin/webhook" ON public.subscriptions
    FOR ALL USING (public.is_admin());

-- --- public.addon_purchases policies ---
CREATE POLICY "Addons readable by owner or admin" ON public.addon_purchases
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = addon_purchases.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Addons managed by admin/webhook" ON public.addon_purchases
    FOR ALL USING (public.is_admin());

-- --- public.claim_requests policies ---
CREATE POLICY "Claim requests readable by requester or admin" ON public.claim_requests
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Logged in users can insert claims" ON public.claim_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can manage claims" ON public.claim_requests
    FOR ALL USING (public.is_admin());

-- --- public.referrals policies ---
CREATE POLICY "Referrals readable by referrer or admin" ON public.referrals
    FOR SELECT USING (referrer_id = auth.uid() OR public.is_admin());
CREATE POLICY "Logged in users can insert referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Only admins can manage referrals" ON public.referrals
    FOR ALL USING (public.is_admin());

-- --- public.articles policies ---
CREATE POLICY "Articles readable by public if published, or by author/admin" ON public.articles
    FOR SELECT USING (published = true OR author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Authenticated users can create articles" ON public.articles
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins can update articles" ON public.articles
    FOR UPDATE USING (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Authors or admins can delete articles" ON public.articles
    FOR DELETE USING (author_id = auth.uid() OR public.is_admin());

-- --- public.best_of_lists policies ---
CREATE POLICY "Best Of Lists are readable by everyone" ON public.best_of_lists
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create Best Of Lists" ON public.best_of_lists
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins can update Best Of Lists" ON public.best_of_lists
    FOR UPDATE USING (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Authors or admins can delete Best Of Lists" ON public.best_of_lists
    FOR DELETE USING (author_id = auth.uid() OR public.is_admin());

-- --- public.best_of_list_items policies ---
CREATE POLICY "List items are readable by everyone" ON public.best_of_list_items
    FOR SELECT USING (true);
CREATE POLICY "List authors or admins can manage list items" ON public.best_of_list_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.best_of_lists l
        WHERE l.id = best_of_list_items.list_id AND (l.author_id = auth.uid() OR public.is_admin())
    ));

-- --- public.analytics_events policies ---
CREATE POLICY "Analytics visible to business owner or admin" ON public.analytics_events
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = analytics_events.business_id AND b.owner_id = auth.uid()
    ) OR public.is_admin());
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can modify/delete analytics" ON public.analytics_events
    FOR ALL USING (public.is_admin());

-- --- public.admin_logs policies ---
CREATE POLICY "Admin logs readable/managed only by admins" ON public.admin_logs
    FOR ALL USING (public.is_admin());

-- --- public.duplicate_flags policies ---
CREATE POLICY "Duplicates visible/managed only by admins" ON public.duplicate_flags
    FOR ALL USING (public.is_admin());

-- --- public.otp_codes policies ---
CREATE POLICY "OTP codes are locked to the public" ON public.otp_codes
    FOR ALL USING (public.is_admin());

-- ==========================================
-- 5. SEEDING DEFAULT DIRECTORY DATA
-- ==========================================

-- Seed Categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Foods', 'foods', 'Utensils'),
('Hotels', 'hotels', 'Hotel'),
('Jobs', 'jobs', 'Briefcase'),
('Medicals', 'medicals', 'HeartPulse'),
('Services', 'services', 'Wrench'),
('Shopping', 'shopping', 'ShoppingBag'),
('Automotive', 'automotive', 'Car')
ON CONFLICT (slug) DO NOTHING;

-- Seed Cities (Henry County, Georgia Focus)
INSERT INTO public.cities (name, slug, state) VALUES
('McDonough', 'mcdonough', 'GA'),
('Stockbridge', 'stockbridge', 'GA'),
('Hampton', 'hampton', 'GA'),
('Locust Grove', 'locust-grove', 'GA')
ON CONFLICT (slug) DO NOTHING;
