-- 貼り付けが通るかの確認用。福島の3件だけ。

insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/jp/24267', 'ja', 7, '福島市の気温は？年間平均と月ごとの気温、ベストな服装を紹介', '福島市の気温は季節ごとに大きく変化します。本記事では、過去のデータをもとに1月から12月までの月ごとの気温と、それぞれの時期に適した服装をまとめています。旅行や外出の際の参考にぜひご活用ください。年間の気候を把握して快適に過ごしましょう。

福島県は、「会津地方」「中通り」「浜通り」の3つに分かれており、福島市が属する中通り地方は、盆地特有の気候が特徴です。

日本海側と太平洋側の気候の中間にあたる福島市は、夏は湿度が高く蒸し暑くなり、冬は冷たい風が吹き、雪も降る寒冷な環境になります。

2024年のデータによると、最も寒い日は-4.4℃、最も暑い日は36.6℃を記録しており、年間平均気温は15.3℃です。', '["https://resources.matcha-jp.com/resize/720x2000/2025/02/26-225917.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/26-225918.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/26-225919.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/26-225920.webp"]'::jsonb, '2025-02-26'::timestamptz),
  ('https://matcha-jp.com/jp/24299', 'ja', 7, '【2025】福島・鶴ヶ城公園の桜の見頃は？ライトアップやイベント情報まとめ', '福島県の会津若松にある鶴ヶ城公園は「日本さくら名所100選」に選ばれた花見の名所。例年4月上旬から5月上旬に約1000本の桜が咲き誇ります。夜桜ライトアップや「鶴ヶ城さくらまつり」といったイベントなどの情報をお伝えします。

会津若松市の象徴、鶴ヶ城（若松城）は、春になると約1000本もの桜が城を取り囲み、壮観な景色を生み出します。

その美しさから鶴ヶ城公園は「日本さくら名所100選」にも選ばれており、会津を代表する桜の名所となっています。

本記事では、2025年最新の情報に基づき、鶴ヶ城公園の桜の見頃やイベントや楽しみ方をご紹介します。', '["https://resources.matcha-jp.com/resize/720x2000/2025/02/27-226232.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/27-226234.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/27-226233.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/26-254095.webp"]'::jsonb, '2025-02-27'::timestamptz),
  ('https://matcha-jp.com/jp/24217', 'ja', 7, '日本三大桜のひとつ・三春滝桜の見どころや開花時期は？福島の花見名所に行こう', '三春滝桜は、福島県を代表する桜の名所です。日本三大桜のひとつであり、推定樹齢1000年以上のベニシダレザクラを鑑賞できます。歴史も感じられるので、ぜひ訪れてみてください。

日本三大桜のひとつとして名高い三春滝桜は、推定樹齢1000年以上のベニシダレザクラが咲き誇る絶景スポットです。

2025年も、例年通り4月中旬に見頃を迎えるこの桜は、圧倒的な開花の美しさで訪れる人々を魅了します。福島県内で桜の名所を探している方は、ぜひこの歴史ある桜の魅力に触れてみてください。

三春滝桜は、日本三大桜のひとつとして名高く、福島県にその存在を刻む歴史ある桜です。推定樹齢は1000年以上とされ、ベニシダレザクラ（エドヒガン系）の代表例として、古くからその美しさと威厳を誇示しています。', '["https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225359.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225360.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225361.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225362.webp"]'::jsonb, '2025-02-20'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;
