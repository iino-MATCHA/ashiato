/**
 * 旅の入口。/goshuin と同じ画面で、ボトムシートの中身だけが違う。
 * 実体は components/home/HomeScreen。
 */
import { HomeScreen } from '@/components/home/HomeScreen';

export default function Home() {
  return <HomeScreen initialView="map" />;
}
