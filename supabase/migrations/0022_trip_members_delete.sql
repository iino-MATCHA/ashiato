-- =====================================================================
-- My Japan — 0022: バディーを外せるようにする
-- =====================================================================
-- trip_members には select と insert の許可しか無く、delete の許可が
-- 抜けていた。RLS は許可が無ければ黙って0行削除で終わるので、
-- 画面上は「消したのに戻ってくる」ように見えていた（実機で確認）。
--
-- 外せるのは
--   * その旅の持ち主（招いた側が外す）
--   * 自分自身（招かれた側が抜ける）
-- のどちらか。持ち主が自分を外して旅が宙に浮かないよう、owner は残す。
-- =====================================================================

drop policy if exists trip_members_delete on trip_members;
create policy trip_members_delete on trip_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from trips
       where trips.id = trip_members.trip_id
         and trips.owner_id = auth.uid()
         and trip_members.user_id <> trips.owner_id
    )
  );

comment on policy trip_members_delete on trip_members is
  '外せるのは持ち主か本人だけ。持ち主自身は外せない（旅の持ち主が消えないように）。';
