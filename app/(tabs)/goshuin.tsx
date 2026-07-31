/**
 * 御朱印の入口。/map と同じ画面で、ボトムシートの中身だけが違う。
 * 上の日本地図・ゲージ・ランクは両方で共通。
 */
import { HomeScreen } from '@/components/home/HomeScreen';

export default function GoshuinBook() {
  return <HomeScreen initialView="goshuin" />;
}
