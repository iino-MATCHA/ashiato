/**
 * 見本のユーザーと旅を10人分入れる。
 *
 * 何もない画面では、/explore も「注目の旅」も判断ができない。
 * 実在しそうな旅を並べて、初めて来た人が中身を掴めるようにする。
 *
 *   node scripts/seed-demo-users.mjs        入れる
 *   node scripts/seed-demo-users.mjs --drop 消す
 *
 * 見本ユーザーの目印は @my-japan-demo.local。
 * 本物のユーザーと混ざらないよう、消すときもこれで拾う。
 *
 * 写真は Unsplash の配信URLをそのまま入れる。
 * photos.storage_path は http から始まる値をそのまま公開URLとして扱うので
 * （lib/api.ts の publicUrl）、Storage へ上げずに済む。
 *
 * 必要な環境変数：
 *   SUPABASE_PAT          Management API のトークン（SQL実行用）
 *   SUPABASE_PROJECT_REF  プロジェクトのref
 *   SUPABASE_SERVICE_KEY  service_role キー（Auth のユーザー作成用）
 */
const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_PROJECT_REF;
const SERVICE = process.env.SUPABASE_SERVICE_KEY;
if (!PAT || !REF || !SERVICE) {
  console.error('SUPABASE_PAT / SUPABASE_PROJECT_REF / SUPABASE_SERVICE_KEY を入れてください');
  process.exit(1);
}
const API = `https://${REF}.supabase.co`;
const DOMAIN = 'my-japan-demo.local';

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const body = await r.json();
  if (!r.ok || body?.message) throw new Error(JSON.stringify(body).slice(0, 400));
  return body;
}

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

// ---------------------------------------------------------------- 素材

const AVATARS = [
  'photo-1494790108377-be9c29b29330', 'photo-1500648767791-00dcc994a43e',
  'photo-1438761681033-6461ffad8d80', 'photo-1507003211169-0a1dd7228f2d',
  'photo-1544005313-94ddf0286df2', 'photo-1506794778202-cad84cf45f1d',
  'photo-1517841905240-472988babdf9', 'photo-1531427186611-ecfd6d936c79',
  'photo-1487412720507-e7ab37603c6f', 'photo-1524504388940-b1c1722653e1',
].map((id) => `https://images.unsplash.com/${id}?w=240&h=240&fit=crop&crop=faces&q=80`);

/** 都市ごとの写真。旅の地点にそのまま貼る */
const SHOTS = {
  tokyo: ['photo-1493976040374-85c8e12f0c0e', 'photo-1540959733332-eab4deabeeaf', 'photo-1536098561742-ca998e48cbcc'],
  asakusa: ['photo-1524413840807-0c3cb6fa808d', 'photo-1503899036084-c55cdd92da26'],
  kyoto: ['photo-1493809842364-78817add7ffb', 'photo-1545569341-9eb8b30979d9', 'photo-1478436127897-769e1b3f0f36'],
  osaka: ['photo-1590559899731-a382839e5549', 'photo-1522547902298-51566e4fb383'],
  hokkaido: ['photo-1480796927426-f609979314bd', 'photo-1601049676869-702ea24cfd58'],
  fuji: ['photo-1490761668535-35497054764d', 'photo-1570459027562-4a916cc6113f'],
  hiroshima: ['photo-1533050487297-09b450131914', 'photo-1519999482648-25049ddd37b1'],
  okinawa: ['photo-1516483638261-f4dbaf036963', 'photo-1518998053901-5348d3961a04'],
  kanazawa: ['photo-1528360983277-13d401cdc186', 'photo-1553653924-39b70295f8da'],
  nara: ['photo-1512757776214-26d36777b513', 'photo-1508009603885-50cf7c579365'],
  hakone: ['photo-1542051841857-5f90071e7989', 'photo-1587595431973-160d0d94add1'],
  fukuoka: ['photo-1554797589-7241bb691973', 'photo-1611250188496-e966043a0629'],
  nikko: ['photo-1492571350019-22de08371fd3', 'photo-1534351590666-13e3e96b5017'],
  kamakura: ['photo-1526481280693-3bfa7568e0f3', 'photo-1492571350019-22de08371fd3'],
};
const shot = (key, i) => {
  const pool = SHOTS[key] ?? SHOTS.tokyo;
  return `https://images.unsplash.com/${pool[i % pool.length]}?w=1400&q=80`;
};

