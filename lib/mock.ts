/**
 * Sample data. The old placeholder trips are gone; the single showcase trip is a
 * "Japan Grand Tour" that loops the country (long flights + short trains), kept
 * pinned at the top as a public sample. The same trip is seeded to Supabase
 * (supabase/seed.sql) so it is DB-linked once connected.
 */

export type TransportMode = 'car' | 'train' | 'shinkansen' | 'plane' | 'walk' | 'ferry' | 'bus';

export interface Goshuin {
  id: string;
  prefectureId: number;
  prefectureName: string;
  name: string;
  rarity: 'normal' | 'limited' | 'seasonal' | 'collab';
  acquired: boolean;
  acquiredAt?: string;
  kanji: string;
}

export interface Step {
  id: string;
  title: string;
  placeName: string;
  prefectureName: string;
  note: string;
  loggedAt: string;
  lng: number;
  lat: number;
  images: string[];
  transport: TransportMode; // how you arrived here from the previous stop
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
  sample?: boolean; // pinned showcase trip
  authorId?: string;
  steps: Step[];
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  color: string;
  tripIds: string[];
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

const photos = (seed: string, n = 6) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}${i}/700/700`);

// ---------------------------------------------------------------- showcase
const grandTour: Trip = {
  id: 'sample-japan',
  title: 'Japan Grand Tour',
  subtitle: 'A loop around the country',
  status: 'completed',
  startDate: '2026-03-20',
  endDate: '2026-04-05',
  prefectures: ['Tokyo', 'Ishikawa', 'Kyoto', 'Osaka', 'Hiroshima', 'Fukuoka', 'Okinawa', 'Hokkaido', 'Miyagi'],
  members: ['You'],
  distanceKm: 4380,
  sample: true,
  authorId: 'me',
  steps: [
    { id: 'gt1', title: 'Start in Tokyo', placeName: 'Chiyoda, Tokyo', prefectureName: 'Tokyo', note: 'The neon capital. Where the loop begins.', loggedAt: '2026-03-20', lng: 139.7630, lat: 35.6920, images: photos('gtTokyo'), transport: 'plane' },
    { id: 'gt2', title: 'Kanazawa Gold', placeName: 'Kanazawa, Ishikawa', prefectureName: 'Ishikawa', note: 'Kenrokuen garden and gold leaf.', loggedAt: '2026-03-22', lng: 136.6625, lat: 36.5784, images: photos('gtKanazawa'), transport: 'shinkansen' },
    { id: 'gt3', title: 'Kyoto Temples', placeName: 'Kyoto', prefectureName: 'Kyoto', note: 'A thousand vermilion gates.', loggedAt: '2026-03-24', lng: 135.7551, lat: 35.0055, images: photos('gtKyoto'), transport: 'train' },
    { id: 'gt4', title: 'Osaka Nights', placeName: 'Osaka', prefectureName: 'Osaka', note: 'Street food until midnight.', loggedAt: '2026-03-26', lng: 135.5085, lat: 34.6704, images: photos('gtOsaka'), transport: 'train' },
    { id: 'gt5', title: 'Hiroshima Peace', placeName: 'Hiroshima', prefectureName: 'Hiroshima', note: 'The dome and the quiet river.', loggedAt: '2026-03-28', lng: 132.4634, lat: 34.4005, images: photos('gtHiroshima'), transport: 'shinkansen' },
    { id: 'gt6', title: 'Fukuoka Ramen', placeName: 'Fukuoka', prefectureName: 'Fukuoka', note: 'Tonkotsu at a riverside yatai.', loggedAt: '2026-03-30', lng: 130.4039, lat: 33.5743, images: photos('gtFukuoka'), transport: 'shinkansen' },
    { id: 'gt7', title: 'Okinawa Blue', placeName: 'Naha, Okinawa', prefectureName: 'Okinawa', note: 'Turquoise sea, Shuri stone.', loggedAt: '2026-04-01', lng: 127.6898, lat: 26.2152, images: photos('gtOkinawa'), transport: 'plane' },
    { id: 'gt8', title: 'Sapporo North', placeName: 'Sapporo, Hokkaido', prefectureName: 'Hokkaido', note: 'From the far south to the far north.', loggedAt: '2026-04-03', lng: 141.3519, lat: 43.0711, images: photos('gtSapporo'), transport: 'plane' },
    { id: 'gt9', title: 'Sendai Green', placeName: 'Sendai, Miyagi', prefectureName: 'Miyagi', note: 'City of trees on the way home.', loggedAt: '2026-04-04', lng: 140.8719, lat: 38.2709, images: photos('gtSendai'), transport: 'plane' },
    { id: 'gt10', title: 'Back to Tokyo', placeName: 'Chiyoda, Tokyo', prefectureName: 'Tokyo', note: 'The loop closes where it began.', loggedAt: '2026-04-05', lng: 139.7630, lat: 35.6920, images: photos('gtTokyo2'), transport: 'shinkansen' },
  ],
};

// ---------------------------------------------------------------- friends' trips
const mikiTrip: Trip = {
  id: 'friend-miki-1',
  title: 'Setouchi Art Islands',
  subtitle: 'Kagawa · Okayama',
  status: 'completed',
  startDate: '2026-05-02',
  endDate: '2026-05-05',
  prefectures: ['Kagawa', 'Okayama'],
  members: ['Miki'],
  distanceKm: 240,
  authorId: 'f1',
  steps: [
    { id: 'mk1', title: 'Naoshima', placeName: 'Naoshima', prefectureName: 'Kagawa', note: 'Yayoi Kusama pumpkin.', loggedAt: '2026-05-02', lng: 133.9955, lat: 34.4581, images: photos('mkNaoshima'), transport: 'ferry' },
    { id: 'mk2', title: 'Okayama Koraku-en', placeName: 'Okayama', prefectureName: 'Okayama', note: 'One of Japan’s three great gardens.', loggedAt: '2026-05-04', lng: 133.9350, lat: 34.6617, images: photos('mkOkayama'), transport: 'ferry' },
  ],
};

const rikuTrip: Trip = {
  id: 'friend-riku-1',
  title: 'Tohoku Local Lines',
  subtitle: 'Aomori · Akita',
  status: 'completed',
  startDate: '2026-06-10',
  endDate: '2026-06-13',
  prefectures: ['Aomori', 'Akita'],
  members: ['Riku'],
  distanceKm: 310,
  authorId: 'f2',
  steps: [
    { id: 'rk1', title: 'Aomori Bay', placeName: 'Aomori', prefectureName: 'Aomori', note: 'Nebuta colours.', loggedAt: '2026-06-10', lng: 140.7400, lat: 40.8244, images: photos('rkAomori'), transport: 'shinkansen' },
    { id: 'rk2', title: 'Kakunodate', placeName: 'Semboku, Akita', prefectureName: 'Akita', note: 'Samurai streets and weeping cherries.', loggedAt: '2026-06-12', lng: 140.5620, lat: 39.5980, images: photos('rkAkita'), transport: 'train' },
  ],
};

// ---------------------------------------------------------------- exports
export const trips: Trip[] = [grandTour];
export const allTrips: Trip[] = [grandTour, mikiTrip, rikuTrip];
export const publicTrips: Trip[] = [grandTour, mikiTrip, rikuTrip];

export const me = { id: 'me', name: 'Taro Yamada', username: 'taro', color: '#69AF00' };

export const friends: Friend[] = [
  { id: 'f1', name: 'Miki', username: 'miki', color: '#C4432B', tripIds: ['friend-miki-1'] },
  { id: 'f2', name: 'Riku', username: 'riku', color: '#2B4257', tripIds: ['friend-riku-1'] },
];

export const suggestedFriends: Friend[] = [
  { id: 's1', name: 'Sana', username: 'sana', color: '#A98037', tripIds: [] },
  { id: 's2', name: 'Ken', username: 'ken', color: '#6C8199', tripIds: [] },
  { id: 's3', name: 'Yui', username: 'yui', color: '#8FC93A', tripIds: [] },
];

export const gallery: GalleryCard[] = [
  { id: 'c1', author: 'Miki', tripTitle: 'Setouchi Art Islands', type: 'route', ratio: '9:16', likes: 248, accent: '#69AF00' },
  { id: 'c2', author: 'Taro', tripTitle: 'Japan Grand Tour', type: 'trip_summary', ratio: '1:1', likes: 512, accent: '#2B4257' },
  { id: 'c3', author: 'Riku', tripTitle: 'Tohoku Local Lines', type: 'goshuin', ratio: '9:16', likes: 87, accent: '#A98037' },
  { id: 'c4', author: 'Sana', tripTitle: 'Kumano Kodo', type: 'route', ratio: '1:1', likes: 193, accent: '#8FC93A' },
];

export const goshuinList: Goshuin[] = [
  { id: 'g13', prefectureId: 13, prefectureName: 'Tokyo', name: 'Asakusa', rarity: 'normal', acquired: true, acquiredAt: '2026-03-20', kanji: '東' },
  { id: 'g17', prefectureId: 17, prefectureName: 'Ishikawa', name: 'Kanazawa', rarity: 'limited', acquired: true, acquiredAt: '2026-03-22', kanji: '金' },
  { id: 'g26', prefectureId: 26, prefectureName: 'Kyoto', name: 'Fushimi', rarity: 'seasonal', acquired: true, acquiredAt: '2026-03-24', kanji: '京' },
  { id: 'g27', prefectureId: 27, prefectureName: 'Osaka', name: 'Namba', rarity: 'normal', acquired: true, acquiredAt: '2026-03-26', kanji: '浪' },
  { id: 'g34', prefectureId: 34, prefectureName: 'Hiroshima', name: 'Miyajima', rarity: 'seasonal', acquired: true, acquiredAt: '2026-03-28', kanji: '厳' },
  { id: 'g40', prefectureId: 40, prefectureName: 'Fukuoka', name: 'Hakata', rarity: 'normal', acquired: true, acquiredAt: '2026-03-30', kanji: '博' },
  { id: 'g47', prefectureId: 47, prefectureName: 'Okinawa', name: 'Shuri', rarity: 'collab', acquired: true, acquiredAt: '2026-04-01', kanji: '琉' },
  { id: 'g01', prefectureId: 1, prefectureName: 'Hokkaido', name: 'Hakodate', rarity: 'normal', acquired: true, acquiredAt: '2026-04-03', kanji: '函' },
  { id: 'g04', prefectureId: 4, prefectureName: 'Miyagi', name: 'Sendai', rarity: 'normal', acquired: true, acquiredAt: '2026-04-04', kanji: '仙' },
  { id: 'g20', prefectureId: 20, prefectureName: 'Nagano', name: 'Zenkoji', rarity: 'limited', acquired: false, kanji: '信' },
  { id: 'g14', prefectureId: 14, prefectureName: 'Kanagawa', name: 'Kamakura', rarity: 'normal', acquired: false, kanji: '鎌' },
  { id: 'g23', prefectureId: 23, prefectureName: 'Aichi', name: 'Atsuta', rarity: 'normal', acquired: false, kanji: '熱' },
];

export const acquiredCount = goshuinList.filter((g) => g.acquired).length;

export const trendingSpots = [
  { name: 'Fushimi Inari Taisha', prefecture: 'Kyoto', visits: 1240 },
  { name: 'Itsukushima Shrine', prefecture: 'Hiroshima', visits: 980 },
  { name: 'Kenroku-en', prefecture: 'Ishikawa', visits: 742 },
  { name: 'Shuri Castle', prefecture: 'Okinawa', visits: 651 },
];

export const transportLabel: Record<TransportMode, string> = {
  car: 'Car',
  train: 'Train',
  shinkansen: 'Shinkansen',
  plane: 'Flight',
  walk: 'Walk',
  ferry: 'Ferry',
  bus: 'Bus',
};

export function findTrip(id?: string) {
  return allTrips.find((t) => t.id === id) ?? grandTour;
}

export function findGoshuin(id?: string) {
  return goshuinList.find((g) => g.id === id) ?? goshuinList[0];
}

export function findFriend(id?: string) {
  return friends.find((f) => f.id === id) ?? friends[0];
}
