# My Japan — 引き継ぎの段取り

前任者が会社を離れるにあたっての引き継ぎ手順。
**上から順に進めれば、権限・知識・残作業のすべてが引き継がれる**ように並べてある。
アプリの使い方・運営の日常作業は `docs/MANUAL.md` に分けてある。

最終更新: 2026-08-29（印刷版の販売取りやめを反映）

---

## 0. このアプリの全体像（5分で読む）

- **My Japan** — 日本を旅した記録を残し、都道府県ごとに御朱印を集め、
  旅をジャーナル（PDF）にできるアプリ。運営は株式会社MATCHA。
  **印刷版の販売は 2026-08 に取りやめ**、軸はアフィリエイトとMATCHAの体験向上に移した
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
| GitHub | `iino-MATCHA/ashiato` | **`iino-MATCHA` は個人アカウント**（2026-08-29 に確認。共同作業者も本人1名だけ）。招待では引き継げない。会社のOrganizationを作って **Transfer ownership** するか、後任の個人アカウントへ譲渡する |
| Supabase | project `tcyclvfinguwudztfgsb` | Organization に後任を Owner で招待 → 前任を外す。**支払い方法が個人のカードなら会社のものに差し替える** |
| Vercel | 本番のプロジェクト | Hobby（個人）なら Team を作ってプロジェクトを移す。Teamなら招待するだけ。**環境変数一覧のスクリーンショットを先に取る** |
| ドメイン | my-japan-matcha.com | レジストラの管理権限を移す（DNSはVercel向け）。**招待の仕組みが無いので、ログイン情報ごと渡すか移管手続きが要る** |
| Mapbox | アクセストークン | トークンの持ち主アカウントを確認し、後任のアカウントで発行し直すのが安全 |

**招待（メールアドレスを教えてもらえば済む）で足りるのは Supabase と
Vercel(Team) の2つだけ。** GitHub は譲渡、ドメインは移管、Mapbox は再発行、
アプリ内の全権は §1-2 の手順が別に要る。

### 1-2. アプリ内の全権を後任に移す

全権（superadmin）は **メールアドレスから出ている**。出どころはDB関数
`owner_emails()`（migration 0035）で、いまは**2人**が入っている:

```
iino@matcha-jp.com
takeda@matcha-jp.com
```

この住所でログインしていれば、`profiles.admin_role` が何かの拍子に消えても
全権として通る ―― 締め出されないための土台。**引き継ぎ期間は2人のまま**にし、
前任が完全に離れてから片方を外す。

増やす／減らすときは、Supabase の SQL Editor でこの関数だけ書き換える:

```sql
create or replace function owner_emails()
returns text[] language sql immutable as $$
  select array[
    'takeda@matcha-jp.com',
    '次の担当@matcha-jp.com'
  ]::text[];
$$;
```

**最後の1人になっても空にしない。** 空にすると誰も管理画面へ入れなくなる。

※ 一般の管理者（閲覧のみ / 編集）は、画面から追加できる。
  /admin → 運営 → 権限を選ぶ → メールアドレス（相手が先に登録している必要あり）

### 1-3. 秘密情報の場所（値はここに書かない）

| なに | どこにある |
|---|---|
| Supabase anon key / URL | Vercel の環境変数（`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`）。anon keyは公開前提の鍵 |
| Supabase service role key | Supabase Dashboard → Settings → API。**絶対にクライアントへ出さない** |
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
- ⬜ **0034_drop_book_orders.sql が未適用**。印刷版の販売をやめたので、
  かご・注文・決済・注文通知の表と関数を落とす。
  ローカルのPostgreSQLで、18個の表・関数・型がすべて消えること、
  二度貼っても壊れないこと、trips/logs/photos/profiles が無事なことを確認済み
- ⬜ **0035_owner_emails.sql が未適用**。全権の出どころを1人から2人
  （iino / takeda）に広げる。**0033 の関数をすべて置き換えるので、
  0033 を貼っていなくてもこれ1本で成立する。**

**貼る順番: 0033 → 0034 → 0035**（0033 を飛ばして 0034 → 0035 でも可）。

### 2-2. 掃除（10分）

- Supabase Auth に動作検証で作ったテストユーザーが残っている。削除する:
  `claude-fa-1@my-japan-demo.local` / `claude-fb-1@my-japan-demo.local` /
  `claude-test-0812@my-japan-demo.local`
- デモ用アカウントのパスワード `ashiato-demo-2026` を変える（CLAUDE.mdにも反映）

---

## 3. 知っておくべき設計判断（なぜそうなっているか）

- **DBへの書き込みはSQLの手貼り**。PAT・サービスキーを開発環境に置かない
  （「環境変数は全員に見える」前提）。AIに開発させるときも、AIはSQLファイルを
  作って渡すだけで、貼るのは人
- **印刷版の販売はやめた（2026-08）**。売れる見込みが立たなかったため、
  購入導線とStripeを丸ごと削除した。**PDFのジャーナルだけが残る** ――
  これはクライアント側で完結していてDBを使わない。
  Supabase のシークレットに残る `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` は
  もう誰も使っていないので、引き継ぎのときに消してよい
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
| 高 | 記事→アプリの導線 | 未着手。集客の本体 | MATCHA記事側に「My Japanに保存」を埋める。アプリ側の受け口は `/explore` と旅作成 |
| 高 | アフィリエイトの拡充 | /quiz の結果とスポンサーカード（/admin → 広告）が入口 | 提携先を増やし、どのカードが押されているかを測れるようにする |
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
| ジャーナル（PDF）の設計思想 | `docs/photobook.md` |
| DBの変更履歴 | `supabase/migrations/0001〜0035` |
| 記事の取り込み道具 | `scripts/import-matcha-articles.mjs` ほか（MANUAL §5） |
