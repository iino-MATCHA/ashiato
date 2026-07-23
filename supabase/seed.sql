-- =====================================================================
-- 足跡 (Ashiato) — デモ用シードデータ
-- =====================================================================
-- 事前に:
--   1) Authentication → Users → Add user で「1人だけ」ユーザーを作成
--      （このシードは最初のユーザーをデモの持ち主にします）
--   2) 0001 / 0002 実行済みであること
-- SQL Editor に貼って実行してください。座標は municipalities_master 参照
-- （Kyoto=26100, Osaka=27100, Nara=29201, Sapporo=1100, Hakodate=1202）。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 公開読み取りポリシー：visibility='public' の旅は匿名でも閲覧可にする
-- （ログイン未実装の間、アプリ(anon)がデモを表示できるようにするため）
-- ---------------------------------------------------------------------
drop policy if exists logs_public_read on logs;
create policy logs_public_read on logs for select using (
  exists (select 1 from trips t where t.id = logs.trip_id and t.visibility = 'public')
);
drop policy if exists photos_public_read on photos;
create policy photos_public_read on photos for select using (
  exists (select 1 from trips t where t.id = photos.trip_id and t.visibility = 'public')
);
drop policy if exists transports_public_read on transports;
create policy transports_public_read on transports for select using (
  exists (select 1 from trips t where t.id = transports.trip_id and t.visibility = 'public')
);
drop policy if exists trip_members_public_read on trip_members;
create policy trip_members_public_read on trip_members for select using (
  exists (select 1 from trips t where t.id = trip_members.trip_id and t.visibility = 'public')
);

-- ---------------------------------------------------------------------
-- デモデータ
-- ---------------------------------------------------------------------
do $$
declare
  uid uuid;
  t1 uuid; t2 uuid;
  l1 uuid; l2 uuid; l3 uuid; l4 uuid; l5 uuid;
  gm_kyoto uuid; gm_osaka uuid; gm_hokkaido uuid;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'No auth user found. Create one in Authentication -> Users first.';
  end if;

  insert into profiles (id, username, display_name)
  values (uid, 'demo', 'Demo Traveller')
  on conflict (id) do nothing;

  -- ===== Trip 1: Kansai (public) =====
  insert into trips (owner_id, title, description, status, visibility, start_date, end_date)
  values (uid, 'Kansai in Spring', 'Kyoto, Osaka, Nara', 'completed', 'public', '2026-04-01', '2026-04-05')
  returning id into t1;

  insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, logged_at, sort_order)
  values (t1, uid, 'Fushimi Inari', 'Vermilion gates at dawn.', 26100, 26, '2026-04-01', 0) returning id into l1;
  insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, logged_at, sort_order)
  values (t1, uid, 'Dotonbori', 'Neon and street food.', 27100, 27, '2026-04-03', 1) returning id into l2;
  insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, logged_at, sort_order)
  values (t1, uid, 'Nara Park', 'Bowing deer.', 29201, 29, '2026-04-04', 2) returning id into l3;

  insert into transports (trip_id, to_log_id, mode, distance_km) values
    (t1, l1, 'shinkansen', 480),
    (t1, l2, 'train', 55),
    (t1, l3, 'train', 42);

  insert into photos (log_id, trip_id, uploader_id, storage_path, sort_order) values
    (l1, t1, uid, 'https://picsum.photos/seed/fushimi0/600', 0),
    (l1, t1, uid, 'https://picsum.photos/seed/fushimi1/600', 1),
    (l2, t1, uid, 'https://picsum.photos/seed/osaka0/600', 0),
    (l3, t1, uid, 'https://picsum.photos/seed/nara0/600', 0);

  -- ===== Trip 2: Hokkaido (public) =====
  insert into trips (owner_id, title, description, status, visibility, start_date, end_date)
  values (uid, 'The Slopes of Hakodate', 'Hokkaido', 'completed', 'public', '2026-05-19', '2026-05-22')
  returning id into t2;

  insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, logged_at, sort_order)
  values (t2, uid, 'Sapporo', 'Arrived by air.', 1100, 1, '2026-05-19', 0) returning id into l4;
  insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, logged_at, sort_order)
  values (t2, uid, 'Mt. Hakodate', 'Night view.', 1202, 1, '2026-05-20', 1) returning id into l5;

  insert into transports (trip_id, to_log_id, mode, distance_km) values
    (t2, l4, 'plane', 830),
    (t2, l5, 'train', 260);

  insert into photos (log_id, trip_id, uploader_id, storage_path, sort_order) values
    (l4, t2, uid, 'https://picsum.photos/seed/sapporo0/600', 0),
    (l5, t2, uid, 'https://picsum.photos/seed/hakodate0/600', 0);

  -- ===== Goshuin masters + acquisitions =====
  insert into goshuin_masters (prefecture_code, name, rarity, image_url)
  values (26, 'Fushimi', 'seasonal', 'https://picsum.photos/seed/g26/400') returning id into gm_kyoto;
  insert into goshuin_masters (prefecture_code, name, rarity, image_url)
  values (27, 'Namba', 'normal', 'https://picsum.photos/seed/g27/400') returning id into gm_osaka;
  insert into goshuin_masters (prefecture_code, name, rarity, image_url)
  values (1, 'Hakodate', 'normal', 'https://picsum.photos/seed/g01/400') returning id into gm_hokkaido;

  insert into user_goshuin (user_id, goshuin_master_id, trip_id) values
    (uid, gm_kyoto, t1),
    (uid, gm_osaka, t1),
    (uid, gm_hokkaido, t2)
  on conflict do nothing;

  raise notice 'Seed done. owner=%, trips=% / %', uid, t1, t2;
end $$;