/** 地点。municipalities_master の実在コードと座標に合わせてある */
const PLACE = {
  asakusa: [13106, 13, 35.713884, 139.78662],
  shibuya: [13113, 13, 35.664035, 139.698212],
  shinjuku: [13104, 13, 35.693825, 139.703356],
  kyoto: [26100, 26, 35.005528, 135.755149],
  nara: [29201, 29, 34.685087, 135.804996],
  osaka: [27100, 27, 34.670414, 135.508454],
  kobe: [28100, 28, 34.690083, 135.19551],
  hiroshima: [34100, 34, 34.400487, 132.4634],
  fukuoka: [40130, 40, 33.574314, 130.403876],
  naha: [47201, 47, 26.215224, 127.689835],
  sapporo: [1100, 1, 43.071088, 141.351854],
  hakodate: [1202, 1, 41.796676, 140.735311],
  kanazawa: [17201, 17, 36.578371, 136.662506],
  shizuoka: [22100, 22, 34.999685, 138.40171],
  yokohama: [14100, 14, 35.450023, 139.612702],
  nikko: [9206, 9, 36.720094, 139.698147],
  kamakura: [14204, 14, 35.319229, 139.550283],
  hakone: [14382, 14, 35.232252, 139.052384],
  matsumoto: [20202, 20, 36.238049, 137.972034],
  takayama: [21203, 21, 36.145793, 137.252106],
  nagasaki: [42201, 42, 32.744839, 129.873756],
};

