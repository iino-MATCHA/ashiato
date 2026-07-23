-- =====================================================================
-- 足跡 (Ashiato) — デモ用シード：日本周遊サンプル "Japan Grand Tour"
-- =====================================================================
-- 事前に:
--   1) Authentication → Users → Add user で1人ユーザーを作成（最初の1人を持ち主にします）
--   2) 0001 / 0002 実行済み / Storage 'photos' バケット作成済み
-- 何度流しても重複しないよう、既存のサンプル(Japan Grand Tour)は毎回作り直します。
-- 座標は municipalities_master 参照（Tokyo/Chiyoda 13101, Kanazawa 17201, Kyoto 26100,
--   Osaka 27100, Hiroshima 34100, Fukuoka 40130, Naha 47201, Sapporo 1100, Sendai 4100）。
-- =====================================================================

-- 公開読み取り（ログイン未実装の間、匿名アプリで公開旅を表示するため）
drop policy if exists logs_public_read on logs;
create policy logs_public_read on logs for select using (
  exists (select 1 from trips t where t.id = logs.trip_id and t.visibility = 'public'));
drop policy if exists photos_public_read on photos;
create policy photos_public_read on photos for select using (
  exists (select 1 from trips t where t.id = photos.trip_id and t.visibility = 'public'));
drop policy if exists transports_public_read on transports;
create policy transports_public_read on transports for select using (
  exists (select 1 from trips t where t.id = transports.trip_id and t.visibility = 'public'));
drop policy if exists trips_public_read on trips;
create policy trips_public_read on trips for select using (visibility = 'public');
drop policy if exists trip_members_public_read on trip_members;
create policy trip_members_public_read on trip_members for select using (
  exists (select 1 from trips t where t.id = trip_members.trip_id and t.visibility = 'public'));

do $$
declare
  uid uuid;
  tid uuid;
  lid uuid;
  prev uuid;
  -- 周遊コース: [municipality_code, prefecture_code, title, note, mode, photoSeed]
  -- [code, prefCode, title, note, mode, photoKeywords]
  rows text[][] := array[
    ['13101','13','Start in Tokyo','The neon capital. Where the loop begins.','plane','tokyo,skyline'],
    ['17201','17','Kanazawa Gold','Kenrokuen garden and gold leaf.','shinkansen','kanazawa,castle'],
    ['26100','26','Kyoto Temples','A thousand vermilion gates.','train','kyoto,temple'],
    ['27100','27','Osaka Nights','Street food until midnight.','train','osaka,night'],
    ['34100','34','Hiroshima Peace','The dome and the quiet river.','shinkansen','hiroshima,itsukushima'],
    ['40130','40','Fukuoka Ramen','Tonkotsu at a riverside yatai.','shinkansen','fukuoka,japan'],
    ['47201','47','Okinawa Blue','Turquoise sea, Shuri stone.','plane','okinawa,beach'],
    ['1100','1','Sapporo North','From the far south to the far north.','plane','sapporo,hokkaido'],
    ['4100','4','Sendai Green','City of trees on the way home.','plane','sendai,japan'],
    ['13101','13','Back to Tokyo','The loop closes where it began.','shinkansen','tokyo,street']
  ];
  i int;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'No auth user found. Create one in Authentication -> Users first.';
  end if;

  insert into profiles (id, username, display_name)
  values (uid, 'taro', 'Taro Yamada')
  on conflict (id) do nothing;

  -- 既存サンプルを削除して作り直し（子行はFKのcascadeで消える）
  delete from trips where owner_id = uid and title = 'Japan Grand Tour';

  insert into trips (owner_id, title, description, status, visibility, start_date, end_date)
  values (uid, 'Japan Grand Tour', 'A loop around the country', 'completed', 'public', '2026-03-20', '2026-04-05')
  returning id into tid;

  prev := null;
  for i in 1 .. array_length(rows, 1) loop
    insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, logged_at, sort_order)
    values (tid, uid, rows[i][3], rows[i][4], rows[i][1]::int, rows[i][2]::int, '2026-03-20'::date + (i - 1), i - 1)
    returning id into lid;

    -- photos: 2 per stop
    insert into photos (log_id, trip_id, uploader_id, storage_path, sort_order) values
      (lid, tid, uid, 'https://picsum.photos/seed/' || rows[i][6] || '0/700', 0),
      (lid, tid, uid, 'https://picsum.photos/seed/' || rows[i][6] || '1/700', 1);

    -- transport to reach this stop (from the 2nd stop onwards)
    if i > 1 then
      insert into transports (trip_id, from_log_id, to_log_id, mode, distance_km)
      values (tid, prev, lid, rows[i][5]::transport_mode, 300);
    end if;
    prev := lid;
  end loop;

  raise notice 'Seeded Japan Grand Tour for owner % (trip %)', uid, tid;
end $$;

-- 御朱印マスタ（サンプル）— 既にあればスキップ
insert into goshuin_masters (prefecture_code, name, rarity, image_url)
select v.code, v.name, v.rarity::goshuin_rarity, 'https://picsum.photos/seed/g' || v.code || '/400'
from (values (13,'Asakusa','normal'),(17,'Kanazawa','limited'),(26,'Fushimi','seasonal'),
             (27,'Namba','normal'),(34,'Miyajima','seasonal'),(40,'Hakata','normal'),
             (47,'Shuri','collab'),(1,'Hakodate','normal'),(4,'Sendai','normal')) as v(code,name,rarity)
where not exists (select 1 from goshuin_masters g where g.prefecture_code = v.code);
