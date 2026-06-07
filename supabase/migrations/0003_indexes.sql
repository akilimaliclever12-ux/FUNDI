-- 0003_indexes.sql — performance indexes (filter/sort/search)

-- main listing filter
create index workers_filter_idx on public.workers (status, profession_id, location_id);
-- sorting
create index workers_rating_idx on public.workers (rating_avg desc);
create index workers_featured_idx on public.workers (is_featured desc, approved_at desc);
-- full-text search over headline + bio
create index workers_search_idx on public.workers using gin (search_tsv);
-- service areas array search
create index workers_areas_idx on public.workers using gin (service_areas);

create index worker_photos_worker_idx on public.worker_photos (worker_id, sort_order);
create index reviews_worker_idx on public.reviews (worker_id, status);
create index leads_worker_time_idx on public.leads (worker_id, created_at desc);
create index job_requests_filter_idx on public.job_requests (status, profession_id, location_id);
create index audit_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_created_idx on public.audit_logs (created_at desc);
create index locations_parent_idx on public.locations (parent_id);
