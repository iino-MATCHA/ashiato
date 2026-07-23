/**
 * Mock data for the MVP. Lets every screen work before Supabase is wired.
 * Each step carries real coordinates, up to 10 photos, and the transport
 * mode used to reach it — so the Mapbox route can be drawn per leg.
 * Replace with lib/api.ts (Supabase) later.
 */

export type TransportMode = 'car' | 'train' | 'shinkansen' | 'plane' | 'walk' | 'ferry';

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
  images: string[]; // up to 10; images[0] is used as the map pin icon
  transport: TransportMode; // how you arrived at this step from the previous one
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

// Consistent placeholder photos (no API key needed).
const photo = (seed: string, n = 10) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}${i}/600/600`);

export const goshuinList: Goshuin[] = [
  { id: 'g13', prefectureId: 13, prefectureName: 'Tokyo', name: 'Asakusa', rarity: 'normal', acquired: true, acquiredAt: '2026-03-14', kanji: '東' },
  { id: 'g14', prefectureId: 14, prefectureName: 'Kanagawa', name: 'Kamakura', rarity: 'limited', acquired: true, acquiredAt: '2026-03-15', kanji: '鎌' },
  { id: 'g26', prefectureId: 26, prefectureName: 'Kyoto', name: 'Fushimi', rarity: 'seasonal', acquired: true, acquiredAt: '2026-04-02', kanji: '京' },
  { id: 'g27', prefectureId: 27, prefectureName: 'Osaka', name: 'Namba', rarity: 'normal', acquired: true, acquiredAt: '2026-04-03', kanji: '浪' },
  { id: 'g01', prefectureId: 1, prefectureName: 'Hokkaido', name: 'Hakodate', rarity: 'normal', acquired: true, acquiredAt: '2026-05-20', kanji: '函' },
  { id: 'g47', prefectureId: 47, prefectureName: 'Okinawa', name: 'Shuri', rarity: 'collab', acquired: true, acquiredAt: '2026-06-11', kanji: '琉' },
  { id: 'g23', prefectureId: 23, prefectureName: 'Aichi', name: 'Atsuta', rarity: 'normal', acquired: true, acquiredAt: '2026-02-01', kanji: '熱' },
  { id: 'g40', prefectureId: 40, prefectureName: 'Fukuoka', name: 'Hakata', rarity: 'normal', acquired: true, acquiredAt: '2026-01-18', kanji: '博' },
  { id: 'g04', prefectureId: 4, prefectureName: 'Miyagi', name: 'Sendai', rarity: 'normal', acquired: false, kanji: '仙' },
  { id: 'g15', prefectureId: 15, prefectureName: 'Niigata', name: 'Echigo', rarity: 'normal', acquired: false, kanji: '越' },
  { id: 'g20', prefectureId: 20, prefectureName: 'Nagano', name: 'Zenkoji', rarity: 'limited', acquired: false, kanji: '信' },
  { id: 'g34', prefectureId: 34, prefectureName: 'Hiroshima', name: 'Miyajima', rarity: 'seasonal', acquired: false, kanji: '厳' },
];

export const acquiredCount = goshuinList.filter((g) => g.acquired).length;

export const trips: Trip[] = [
  {
    id: 't1',
    title: 'Kansai in Spring',
    subtitle: 'Kyoto · Osaka · Nara',
    status: 'completed',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
    prefectures: ['Kyoto', 'Osaka', 'Nara'],
    members: ['You', 'Miki'],
    distanceKm: 612,
    steps: [
      { id: 's1', title: 'Fushimi Inari Torii', placeName: 'Fushimi Inari Taisha', prefectureName: 'Kyoto', note: 'Climbed at dawn. The vermilion gates dissolved into the mist.', loggedAt: '2026-04-01', lng: 135.7727, lat: 34.9671, images: photo('fushimi'), transport: 'shinkansen' },
      { id: 's2', title: 'Along the Kamo River', placeName: 'Kamogawa', prefectureName: 'Kyoto', note: 'People sitting at even intervals. Evening light.', loggedAt: '2026-04-02', lng: 135.7681, lat: 35.0116, images: photo('kamo'), transport: 'walk' },
      { id: 's3', title: 'Dotonbori at Night', placeName: 'Dotonbori', prefectureName: 'Osaka', note: 'Neon and street food.', loggedAt: '2026-04-03', lng: 135.5013, lat: 34.6687, images: photo('dotonbori'), transport: 'train' },
      { id: 's4', title: 'Deer of Nara Park', placeName: 'Nara Park', prefectureName: 'Nara', note: 'Surprised by bowing deer.', loggedAt: '2026-04-04', lng: 135.8048, lat: 34.6851, images: photo('nara'), transport: 'train' },
    ],
  },
  {
    id: 't2',
    title: 'The Slopes of Hakodate',
    subtitle: 'Hokkaido',
    status: 'completed',
    startDate: '2026-05-19',
    endDate: '2026-05-22',
    prefectures: ['Hokkaido'],
    members: ['You'],
    distanceKm: 288,
    steps: [
      { id: 's5', title: 'Mt. Hakodate Night View', placeName: 'Mt. Hakodate', prefectureName: 'Hokkaido', note: 'Light filling a pinched landscape.', loggedAt: '2026-05-20', lng: 140.7040, lat: 41.7594, images: photo('hakodate'), transport: 'plane' },
      { id: 's6', title: 'Squid at the Morning Market', placeName: 'Hakodate Morning Market', prefectureName: 'Hokkaido', note: 'Translucent squid sashimi.', loggedAt: '2026-05-21', lng: 140.7260, lat: 41.7737, images: photo('market'), transport: 'walk' },
    ],
  },
  {
    id: 't3',
    title: 'Okinawa After the Rains',
    subtitle: 'Okinawa Main Island',
    status: 'ongoing',
    startDate: '2026-07-20',
    endDate: '2026-07-26',
    prefectures: ['Okinawa'],
    members: ['You', 'Riku', 'Sana'],
    distanceKm: 134,
    steps: [
      { id: 's7', title: 'Shuri Castle Walls', placeName: 'Shuri Castle', prefectureName: 'Okinawa', note: 'Curved stone masonry.', loggedAt: '2026-07-21', lng: 127.7195, lat: 26.2170, images: photo('shuri'), transport: 'plane' },
      { id: 's8', title: 'Makishi Public Market', placeName: 'Makishi Market', prefectureName: 'Okinawa', note: 'A flood of colour.', loggedAt: '2026-07-22', lng: 127.6790, lat: 26.2145, images: photo('makishi'), transport: 'car' },
    ],
  },
];

export const gallery: GalleryCard[] = [
  { id: 'c1', author: 'Miki', tripTitle: 'Kansai in Spring', type: 'route', ratio: '9:16', likes: 248, accent: '#C4432B' },
  { id: 'c2', author: 'Taro', tripTitle: 'Shikoku Pilgrimage', type: 'goshuin', ratio: '1:1', likes: 512, accent: '#2B4257' },
  { id: 'c3', author: 'Sana', tripTitle: 'Tohoku Local Lines', type: 'trip_summary', ratio: '9:16', likes: 87, accent: '#A98037' },
  { id: 'c4', author: 'Riku', tripTitle: 'Setouchi Art Islands', type: 'route', ratio: '1:1', likes: 193, accent: '#6C8199' },
  { id: 'c5', author: 'Yui', tripTitle: 'Crossing Kyushu', type: 'goshuin', ratio: '9:16', likes: 341, accent: '#C4432B' },
  { id: 'c6', author: 'Ken', tripTitle: 'Highlands of Shinshu', type: 'trip_summary', ratio: '1:1', likes: 129, accent: '#2B4257' },
];

export const trendingSpots = [
  { name: 'Fushimi Inari Taisha', prefecture: 'Kyoto', visits: 1240 },
  { name: 'Itsukushima Shrine', prefecture: 'Hiroshima', visits: 980 },
  { name: 'Zenko-ji Temple', prefecture: 'Nagano', visits: 742 },
  { name: 'Izumo Taisha', prefecture: 'Shimane', visits: 651 },
];

export const transportLabel: Record<TransportMode, string> = {
  car: 'Car',
  train: 'Train',
  shinkansen: 'Shinkansen',
  plane: 'Flight',
  walk: 'Walk',
  ferry: 'Ferry',
};

export function findTrip(id?: string) {
  return trips.find((t) => t.id === id) ?? trips[0];
}

export function findGoshuin(id?: string) {
  return goshuinList.find((g) => g.id === id) ?? goshuinList[0];
}
