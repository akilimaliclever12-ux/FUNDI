-- 0009_chat.sql — in-app chat (conversations + messages), replacing WhatsApp.
-- Run in Supabase SQL Editor.

-- Add a 'chat' channel for leads analytics continuity.
alter type lead_channel add value if not exists 'chat';

-- CONVERSATIONS: one thread per (worker, customer)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  customer_user_id uuid not null references public.users(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  customer_unread int4 not null default 0,
  worker_unread int4 not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, customer_user_id)
);

-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists conversations_customer_idx on public.conversations (customer_user_id, last_message_at desc);
create index if not exists conversations_worker_idx on public.conversations (worker_id, last_message_at desc);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

-- Participant check (SECURITY DEFINER -> no recursion in policies)
create or replace function public.is_conversation_participant(conv uuid, uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    left join public.workers w on w.id = c.worker_id
    where c.id = conv and (c.customer_user_id = uid or w.user_id = uid)
  );
$$;

-- Maintain conversation summary + unread counts on new message
create or replace function public.on_new_message()
returns trigger
language plpgsql
as $$
declare
  cust uuid;
begin
  select customer_user_id into cust from public.conversations where id = new.conversation_id;
  update public.conversations set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 120),
    worker_unread = worker_unread + (case when new.sender_user_id = cust then 1 else 0 end),
    customer_unread = customer_unread + (case when new.sender_user_id = cust then 0 else 1 end),
    updated_at = now()
  where id = new.conversation_id;
  return null;
end;
$$;

drop trigger if exists trg_on_new_message on public.messages;
create trigger trg_on_new_message
  after insert on public.messages
  for each row execute function public.on_new_message();

create trigger trg_conversations_updated
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- conversations: participants read; customer creates; participants update (unread reset)
create policy conversations_participant_read on public.conversations
  for select using (public.is_conversation_participant(id, auth.uid()));
create policy conversations_customer_insert on public.conversations
  for insert with check (customer_user_id = auth.uid());
create policy conversations_participant_update on public.conversations
  for update using (public.is_conversation_participant(id, auth.uid()));
create policy conversations_admin_all on public.conversations
  for all using (public.is_admin(auth.uid()));

-- messages: participants read; sender (a participant) inserts; participant updates (read_at)
create policy messages_participant_read on public.messages
  for select using (public.is_conversation_participant(conversation_id, auth.uid()));
create policy messages_sender_insert on public.messages
  for insert with check (
    sender_user_id = auth.uid()
    and public.is_conversation_participant(conversation_id, auth.uid())
  );
create policy messages_participant_update on public.messages
  for update using (public.is_conversation_participant(conversation_id, auth.uid()));
create policy messages_admin_all on public.messages
  for all using (public.is_admin(auth.uid()));

-- Realtime: broadcast message inserts to authorized clients (RLS-respecting)
alter publication supabase_realtime add table public.messages;
