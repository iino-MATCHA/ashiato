# ドメインを変えるときの手順書

**この文書だけを読めば、ドメインの引っ越しが完了するように書いてある。**
AI（Claude など）に作業を任せる場合は、この文書をそのまま渡してよい。

対象: `www.my-japan-matcha.com` → 別のドメイン
最終更新: 2026-08-31（実際にビルドを通して検証した内容）

---

## 0. 全体像（5分で読む）

このアプリは Expo (React Native) + expo-router の **Web書き出し**を Vercel に
置いたものです。DB・認証・画像置き場は Supabase にあります。

ドメインを変えるときにやることは、大きく4つ:

| # | どこ | 難易度 | 忘れると |
|---|---|---|---|
| 1 | **コード**（`lib/site.ts` の1行） | ★ | 共有リンクとOGPが旧ドメインのまま |
| 2 | **Supabase の認証設定** | ★★ | **ログインが一切できなくなる** |
| 3 | **Vercel + DNS** | ★★ | サイトが開かない |
| 4 | **OG画像の作り直し** | ★ | シェア画像に旧ドメインの文字が残る |

**所要時間の目安: 1〜2時間**（DNSの浸透待ちを除く）

---

## 1. コード側（`lib/site.ts` の1行だけ）

### やること

`lib/site.ts` を開いて、この1行を書き換えるだけです。

```ts
export const SITE_HOST = 'www.my-japan-matcha.com';
//                        ^^^^^^^^^^^^^^^^^^^^^^ ここを新しいホスト名に
```

**コードで直すところは、他にありません。** 以前は8箇所にベタ書きされていた
のを、2026-08-31 に1箇所へ集約しました。

### 本当に1行で足りることの確認（実測済み）

`SITE_HOST` を仮のドメインに変えて `npm run build:web` を通し、
書き出された `dist/` を調べた結果:

```
dist/index.html   旧ドメイン 0件 / 新ドメイン 3件（og:image・og:url・twitter:image）
JSバンドル         旧ドメイン 0件 / 新ドメイン 1件（1箇所に集約されている証拠）
```

旧ドメインの残りはゼロでした。

### この1行がどこへ効くか（把握用。触る必要はない）

| 効く先 | ファイル |
|---|---|
| 認証の戻り先（Google・メール確認） | `lib/authRedirect.ts` |
| 旅の共有リンク | `app/trip/[id]/share.tsx` |
| 立ち寄り先の共有リンク | `app/trip/[id]/step/[stepId]/share.tsx` |
| 御朱印カードのプロフィールURL | `app/goshuin/share.tsx` |
| 友だち招待リンク | `lib/invite.ts` |
| **共有カード画像に焼かれる文字** | `lib/stopCard.web.ts` / `components/ugc/StopCard.tsx` |
| OGP（本番のhead） | `scripts/inject-head.mjs` |
| OG画像に焼かれる文字 | `scripts/make-og.mjs` |

`scripts/` の2つは Node スクリプトなので TypeScript を import できません。
`lib/site.ts` を読んで `SITE_HOST` を正規表現で取り出しています。
（ビルド手順を増やさないため。この仕組みも上の実測に含まれています）

### 補足: `app/+html.tsx` は本番では使われていない

`app.json` の `web.output` が `"single"` のため、Expo Router は
`app/+html.tsx` を使わず既定のテンプレートを吐きます。本番のheadは
`npm run build:web` の後半（`scripts/inject-head.mjs`）が差し込んでいます。
`+html.tsx` にも同じ内容が書いてありますが、**効いているのは
`inject-head.mjs` のほう**です。両方とも `lib/site.ts` を見ているので、
どちらを直す必要もありません。

### 一時的に別ドメインで確かめたいとき

環境変数 `SITE_ORIGIN` が `lib/site.ts` より優先されます（OGPのみ）。

```bash
SITE_ORIGIN=https://staging.example.com npm run build:web
```

---

## 2. Supabase の認証設定（ここを忘れるとログインできません）

Supabase Dashboard → **Authentication → URL Configuration**

| 項目 | 入れる値 |
|---|---|
| **Site URL** | `https://新しいドメイン`（www を付ける側。1つだけ） |
| **Redirect URLs** | 新ドメイン、および Vercel のプレビュー用URL |

Redirect URLs には最低これだけ入れてください:

```
https://新しいドメイン/**
https://新しいドメイン
http://localhost:8081/**      ← ローカル開発用
https://*-あなたのVercelチーム.vercel.app/**   ← プレビュー用（任意）
```

### Google ログインを使っている場合（使っています）

`app/(auth)/login.tsx` が `signInWithOAuth({ provider: 'google' })` を
呼んでいます。**Google Cloud Console 側の設定も直す必要があります。**

1. Google Cloud Console → APIとサービス → 認証情報
2. 該当の OAuth 2.0 クライアント ID を開く
3. **承認済みのリダイレクト URI** に Supabase のコールバックが入っているか確認
   （`https://tcyclvfinguwudztfgsb.supabase.co/auth/v1/callback` の形。
   これはドメインを変えても**変わりません**）
4. **承認済みの JavaScript 生成元** に新しいドメインを追加

> リダイレクトURIはSupabase側のドメインなので基本そのままですが、
> 生成元（Origin）の追加は要ります。

### 確認方法

新ドメインで実際にログインしてみてください。
「ログインボタンは押せるのに戻ってこない」なら、上のどれかが漏れています。

---

