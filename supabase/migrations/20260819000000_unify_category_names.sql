-- Update category names and icons to be consistent with short versions
UPDATE public.categories SET name = 'Medical', icon = 'HeartPulse' WHERE slug = 'medicals';
UPDATE public.categories SET name = 'Automotive', icon = 'Car' WHERE slug = 'automotive';
UPDATE public.categories SET name = 'Food', icon = 'Utensils' WHERE slug = 'foods';
UPDATE public.categories SET name = 'Services', icon = 'Wrench' WHERE slug = 'services';
UPDATE public.categories SET name = 'Professional', icon = 'Briefcase' WHERE slug = 'professional';
UPDATE public.categories SET name = 'Beauty & Spa', icon = 'Sparkles' WHERE slug = 'beauty-spa';
UPDATE public.categories SET name = 'Shopping', icon = 'ShoppingBag' WHERE slug = 'shopping';
UPDATE public.categories SET name = 'Fitness', icon = 'Dumbbell' WHERE slug = 'fitness';
