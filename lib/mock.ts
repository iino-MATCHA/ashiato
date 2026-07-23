/**
 * MVP用モックデータ。Supabase接続前でも全画面が成立するように用意。
 * 実データ接続時は lib/api.ts に置き換える想定。
 */

export interface Prefecture {
  id: number;
  code: string;
  name: string;
  region: string;
}

export interface Goshuin {
  id: string;
  prefectureId: number;
  prefectureName: string;
  name: string;
  rarity: 'normal' | 'limited' | 'seasonal' | 'collab';
  acquired: boolean;
  acquiredAt?: string;
  kanji: string; // スタンプに描く一文字
}

export interface Step {
  id: string;
  title: string;
  placeName: string;
  prefectureName: string;
  note: string;
  loggedAt: string;
  photoCount: number;
}

export interface Trip {
  id: string;
  title: string;
  subtitle: string;
  status: 'planning' | 'ongoing' | 'completed';
  startDate: string;
  endDate: string;
  prefectures: string[];
  members: string[];
  distanceKm: number;
  stepCount: number;
  goshuinCount: number;
  steps: Step[];
}

export interface GalleryCard {
  id: string;
  author: string;
  tripTitle: string;
  type: 'route' | 'goshuin' | 'trip_summary';
  ratio: '1:1' | '9:16';
  likes: number;
  accent: string;
}

export const PREFECTURE_TOTAL = 47;

export const goshuinList: Goshuin[] = [
  { id: 'g13', prefectureId: 13, prefectureName: '東京都', name: '浅草', rarity: 'normal', acquired: true, acquiredAt: '2026-03-14', kanji: '東' },
  { id: 'g14', prefectureId: 14, prefectureName: '神奈川県', name: '鎌倉', rarity: 'limited', acquired: true, acquiredAt: '2026-03-15', kanji: '鎌' },
  { id: 'g26', prefectureId: 26, prefectureName: '京都府', name: '伏見', rarity: 'seasonal', acquired: true, acquiredAt: '2026-04-02', kanji: '京' },
  { id: 'g27', prefectureId: 27, prefectureName: '大阪府', name: '難波', rarity: 'normal', acquired: true, acquiredAt: '2026-04-03', kanji: '浪' },
  { id: 'g01', prefectureId: 1, prefectureName: '北海道', name: '函館', rarity: 'normal', acquired: true, acquiredAt: '2026-05-20', kanji: '函' },
  { id: 'g47', prefectureId: 47, prefectureName: '沖縄県', name: '首里', rarity: 'collab', acquired: true, acquiredAt: '2026-06-11', kanji: '琉' },
  { id: 'g23', prefectureId: 23, prefectureName: '愛知県', name: '熱田', rarity: 'normal', acquired: true, acquiredAt: '2026-02-01', kanji: '熱' },
  { id: 'g40', prefectureId: 40, prefectureName: '福岡県', name: '博多', rarity: 'normal', acquired: true, acquiredAt: '2026-01-18', kanji: '博' },
  // 未獲得（グレーアウト表示）
  { id: 'g04', prefectureId: 4, prefectureName: '宮城県', name: '仙台', rarity: 'normal', acquired: false, kanji: '仙' },
  { id: 'g15', prefectureId: 15, prefectureName: '新潟県', name: '越後', rarity: 'normal', acquired: false, kanji: '越' },
  { id: 'g20', prefectureId: 20, prefectureName: '長野県', name: '善光寺', rarity: 'limited', acquired: false, kanji: '信' },
  { id: 'g34', prefectureId: 34, prefectureName: '広島県', name: '宮島', rarity: 'seasonal', acquired: false, kanji: '厳' },
];

export const acquiredCount = goshuinList.filter((g) => g.acquired).length;