## 3. Vercel と DNS

### いまの構成（実測）

```
NS    my-japan-matcha.com      → 01〜04.dnsv.jp        （お名前.comのDNS）
A     my-japan-matcha.com      → 216.198.79.1          （Vercel）
CNAME www.my-japan-matcha.com  → e5ba73a4ef7e3fa7.vercel-dns-017.com
MX / TXT / CAA                 → なし（メールは使っていない）
```

レコードは実質2つだけです。

### 手順

1. Vercel で新しいプロジェクトを作り、GitHubリポジトリを繋ぐ
   - ビルド設定は `vercel.json` がリポジトリに入っているので**そのままでOK**
     （`npm run build:web` → `dist` → SPA rewrite）
2. Vercel → Settings → Domains に新しいドメインを追加
3. **Vercelが指示するA / CNAMEの値**を、ドメインのDNSに設定する
   - 上に書いた `216.198.79.1` などは**旧プロジェクトの値なので使わない**
4. apex（www なし）を www へリダイレクトする設定を Vercel で入れる
   （このアプリは www 側を正としています）

### ⚠️ 同じドメインは2つのVercelプロジェクトに登録できません

旧プロジェクトにドメインが残っていると `Domain is already in use` で弾かれます。
**新プロジェクトの準備ができてから、旧プロジェクトのドメインを外す**順番で。

### 環境変数（Vercel → Settings → Environment Variables）

```
EXPO_PUBLIC_SUPABASE_URL        Supabase → Settings → API
EXPO_PUBLIC_SUPABASE_ANON_KEY   同上（公開前提の鍵。クライアントに載る）
EXPO_PUBLIC_MAPBOX_TOKEN        地図。自分のMapboxアカウントで発行し直すのが安全
EXPO_PUBLIC_META_PIXEL_ID       Meta広告のピクセル。自社のIDに
```

**`EXPO_PUBLIC_*` はビルド成果物に焼き込まれ、誰でも読めます。**
秘密の鍵をここに置かないでください（Supabase の service role key は特に）。

### Google Analytics

`scripts/inject-head.mjs` の `GA_ID` に測定IDが直接書いてあります。

```js
const GA_ID = 'G-4DM6J1C4K0';
```

**自社のGA4プロパティに差し替えてください。** 旧IDのままだと、
前任者のプロパティにデータが流れ続けます。

---

## 4. OG画像を作り直す（画像の中に文字が入っています）

`public/og.png` と `public/og-en.png` は、**画像そのものにドメイン文字が
描かれています。** テキスト置換では直りません。

```bash
node scripts/make-og.mjs ja   # -> public/og.png
node scripts/make-og.mjs en   # -> public/og-en.png
```

`lib/site.ts` を直したあとに実行すれば、新しいドメインで焼き直されます。
（描画は headless Chromium が行います）

---

## 5. 直せないもの（諦めが必要）

**すでに利用者がSNSへ投稿した共有カード画像**には、旧ドメインの文字が
ピクセルとして入っています。あとから直す方法はありません。

**すでに貼られた `https://www.my-japan-matcha.com/trip/xxx` のリンク**は、
旧ドメインを保持して301リダイレクトを張らないかぎり切れます。
旧ドメインを手放す場合、これは受け入れることになります。

> 可能なら、旧ドメインを**1年だけ保持して新ドメインへ301**するのが理想です。
> SEOの評価も引き継げます。

---

## 6. 作業の順番（この順でやってください）

```
1. lib/site.ts の SITE_HOST を書き換える
2. node scripts/make-og.mjs ja && node scripts/make-og.mjs en
3. npm run build:web が通ることを確認
4. コミット & プッシュ
5. Vercel で新プロジェクトを作り、環境変数4つを入れる
6. Vercel にドメインを追加 → 指示されたDNSレコードを設定
7. Supabase の Site URL / Redirect URLs を新ドメインに
8. Google Cloud Console の「承認済みのJavaScript生成元」に新ドメイン追加
9. inject-head.mjs の GA_ID を自社のものに
10. 下の確認リストを全部通す
```

---

## 7. 終わったか確認するリスト

- [ ] 新ドメインでトップページが開く
- [ ] **Googleログインができて、ログイン後に戻ってくる**
- [ ] メールで新規登録 → 確認メールのリンクが新ドメインを指している
- [ ] 旅を開いて共有 → 生成された画像の下に**新しいドメイン**の文字が出ている
- [ ] 共有リンクをSlackやXに貼って、**OGPカードが出る**（画像が表示される）
- [ ] `/trip/xxx/book` で **Export PDF** が動く
- [ ] 地図が表示される（Mapboxトークンが有効）
- [ ] apex（wwwなし）でアクセスすると www へ飛ぶ

### コマンドで確認する場合

```bash
# OGPが新ドメインになっているか
curl -s https://新しいドメイン/ | grep -o '<meta property="og:[^>]*>'

# 旧ドメインが残っていないか
npm run build:web && grep -c "my-japan-matcha" dist/index.html   # 0 なら合格
```

---

## 8. 関連する資料

| 知りたいこと | どこ |
|---|---|
| 開発の決まり・ハマりどころ（**作業前に必読**） | `CLAUDE.md` |
| 権限・秘密情報・残作業の引き継ぎ | `docs/HANDOVER.md` |
| アプリと管理画面の使い方 | `docs/MANUAL.md` |
| DBの変更履歴（手で貼る運用） | `supabase/migrations/` |
