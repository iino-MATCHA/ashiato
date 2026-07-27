-- =====================================================================
-- 足跡 (Ashiato) — 0005: コメント通知の既読管理
-- =====================================================================
-- 「自分のStepに他人がコメントした」を通知として扱う。
-- 未読 = 自分のlogsへのコメント（自分以外が投稿）のうち、
--        notification_reads に既読行が無いもの。
-- 右スワイプで既読化 → この表に upsert する。
-- =====================================================================

create table if not exists notification_reads (
  user_id    uuid not null references profiles (id) on delete cascade,
  comment_id uuid not null references comments (id) on delete cascade,
  read_at    timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table notification_reads enable row level security;
drop policy if exists notification_reads_own on notification_reads;
create policy notification_reads_own on notification_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
