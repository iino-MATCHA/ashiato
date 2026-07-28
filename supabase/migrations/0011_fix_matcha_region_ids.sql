-- =====================================================================
-- 足跡 (Ashiato) — 0011: MATCHAリンクの region ID を修正
-- =====================================================================
-- 0008 では region=<JISコード> のまま保存していたが、MATCHA の都道府県
-- ページは region = JISコード + 100（101=北海道 … 147=沖縄）。
-- 旧URLは全く別の県へ301される（例: region=13 → 128=兵庫県）。
-- 全47IDの og:title を実測して対応を確認済み。
-- =====================================================================

update tourism_area_master
set matcha_url = 'https://matcha-jp.com/jp/list?region=' || (prefecture_code + 100) || '&category=all'
where prefecture_code is not null;
