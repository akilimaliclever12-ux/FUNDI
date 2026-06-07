-- 0005_triggers.sql — wire functions to tables

-- updated_at on all mutable tables
create trigger trg_users_updated      before update on public.users        for each row execute function public.set_updated_at();
create trigger trg_professions_updated before update on public.professions for each row execute function public.set_updated_at();
create trigger trg_locations_updated   before update on public.locations    for each row execute function public.set_updated_at();
create trigger trg_workers_updated     before update on public.workers       for each row execute function public.set_updated_at();
create trigger trg_worker_photos_updated before update on public.worker_photos for each row execute function public.set_updated_at();
create trigger trg_reviews_updated     before update on public.reviews       for each row execute function public.set_updated_at();
create trigger trg_job_requests_updated before update on public.job_requests for each row execute function public.set_updated_at();
create trigger trg_admin_users_updated before update on public.admin_users   for each row execute function public.set_updated_at();

-- search vector
create trigger trg_workers_search
  before insert or update of headline, bio on public.workers
  for each row execute function public.workers_set_search_tsv();

-- rating recompute
create trigger trg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_worker_rating();

-- lead count
create trigger trg_leads_count
  after insert on public.leads
  for each row execute function public.bump_lead_count();