export const trips: Trip[] = [
  {
    id: 't1',
    title: '春の関西、朱をたどる',
    subtitle: '京都・大阪・奈良',
    status: 'completed',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
    prefectures: ['京都府', '大阪府', '奈良県'],
    members: ['あなた', 'みき'],
    distanceKm: 612,
    stepCount: 14,
    goshuinCount: 3,
    steps: [
      { id: 's1', title: '伏見稲荷の千本鳥居', placeName: '伏見稲荷大社', prefectureName: '京都府', note: '朝いちで登る。朱の連なりが霧に溶けていた。', loggedAt: '2026-04-01', photoCount: 12 },
      { id: 's2', title: '鴨川べりを歩く', placeName: '鴨川', prefectureName: '京都府', note: '等間隔に座る人々。夕方の光。', loggedAt: '2026-04-02', photoCount: 6 },
      { id: 's3', title: '道頓堀の夜', placeName: '道頓堀', prefectureName: '大阪府', note: 'ネオンと粉もん。', loggedAt: '2026-04-03', photoCount: 9 },
      { id: 's4', title: '奈良公園の鹿', placeName: '奈良公園', prefectureName: '奈良県', note: 'お辞儀する鹿に驚く。', loggedAt: '2026-04-04', photoCount: 8 },
    ],
  },
  {
    id: 't2',
    title: '北の果て、函館の坂',
    subtitle: '北海道',
    status: 'completed',
    startDate: '2026-05-19',
    endDate: '2026-05-22',
    prefectures: ['北海道'],
    members: ['あなた'],
    distanceKm: 288,
    stepCount: 9,
    goshuinCount: 1,
    steps: [
      { id: 's5', title: '函館山の夜景', placeName: '函館山', prefectureName: '北海道', note: 'くびれた地形に光が満ちる。', loggedAt: '2026-05-20', photoCount: 15 },
      { id: 's6', title: '朝市でイカ', placeName: '函館朝市', prefectureName: '北海道', note: '透きとおったイカ刺し。', loggedAt: '2026-05-21', photoCount: 5 },
    ],
  },
  {
    id: 't3',
    title: '梅雨明けの沖縄（進行中）',
    subtitle: '沖縄本島',
    status: 'ongoing',
    startDate: '2026-07-20',
    endDate: '2026-07-26',
    prefectures: ['沖縄県'],
    members: ['あなた', 'りく', 'さな'],
    distanceKm: 134,
    stepCount: 4,
    goshuinCount: 1,
    steps: [
      { id: 's7', title: '首里城の石垣', placeName: '首里城', prefectureName: '沖縄県', note: '曲線の石積み。', loggedAt: '2026-07-21', photoCount: 7 },
      { id: 's8', title: '国際通りの市場', placeName: '第一牧志公設市場', prefectureName: '沖縄県', note: '色の洪水。', loggedAt: '2026-07-22', photoCount: 4 },
    ],
  },
];

export const gallery: GalleryCard[] = [
  { id: 'c1', author: 'みき', tripTitle: '春の関西、朱をたどる', type: 'route', ratio: '9:16', likes: 248, accent: '#C4432B' },
  { id: 'c2', author: 'たろ', tripTitle: '四国遍路 通し打ち', type: 'goshuin', ratio: '1:1', likes: 512, accent: '#2B4257' },
  { id: 'c3', author: 'さな', tripTitle: '東北ローカル線の旅', type: 'trip_summary', ratio: '9:16', likes: 87, accent: '#A98037' },
  { id: 'c4', author: 'りく', tripTitle: '瀬戸内アート島めぐり', type: 'route', ratio: '1:1', likes: 193, accent: '#6C8199' },
  { id: 'c5', author: 'ゆい', tripTitle: '九州横断ドライブ', type: 'goshuin', ratio: '9:16', likes: 341, accent: '#C4432B' },
  { id: 'c6', author: 'けん', tripTitle: '信州の高原を歩く', type: 'trip_summary', ratio: '1:1', likes: 129, accent: '#2B4257' },
];

export const trendingSpots = [
  { name: '伏見稲荷大社', prefecture: '京都府', visits: 1240 },
  { name: '宮島 厳島神社', prefecture: '広島県', visits: 980 },
  { name: '善光寺', prefecture: '長野県', visits: 742 },
  { name: '出雲大社', prefecture: '島根県', visits: 651 },
];

export function findTrip(id?: string) {
  return trips.find((t) => t.id === id) ?? trips[0];
}

export function findGoshuin(id?: string) {
  return goshuinList.find((g) => g.id === id) ?? goshuinList[0];
}
