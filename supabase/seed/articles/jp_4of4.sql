insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at, place, text_attribution, text_attribution_url)
values
(E'https://matcha-jp.com/jp/24195', E'ja', 47, E'沖縄旅行のモデルコース！2泊3日で回れるコースを紹介', E'沖縄には観光地が数多くありますが、多すぎてどこに行こうか迷う人もいるでしょう。本記事では、2泊3日で沖縄旅行ができるモデルコースをご紹介します。各スポットの特徴もお伝えするので、参考にしてくださいね。\n\n沖縄の観光名所は本当に数多くありますが、だからこそどこに行こうか迷う人もいるのではないでしょうか？\n\nまた、車がないと移動しづらい環境のため、効率よく回る方法も知りたいところですよね。\n\nそこでこの記事では、2泊3日という短い期間でも効率よく観光できるモデルコースをご紹介します。', E'["https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225246.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225247.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225248.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225249.webp"]'::jsonb, E'2025-02-20'::timestamptz, null, null, null),
(E'https://matcha-jp.com/jp/23227', E'ja', 47, E'宮古島', E'宮古島（みやこじま、宮古語:みゃーく/myāku/、沖縄語:なーく/nāku/）は、沖縄県宮古島市に属する宮古列島の島の一つである。\n\n宮古島市役所などがある平良（ひらら）地区などが所在し、宮古島市および宮古列島の中心となっている。沖縄本島から宮古海峡を経て南西に約290 km、東経125度、北緯24度に位置し、太平洋と東シナ海の間にある。\n\n93 km2 である。近隣には、池間島、大神島、伊良部島、下地島、来間島がある。', E'["https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215063.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215064.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215065.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215066.webp"]'::jsonb, E'2024-12-13'::timestamptz, E'宮古島', E'Wikipedia (CC BY-SA 4.0)', E'https://ja.wikipedia.org/wiki/%E5%AE%AE%E5%8F%A4%E5%B3%B6'),
(E'https://matcha-jp.com/jp/6875', E'ja', 47, E'【2026】沖縄の開花予報と桜まつり5選！日本一早く咲く桜を楽しもう', E'一年中温暖な気候で、きれいなビーチが多く、リゾート地として人気のある沖縄県。けれど魅力はそれだけではありません。日本一桜が早く咲くのです！ 沖縄の桜は1月中旬ごろから咲き始め、1月下旬には見ごろを迎えます。そんな沖縄の桜を見にいきたくなる、桜まつりを5つ紹介します。\n\n九州よりさらに南西にある、沖縄県。1年を通して温暖な気候で、きれいなビーチが多く、マリンアクティビティが盛んなことでも有名です。日本人だけでなく、訪日観光客からも人気のリゾート地。\n\n1つ目は、桜の開花が日本一早いこと！ 暖かい気候の沖縄では、桜が1月中旬ごろから咲き始めるため、日本で1番早く桜が咲くのです。\n\n2つ目は、桜の種類が本州とは異なること。本州では、ソメイヨシノがよくみられますが、沖縄はカンヒザクラが多いのです。カンヒザクラはソメイヨシノに比べ、濃いピンク色で下向きに咲きます。', E'["https://resources.matcha-jp.com/resize/720x2000/2018/12/14-68105.webp","https://resources.matcha-jp.com/resize/720x2000/2018/12/14-68107.webp","https://resources.matcha-jp.com/resize/720x2000/2018/12/07-67657.webp","https://resources.matcha-jp.com/resize/720x2000/2018/12/07-67658.webp"]'::jsonb, E'2018-12-06'::timestamptz, null, null, null)
on conflict (url, lang) do update set
prefecture_code = excluded.prefecture_code,
title = excluded.title,
body = excluded.body,
images = excluded.images,
published_at = excluded.published_at,
place = excluded.place,
text_attribution = excluded.text_attribution,
text_attribution_url = excluded.text_attribution_url;
