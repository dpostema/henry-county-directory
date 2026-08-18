ALTER TABLE public.articles RENAME COLUMN image_url TO cover_image_url;
ALTER TABLE public.articles ADD COLUMN excerpt TEXT;
