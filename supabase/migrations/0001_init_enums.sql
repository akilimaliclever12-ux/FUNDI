-- 0001_init_enums.sql — enumerated types
-- Fundi (Bukavu). See docs/02-data-dictionary.md

create type user_role     as enum ('customer', 'worker');
create type worker_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type location_type as enum ('city', 'commune', 'quartier');
create type review_status as enum ('pending', 'published', 'rejected');
create type photo_type    as enum ('portfolio', 'avatar', 'verification');
create type lead_channel  as enum ('whatsapp', 'call', 'form');
create type lead_status   as enum ('new', 'contacted', 'converted', 'lost');
create type job_status    as enum ('open', 'assigned', 'closed', 'cancelled');
create type admin_role    as enum ('super_admin', 'moderator', 'support');
