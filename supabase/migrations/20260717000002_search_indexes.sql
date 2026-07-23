-- Performance indexes for Henry County Directory

-- Index for searching businesses by name or description
CREATE INDEX IF NOT EXISTS idx_businesses_name ON public.businesses USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_businesses_description ON public.businesses USING GIN (to_tsvector('english', coalesce(description, '')));

-- Index for filtering by category, city, and status
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON public.businesses (category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_city_id ON public.businesses (city_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses (status);

-- Composite index for the most common active queries
CREATE INDEX IF NOT EXISTS idx_businesses_active_search ON public.businesses (status, category_id, city_id);

-- Review count and rating sorting indexes
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON public.businesses (rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_reviews ON public.businesses (review_count DESC);
