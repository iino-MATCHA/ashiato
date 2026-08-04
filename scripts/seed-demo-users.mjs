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
 * 写真はこちらの保管庫（photos バケットの demo/）に置いた1地点1枚を使う。
 * 外部を直接参照すると相手の都合で絵が消える（実際 Wikimedia は 429 を返した）。
 * photos.storage_path は http から始まる値をそのまま公開URLとして扱う
 * （lib/api.ts の publicUrl）。
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

/**
 * 人物の顔。PEOPLE と同じ並びで、1人ずつ突き合わせてある。
 * 以前は並び順を見ずに割り当てたため、男性名に女性の顔、
 * 日本人・韓国人の設定に欧州の顔が付いていた（10人中5人）。
 */
const AVATARS = [
  'photo-1494790108377-be9c29b29330', // emma   — 仏・女性
  'photo-1611403119860-57c4937ef987', // minjun — 韓・男性
  'photo-1552374196-c4e7ffc6e126',    // lucas  — 独・男性
  'photo-1592621385612-4d7129426394', // sofia  — 墨・女性
  'photo-1541823709867-1b206113eafd', // aiko   — 日・女性
  'photo-1506794778202-cad84cf45f1d', // noah   — 豪・男性
  'photo-1517841905240-472988babdf9', // chiara — 伊・女性
  'photo-1531427186611-ecfd6d936c79', // wei    — 台・男性
  'photo-1487412720507-e7ab37603c6f', // hana   — 伯・女性
  'photo-1615109398623-88346a601842', // oliver — 英・男性
].map((id) => `https://images.unsplash.com/${id}?w=240&h=240&fit=crop&crop=faces&q=80`);

/**
 * 写真は URL をそのまま持つ。
 *
 * 以前は「その場所らしい」画像IDを当てずっぽうで並べ、200が返ることしか
 * 確かめていなかった。結果、北海道の地点に象が写っていた。
 * いまは 1地点1枚を実際に目で見て選び、こちらの保管庫へ写してある。
 * 同じ絵は二度使わない。出典と作者は photos.caption に残す。
 */
