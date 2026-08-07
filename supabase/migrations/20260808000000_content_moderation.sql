-- Add moderation_status to reviews
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.reviews 
ADD COLUMN moderation_status public.moderation_status NOT NULL DEFAULT 'pending'::public.moderation_status;

-- Add moderation_status to businesses (to moderate new submissions)
ALTER TABLE public.businesses
ADD COLUMN moderation_status public.moderation_status NOT NULL DEFAULT 'approved'::public.moderation_status;
-- Note: default is 'approved' to not break existing data. New submissions can be set to 'pending' explicitly.

-- RLS Policies for reviews based on moderation_status
-- (Assuming we want to hide pending/rejected reviews from public)
-- Since policies might already exist, you might need to drop them first.
-- Here is an example of updating the public read policy for reviews:
-- DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."reviews";
-- CREATE POLICY "Enable read access for approved reviews" ON "public"."reviews"
-- FOR SELECT USING (moderation_status = 'approved');