/** 見本の10人。国と旅の性格を散らして、同じ形の旅が並ばないようにする */
const PEOPLE = [
  {
    user: 'emma_walks', name: 'Emma Laurent', nat: 'France', res: 'Lyon', lang: 'en',
    bio: 'Two weeks of trains, temples and too much ramen.',
    trip: { title: 'Golden Route, slowly', start: '2026-04-04', end: '2026-04-13' },
    stops: [
      ['asakusa', 'tokyo', 'Landed and went straight to Sensō-ji', 'Jet-lagged but the lanterns were worth it. Ate melonpan at 7am.'],
      ['hakone', 'hakone', 'Hakone, chasing Fuji', 'Clouds all morning, then it appeared for about four minutes.'],
      ['kyoto', 'kyoto', 'Fushimi Inari before sunrise', 'Left the hostel at 4:30. Had the whole path to myself for an hour.'],
      ['nara', 'nara', 'The deer are not shy', 'One took the map straight out of my hand.'],
      ['osaka', 'osaka', 'Last night in Dōtonbori', 'Ended the trip with takoyaki and no regrets.'],
    ],
  },
  {
    user: 'minjun_kim', name: 'Kim Min-jun', nat: 'South Korea', res: 'Seoul', lang: 'ko',
    bio: '3rd time in Japan. This time, only the north.',
    trip: { title: 'Hokkaido in the snow', start: '2026-02-11', end: '2026-02-16' },
    stops: [
      ['sapporo', 'hokkaido', 'Snow Festival, day one', 'Colder than Seoul by a lot. The ice sculptures are enormous.'],
      ['hakodate', 'hokkaido', 'Night view from Mt. Hakodate', 'Queued 40 minutes for the ropeway. Still worth it.'],
      ['sapporo', 'hokkaido', 'Miso ramen in Susukino', 'Third bowl in three days. No notes.'],
    ],
  },
  {
    user: 'lucas_rides', name: 'Lucas Meyer', nat: 'Germany', res: 'Berlin', lang: 'en',
    bio: 'Cycling and coffee. Mostly coffee.',
    trip: { title: 'Setouchi by bicycle', start: '2026-05-02', end: '2026-05-08' },
    stops: [
      ['hiroshima', 'hiroshima', 'Peace Memorial Park', 'Quiet in a way I did not expect. Stayed much longer than planned.'],
      ['kobe', 'osaka', 'Kobe harbour at dusk', 'Rest day. Sat by the water and did nothing.'],
      ['osaka', 'osaka', 'Back to the city', 'Bike in a box, legs destroyed, very happy.'],
    ],
  },
  {
    user: 'sofia_lens', name: 'Sofía Ramírez', nat: 'Mexico', res: 'Mexico City', lang: 'en',
    bio: 'Photographer. Chasing light in old towns.',
    trip: { title: 'Old towns and mountain air', start: '2026-10-18', end: '2026-10-25' },
    stops: [
      ['takayama', 'kanazawa', 'Takayama morning market', 'Everyone said go early. Everyone was right.'],
      ['kanazawa', 'kanazawa', 'Kenroku-en in the rain', 'The rain made the moss glow. Best photos of the trip.'],
      ['matsumoto', 'nikko', 'Matsumoto Castle', 'Black walls against a completely clear sky.'],
      ['shinjuku', 'tokyo', 'One night in Tokyo before flying out', 'Golden Gai, one drink, then bed.'],
    ],
  },
  {
    user: 'aiko_trip', name: '相川 あいこ', nat: 'Japan', res: '東京', lang: 'ja',
    bio: '週末だけの旅人。御朱印を集めています。',
    trip: { title: '週末で行く、日光と鎌倉', start: '2026-06-06', end: '2026-06-14' },
    stops: [
      ['nikko', 'nikko', '日光東照宮', '朝いちばんの電車で。人が少ないうちに三猿を見られた。'],
      ['kamakura', 'kamakura', '鎌倉の紫陽花', '明月院。並んだけれど、あの青は並ぶ価値がある。'],
      ['yokohama', 'tokyo', '帰りに横浜で夕飯', '中華街で小籠包。週末旅の締めにちょうどいい。'],
    ],
  },
  {
    user: 'noah_eats', name: 'Noah Bennett', nat: 'Australia', res: 'Melbourne', lang: 'en',
    bio: 'Here for the food. All of it.',
    trip: { title: 'Kyushu, one bowl at a time', start: '2026-03-08', end: '2026-03-14' },
    stops: [
      ['fukuoka', 'fukuoka', 'Yatai stalls by the river', 'Sat down at a stall, could not read the menu, pointed. Perfect.'],
      ['nagasaki', 'fukuoka', 'Nagasaki, up and down hills', 'Champon for lunch, then the harbour view at night.'],
      ['fukuoka', 'fukuoka', 'Last bowl before the airport', 'Tonkotsu, extra firm noodles. I get it now.'],
    ],
  },
  {
    user: 'chiara_v', name: 'Chiara Villa', nat: 'Italy', res: 'Milan', lang: 'en',
    bio: 'Slow travel. One city at a time.',
    trip: { title: 'Two weeks in Kyoto only', start: '2026-11-02', end: '2026-11-15' },
    stops: [
      ['kyoto', 'kyoto', 'Arashiyama, very early', 'The bamboo grove is only quiet before 7am. Worth the alarm.'],
      ['kyoto', 'kyoto', 'A week of small temples', 'Skipped the famous ones for a few days. Found better ones.'],
      ['kyoto', 'kyoto', 'Autumn leaves at Tōfuku-ji', 'Peak colour, peak crowd. Still glad I went.'],
      ['nara', 'nara', 'Day trip to Nara', 'Forty minutes by train and it feels like another century.'],
    ],
  },
  {
    user: 'wei_chen', name: '陳 威廷', nat: 'Taiwan', res: 'Taipei', lang: 'zh-Hant',
    bio: '每年都來日本。這次走中部。',
    trip: { title: '中部小旅行', start: '2026-09-12', end: '2026-09-17' },
    stops: [
      ['shizuoka', 'fuji', '富士山と静岡', '新幹線の窓から見えた瞬間、車内がざわついた。'],
      ['takayama', 'kanazawa', '高山の古い町並み', '朝市で買った漬物が旅で一番のおみやげになった。'],
      ['kanazawa', 'kanazawa', '金沢21世紀美術館', '雨の日にちょうどよかった。'],
    ],
  },
  {
    user: 'hana_okinawa', name: 'Hana Silva', nat: 'Brazil', res: 'São Paulo', lang: 'en',
    bio: 'Beaches first, cities later.',
    trip: { title: 'Okinawa and nothing else', start: '2026-07-20', end: '2026-07-26' },
    stops: [
      ['naha', 'okinawa', 'Shuri Castle', 'Learned that Okinawa was its own kingdom. Did not know that.'],
      ['naha', 'okinawa', 'Snorkelling day', 'Water warmer than the air. Saw a sea turtle.'],
      ['naha', 'okinawa', 'Kokusai-dōri at night', 'Bought far too much beniimo tart.'],
    ],
  },
  {
    user: 'oliver_rail', name: 'Oliver Grant', nat: 'United Kingdom', res: 'Manchester', lang: 'en',
    bio: 'Rail pass, no plan, 9 days.',
    trip: { title: 'Nine days, one rail pass', start: '2026-01-09', end: '2026-01-17' },
    stops: [
      ['shibuya', 'tokyo', 'Straight off the plane into Shibuya', 'Everything I was told about the crossing is true.'],
      ['kyoto', 'kyoto', 'Kyoto in winter', 'Cold, empty, and better for it.'],
      ['hiroshima', 'hiroshima', 'Miyajima at low tide', 'Walked out to the gate. Did not expect to be able to.'],
      ['fukuoka', 'fukuoka', 'End of the line', 'Ran out of rail pass before I ran out of Japan.'],
    ],
  },
];

