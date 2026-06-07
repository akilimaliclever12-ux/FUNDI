-- seed.sql — reference data: professions + Bukavu locations
-- Idempotent: safe to re-run.

-- ---------- PROFESSIONS ----------
insert into public.professions (slug, name_fr, name_sw, name_en, icon, sort_order) values
  ('electrician', 'Électricien',   'Fundi wa umeme',     'Electrician',   'bolt',     1),
  ('plumber',     'Plombier',      'Fundi wa maji',      'Plumber',       'droplet',  2),
  ('carpenter',   'Menuisier',     'Seremala',           'Carpenter',     'hammer',   3),
  ('mason',       'Maçon',         'Fundi wa ujenzi',    'Mason',         'bricks',   4),
  ('welder',      'Soudeur',       'Fundi wa kuunganisha','Welder',       'flame',    5),
  ('painter',     'Peintre',       'Mpaka rangi',        'Painter',       'brush',    6),
  ('construction','Professionnel du bâtiment', 'Fundi wa ujenzi mkuu', 'Construction professional', 'helmet', 7)
on conflict (slug) do nothing;

-- ---------- LOCATIONS ----------
-- City
insert into public.locations (slug, name, type, latitude, longitude) values
  ('bukavu', 'Bukavu', 'city', -2.508300, 28.842500)
on conflict (slug) do nothing;

-- Communes of Bukavu
insert into public.locations (slug, name, type, parent_id)
select v.slug, v.name, 'commune'::location_type, c.id
from (values
  ('ibanda', 'Ibanda'),
  ('kadutu', 'Kadutu'),
  ('bagira', 'Bagira')
) as v(slug, name)
cross join (select id from public.locations where slug = 'bukavu') c
on conflict (slug) do nothing;

-- A few well-known quartiers (extend as needed)
insert into public.locations (slug, name, type, parent_id)
select v.slug, v.name, 'quartier'::location_type, p.id
from (values
  ('ndendere',     'Ndendere',     'ibanda'),
  ('nyalukemba',   'Nyalukemba',   'ibanda'),
  ('panzi',        'Panzi',        'ibanda'),
  ('nyakaliba',    'Nyakaliba',    'kadutu'),
  ('cimpunda',     'Cimpunda',     'kadutu'),
  ('mosala',       'Mosala',       'kadutu'),
  ('lumu',         'Lumu',         'bagira'),
  ('nyamoma',      'Nyamoma',      'bagira')
) as v(slug, name, parent_slug)
join public.locations p on p.slug = v.parent_slug
on conflict (slug) do nothing;
