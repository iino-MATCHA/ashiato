-- 記事の本文を、その場所の「概要」に差し替えられるようにする。
--
-- 県カードの「◯◯県で行くなら」は行き先の一覧なので、押した先には
-- **その場所がどんなところか**が出てほしい。ところがMATCHAの記事は
-- 「【2025】福島・鶴ヶ城公園の桜の見頃は？ライトアップやイベント情報まとめ」
-- のような一覧・季節・イベントものが多く、初めての人には土地が伝わらない
-- （指摘を受けた）。
--
-- そこで取り込みのときに、題から主役のスポットを Wikipedia で特定し、
--   ・札(place)と題を、そのスポットの名前にする（会津若松 → 若松城）
--   ・一覧・季節ものの本文だけ、Wikipedia の概要文に差し替える
-- という手当てをする（scripts/enrich-article-spots.mjs）。
-- 単一スポットの紹介記事（「日光東照宮の歴史・見どころ」）はMATCHAのまま。
--
-- **写真はどちらの場合もMATCHAのもの。** 文だけ出所が変わることがあるので、
-- 差し替えたものには出典を持たせ、ポップアップの下に小さく出す。
-- MATCHAの本文をそのまま使っている記事では null（何も出さない）。

alter table matcha_articles
  add column if not exists text_attribution text,
  add column if not exists text_attribution_url text;

comment on column matcha_articles.text_attribution is
  '本文の出典。MATCHAの本文をそのまま使っているときは null';
