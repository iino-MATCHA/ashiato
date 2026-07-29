/**
 * 軽量なリフレッシュ通知。データを書き換えた画面が bump() を呼ぶと、
 * その channel を購読しているフックが再取得する（リロード不要）。
 */
type Channel = 'visited' | 'trips' | 'cart' | 'orders';

const versions: Record<Channel, number> = { visited: 0, trips: 0, cart: 0, orders: 0 };
const listeners: Record<Channel, Set<() => void>> = {
  visited: new Set(), trips: new Set(), cart: new Set(), orders: new Set(),
};

export function bump(channel: Channel) {
  versions[channel] += 1;
  listeners[channel].forEach((l) => l());
}

export function getVersion(channel: Channel): number {
  return versions[channel];
}

export function subscribe(channel: Channel, fn: () => void): () => void {
  listeners[channel].add(fn);
  return () => listeners[channel].delete(fn);
}
