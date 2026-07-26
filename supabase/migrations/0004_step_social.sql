-- =====================================================================
-- 足跡 (Ashiato) — 0004: Step単位のいいね・コメント（閲覧可能な旅で読み書き）
-- =====================================================================
-- reactions(=いいね) と comments を「その旅を閲覧できるユーザー」なら
-- 読める／書けるようにする（public / メンバー / 友達 / 所有者）。
-- 0001/0002 実行後に SQL Editor で実行してください。
-- =====================================================================

-- 閲覧可否ヘルパー
create or replace function can_view_trip(p_trip uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from trips t
    where t.id = p_trip and (
      t.visibility = 'public'
      or t.owner_id = auth.uid()
      or is_trip_member(t.id)
      or (t.visibility = 'friends' and are_friends(t.owner_id))
    )
  );
$$;

-- ---- reactions (いいね) ----
drop policy if exists reactions_member on reactions;
drop policy if exists reactions_view   on reactions;
drop policy if exists reactions_like   on reactions;
drop policy if exists reactions_unlike on reactions;
create policy reactions_view   on reactions for select using (can_view_trip(trip_id));
create policy reactions_like   on reactions for insert with check (user_id = auth.uid() and can_view_trip(trip_id));
create policy reactions_unlike on reactions for delete using (user_id = auth.uid());

-- ---- comments ----
drop policy if exists comments_member on comments;
drop policy if exists comments_view   on comments;
drop policy if exists comments_write  on comments;
drop policy if exists comments_delete on comments;
create policy comments_view   on comments for select using (can_view_trip(trip_id));
create policy comments_write  on comments for insert with check (author_id = auth.uid() and can_view_trip(trip_id));
create policy comments_delete on comments for delete using (author_id = auth.uid());

create index if not exists idx_comments_log  on comments (log_id, created_at);
create index if not exists idx_reactions_log on reactions (target_type, target_id);
