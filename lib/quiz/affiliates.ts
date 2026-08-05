/**
 * 診断結果のあとに出す、体験・ツアーの枠。
 *
 * **診断中には一切出さない。** 結果を見たあとに「その県で何ができるか」を
 * 並べるところだけに置く（LPの作りとしてそう決めてある）。
 *
 * ---------------------------------------------------------------------------
 * 使い始めるのに必要なこと
 * ---------------------------------------------------------------------------
 * 1. 各社のアフィリエイトに登録して、下の PROVIDERS の `partner` を埋める。
 *    **空のままでも壊れない** ―― その場合はただの検索リンクになる（成果は付かない）。
 * 2. 個別の商品を出したいときは ITEMS にその県の分を足す。ITEMS にある県は
 *    そちらが優先され、無い県は検索リンクへ落ちる。
 *
 * `param` の名前（partner_id / aid など）は各社の管理画面で発行される
 * リンクの形に合わせて確認してから入れること。ここに書いてあるのは
 * 一般に使われている名前で、契約内容によって変わる。
 */
import type { Locale } from '@/lib/i18n';

export interface AffiliateProvider {
  id: string;
  /** 表示名 */
  name: string;
  /** 成果計測用のパラメータ。value を空にしておくと付けない */
  param: { key: string; value: string };
  /** 県名（英語）から検索URLを作る */
  search: (prefectureEn: string, locale: Locale) => string;
}

/** 言語ごとのパス。分からないものは空にしておく（英語版へ落ちる） */
const GYG_LOCALE: Record<Locale, string> = {
  en: '',
  ja: 'ja-jp/',
  ko: 'ko-kr/',
  'zh-Hans': 'zh-cn/',
  'zh-Hant': 'zh-tw/',
};

const KLOOK_LOCALE: Record<Locale, string> = {
  en: 'en-US/',
  ja: 'ja/',
  ko: 'ko/',
  'zh-Hans': 'zh-CN/',
  'zh-Hant': 'zh-TW/',
};

export const PROVIDERS: AffiliateProvider[] = [
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    param: { key: 'partner_id', value: '' },
    search: (pref, locale) =>
      `https://www.getyourguide.com/${GYG_LOCALE[locale] ?? ''}s/?q=${encodeURIComponent(pref)}`,
  },
  {
    id: 'klook',
    name: 'Klook',
    param: { key: 'aid', value: '' },
    search: (pref, locale) =>
      `https://www.klook.com/${KLOOK_LOCALE[locale] ?? 'en-US/'}search/?query=${encodeURIComponent(pref)}`,
  },
];

export interface AffiliateItem {
  /** PROVIDERS の id */
  provider: string;
  /** 商品名。訳を持つなら i18n のキーを titleKey に入れる */
  title?: string;
  titleKey?: string;
  /** 一言（任意） */
  note?: string;
  url: string;
  /** 横長の画像（任意）。無ければ文字だけのカードになる */
  image?: string;
  /** 「¥4,500〜」の 4500 の部分（任意） */
  priceFrom?: number;
}

/**
 * 県ごとの個別商品。
 * 例）
 *   20: [
 *     { provider: 'getyourguide', title: 'Snow Monkey Park day trip',
 *       url: 'https://www.getyourguide.com/...', priceFrom: 12000 },
 *   ],
 */
export const ITEMS: Record<number, AffiliateItem[]> = {};

export interface AffiliateCard {
  key: string;
  providerId: string;
  providerName: string;
  title: string;
  note?: string;
  url: string;
  image?: string;
  priceFrom?: number;
  /** 個別商品ではなく検索リンクか */
  isSearch: boolean;
}

/** 成果計測のパラメータを足す（空なら何もしない） */
function withParam(url: string, p: AffiliateProvider): string {
  if (!p.param.value) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${encodeURIComponent(p.param.key)}=${encodeURIComponent(p.param.value)}`;
}

/**
 * その県で出す枠を組む。
 * 個別商品があればそれを、無ければ各社の検索リンクを1枚ずつ。
 */
export function affiliatesFor(code: number, prefectureEn: string, locale: Locale): AffiliateCard[] {
  const curated = ITEMS[code] ?? [];
  if (curated.length) {
    return curated
      .map((it, i) => {
        const p = PROVIDERS.find((x) => x.id === it.provider);
        if (!p) return null;
        return {
          key: `${code}-${it.provider}-${i}`,
          providerId: p.id,
          providerName: p.name,
          title: it.titleKey ? it.titleKey : (it.title ?? p.name),
          note: it.note,
          url: withParam(it.url, p),
          image: it.image,
          priceFrom: it.priceFrom,
          isSearch: false,
        } as AffiliateCard;
      })
      .filter((x): x is AffiliateCard => !!x);
  }
  return PROVIDERS.map((p) => ({
    key: `${code}-${p.id}-search`,
    providerId: p.id,
    providerName: p.name,
    title: p.name,
    url: withParam(p.search(prefectureEn, locale), p),
    isSearch: true,
  }));
}

/** 提携先の設定が済んでいるか（管理用。表示の出し分けには使っていない） */
export const AFFILIATES_CONFIGURED = PROVIDERS.some((p) => !!p.param.value);
