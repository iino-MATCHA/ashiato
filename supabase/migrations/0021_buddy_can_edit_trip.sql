-- =====================================================================
-- My Japan — 0021: travel buddy が旅そのものも直せるようにする
-- =====================================================================
-- 写真・地点・移動（photos / logs / transports）は最初から
-- 「その旅のメンバーなら誰でも」書けるようになっていた。
-- 一方 trips だけは owner 限定で、buddy はタイトルや公開範囲を直せなかった。
-- 一緒に記録する相手なのに旅の名前を直せないのは筋が通らないので、
-- 更新はメンバー全員に開く。
--
-- ただし削除は owner のままにする。招かれた側の操作で
-- 旅ごと消えるのは取り返しがつかない。
-- =====================================================================

drop policy if exists trips_modify on trips;
create policy trips_modify on trips for update
  using (is_trip_member(id)) with check (is_trip_member(id));

comment on table trip_members is
  'その旅を一緒に記録する人。載っている人は旅・地点・写真を足したり直したりできる（削除は owner のみ）。';
