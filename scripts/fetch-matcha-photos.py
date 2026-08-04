# -*- coding: utf-8 -*-
"""MATCHAの記事から、地点に合う写真を拾う。

見本データの写真はWikimediaから取っていたが、45枚中27枚が
表示義務のあるライセンス（CC BY / CC BY-SA）で、商用のこのアプリで
無表示のまま使うと違反になる。MATCHAは自社媒体なのでその問題が消える。

matcha-jp.com は img が lazyload で、data-src にサーバー描画済みの
実URLがHTMLに入っている（JS実行なしで取れる）。

使い方：
  1. PLAN に「地点 -> 検索語, 採点語」を書く
  2. このスクリプトで候補を集める
  3. scripts/photo-contact-sheet.mjs で一覧に焼き、必ず目で見る
  4. 合わないものは検索語を変えて取り直す

3を飛ばすと必ず事故る。実際、記事の1枚目を機械的に取っただけでは
45枚中27枚が地点と無関係だった（東京駅のはずが野球場、など）。
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
S = os.path.dirname(os.path.abspath(__file__))
UA = {'User-Agent': 'Mozilla/5.0 (compatible; my-japan-seed/1.0)'}
SPONSORED = {'27358'}
STOP_ALT_WORDS = {'matcha', 'writer', 'ライター', 'アイコン', 'icon', 'logo', 'banner', 'ロゴ', 'author'}

# photo_id -> (検索キーワード, 採点に使う語のリスト)
# 採点語は記事のalt/ファイル名に出てきそうな断片を複数用意する
PLAN = {
    'ea074311': ('日光東照宮', ['東照宮', '日光', 'toshogu', 'nikko']),
    'a2ec9bcc': ('明月院 紫陽花', ['明月院', 'あじさい', '紫陽花', 'meigetsu']),
    '2957eb6f': ('横浜中華街', ['中華街', '横浜', 'chinatown', 'yokohama']),
    '40bf0de1': ('東京駅 丸の内駅舎', ['東京駅', 'tokyo_station', 'tokyostation', 'marunouchi']),
    'e5dde817': ('近江町市場', ['近江町', 'omicho', 'ohmicho']),
    '00c25c17': ('錦市場', ['錦市場', 'nishiki']),
    'c23e6d3f': ('新世界 通天閣 串カツ', ['通天閣', '新世界', 'tsutenkaku', 'shinsekai', '串カツ', 'kushikatsu']),
    '224495ac': ('原爆ドーム', ['原爆ドーム', 'genbaku', 'atomic', 'dome']),
    '79a83bc9': ('博多ラーメン とんこつ', ['ラーメン', 'ramen', 'tonkotsu', '豚骨']),
    '62c17e97': ('識名園', ['識名園', 'shikinaen']),
    '18e98c7b': ('大通公園 雪まつり', ['大通公園', 'odori', '雪まつり', 'snow']),
    '0b3fd581': ('瑞鳳殿', ['瑞鳳殿', 'zuihoden', 'zuihouden']),
    '54ba25e4': ('東京スカイツリー', ['スカイツリー', 'skytree']),
    'c475ec30': ('嵐山 竹林', ['嵐山', '竹林', 'arashiyama', 'bamboo']),
    'ada4279e': ('清水寺', ['清水寺', 'kiyomizu']),
    '1b2d53cc': ('東福寺 紅葉', ['東福寺', 'tofukuji', 'tofuku']),
    '47ce1511': ('東大寺 大仏', ['東大寺', 'todaiji', '大仏', 'daibutsu']),
    '52b51af3': ('浅草寺 雷門', ['浅草寺', '雷門', 'sensoji', 'kaminarimon', 'asakusa']),
    'edc84ff0': ('芦ノ湖 富士山 箱根', ['芦ノ湖', 'ashinoko', '富士', 'fuji', '箱根', 'hakone']),
    'b84c7994': ('伏見稲荷 千本鳥居', ['伏見稲荷', '千本鳥居', 'fushimiinari', 'fushimi_inari', 'senbon']),
    'f52dfe32': ('奈良公園 鹿', ['奈良公園', '鹿', 'nara_park', 'deer', 'sika', 'shika']),
    'e0ca75af': ('道頓堀 グリコ', ['道頓堀', 'dotonbori', 'グリコ', 'glico']),
    '2d929eae': ('首里城', ['首里城', 'shuri', 'shurijo']),
    '094b36c9': ('波上宮', ['波上宮', 'naminoue']),
    '9d14e2fd': ('国際通り 那覇', ['国際通り', 'kokusai', '那覇', 'naha']),
    '8adc5055': ('広島平和記念公園 原爆ドーム', ['平和記念公園', '原爆ドーム', 'peace_memorial', 'genbaku']),
    '1137b8fe': ('神戸ポートタワー', ['ポートタワー', 'port_tower', 'porttower', '神戸港']),
    'ff76e799': ('大阪城', ['大阪城', 'osakajo', 'osaka_castle']),
    '79578651': ('さっぽろ雪まつり 大通公園', ['雪まつり', 'snow_festival', '大通公園', 'odori']),
    '72b03b56': ('函館山 夜景', ['函館山', 'hakodateyama', '夜景', 'nightview']),
    '4f5d6acd': ('すすきの ラーメン 味噌', ['すすきの', 'susukino', 'ラーメン', 'ramen', '味噌']),
    '49e53409': ('屋台 中洲 福岡', ['屋台', 'yatai', '中洲', 'nakasu']),
    '93d6bd47': ('長崎 グラバー園 眼鏡橋', ['グラバー園', 'glover', '眼鏡橋', 'meganebashi', '長崎']),
    'd88a48f9': ('博多駅 ラーメン滑走路', ['博多駅', 'hakata_station', 'ラーメン', 'ramen']),
    '9f7de5c5': ('渋谷スクランブル交差点', ['スクランブル交差点', 'scramble', 'shibuya_crossing', '渋谷']),
    '94401591': ('金閣寺', ['金閣寺', 'kinkakuji', 'kinkaku']),
    'eeef7869': ('宮島 厳島神社 鳥居', ['厳島神社', 'itsukushima', '宮島', 'miyajima', '大鳥居']),
    '49dd0b34': ('博多駅 新幹線', ['博多駅', 'hakata_station', 'hakata']),
    '38add7a5': ('高山 陣屋 朝市', ['高山陣屋', 'takayama_jinya', '朝市', 'asaichi', '高山'],),
    'ce4f36a5': ('兼六園', ['兼六園', 'kenrokuen']),
    '635a3d1f': ('松本城', ['松本城', 'matsumoto_castle', 'matsumotojo']),
    '460cee2a': ('新宿 歌舞伎町 夜景', ['歌舞伎町', 'kabukicho', '新宿', 'shinjuku']),
    'e237131a': ('富士山 静岡', ['富士山', 'mount_fuji', 'fujisan', '富士', '静岡', 'shizuoka']),
    '5eea1737': ('白川郷 合掌造り', ['白川郷', 'shirakawago', '合掌造り', 'gassho']),
    '7d8c341c': ('金沢21世紀美術館', ['21世紀美術館', '21_century', 'kanazawa', 'museum']),
}


def search_articles(keyword, n=6):
    url = 'https://matcha-jp.com/jp/search?keyword=' + urllib.parse.quote(keyword)
    try:
        html = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25).read().decode('utf-8', 'ignore')
    except Exception:
        return []
    ids = re.findall(r'href="https://matcha-jp\.com/jp/(\d+)"', html)
    seen, out = set(), []
    for i in ids:
        if i in seen or i in SPONSORED:
            continue
        seen.add(i)
        out.append(i)
        if len(out) >= n:
            break
    return out


def article_images(article_id):
    url = f'https://matcha-jp.com/jp/{article_id}'
    try:
        html = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25).read().decode('utf-8', 'ignore')
    except Exception:
        return []
    title_m = re.search(r'<title>([^<]+)</title>', html)
    title = title_m.group(1) if title_m else ''
    pairs = re.findall(r'<img[^>]*data-src="([^"]+)"[^>]*alt="([^"]*)"', html)
    pairs += [(u, a) for a, u in re.findall(r'<img[^>]*alt="([^"]*)"[^>]*data-src="([^"]+)"', html)]
    out = []
    for src, alt in pairs:
        if not src.startswith('http') or 'resize/100x' in src or 'old_thumbnails' in src:
            continue
        if any(w in alt.lower() for w in STOP_ALT_WORDS):
            continue
        out.append({'src': src, 'alt': alt, 'article': article_id, 'article_title': title})
    return out


def score(alt_and_url, terms):
    hay = (alt_and_url['alt'] + ' ' + alt_and_url['src']).lower()
    return sum(1 for t in terms if t.lower() in hay)


results = {}
for pid, spec in PLAN.items():
    kw, terms = spec[0], spec[1]
    arts = search_articles(kw)
    pool = []
    for aid in arts:
        pool.extend(article_images(aid))
        time.sleep(0.3)
    if not pool:
        print(f"{pid} {kw:<18} -> NO IMAGES AT ALL")
        continue
    ranked = sorted(pool, key=lambda x: -score(x, terms))
    best = ranked[0]
    best_score = score(best, terms)
    results[pid] = {'image': best['src'], 'alt': best['alt'], 'article': best['article'],
                     'article_title': best['article_title'], 'score': best_score,
                     'runner_up': ranked[1]['src'] if len(ranked) > 1 else None}
    flag = '' if best_score > 0 else '  ⚠ 0点（機械採点は当てにならない、要目視）'
    print(f"{pid} {kw:<18} score={best_score} alt={best['alt'][:36]!r}{flag}")

io.open(S + '/matcha_candidates2.json', 'w', encoding='utf-8').write(
    json.dumps(results, ensure_ascii=False, indent=1))
print('\ndone', len(results), '/', len(PLAN))
