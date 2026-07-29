/**
 * Web では使わない。カードは Canvas で 1080px に描き直す方が綺麗なので、
 * 画面の写し取りはしない（呼び出し側が null を見て描き直しに回る）。
 */
export async function captureCard(_ref?: any): Promise<string | null> {
  return null;
}
