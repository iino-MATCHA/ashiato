-- 県のカードまわりを、コードではなくDBで持てるようにする。
--
-- 1) matcha_articles.place
--    「◯◯県で行くなら」の段は、記事の題ではなく行き先の名前で並べる。
--    「福島市の気温は？年間平均と…」ではなく「会津若松」。
--    MATCHAの記事ページは記事ごとの地名を持っていないので、取り込みのときに
--    観光エリア(tourism_area_master) → 市区町村(municipalities_master) の順で
--    題と本文を照合して決める（scripts/build-article-sql.mjs）。
--    決まらない記事もあるので null を許す。
--
-- 2) prefecture_texts
--    県の紹介文。これまで lib/quiz/descriptions.ts に47県×5言語を直書きして
--    いたが、**消したり増やしたりできるようにDBへ移す**。
--    アプリはDBを先に見て、行が無いときだけ手元の文にさがる ――
--    取り込み前でも県のカードが空にならないようにするため。

alter table matcha_articles
  add column if not exists place text;

create index if not exists matcha_articles_place
  on matcha_articles (prefecture_code, lang, place);

create table if not exists prefecture_texts (
  prefecture_code int not null check (prefecture_code between 1 and 47),
  -- アプリの表示言語と同じ札（lib/i18n の Locale）
  lang text not null check (lang in ('en', 'ja', 'ko', 'zh-Hans', 'zh-Hant')),
  -- 4〜5文の散文。どんな場所か・何があるか・いつが良いか・何が旨いか
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (prefecture_code, lang)
);

alter table prefecture_texts enable row level security;

-- 読みは誰でも（ゲストにも県のカードを見せる）。
-- 書き込みポリシーは作らない ―― 更新は service role か SQL から
create policy "prefecture_texts_read_all"
  on prefecture_texts for select
  using (true);
