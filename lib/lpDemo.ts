/**
 * LPのデモ地図に流す旅。実在する3地点の緯度経度で、
 * 地図・ルート線・ピンの描画は /trip と同じ TripMap がそのまま担当する。
 * 経路は Mapbox Directions が返す実際の道路に沿う（アプリ本体と同一の処理）。
 */
import type { Step } from './mock';

export const LP_DEMO_STEPS: Step[] = [
  {
    id: 'lp-1',
    title: 'Tokyo Station',
    placeName: 'Chiyoda',
    prefectureName: 'Tokyo',
    note: '',
    loggedAt: '2026-05-02',
    lat: 35.6812,
    lng: 139.7671,
    images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Tokyo-STA_Marunouchi-Entrance_2023.jpg/960px-Tokyo-STA_Marunouchi-Entrance_2023.jpg'],
    transport: 'shinkansen',
  },
  {
    id: 'lp-2',
    title: 'Fushimi Inari',
    placeName: 'Kyoto',
    prefectureName: 'Kyoto',
    note: '',
    loggedAt: '2026-05-04',
    lat: 34.9671,
    lng: 135.7727,
    images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Fushimiinari-taisha%2C_gehaiden-1.jpg/960px-Fushimiinari-taisha%2C_gehaiden-1.jpg'],
    transport: 'shinkansen',
  },
  {
    id: 'lp-3',
    title: 'Hiroshima Peace Park',
    placeName: 'Hiroshima',
    prefectureName: 'Hiroshima',
    note: '',
    loggedAt: '2026-05-06',
    lat: 34.3955,
    lng: 132.4536,
    images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Genbaku_Dome04-r.JPG/960px-Genbaku_Dome04-r.JPG'],
    transport: 'shinkansen',
  },
];

/**
 * ジャーナルの見本を描くための旅。LP_DEMO_STEPS をそのまま束ねただけで、
 * 製本ページ(/trip/[id]/bind)と同じ planBook / renderPage に通す。
 */
export const LP_DEMO_TRIP = {
  id: 'lp-demo',
  title: 'Tokyo to the South',
  subtitle: 'Tokyo · Kyoto · Hiroshima',
  status: 'completed' as const,
  startDate: '2026-05-02',
  endDate: '2026-05-06',
  prefectures: ['Tokyo', 'Kyoto', 'Hiroshima'],
  members: ['Traveller'],
  distanceKm: 894,
  steps: LP_DEMO_STEPS,
};
