# My Japan — 引き継ぎの段取り

前任者が会社を離れるにあたっての引き継ぎ手順。
**上から順に進めれば、権限・知識・残作業のすべてが引き継がれる**ように並べてある。
アプリの使い方・運営の日常作業は `docs/MANUAL.md` に分けてある。

最終更新: 2026-08-29

---

## 0. このアプリの全体像（5分で読む）

- **My Japan** — 日本を旅した記録を残し、都道府県ごとに御朱印を集め、
  旅を製本（御朱印帳）にできるアプリ。運営は株式会社MATCHA
- 本番: https://www.my-japan-matcha.com （Vercel。apexはwwwへ転送）
- リポジトリ: https://github.com/iino-MATCHA/ashiato
- 構成: Expo (React Native) + expo-router。**Web運用が前提**（ネイティブは未検証）。
  DBと認証とStorageは Supabase（project ref: `tcyclvfinguwudztfgsb`）
- 開発の決まりごと・ハマりどころは **`CLAUDE.md`**（リポジトリ直下）が正。
  AI（Claude）に開発を頼むときも、人が読むときも、まずこれ

---

## 1. 引き継ぎ初日にやること（権限の移管）

### 1-1. アカウントの持ち主を替える

| なに | どこ | やること |
|---|---|---|
| GitHub | `iino-MATCHA/ashiato` | 後任を admin に追加（org の場合は owner 移管） |
| Supabase | project `tcyclvfinguwudztfgsb` | Organization に後任を Owner で招待 → 前任を外す |
| Vercel | 本番のプロジェクト | 後任を招待 → 前任を外す。**環境変数一覧のスクリーンショットを先に取る** |
| ドメイン | my-japan-matcha.com | レジストラの管理権限を移す（DNSはVercel向け） |
| Stripe | テストアカウント | 後任をチームに追加。本番化は §4-1 |
| Mapbox | アクセストークン | トークンの持ち主アカウントを確認し、後任のアカウントで発行し直すのが安全 |

### 1-2. アプリ内の全権を後任に移す

全権（superadmin）は **`iino@matcha-jp.com` というメールアドレスから出ている**。
出どころはDB関数 `owner_email()`（migration 0033）。移すには:

1. 後任が普通にアプリへ登録する（メールアドレスでサインアップ）
2. Supabase の SQL Editor で1行:
   ```sql
   create or replace function owner_email()
   returns text language sql immutable as $$
     select '後任のアドレス@matcha-jp.com'::text;
   $$;
   ```
3. 管理画面（/admin → 運営）で後任のアドレスに「全権」を付けておく
   （owner_email と二重にしておくと、どちらかが欠けても締め出されない）

### 1-3. 秘密情報の場所（値はここに書かない）

| なに | どこにある |
|---|---|
| Supabase anon key / URL | Vercel の環境変数（`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`）。anon keyは公開前提の鍵 |
| Supabase service role key | Supabase Dashboard → Settings → API。**絶対にクライアントへ出さない** |
| Stripe 鍵（テスト） | Supabase の Edge Function secrets（`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`） |
| Mapbox トークン | Vercel の環境変数（`EXPO_PUBLIC_MAPBOX_TOKEN`） |
| デモ用アカウント | パスワードは全員 `ashiato-demo-2026`（CLAUDE.md「データ」節に一覧）。**引き継ぎ後に変える** |

**大原則: `EXPO_PUBLIC_*` はビルド成果物に焼き込まれて誰でも読める。**
秘密の鍵は必ず Supabase の secrets（Edge Functionから使う）に置く。

---

## 2. 初週にやること（残作業の消化）

### 2-1. SQLの貼り付け（5分・最優先）

DBの変更はすべて `supabase/migrations/` にファイルとして残っており、
SQL Editor に**手で貼る**運用（サービスキーを環境に置かない方針のため）。
どのファイルも**二度貼りしても壊れない**ように書いてある。

2026-08-29 時点の本番の適用状況（実測済み）:

- ✅ 0001〜0032 適用済み（記事721件・場所の札197件・スポンサーカード表も確認）
- ⬜ **0033_admin_by_email.sql が未適用**。これを貼るとメールアドレスでの
  管理者の付け外しと、`iino@matcha-jp.com` の全権が有効になる（§1-2の前提）

### 2-2. Stripe をテストカードで1件通す（30分）

実装は**完成してデプロイ済み**（`stripe-checkout` / `stripe-webhook`、DB側は 0020）。
未確認なのは通しの動作だけ。

