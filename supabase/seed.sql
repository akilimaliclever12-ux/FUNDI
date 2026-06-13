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
  ('construction','Professionnel du bâtiment', 'Fundi wa ujenzi mkuu', 'Construction professional', 'helmet', 7),
  ('staffeur', 'Staffeur', 'Fundi wa dari', 'Ceiling / plaster technician', 'panel-top', 8)
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

-- Quartiers of Bukavu (3 communes). Source of truth.
insert into public.locations (slug, name, type, parent_id)
select v.slug, v.name, 'quartier'::location_type, p.id
from (values
  -- IBANDA
  ('ndendere',   'Ndendere',   'ibanda'),
  ('nyalukemba', 'Nyalukemba', 'ibanda'),
  ('panzi',      'Panzi',      'ibanda'),
  -- BAGIRA
  ('lumumba',    'Lumumba',    'bagira'),
  ('nyakavogo',  'Nyakavogo',  'bagira'),
  ('mulambula',  'Mulambula',  'bagira'),
  ('chikera',    'Chikera',    'bagira'),
  ('chikonyi',   'Chikonyi',   'bagira'),
  ('ciriri',     'Ciriri',     'bagira'),
  ('kanoshe',    'Kanoshe',    'bagira'),
  ('mulwa',      'Mulwa',      'bagira'),
  ('kasha',      'Kasha',      'bagira'),
  ('chahi',      'Chahi',      'bagira'),
  -- KADUTU
  ('cimpunda',   'Cimpunda',   'kadutu'),
  ('mosala',     'Mosala',     'kadutu'),
  ('kasali',     'Kasali',     'kadutu'),
  ('nyamugo',    'Nyamugo',    'kadutu'),
  ('nkafu',      'Nkafu',      'kadutu'),
  ('nyakaliba',  'Nyakaliba',  'kadutu'),
  ('kajangu',    'Kajangu',    'kadutu')
) as v(slug, name, parent_slug)
join public.locations p on p.slug = v.parent_slug
on conflict (slug) do nothing;
