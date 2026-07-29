-- =====================================================================
-- 足跡 → My Japan — 0017: 使っていないテーブルを片付ける
-- =====================================================================
-- 0001/0002 で先に器だけ作ったが、実装が別の形に落ち着いて使われなかったもの。
-- 全て0行、コードからの参照なし、他テーブルからの外部キーもなし、
-- RPCもポリシーも触っていないことを確認して落とす。
--
--   ugc_cards        シェアカードは端末で描いて書き出すだけで、保存していない
--   goshuin_masters  「県ごとに複数の御朱印」をやめ、1県=1御朱印に落ち着いた
--   user_goshuin     同上。訪問記録(logs / user_prefectures)から導く形になった
--   gifts            贈り物として送る機能は作っていない
--   reports          通報機能は作っていない
--
-- 御朱印の現在の実装:
--   訪問した都道府県 = logs.prefecture_code ∪ user_prefectures
--   → RPC my_visited_prefectures が唯一の入口。masterテーブルは要らない
--
-- 消える型も一緒に落とす。トリガ(set_updated_at)は他のテーブルでも使うので残す。
-- =====================================================================

drop table if exists ugc_cards cascade;
drop table if exists user_goshuin cascade;
drop table if exists goshuin_masters cascade;
drop table if exists gifts cascade;
drop table if exists reports cascade;

-- これらのテーブルだけが使っていた列挙型
drop type if exists ugc_card_type;
drop type if exists ugc_aspect_ratio;
drop type if exists goshuin_rarity;
drop type if exists gift_status;
drop type if exists report_status;
drop type if exists report_target;
