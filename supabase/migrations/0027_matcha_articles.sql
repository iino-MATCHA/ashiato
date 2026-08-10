-- MATCHAの記事（県カードのアプリ内ポップアップ用）。
--
-- 記事の本文をアプリ内で「味見」させ、続きを読む人だけをMATCHAへ送る。
-- 本文はブラウザから matcha-jp.com を読めない（CORS）ので、
-- 社内のCMS・記事フィードからこのテーブルへ取り込んで使う（許可取得済み）。
--
-- body は本文の抜粋。段落は空行（\n\n）で区切って入れる。
-- 全文は置かない ―― 続きはMATCHAで読ませる導線が目的のため。
-- images は本文に添える写真のURL配列（0〜4枚を想定）。

create table if not exists matcha_articles (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  -- アプリの表示言語と同じ札。MATCHA側の言語（jp/en/ko/cn/tw）は取り込み時に変換する
  lang text not null check (lang in ('en', 'ja', 'ko', 'zh-Hans', 'zh-Hant')),
  prefecture_code int not null check (prefecture_code between 1 and 47),
  title text not null,
  -- 本文の抜粋（段落は空行区切り）。要約を新しく作らず、記事の導入部を使う
  body text not null default '',
  -- 本文に添える写真（URLの配列）
  images jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (url, lang)
);

create index if not exists matcha_articles_pref_lang
  on matcha_articles (prefecture_code, lang, published_at desc);

alter table matcha_articles enable row level security;

-- 読みは誰でも（ゲストにも県カードを見せる）。書き込みポリシーは作らない ――
-- 取り込みは service role（バッチ / 管理コンソールのEdge Function）から行う
create policy "matcha_articles_read_all"
  on matcha_articles for select
  using (true);