1. Stripe Dashboard（テストモード）→ Webhook に
   `https://tcyclvfinguwudztfgsb.supabase.co/functions/v1/stripe-webhook` が
   登録されているか確認（イベント: `checkout.session.completed`）
2. アプリで旅を製本 → かご → 購入手続き → 支払い（Stripeのページに飛ぶ）
3. テストカード `4242 4242 4242 4242` で支払う
4. 注文が `pending` → `paid` に変わること、管理画面の通知に
   `order_paid` が出ることを確認

うまくいかないときは Supabase Dashboard → Edge Functions → Logs を見る。
入金の確定は webhook **だけ**が行う（戻りURLは信じない設計）。

### 2-3. 掃除（10分）

- Supabase Auth に動作検証で作ったテストユーザーが残っている。削除する:
  `claude-fa-1@my-japan-demo.local` / `claude-fb-1@my-japan-demo.local` /
  `claude-test-0812@my-japan-demo.local`
- デモ用アカウントのパスワード `ashiato-demo-2026` を変える（CLAUDE.mdにも反映）

---

## 3. 知っておくべき設計判断（なぜそうなっているか）

- **DBへの書き込みはSQLの手貼り**。PAT・サービスキーを開発環境に置かない
  （「環境変数は全員に見える」前提）。AIに開発させるときも、AIはSQLファイルを
  作って渡すだけで、貼るのは人
- **金額はクライアントから受け取らない**。`checkout_cart()` がDBの単価から
  組み直す。Stripe に渡す金額も注文IDからDBを引いて組む
- **かごに入れた時点で全ページを画像として焼く**。あとから旅を編集しても
  届く本は変わらない。印刷所に渡すのは `order_items.page_urls`
- **ゲストには「見せるは素通し、保存するだけ止める」**。RLSは触らず、
  画面側で SignInPrompt を出す
- **記事の本文の一部は Wikipedia 由来（CC BY-SA 4.0）**。172件の本文が
  Wikipediaの導入節（DBの `text_attribution` 列で見分けられる）。
  現在、画面の出典表示はオーナー判断で消してある。**CC BY-SA は表示が
  条件のライセンスなので、公開を広げる前に法務に確認するか、
  出典行を戻す（ArticleModal.tsx に数行）か、自前の紹介文に差し替える**
- スポンサーカードは「PR」表記なしで運用（オーナー判断）。
  景表法のステマ規制に関わるので、これも法務確認を推奨

---

## 4. そのうちやること（残件と、着手の順序のおすすめ）

| 優先 | なに | いまの状態 | 次の一歩 |
|---|---|---|---|
| 高 | Stripe 本番化 | テスト鍵で動く | 本番鍵を Supabase secrets に入れ替え、本番Webhookを登録、少額で実決済を1件 |
| 高 | 印刷所への入稿 | `order_items.page_urls` に全ページのURLが揃う。渡す先が未定 | 印刷所を決め、管理画面の注文詳細からURL一覧を渡す運用を作る |
| 中 | 記事→アプリの導線 | 未着手。集客の本体 | MATCHA記事側に「My Japanに保存」を埋める。アプリ側の受け口は `/explore` と旅作成 |
| 中 | ネイティブビルド | 未検証（Web運用中） | expo prebuild → 実機で、特にSNS共有（expo-sharing + view-shot）を確認 |
| 低 | 「MATCHA 200」制覇軸 | 構想のみ | `tourism_area_master`（200件）を制覇バッジ化する案 |
| 低 | 診断の希少県 | 全47県が「出うる」ことは保証済み | 素点が0..3で頭打ちのため一部の県は稀。軸を0..5に広げると分布が良くなる |

---

## 5. 開発の再開のしかた（後任向け）

```bash
git clone https://github.com/iino-MATCHA/ashiato && cd ashiato
npm install
# .env に2行（値はVercelの環境変数からコピー）
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
npx expo start --web
```

- デプロイは Vercel が main ブランチを見て自動
- **AIに開発を頼むときは CLAUDE.md がそのまま指示書になる**。
  「目で確認してから『できました』と言うこと」「決まっていることを勝手に
  変えない」を徹底させる
- DBを変えるときは migration ファイルを書かせて、自分で SQL Editor に貼る

---

## 6. 資料の地図

| 知りたいこと | どこ |
|---|---|
| 開発の決まり・ハマりどころ | `CLAUDE.md` |
| アプリと管理画面の使い方 | `docs/MANUAL.md` |
| 製本（PDF）の設計思想 | `docs/photobook.md` |
| DBの変更履歴 | `supabase/migrations/0001〜0033` |
| 記事の取り込み道具 | `scripts/import-matcha-articles.mjs` ほか（MANUAL §5） |
