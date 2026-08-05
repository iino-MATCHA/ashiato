/**
 * 診断結果に出す、都道府県ごとの代表写真（47件そろっている）。
 *
 * - すべて Wikimedia Commons。**実際に叩いて 200 が返る幅だけを使う**
 *   （Commons は任意の幅を配信するとは限らない。原寸より大きい幅は拒否される
 *   ので、原寸が 960px 未満のものは /thumb/ を挟まない素のURLになっている）
 * - 28件は LP（lib/lpPhotos.ts）と同じ写真。残り19件はここで足した
 * - 差し替えるときは、URLを実際に開いて 200 と縦横比（横長）を確かめること。
 *   結果カードは 16:10 で切るので、縦長の写真は上下が切れる
 */
export interface QuizPhoto {
  /** 写っている場所の名前（結果カードの隅に出す） */
  title: string;
  url: string;
}

const C = 'https://upload.wikimedia.org/wikipedia/commons';

export const PREFECTURE_PHOTO: Record<number, QuizPhoto> = {
  1: { title: 'Farm Tomita', url: `${C}/b/b6/Sign_of_Farm_Tomita.jpg` },
  2: { title: 'Hirosaki Castle', url: `${C}/f/f3/Hirosaki-castle_Aomori_with_Sakura_blossoms.jpg` },
  3: { title: 'Chuson-ji', url: `${C}/thumb/9/9b/230728_Chusonji_Hiraizumi_Iwate_pref_Japan01s3.jpg/960px-230728_Chusonji_Hiraizumi_Iwate_pref_Japan01s3.jpg` },
  4: { title: 'Sendai Castle', url: `${C}/f/ff/SendaiJoOtemonSumiYagura2003-11.jpg` },
  5: { title: 'Lake Tazawa', url: `${C}/thumb/4/43/Lake_Tazawa_and_Kansa-g%C5%AB_20210213.jpg/960px-Lake_Tazawa_and_Kansa-g%C5%AB_20210213.jpg` },
  6: { title: 'Yamadera', url: `${C}/thumb/3/3a/Risshaku-ji_konponchudo.jpg/960px-Risshaku-ji_konponchudo.jpg` },
  7: { title: 'Ouchi-juku', url: `${C}/thumb/e/e3/Ouchijuku_2006-11-12.jpg/960px-Ouchijuku_2006-11-12.jpg` },
  8: { title: 'Hitachi Seaside Park', url: `${C}/thumb/f/ff/Miharashino_Oka_%28Hitachi_Seaside_Park%29_07.jpg/960px-Miharashino_Oka_%28Hitachi_Seaside_Park%29_07.jpg` },
  9: { title: 'Nikko Toshogu', url: `${C}/thumb/1/1b/Nikko_Toshogu_Yomeimon_M3249.jpg/960px-Nikko_Toshogu_Yomeimon_M3249.jpg` },
  10: { title: 'Kusatsu Onsen', url: `${C}/thumb/6/69/251128_Yubatake%2C_Kusatsu_14.jpg/960px-251128_Yubatake%2C_Kusatsu_14.jpg` },
  11: { title: 'Kawagoe', url: `${C}/thumb/7/74/Kurazukuri_Street_in_Little_Edo.jpg/960px-Kurazukuri_Street_in_Little_Edo.jpg` },
  12: { title: 'Inubosaki', url: `${C}/thumb/7/73/Inubosaki_Lighthouse_01.JPG/960px-Inubosaki_Lighthouse_01.JPG` },
  13: { title: 'Senso-ji', url: `${C}/thumb/4/43/Sensoji_2023.jpg/960px-Sensoji_2023.jpg` },
  14: { title: 'Lake Ashi', url: `${C}/thumb/f/f9/Lake_Ashi_Aerial_photograph.1976.jpg/960px-Lake_Ashi_Aerial_photograph.1976.jpg` },
  15: { title: 'Bandai Bridge', url: `${C}/thumb/e/ec/Bandai_burdge.JPG/960px-Bandai_burdge.JPG` },
  16: { title: 'Amaharashi Coast', url: `${C}/thumb/e/e1/Amaharashi_Coast_20150122.JPG/960px-Amaharashi_Coast_20150122.JPG` },
  17: { title: 'Kenroku-en', url: `${C}/thumb/f/fc/Kenrokuen10-r.jpg/960px-Kenrokuen10-r.jpg` },
  18: { title: 'Tojinbo', url: `${C}/thumb/b/b2/Tojinbo_cliffs%2C_Fukui_Prefecture%3B_September_2019_%2801%29.jpg/960px-Tojinbo_cliffs%2C_Fukui_Prefecture%3B_September_2019_%2801%29.jpg` },
  19: { title: 'Chureito Pagoda', url: `${C}/thumb/9/9e/Chureito_Pagoda_and_Mount_Fuji.jpg/960px-Chureito_Pagoda_and_Mount_Fuji.jpg` },
  20: { title: 'Kamikochi', url: `${C}/thumb/7/7a/%E7%A7%8B%E3%81%AE%E4%B8%8A%E9%AB%98%E5%9C%B0_%28Kamikochi_in_autumn%29_24_Oct%2C_2011_-_panoramio.jpg/960px-%E7%A7%8B%E3%81%AE%E4%B8%8A%E9%AB%98%E5%9C%B0_%28Kamikochi_in_autumn%29_24_Oct%2C_2011_-_panoramio.jpg` },
  21: { title: 'Shirakawa-go', url: `${C}/thumb/a/a2/Shirakawa-go_%282017-07-22%29.jpg/960px-Shirakawa-go_%282017-07-22%29.jpg` },
  22: { title: 'Miho no Matsubara', url: `${C}/thumb/3/3d/Mount_Fuji_and_Miho_no_Matsubara_20151116.jpg/960px-Mount_Fuji_and_Miho_no_Matsubara_20151116.jpg` },
  23: { title: 'Nagoya Castle', url: `${C}/thumb/4/45/Nagoya_Castle%28Larger%29.jpg/960px-Nagoya_Castle%28Larger%29.jpg` },
  24: { title: 'Meoto Iwa', url: `${C}/thumb/3/33/Meotoiwa_Rocks_of_Futamigaura_Beach_2.JPG/960px-Meotoiwa_Rocks_of_Futamigaura_Beach_2.JPG` },
  25: { title: 'Hikone Castle', url: `${C}/thumb/a/ab/Hikone_castle5537.JPG/960px-Hikone_castle5537.JPG` },
  26: { title: 'Fushimi Inari', url: `${C}/thumb/6/64/Fushimiinari-taisha%2C_gehaiden-1.jpg/960px-Fushimiinari-taisha%2C_gehaiden-1.jpg` },
  27: { title: 'Dotonbori', url: `${C}/thumb/f/f4/Osaka_Dotonbori_Ebisu_Bridge.jpg/960px-Osaka_Dotonbori_Ebisu_Bridge.jpg` },
  28: { title: 'Himeji Castle', url: `${C}/thumb/c/c1/Himeji_castle_in_may_2015.jpg/960px-Himeji_castle_in_may_2015.jpg` },
  29: { title: 'Todai-ji', url: `${C}/thumb/a/a7/%E6%9D%B1%E5%A4%A7%E5%AF%BA_%E5%A4%A7%E4%BB%8F%E6%AE%BF%EF%BC%882024%E5%B9%B4%EF%BC%89.jpg/960px-%E6%9D%B1%E5%A4%A7%E5%AF%BA_%E5%A4%A7%E4%BB%8F%E6%AE%BF%EF%BC%882024%E5%B9%B4%EF%BC%89.jpg` },
  30: { title: 'Nachi Falls', url: `${C}/thumb/0/03/Nachi_Falls_201908-1.jpg/960px-Nachi_Falls_201908-1.jpg` },
  31: { title: 'Tottori Sand Dunes', url: `${C}/thumb/e/e1/Tottori-Sakyu_Tottori_Japan.JPG/960px-Tottori-Sakyu_Tottori_Japan.JPG` },
  32: { title: 'Izumo Taisha', url: `${C}/thumb/e/e6/Izumo-taisha14bs4592.jpg/960px-Izumo-taisha14bs4592.jpg` },
  33: { title: 'Kurashiki', url: `${C}/thumb/c/cb/Kurasiki_morning01.JPG/960px-Kurasiki_morning01.JPG` },
  34: { title: 'Hiroshima Peace Park', url: `${C}/thumb/7/77/Genbaku_Dome04-r.JPG/960px-Genbaku_Dome04-r.JPG` },
  // 原寸が 960px 未満なので /thumb/ を挟まない（挟むと拡大要求になって落ちる）
  35: { title: 'Kintaikyo', url: `${C}/4/4f/IwakuniKintaikyo.jpg` },
  36: { title: 'Iya Valley', url: `${C}/thumb/0/00/Vine_bridge_in_Iya_Valley_0688.jpg/960px-Vine_bridge_in_Iya_Valley_0688.jpg` },
  37: { title: 'Ritsurin Garden', url: `${C}/thumb/0/0b/Ritsurin.JPG/960px-Ritsurin.JPG` },
  38: { title: 'Dogo Onsen', url: `${C}/thumb/8/83/D%C5%8Dgo_Onsen.jpg/960px-D%C5%8Dgo_Onsen.jpg` },
  39: { title: 'Katsurahama', url: 'https://upload.wikimedia.org/wikipedia/ja/thumb/7/79/Kochi_Katsurahama_Daytime_2.JPG/960px-Kochi_Katsurahama_Daytime_2.JPG' },
  40: { title: 'Dazaifu Tenmangu', url: `${C}/thumb/8/8b/20100719_Dazaifu_Tenmangu_Shrine_3328.jpg/960px-20100719_Dazaifu_Tenmangu_Shrine_3328.jpg` },
  41: { title: 'Yutoku Inari', url: `${C}/thumb/9/95/Yutoku_inari_Shrine-b.jpg/960px-Yutoku_inari_Shrine-b.jpg` },
  42: { title: 'Glover Garden', url: `${C}/a/a3/Nagasaki_glover_16835805_886671322b_o_d.jpg` },
  43: { title: 'Kumamoto Castle', url: `${C}/thumb/f/ff/Kumamoto_Castle_Keep_Tower_20221022-3.jpg/960px-Kumamoto_Castle_Keep_Tower_20221022-3.jpg` },
  44: { title: 'Yufuin', url: `${C}/thumb/f/f5/Yufuin_Onsen_-Mus%C5%8Den_02.jpg/960px-Yufuin_Onsen_-Mus%C5%8Den_02.jpg` },
  45: { title: 'Takachiho Gorge', url: `${C}/thumb/2/28/Takachiho-kyo%28Gorge%29_-_River_-_%E5%B7%9D.jpg/960px-Takachiho-kyo%28Gorge%29_-_River_-_%E5%B7%9D.jpg` },
  46: { title: 'Sakurajima', url: `${C}/thumb/5/5c/Sakurajima55.jpg/960px-Sakurajima55.jpg` },
  47: { title: 'Kabira Bay', url: `${C}/thumb/9/90/Kabira-Bay-Kabira-park-2019.jpg/960px-Kabira-Bay-Kabira-park-2019.jpg` },
};

export function photoFor(code: number): QuizPhoto | null {
  return PREFECTURE_PHOTO[code] ?? null;
}