const CREDIT = {
  "emma-1": "Sensō-ji · Akonnchiroll / CC0 · Wikimedia Commons",
  "emma-2": "Hakone · Quercus acuta / CC0 · Wikimedia Commons",
  "emma-3": "Fushimi Inari-taisha · Basile Morin / CC BY-SA 4.0 · Wikimedia Commons",
  "emma-4": "Nara Park · Feri88 / CC BY 3.0 · Wikimedia Commons",
  "emma-5": "Dōtonbori · Type specimen / CC BY-SA 3.0 · Wikimedia Commons",
  "minjun-1": "Sapporo Snow Festival · Materialscientist / CC BY-SA 3.0 · Wikimedia Commons",
  "minjun-2": "Mount Hakodate · 663highland / CC BY 2.5 · Wikimedia Commons",
  "minjun-3": "Susukino · Chatama / Public domain · Wikimedia Commons",
  "lucas-1": "Hiroshima Peace Memorial Park · Balon Greyjoy / CC0 · Wikimedia Commons",
  "lucas-2": "Kobe Port Tower · Balon Greyjoy / CC0 · Wikimedia Commons",
  "lucas-3": "Osaka Castle · 663highland / CC BY 2.5 · Wikimedia Commons",
  "sofia-1": "Takayama, Gifu · Nickaura (Nick Sevarg) / CC BY-SA 3.0 · Wikimedia Commons",
  "sofia-2": "Kenroku-en · Japanexperterna.se / CC BY-SA 3.0 · Wikimedia Commons",
  "sofia-3": "Matsumoto Castle · Lightning toothed whale (稲妻ノ歯鯨)\n\n This photo was taken with Canon EOS 500D / CC BY-SA 4.0 · Wikimedia Commons",
  "sofia-4": "Shinjuku · Morio / CC BY-SA 3.0 · Wikimedia Commons",
  "aiko-1": "Nikkō Tōshō-gū · 663highland / CC BY-SA 4.0 · Wikimedia Commons",
  "aiko-2": "Meigetsu-in · Tarourashima / Public domain · Wikimedia Commons",
  "aiko-3": "Yokohama Chinatown · Wpcpey / CC BY-SA 4.0 · Wikimedia Commons",
  "noah-1": "Yatai · Tomomarusan / CC BY-SA 3.0 · Wikimedia Commons",
  "noah-2": "Nagasaki · Tomio344456 / CC BY-SA 4.0 · Wikimedia Commons",
  "noah-3": "Tonkotsu ramen · Schellack / Public domain · Wikimedia Commons",
  "chiara-1": "Arashiyama · lumoplank / CC0 · Wikimedia Commons",
  "chiara-2": "Kiyomizu-dera · Jordy Meow / CC BY-SA 3.0 · Wikimedia Commons",
  "chiara-3": "Tōfuku-ji · PlusMinus / CC BY-SA 3.0 · Wikimedia Commons",
  "chiara-4": "Tōdai-ji · Wiiii / CC BY-SA 3.0 · Wikimedia Commons",
  "wei-1": "Mount Fuji · Suicasmo / CC BY-SA 4.0 · Wikimedia Commons",
  "wei-2": "Shirakawa-go · 663highland / CC BY 2.5 · Wikimedia Commons",
  "wei-3": "21st Century Museum of Contemporary Art, Kanazawa · 金沢市 / CC BY 2.1 jp · Wikimedia Commons",
  "hana-1": "Shuri Castle · CEphoto, Uwe Aranas / CC BY-SA 3.0 · Wikimedia Commons",
  "hana-2": "Naminoue Shrine · ChiefHira / CC BY-SA 3.0 · Wikimedia Commons",
  "hana-3": "Kokusai-dori · TurnOnTheNight / CC BY-SA 4.0 · Wikimedia Commons",
  "oliver-1": "Shibuya Crossing · David Kernan / CC BY 4.0 · Wikimedia Commons",
  "oliver-2": "Kinkaku-ji · Nacaru / CC BY-SA 4.0 · Wikimedia Commons",
  "oliver-3": "Itsukushima Shrine · redlegsfan21 / CC BY-SA 2.0 · Wikimedia Commons",
  "oliver-4": "Fukuoka Tower · Steffen Flor / CC BY-SA 4.0 · Wikimedia Commons"
};
/** URL から出典を引く（キーはファイル名） */
const creditFor = (url) => CREDIT[(url.split('/').pop() || '').replace(/\.jpg$/, '')] ?? '';

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
      ['asakusa', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/emma-1.jpg", "Landed and went straight to Sensō-ji", "Jet-lagged but the lanterns were worth it. Ate melonpan at 7am."],
      ['hakone', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/emma-2.jpg", "Hakone, chasing Fuji", "Clouds all morning, then it appeared for about four minutes."],
      ['kyoto', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/emma-3.jpg", "Fushimi Inari before sunrise", "Left the hostel at 4:30. Had the whole path to myself for an hour."],
      ['nara', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/emma-4.jpg", "A slow afternoon in Nara Park", "Sat by the pond until it got dark. The deer come right up to you."],
      ['osaka', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/emma-5.jpg", "Last night in Dōtonbori", "Ended the trip with takoyaki and no regrets."],
    ],
  },
  {
    user: 'minjun_kim', name: 'Kim Min-jun', nat: 'South Korea', res: 'Seoul', lang: 'ko',
    bio: '3rd time in Japan. This time, only the north.',
    trip: { title: 'Hokkaido in the snow', start: '2026-02-11', end: '2026-02-16' },
    stops: [
      ['sapporo', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/minjun-1.jpg", "Snow Festival, day one", "Colder than Seoul by a lot. The ice sculptures are enormous."],
      ['hakodate', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/minjun-2.jpg", "Mount Hakodate from the harbour", "Went up for the night view. Queued 40 minutes and still worth it."],
      ['sapporo', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/minjun-3.jpg", "Miso ramen in Susukino", "Third bowl in three days. No notes."],
    ],
  },
  {
    user: 'lucas_rides', name: 'Lucas Meyer', nat: 'Germany', res: 'Berlin', lang: 'en',
    bio: 'Cycling and coffee. Mostly coffee.',
    trip: { title: 'Setouchi by bicycle', start: '2026-05-02', end: '2026-05-08' },
    stops: [
      ['hiroshima', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/lucas-1.jpg", "Peace Memorial Park", "Quiet in a way I did not expect. Stayed much longer than planned."],
      ['kobe', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/lucas-2.jpg", "Kobe harbour at dusk", "Rest day. Sat under the tower and did nothing."],
      ['osaka', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/lucas-3.jpg", "Osaka Castle on the last morning", "Bike in a box, legs destroyed, very happy."],
    ],
  },
  {
    user: 'sofia_lens', name: 'Sofía Ramírez', nat: 'Mexico', res: 'Mexico City', lang: 'en',
    bio: 'Photographer. Chasing light in old towns.',
    trip: { title: 'Old towns and mountain air', start: '2026-10-18', end: '2026-10-25' },
    stops: [
      ['takayama', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/sofia-1.jpg", "Takayama, from above", "Everyone said go early. Everyone was right."],
      ['kanazawa', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/sofia-2.jpg", "Kenroku-en in the rain", "The rain made the moss glow. Best photos of the trip."],
      ['matsumoto', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/sofia-3.jpg", "Matsumoto Castle", "Black walls against a completely clear sky."],
      ['shinjuku', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/sofia-4.jpg", "One night in Tokyo before flying out", "Fuji was out behind the towers. Did not expect that from Shinjuku."],
    ],
  },
  {
    user: 'aiko_trip', name: '相川 あいこ', nat: 'Japan', res: '東京', lang: 'ja',
    bio: '週末だけの旅人。御朱印を集めています。',
    trip: { title: '週末で行く、日光と鎌倉', start: '2026-06-06', end: '2026-06-14' },
    stops: [
      ['nikko', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/aiko-1.jpg", "日光東照宮", "朝いちばんの電車で。人が少ないうちに鳥居をくぐれた。"],
      ['kamakura', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/aiko-2.jpg", "鎌倉・明月院", "紫陽花の季節。並んだけれど、あの青は並ぶ価値がある。"],
      ['yokohama', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/aiko-3.jpg", "帰りに横浜中華街で夕飯", "小籠包で締め。週末旅にちょうどいい終わり方だった。"],
    ],
  },
  {
    user: 'noah_eats', name: 'Noah Bennett', nat: 'Australia', res: 'Melbourne', lang: 'en',
    bio: 'Here for the food. All of it.',
    trip: { title: 'Kyushu, one bowl at a time', start: '2026-03-08', end: '2026-03-14' },
    stops: [
      ['fukuoka', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/noah-1.jpg", "Yatai stalls by the river", "Sat down at a stall, could not read the menu, pointed. Perfect."],
      ['nagasaki', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/noah-2.jpg", "Nagasaki, up and down hills", "Champon for lunch, then the harbour view from the hill."],
      ['fukuoka', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/noah-3.jpg", "Last bowl before the airport", "Tonkotsu, extra firm noodles. I get it now."],
    ],
  },
  {
    user: 'chiara_v', name: 'Chiara Villa', nat: 'Italy', res: 'Milan', lang: 'en',
    bio: 'Slow travel. One city at a time.',
    trip: { title: 'Two weeks in Kyoto only', start: '2026-11-02', end: '2026-11-15' },
    stops: [
      ['kyoto', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/chiara-1.jpg", "Arashiyama, very early", "Walked along the river before the crowds. Worth the alarm."],
      ['kyoto', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/chiara-2.jpg", "Kiyomizu-dera on a clear day", "Skipped the famous ones for a few days, then gave in to this one."],
      ['kyoto', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/chiara-3.jpg", "A week of small temples", "Tōfuku-ji almost to myself on a Tuesday morning."],
      ['nara', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/chiara-4.jpg", "Day trip to Nara", "Tōdai-ji is far bigger in person than any photo suggests."],
    ],
  },
  {
    user: 'wei_chen', name: '陳 威廷', nat: 'Taiwan', res: 'Taipei', lang: 'zh-Hant',
    bio: '每年都來日本。這次走中部。',
    trip: { title: '中部小旅行', start: '2026-09-12', end: '2026-09-17' },
    stops: [
      ['shizuoka', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/wei-1.jpg", "富士山と静岡", "新幹線の窓から見えた瞬間、車内がざわついた。"],
      ['takayama', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/wei-2.jpg", "白川郷まで足をのばす", "合掌造りの集落。写真で見るより、屋根がずっと大きい。"],
      ['kanazawa', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/wei-3.jpg", "金沢21世紀美術館", "雨の日にちょうどよかった。"],
    ],
  },
  {
    user: 'hana_okinawa', name: 'Hana Silva', nat: 'Brazil', res: 'São Paulo', lang: 'en',
    bio: 'Beaches first, cities later.',
    trip: { title: 'Okinawa and nothing else', start: '2026-07-20', end: '2026-07-26' },
    stops: [
      ['naha', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/hana-1.jpg", "Shuri Castle", "Learned that Okinawa was its own kingdom. Did not know that."],
      ['naha', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/hana-2.jpg", "Naminoue, right in the city", "A shrine on a cliff above the beach. Swam below it afterwards."],
      ['naha', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/hana-3.jpg", "Kokusai-dōri at night", "Bought far too much beniimo tart."],
    ],
  },
  {
    user: 'oliver_rail', name: 'Oliver Grant', nat: 'United Kingdom', res: 'Manchester', lang: 'en',
    bio: 'Rail pass, no plan, 9 days.',
    trip: { title: 'Nine days, one rail pass', start: '2026-01-09', end: '2026-01-17' },
    stops: [
      ['shibuya', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/oliver-1.jpg", "Straight off the plane into Shibuya", "Everything I was told about the lights is true."],
      ['kyoto', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/oliver-2.jpg", "Kyoto in winter", "Kinkaku-ji with almost nobody there. Cold, empty, better for it."],
      ['hiroshima', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/oliver-3.jpg", "Miyajima", "The gate stands in the water at high tide. Waited for it to turn."],
      ['fukuoka', "https://tcyclvfinguwudztfgsb.supabase.co/storage/v1/object/public/photos/demo/oliver-4.jpg", "End of the line", "Ran out of rail pass before I ran out of Japan."],
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
    const stopSql = p.stops.map(([key, photo, title, note], n) => {
      const [muni, pref, lat, lng] = PLACE[key];
      // 旅の日程の中に散らす。同じ日に固まらないよう1日ずつずらす
      const day = new Date(p.trip.start);
      day.setUTCDate(day.getUTCDate() + n * 2);
      const at = `${day.toISOString().slice(0, 10)} 0${(9 + (n % 5))}:30:00+09`;
      return { muni, pref, lat, lng, title, note, at, photo };
    });

    await sql(`
      insert into profiles (id, username, display_name, avatar_url, bio, nationality, residence, language)
      values ('${user.id}', ${q(p.user)}, ${q(p.name)}, ${q(AVATARS[i % AVATARS.length])},
              ${q(p.bio)}, ${q(p.nat)}, ${q(p.res)}, ${q(p.lang)});

      insert into user_prefectures (user_id, prefecture_code)
      values ${prefs.map((c) => `('${user.id}', ${c})`).join(',')};

      insert into trips (id, owner_id, title, status, visibility, start_date, end_date, cover_photo_url)
      values ('${user.id}'::uuid, '${user.id}', ${q(p.trip.title)}, 'completed', 'public',
              ${q(p.trip.start)}, ${q(p.trip.end)}, ${q(stopSql[0].photo)});

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
      insert into photos (log_id, trip_id, uploader_id, storage_path, caption, sort_order)
      select l.id, '${user.id}'::uuid, '${user.id}', ${q(s.photo)}, ${q(creditFor(s.photo))}, 0
      from l;
      `).join('\n')}
    `);
    console.log('入れました:', p.user, `(${p.stops.length}地点 / 写真${p.stops.length}枚)`);
  }
}

const mode = process.argv[2];
if (mode === '--drop') await drop();
else { await drop(); await seed(); }