// ---------------------------------------------------------------- 実行

async function drop() {
  /**
   * 途中で落ちた回の取り残しも拾う。
   * auth のユーザーだけ消えて profiles が残ると、次に同じ username で
   * 入れられなくなる（username に一意制約がある）。
   */
  const names = PEOPLE.map((p) => q(p.user)).join(',');
  const rows = await sql(`
    select u.id, u.email from auth.users u where u.email like '%@${DOMAIN}'
    union
    select p.id, '' from profiles p where p.username in (${names})
  `);
  if (!rows.length) return console.log('見本ユーザーは居ません');
  const ids = rows.map((r) => `'${r.id}'`).join(',');
  await sql(`
    delete from photos where trip_id in (select id from trips where owner_id in (${ids}));
    delete from logs where trip_id in (select id from trips where owner_id in (${ids}));
    delete from trip_members where trip_id in (select id from trips where owner_id in (${ids}));
    delete from trip_members where user_id in (${ids});
    delete from trips where owner_id in (${ids});
    delete from user_prefectures where user_id in (${ids});
    delete from profiles where id in (${ids});
  `);
  for (const r of rows) {
    await fetch(`${API}/auth/v1/admin/users/${r.id}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    });
  }
  console.log('消しました:', rows.length, '人');
}

async function seed() {
  for (const [i, p] of PEOPLE.entries()) {
    const email = `${p.user}@${DOMAIN}`;

    // 1) ログインできる実体を作る（プロフィールの外部キーが auth.users を見る）
    const res = await fetch(`${API}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: `Demo!${Date.parse(p.trip.start)}`, email_confirm: true }),
    });
    const user = await res.json();
    if (!user.id) { console.error('作れませんでした', email, JSON.stringify(user).slice(0, 160)); continue; }

    const prefs = [...new Set(p.stops.map(([k]) => PLACE[k][1]))];
    const stopSql = p.stops.map(([key, shotKey, title, note], n) => {
      const [muni, pref, lat, lng] = PLACE[key];
      // 旅の日程の中に散らす。同じ日に固まらないよう1日ずつずらす
      const day = new Date(p.trip.start);
      day.setUTCDate(day.getUTCDate() + n * 2);
      const at = `${day.toISOString().slice(0, 10)} 0${(9 + (n % 5))}:30:00+09`;
      const photos = [shot(shotKey, n), shot(shotKey, n + 1)];
      return { muni, pref, lat, lng, title, note, at, photos };
    });

    await sql(`
      insert into profiles (id, username, display_name, avatar_url, bio, nationality, residence, language)
      values ('${user.id}', ${q(p.user)}, ${q(p.name)}, ${q(AVATARS[i % AVATARS.length])},
              ${q(p.bio)}, ${q(p.nat)}, ${q(p.res)}, ${q(p.lang)});

      insert into user_prefectures (user_id, prefecture_code)
      values ${prefs.map((c) => `('${user.id}', ${c})`).join(',')};

      insert into trips (id, owner_id, title, status, visibility, start_date, end_date, cover_photo_url)
      values ('${user.id}'::uuid, '${user.id}', ${q(p.trip.title)}, 'completed', 'public',
              ${q(p.trip.start)}, ${q(p.trip.end)}, ${q(stopSql[0].photos[0])});

      -- trips への挿入で持ち主が自動で入る仕掛けがあるので、重なったら見送る
      insert into trip_members (trip_id, user_id, role)
      values ('${user.id}'::uuid, '${user.id}', 'owner')
      on conflict (trip_id, user_id) do nothing;

      ${stopSql.map((s, n) => `
      with l as (
        insert into logs (trip_id, author_id, title, note, municipality_code, prefecture_code, lat, lng, logged_at, sort_order)
        values ('${user.id}'::uuid, '${user.id}', ${q(s.title)}, ${q(s.note)}, ${s.muni}, ${s.pref},
                ${s.lat}, ${s.lng}, ${q(s.at)}, ${n})
        returning id
      )
      insert into photos (log_id, trip_id, uploader_id, storage_path, sort_order)
      select l.id, '${user.id}'::uuid, '${user.id}', v.url, v.ord
      from l, (values ${s.photos.map((u, k) => `(${q(u)}, ${k})`).join(',')}) as v(url, ord);
      `).join('\n')}
    `);
    console.log('入れました:', p.user, `(${p.stops.length}地点 / 写真${p.stops.length * 2}枚)`);
  }
}

const mode = process.argv[2];
if (mode === '--drop') await drop();
else { await drop(); await seed(); }
