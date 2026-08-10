-- MATCHAの記事を matcha_articles へ入れる。
-- scripts/import-matcha-articles.mjs --dry-run --sql --lang <jp|en|ko|cn|tw> --limit 20 の出力を並べたもの。
-- 取得日 2026-08-10。各言語 直近6か月ぶんの先頭20件を見て、パンくずから県が決まったものだけ。
-- 同じ url+lang は入れ直す（upsert）ので、何度貼っても増えない。

-- ================================================= jp
insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/jp/27479', 'ja', 14, '8月10日オープン！横浜の歴史的建造物を用いた「スターバックス コーヒー 横浜海の公園店」', 'コーヒー＆建築は必見！ 8月10日、横浜「海の公園」に新店舗「スターバックス コーヒー 横浜海の公園店」がオープンします。建物は国の登録有形文化財である「旧長濱検疫所一号停留所」。横浜の歴史と海を、コーヒーを飲みながら味わいましょう。

2026年8月10日（月）から、横浜「海の公園」にて新店舗「スターバックス コーヒー 横浜海の公園店」がオープンします。

建物は国の登録有形文化財である「旧長濱検疫所一号停留所」です。この建物は、海外から持ち込まれる感染症を防ぐための検疫施設の一部として建てられました。感染の疑いがある船客を一時的に滞在させる「停留所」でありながら、上流階級の乗客をもてなすため、シャンデリアなどの装飾を施した格式高い造りが特徴です。

1895年に建設されたのち、関東大震災で被害を受けながらも復旧工事がされ、2018年には国の登録有形文化財に登録されました。', '["https://resources.matcha-jp.com/resize/720x2000/2026/08/08-268632.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/08-268634.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/08-268633.webp"]'::jsonb, '2026-08-08'::timestamptz),
  ('https://matcha-jp.com/jp/27515', 'ja', 13, 'MAPPA15周年展が東京へ！チェンソーマンや呪術廻戦の世界を体感', 'MAPPA設立15周年を記念した展覧会が東京・有楽町で開催されます。チェンソーマンや進撃の巨人、呪術廻戦の展示や限定グッズを紹介します。

アニメーションスタジオMAPPAの設立15周年を記念した大規模展覧会「MAPPA EXPO 15th Anniversary」が、2026年9月16日から12月7日まで、東京・有楽町のYURAKUCHO MUSEUMで開催されます。

会場では、MAPPAが制作を手がけた23作品を取り上げ、アニメ原画や制作資料、作品の世界を体感できる没入型展示、等身大フィギュア、展覧会描き下ろしイラスト、オリジナルグッズなどを展開します。

なかでも、劇場版『チェンソーマン レゼ篇』、『進撃の巨人』The Final Season、アニメ『呪術廻戦』の展示エリアは必見です。', '["https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268549.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268548.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268547.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268551.webp"]'::jsonb, '2026-08-10'::timestamptz),
  ('https://matcha-jp.com/jp/27358', 'ja', 13, '東京旅行で絶対外せない！GINZA SIXならではの「限定手土産」と「美食体験」完全ガイド', '世界のラグジュアリーブランドや現代アート、美食が集結する「GINZA SIX」は、銀座を代表するランドマークです。本記事では、上質な手土産や名店グルメ、優雅なアフタヌーンティーまで、GINZA SIXならではの魅力を通して、洗練された銀座のひとときをご紹介します。

建物はB6Fから地上13Fまでの複合商業施設で、うち商業施設の9つのフロアには約240店舗が軒を連ねています。また、B3Fには、日本の伝統芸能「能」を鑑賞できる「観世能楽堂(かんぜのうがくどう)」を併設。ショッピングだけでなく、日本文化にも触れられます。

なかでも見逃せないのが、施設のシンボルでもある中央吹き抜け空間に展示されている、国際的アーティスト、ジュリアン・オピー(Julian Opie)による大規模なインスタレーション作品。エスカレーターに乗る際は、ぜひ見上げて鑑賞してみてください。

ひとつは、ミシュラン星獲得店が手がける和菓子ブランド「赤坂おぎ乃和甘(わかん)」。もうひとつは、日本の名山をモチーフにした美しい和洋菓子で注目を集める「小楽園KIOSK」です。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266419.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266420.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266421.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266422.webp"]'::jsonb, '2026-07-02'::timestamptz),
  ('https://matcha-jp.com/jp/27504', 'ja', 13, '【2026】銀座の安いアフタヌーンティー6選！駅近・直結のホテルも紹介', '銀座で安く楽しめるホテルのアフタヌーンティー6選を紹介します。駅近・周辺、前泊に便利な店、日比谷駅地下通路から徒歩0分のホテルまで比較できます。

銀座でホテルのアフタヌーンティーを楽しみたいけれど、できるだけ安いプランを選びたい方へ。本記事では、銀座・銀座周辺のホテルレストランを、価格の目安が安い順に紹介します。

銀座駅や東銀座駅の近く、観光や買い物の前後に立ち寄りやすい店、ホテル前泊と組み合わせやすい店、地下通路の出口から徒歩0分の店までまとめました。

※料金・プラン内容は2026年8月4日時点の一休.comレストラン掲載情報を参考にしています。季節や曜日によって変わるため、予約時に最新情報をご確認ください。', '["https://restaurant.img-ikyu.com/rsDatas/rsData114500/r114495/orig/114495ga10000220.jpg?auto=compress%2Cformat&lossless=0&fit=crop&w=1600&h=800","https://restaurant.img-ikyu.com/rsDatas/rsData114500/r114495/orig/114495ga10000255.jpg?auto=compress%2Cformat&lossless=0&fit=crop&w=1600&h=800","https://restaurant.img-ikyu.com/rsDatas/rsData118000/r117963/orig/117963ga10000061.jpg?auto=compress%2Cformat&lossless=0&fit=crop&w=1600&h=800","https://restaurant.img-ikyu.com/rsDatas/rsData118000/r117963/orig/117963ga10000056.jpg?auto=compress%2Cformat&lossless=0&fit=crop&w=1600&h=800"]'::jsonb, '2026-08-04'::timestamptz),
  ('https://matcha-jp.com/jp/27466', 'ja', 13, '世界で100万人が迷い込んだ「ティム・バートンのラビリンス」東京へ', 'ティム・バートンの没入型展覧会が東京・豊洲に初上陸します。200点以上の直筆スケッチと、名作映画の世界を巡る迷宮体験を楽しめます。

世界各地で累計100万人以上を動員した話題の没入型展覧会「ティム・バートンのラビリンス」が、ついに日本へ上陸します。

開催期間は2026年11月25日から2027年2月21日まで。東京・豊洲の「CREVIA BASE Tokyo」が会場です。

2022年にスペイン・マドリードで開幕した本展は、世界5カ国8都市を巡回してきました。日本だけでなくアジアでも初開催となり、ティム・バートンが日本で展覧会を開催するのは約10年ぶりです。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267949.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267950.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267947.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267948.webp"]'::jsonb, '2026-08-03'::timestamptz),
  ('https://matcha-jp.com/jp/27463', 'ja', 13, '原宿「ハラカド」で夏祭り！よさこいとKAWAII夜市に熱狂', '原宿「ハラカド」で、よさこい演舞や高知グルメ、光と音に包まれるKAWAII夜市を開催します。日本の伝統と原宿文化を一度に楽しめます。

東急プラザ原宿「ハラカド」では、2026年8月20日から8月30日まで、日本の伝統的な夏文化と原宿のポップカルチャーを組み合わせたイベントが開催されます。

高知県を代表する「よさこい祭り」の熱気を体感できる「原宿よさこいフェア」と、アソビシステムが手がける新感覚のナイトマーケット「KAWAII夜市 vol.1『原宿可愛夜市』」を同時に楽しめます。

毎年8月下旬には、原宿・表参道エリアで原宿表参道元氣祭 スーパーよさこいが開催されます。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267933.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267936.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267935.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267934.webp"]'::jsonb, '2026-08-03'::timestamptz),
  ('https://matcha-jp.com/jp/27462', 'ja', 13, '『薬屋のひとりごと』×東京シティビュー！天空で猫猫の舞を体感', '『薬屋のひとりごと』と東京シティビューが初めてコラボします。東京の絶景と猫猫の舞、本邦初公開の猫猫像、限定グッズを楽しめます。

六本木ヒルズ森タワー52階にある展望台「東京シティビュー」では、2026年8月1日から10月26日まで、大人気TVアニメ『薬屋のひとりごと』とのコラボイベントを開催します。

イベント名は、「TVアニメ『薬屋のひとりごと』×東京シティビュー 舞が織りなす幻想の世界 ―天空に響く、舞のしらべ―」。両者にとって初めてのコラボイベントで、作品を象徴する名場面と海抜250メートルから望む東京の景色が融合します。

会場のエントランスでは、東京のパノラマビューとアニメーションの映像美が交錯する、幻想的な空間が来場者を迎えます。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267925.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267926.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267928.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267929.webp"]'::jsonb, '2026-08-03'::timestamptz),
  ('https://matcha-jp.com/jp/27489', 'ja', 40, '福岡空港周辺のおすすめホテル10選｜安い・駅直結・送迎付き', '福岡空港周辺で安くて近いおすすめホテル10選を紹介します。無料送迎付きの宿や駅直結で前泊に便利なビジネスホテルなど、旅の目的に合わせてプランを選べます。

福岡空港国内線ターミナルから最も近い場所にあるビジネスホテルです。早朝6:10から運行している福岡空港行きの無料送迎バスがあるため、LCCなどの早朝フライトを利用する際の前泊に絶大な人気を誇っています。

館内には旅の疲れをじんわりと癒せる大浴場も完備。スタイリッシュで清潔感のある客室ながらリーズナブルな価格帯で宿泊できる、コスパ抜群の頼れるホテルです。

福岡空港国内線ターミナルから徒歩約8分という、圧倒的な近さを誇る好立地ホテルです。空港周辺でとにかく移動の手間を減らしたい方や、フライト直前までホテルでゆっくり過ごしたい前泊・後泊利用に最適です。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268175.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268177.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268178.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268180.webp"]'::jsonb, '2026-07-31'::timestamptz),
  ('https://matcha-jp.com/jp/27488', 'ja', 1, '新千歳空港周辺のおすすめホテル10選｜直結・安い・送迎あり', '新千歳空港直結や無料送迎ありなど、前泊に便利なホテル10軒をご紹介します。比較的安く泊まれる宿も掲載しており、早朝便や夜遅い便の移動がスムーズになります。

早朝便や夜遅い便で新千歳空港を利用するときは、空港直結または千歳駅周辺のホテルに前泊すると移動がスムーズです。

この記事では、新千歳空港に直結するホテル、空港送迎がある周辺ホテル、比較的安く泊まりやすいホテルを10施設紹介します。

こんな方におすすめ！ ・早朝便に備えて新千歳空港周辺で前泊したい ・国内線・国際線ターミナル直結のホテルを探している ・無料送迎がある空港近くのホテルに泊まりたい ・千歳駅周辺で安いホテルを比較したい', '["https://img.travel.rakuten.co.jp/share/image_up/178465/LARGE/89c06ff509a5df330d5ed5daf2accc689d31ed59.47.9.26.3.jpg","https://trvimg.r10s.jp/share/image_up/137428/origin/8967a5f2d5bb4e29b283074935ed1baf7017a3e8.47.9.26.3.jpg?fit=inside%7C888:498","https://trvimg.r10s.jp/share/image_up/167873/origin/3bbbcf68b6ecbdbc86928d4f5640b60d2828bb6c.47.9.26.3.jpg?fit=inside%7C888:498","https://trvimg.r10s.jp/share/image_up/705/origin/4e2438ccafffb4be3cdb7a45b4887db3f24d8fbf.47.9.26.3.jpg?fit=inside%7C888:498"]'::jsonb, '2026-07-31'::timestamptz),
  ('https://matcha-jp.com/jp/27422', 'ja', 26, '【関西】大阪・京都・奈良・神戸の2026年8月おすすめイベント・祭り8選', '大阪・京都・奈良・神戸で8月に開催される祭りやイベントを厳選。京都五山送り火、なら燈花会、びわ湖大花火大会、盆踊りなど、関西の夏を彩る注目行事を紹介します。

日本の8月の大きな行事といえば、月の半ばに先祖を供養する伝統行事が行われるお盆です。

大阪、京都、奈良、神戸を擁する関西地方では、日本文化を深く体感できる代表的な祭りが数多く開催されます。

主なイベントは、京都を囲む5つの山に巨大な送り火がともる京都五山送り火、2万本のろうそくが奈良公園を幻想的に照らすなら燈花会、壮大なびわ湖大花火大会などです。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267741.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267742.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267743.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267744.webp"]'::jsonb, '2026-07-31'::timestamptz),
  ('https://matcha-jp.com/jp/27475', 'ja', 13, '羽田空港での前泊に便利なホテル10選！直結・送迎・安い宿', '羽田空港での前泊に便利なホテル10軒を紹介します。第2・第3ターミナル直結や無料送迎、安い宿を比較し、楽天・Booking.comの予約先も掲載します。

早朝便や深夜便で羽田空港を利用するときは、空港直結または周辺のホテルに前泊すると移動がスムーズです。

この記事では、羽田空港に直結するホテル、無料送迎バスがあるホテル、比較的安く泊まりやすいホテルを10施設紹介します。すべて楽天トラベルとBooking.comの両方で予約できるホテルです。

こんな方におすすめ！ ・早朝便に備えて羽田空港周辺で前泊したい ・第2・第3ターミナル直結のホテルを探している ・無料送迎がある空港近くのホテルに泊まりたい ・宿泊費を抑えやすいホテルを比較したい', '["https://trvimg.r10s.jp/share/HOTEL/147116/147116.jpg","https://trvimg.r10s.jp/share/HOTEL/889/889.jpg","https://trvimg.r10s.jp/share/HOTEL/178228/178228.jpg","https://trvimg.r10s.jp/share/HOTEL/187588/187588.jpg"]'::jsonb, '2026-07-30'::timestamptz),
  ('https://matcha-jp.com/jp/27472', 'ja', 13, '【2026】上野・鶯谷周辺のラブホテル10選！おしゃれ・安い・予約できるラブホを厳選', '上野・鶯谷周辺でおすすめのラブホテル10軒を紹介します。駅近で比較的安いホテルから、サウナ、ジャグジー、カラオケ付きのおしゃれなホテルまで厳選しました。

上野周辺でラブホテルを探すなら、JR上野駅から山手線で1駅の鶯谷エリアがおすすめです。

JR鶯谷駅周辺、特に台東区根岸1丁目には多くのラブホテルが集まっています。駅から徒歩数分で行ける施設が多く、上野公園や上野動物園、東京国立博物館を楽しんだあとのホテルデートにも便利です。

鶯谷周辺には、比較的安く宿泊できるホテルから、サウナ、ジャグジー、カラオケなどを備えた設備充実のホテルまで、さまざまな施設があります。', '["https://cf.bstatic.com/xdata/images/hotel/max1024x768/147959772.jpg?k=a6e1b068b91064aa326408bb0946112c7307125b3f6d385c79dfb408f201b78b&o=","https://cf.bstatic.com/xdata/images/hotel/max1024x768/138665890.jpg?k=0fc2207f7430c3a2b3f2ba5b7535b69364547f9b292e82b53f5d9cead02fcb88&o=","https://cf.bstatic.com/xdata/images/hotel/max500/840900898.jpg?k=345b624799061e7d8d1fa44115d73483f7bce1dc3e4e06b4dee854f9c7c0a238&o=","https://cf.bstatic.com/xdata/images/hotel/max500/791852557.jpg?k=7eb7dc3bd80c4d515f50f7ad0373da7cfbd60816e35933eefb91152ab91457d6&o="]'::jsonb, '2026-07-29'::timestamptz),
  ('https://matcha-jp.com/jp/27420', 'ja', 42, 'ハウステンボスのハロウィンが進化！ミッフィーと本格ホラーに大興奮', 'ハウステンボスで2026年9月18日からハロウィンイベントを開催します。本格ホラーやミッフィーの仮装パレード、秋のグルメを紹介します。

ハウステンボスでは、2026年9月18日から11月3日まで、かつてないスケールに進化した秋のハロウィンイベントを開催します。

ヨーロッパのような美しい街並みを舞台に、本格的な恐怖を体験できる「ホーンテッド・ハロウィン」、家族で楽しめる「ミッフィー・ハロウィン」、九州の秋の味覚がそろうグルメフェスティバル、壮大なナイトショーなどが展開されます。

毎年人気を集める「ホーンテッド・ハロウィン」が、本物の宮殿「パレス ハウステンボス」を舞台に、さらにスリリングな内容へと進化します。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267343.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267341.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267344.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267342.webp"]'::jsonb, '2026-07-29'::timestamptz),
  ('https://matcha-jp.com/jp/27419', 'ja', 27, 'USJハロウィーン・ホラー・ナイト！15周年の見どころを紹介', 'USJで2026年9月から開業25周年の秋イベントを開催します。15周年を迎えるホラー・ナイトの新アトラクションやチケット情報を紹介します。

ユニバーサル・スタジオ・ジャパン（USJ）では、2026年9月10日から11月8日まで、秋のシーズナルイベント「ユニバーサル・エクストリーム・オータム ～Discover U!!!～」を開催します。

パーク開業25周年を迎える2026年は、9月11日から始まる「ハロウィーン・ホラー・ナイト」も15周年を迎えます。2011年の初開催以来、圧倒的な世界観と斬新なエンターテイメントで、日本の秋に「ホラー」という新たなレジャーを定着させてきた人気イベントです。

2026年は、逃げ場のない絶望的な恐怖が押し寄せる、すべてが異常値のホラー体験へと進化します。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267325.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267324.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267320.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267316.webp"]'::jsonb, '2026-07-29'::timestamptz),
  ('https://matcha-jp.com/jp/21235', 'ja', 13, 'ムーンアートナイト下北沢2026！巨大な月と街を巡るアート体験', 'ムーンアートナイト下北沢2026が9月18日から開催されます。巨大な月や屋外作品、英語対応のイマーシブシアターなど、見どころを紹介します。

日本の文化において、月は特別な存在です。特に中秋の名月を迎える9月には、月にまつわるさまざまな伝統行事が行われます。

月をテーマにしたイベントのひとつであるムーンアートナイト下北沢は、2026年で5回目を迎え、東京の初秋を彩る恒例イベントとして親しまれています。

2026年は9月18日から10月4日まで開催。個性的なファッションやライブハウス、新しいアートカルチャーで知られる東京・下北沢を舞台に、アート、音楽、演劇、食、ワークショップなど、約100の企画や表現が街の各所で展開されます。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/27-267834.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/27-267835.webp","https://resources.matcha-jp.com/resize/720x2000/2025/10/03-245900.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/27-267836.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/jp/27450', 'ja', 13, '【2026年】新宿のラブホテル10選！おしゃれ・安い・予約できるラブホを厳選', '新宿・歌舞伎町や東新宿でおすすめのラブホテル10軒を紹介。おしゃれなホテル、比較的安いホテル、サウナ・露天風呂付きホテルなどを厳選しました。アクセスや設備、選び方も解説します。

新宿のラブホテル街は、JR新宿駅東口から歌舞伎町2丁目、東新宿駅、新宿三丁目駅にかけて広がっています。

日本最大級の繁華街として知られる新宿・歌舞伎町には、比較的安い料金で宿泊できるホテルから、サウナ、露天風呂、ジェットバス、カラオケなどを備えたおしゃれなラブホテルまで、さまざまな施設があります。

新宿駅東口、西武新宿駅、東新宿駅、新宿三丁目駅から徒歩でアクセスできるホテルが多く、食事や映画、ショッピングを楽しんだあとのホテルデートにも便利です。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/24-267761.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/24-267775.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/24-267763.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/24-267764.webp"]'::jsonb, '2026-07-24'::timestamptz),
  ('https://matcha-jp.com/jp/27421', 'ja', 13, '東京の8月イベント・祭り8選！2026年の花火や阿波踊り', '2026年8月に東京で開催される祭りやイベントを紹介します。花火大会、阿波踊り、とうろう流し、七夕祭りなど、東京の夏を彩る催しを楽しめます。

8月の東京では、活気あふれる伝統行事や地域色豊かなイベントが各地で開催されます。

沿道から神輿に水をかける歴史ある祭り、六本木周辺で各地のグルメを味わえる納涼まつり、希少な花が咲く涼しい山へのおでかけなど、多彩な夏の体験を楽しめます。

うちわを片手に出かけたい、2026年8月に東京で開催される注目の祭り・イベント8選を紹介します。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267733.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267485.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267732.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267349.webp"]'::jsonb, '2026-07-24'::timestamptz),
  ('https://matcha-jp.com/jp/27394', 'ja', 13, '東京の7月イベント・祭り7選！2026年の花火や盆踊り', '2026年7月に東京で開催される祭りやイベントを紹介します。隅田川花火大会、盆踊り、七夕祭りなど、夏の旅行におすすめの催しを楽しめます。

蒸し暑い日中から少し涼しい夕方になると、歴史ある街並みや神社仏閣の境内が、夜店や太鼓の音、色鮮やかな提灯の明かりに包まれます。

夏の旅行プランを立てる際にチェックしておきたい、2026年7月に東京で開催されるおすすめの祭り・イベントを紹介します。

2026年は7月25日に開催され、約2万発の花火が東京の夜空を華やかに彩ります。東京スカイツリーと花火を一緒に眺められる場所もあり、東京らしい夏の夜景を楽しめます。', '["https://resources.matcha-jp.com/resize/720x2000/2019/07/18-81849.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/10-266930.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/16-267234.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/10-266929.webp"]'::jsonb, '2026-07-23'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;

-- ================================================= en
insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/en/6264', 'en', 20, 'Coriss Karuizawa: Japanese Lifestyle Boutique', 'Explore Japanese-made apparel, ceramics, and lifestyle items at Coriss Karuizawa, an inviting boutique housed inside a century-old former church near Ginza Dori.

As you walk from Karuizawa Station toward Kyu-Karuizawa Ginza Dori, the distinct facade of Coriss appears just off the main street. Nearly every product inside is crafted in Japan, featuring a thoughtful mix of apparel, socks, accessories, kitchen items, and ceramic tableware. Packed with well-designed, high-quality home and everyday goods, the shelves make it nearly impossible to leave empty-handed.

Driven by a passion for design, founders Mr. Tadashi and Mrs. Yuko Arai opened Coriss six years ago in their hometown. The shop resides inside a century-old former church, a historic space they filled with domestic goods and daily essentials that complement its original architecture.

"We bring in new stock every one to two weeks"—a simple statement that reflects the immense dedication behind running their dream boutique. To source unique lifestyle brands from across Japan, the couple travels almost weekly to meet local artisans and partner with regional makers.', '["https://resources.matcha-jp.com/resize/720x2000/2018/06/29-57298.webp","https://resources.matcha-jp.com/resize/720x2000/2018/06/29-57284.webp","https://resources.matcha-jp.com/resize/720x2000/2018/06/29-57283.webp","https://resources.matcha-jp.com/resize/720x2000/2018/06/29-57288.webp"]'::jsonb, '2026-06-12'::timestamptz),
  ('https://matcha-jp.com/en/27507', 'en', 29, '6 Best Restaurants in Nara: Savor Refined Japanese Cuisine', 'Savor the spirit of Nara—Japan''s ancient capital. Discover 6 Nara restaurants offering authentic local produce, fine sake, and cultural artistry.

As the cradle of Japanese culture and home to some of the nation''s oldest temples, Nara is a must-visit destination for anyone wishing to immerse themselves in Japan''s rich history.

Historically known as Yamato, this fertile region boasts a profound culinary heritage alongside its iconic heritage sites.

Beyond ancient heritage, Nara''s modern dining scene seamlessly weaves traditional techniques with innovative global concepts—from classic kaiseki (Japanese course cuisine) and hearth-cooked "ginshari" rice to refined French fusion and wood-fired dining.', '["https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268577.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268578.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268579.jpeg","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268580.jpeg"]'::jsonb, '2026-08-04'::timestamptz),
  ('https://matcha-jp.com/en/17804', 'en', 27, 'Osaka Day Trips: 15 Destinations Easily Accessed by Train', 'Discover the best day trips from Osaka: top destinations in Kyoto, Nara, Kobe, and Wakayama—all within 2 hours of Osaka Station. Includes travel times and tips.

Kyoto and Nara are just a short trip from Osaka—much like traveling between Yokohama and Tokyo.

Having lived in Osaka, I was surprised by how accessible both cities were and visited them frequently. Day trips to Kobe and Wakayama are also convenient.

This guide compiles the top Kansai destinations reachable within a two-hour one-way trip from Osaka.', '["https://resources.matcha-jp.com/resize/720x2000/2024/01/06-161032.webp","https://resources.matcha-jp.com/resize/720x2000/2024/01/06-161034.webp","https://resources.matcha-jp.com/resize/720x2000/2024/01/06-161033.webp","https://resources.matcha-jp.com/resize/720x2000/2024/01/06-161035.webp"]'::jsonb, '2026-08-07'::timestamptz),
  ('https://matcha-jp.com/en/27515', 'en', 13, 'MAPPA EXPO 2026: Chainsaw Man, Jujutsu Kaisen and More', 'MAPPA EXPO 2026 runs September 16–December 7 in Tokyo. Explore 23 anime titles, original artwork, life-size figures, exhibits, and exclusive goods.

Animation studio MAPPA will celebrate its 15th anniversary with a large-scale exhibition at YURAKUCHO MUSEUM in Tokyo from September 16 to December 7, 2026.

MAPPA EXPO 15th Anniversary will feature original animation drawings, production materials, immersive installations, life-size figures, exclusive illustrations, and merchandise from 23 works produced by the studio.

Highlights include dedicated areas for Chainsaw Man – The Movie: Reze Arc, Attack on Titan: The Final Season, and JUJUTSU KAISEN.', '["https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268549.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268548.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268547.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/07-268551.webp"]'::jsonb, '2026-08-07'::timestamptz),
  ('https://matcha-jp.com/en/27508', 'en', 27, 'Autumn-Limited mofusand Sweets Buffet at Hilton Osaka', 'Japan’s first mofusand sweets buffet brings around 20 adorable cat-themed desserts and savory dishes to a colorful sweets factory at Hilton Osaka.

Hilton Osaka’s Folk Kitchen will host Japan’s first "mofusand" sweets buffet from September 3 to December 27, 2026.

Titled "Sweets Buffet ~mofusand sweets factory~," the event transforms the venue into a factory-themed space featuring the popular, delightfully surreal cats surrounded by colorful treats.

Guests can enjoy roughly 20 desserts, including cat-themed creations like the Banana-Nyan Special Cake and Shark-Nyan Cake, alongside fruit-filled options like chestnut cakes and blueberry tarts.', '["https://resources.matcha-jp.com/resize/720x2000/2026/08/04-268395.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/04-268396.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/04-268393.webp","https://resources.matcha-jp.com/resize/720x2000/2026/08/04-268394.webp"]'::jsonb, '2026-08-04'::timestamptz),
  ('https://matcha-jp.com/en/27487', 'en', 27, 'JOJO''s Bizarre Adventure THE★JOJO WORLD OSAKA Opens in 2026', 'THE★JOJO WORLD OSAKA, Japan''s second permanent JOJO''s Bizarre Adventure store, opens at LUCUA SOUTH in Osaka''s Umeda district in winter 2026.

The permanent official experience-based specialty store THE★JOJO WORLD OSAKA, based on Hirohiko Araki''s manga series JOJO''s Bizarre Adventure, will open on the 10th floor of LUCUA SOUTH in Umeda, Osaka, in winter 2026.

THE★JOJO WORLD OSAKA will be the second permanent location following THE★JOJO WORLD, which opened at Shibuya PARCO in Tokyo in July 2025.

In addition to selling original merchandise, the store offers an immersive experience that allows visitors to step directly into the distinctive world of JOJO''s Bizarre Adventure.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268154.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268153.webp"]'::jsonb, '2026-08-04'::timestamptz),
  ('https://matcha-jp.com/en/6265', 'en', 20, 'Karuizawa Breakfast: Relax at Natural Cafeina', 'Relax at Karuizawa''s Natural Cafeina! Run by a former Maruyama Coffee barista and his wife, this cozy spot serves specialty French press coffee and quiche.

Imagine a wonderful bicycle ride or stroll through the summer resort town of Karuizawa, and making a stop by a charming local café to start your day. Natural Cafeina makes this a reality.

By removing the rush of daily life, Natural Cafeina welcomes guests with the faint aroma of fresh coffee, soothing background music, and a warm neighborhood atmosphere.

Grab a seat with a MATCHA editor and enjoy a refreshing, energizing breakfast!', '["https://resources.matcha-jp.com/resize/720x2000/2018/07/03-57554.webp","https://resources.matcha-jp.com/resize/720x2000/2018/07/03-57556.webp","https://resources.matcha-jp.com/resize/720x2000/2018/07/03-57555.webp","https://resources.matcha-jp.com/resize/720x2000/2018/07/03-57557.webp"]'::jsonb, '2026-06-12'::timestamptz),
  ('https://matcha-jp.com/en/21666', 'en', 2, 'Aomori Airport: Access, Nearby Attractions, and Souvenirs', 'Learn about Aomori Airport (AOJ) - from access to downtown and rental car info to duty-free shopping, top souvenirs, and nearby travel spots like Hirosaki Park.

The fastest and most convenient way to travel from Tokyo to Aomori is aboard the JR Tohoku Shinkansen (Hayabusa bullet train), which takes you directly from Tokyo Station to Shin-Aomori Station in roughly 3 to 3.5 hours.

A one-way ticket typically costs around 18,000 yen (120 USD), though the journey is fully covered for travelers using a Japan Rail Pass or JR East Pass. Once you arrive at Shin-Aomori, central Aomori Station is just a quick, 5-minute local train connection away.

Traveling by bullet train is also convenient if you depart from a destination in Hokkaido or eastern Japan.', '["https://resources.matcha-jp.com/resize/720x2000/2024/09/15-197577.webp","https://resources.matcha-jp.com/resize/720x2000/2024/09/15-197578.webp","https://resources.matcha-jp.com/resize/720x2000/2024/09/15-197579.webp","https://resources.matcha-jp.com/resize/720x2000/2024/09/15-197580.webp"]'::jsonb, '2026-08-04'::timestamptz),
  ('https://matcha-jp.com/en/27358', 'en', 13, 'GINZA SIX: Exclusive Tokyo Gifts and Gourmet Cuisine', 'Tokyo''s GINZA SIX is home to luxury brands, modern art, and gourmet food. Today we feature a refined Ginza experience through the unique charms of GINZA SIX―from premium gifts and gourmet dining at famous restaurants all the way to elegant cafes.

If your plan is to enjoy a day of shopping in Tokyo''s Ginza district, then you don''t want to miss one of the area''s iconic landmarks, GINZA SIX.

Housed inside this commercial facility are a wide range of irresistible attractions: from luxury brands representing the world, all the way to cosmetics and modern art. There are even fine dining restaurants and confectionery shops.

This facility consists of six basement floors and rises thirteen stories above ground. Nine floors within this complex are lined with a total of 240 shops.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266419.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266420.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266421.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266422.webp"]'::jsonb, '2026-07-30'::timestamptz),
  ('https://matcha-jp.com/en/27388', 'en', 13, 'Marunouchi Nights: Refined Dining and Bars by Tokyo Station', 'Enjoy an elegant night out near Tokyo Station. From upscale wine bistros to rooftop views at (marunouchi) HOUSE, discover the best night spots in Marunouchi.

The Marunouchi area in Tokyo is a historic district located just outside Tokyo Station''s Marunouchi Exits, on the east side of the Imperial Palace.

While the neighborhood bustles by day with its elegant boutiques, it is also an ideal destination for a night out, offering a wide array of upscale restaurants and bars that stay open late. Best of all, with Tokyo Station just steps away, you can relax and enjoy your evening without worrying about missing the last train.

In this article, we highlight a few spots perfect for experiencing the magic of Marunouchi at night, along with TOKYO AfterDark in Marunouchi—a series of nighttime events and activities running through August 14, 2026.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/09-266865.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/09-266826.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/09-266830.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267701.webp"]'::jsonb, '2026-07-09'::timestamptz),
  ('https://matcha-jp.com/en/27462', 'en', 13, 'The Apothecary Diaries Exhibition: Tokyo City View 2026', 'Visit Tokyo City View for The Apothecary Diaries collaboration (August 1–October 26). Enjoy anime exhibits, exclusive merch, and sky-high Tokyo views!

Tokyo City View, located on the 52nd floor of Roppongi Hills Mori Tower, is pairing its sweeping cityscape views with the hit TV anime series The Apothecary Diaries from August 1 to October 26, 2026.

Titled A World of Fantasy Woven by Dance — The Melody of Dance Resonating in the Sky, this first-ever collaboration fuses cutting-edge audiovisual technology with iconic scenes from the show.

At the entrance, visitors are greeted by a dynamic blend of panoramic city views and animation.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267925.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267926.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267928.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267929.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/en/27463', 'en', 13, 'Harajuku Yosakoi and KAWAII Night Market: Until August 30', 'Tokyu Plaza Harajuku Harakado hosts special summer events and a KAWAII Night Market (August 20–30) in collaboration with the Super Yosakoi Dance Festival.

The dual event pairs the lively energy of Kochi Prefecture''s iconic Yosakoi festival with a futuristic, colorful night market produced by pop-culture powerhouse ASOBISYSTEM.

Every year on August 29 - 30, Harajuku hosts the Super Yosakoi Festival, a spectacular dance festival that unfolds on Omotesando Avenue.

In collaboration with this event, Harakado presents a full lineup of activities.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267933.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267936.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267935.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267934.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/en/27422', 'en', 26, 'August Events and Festivals in Osaka, Kyoto, Nara, Kobe', 'Discover the best August festivals and events held in Kyoto, Osaka, Nara, and Kobe, including the famous Kyoto Gozan Okuribi Bonfire, the Nara Tokae Lantern Festival, and the Lake Biwa Fireworks Festival.

The highlight of August in Japan is Obon, a mid-month period of traditional events held to honor departed ancestors.

The Kansai region—home to Osaka, Kyoto, Nara, and Kobe—hosts several iconic festivals that offer a deep dive into Japanese culture.

Major events include Kyoto''s Daimonji Gozan Okuribi, where massive bonfires light up five mountains surrounding the city, the Nara Tokae Lantern Festival, which fills Nara Park with 20,000 flickering candles, and the spectacular Lake Biwa Fireworks Festival.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267741.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267742.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267743.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267744.webp"]'::jsonb, '2026-07-17'::timestamptz),
  ('https://matcha-jp.com/en/27466', 'en', 13, 'Tim Burton''s Labyrinth Makes Japan Debut in Tokyo', 'Step inside the imaginative worlds of Edward Scissorhands, Beetlejuice, and The Nightmare Before Christmas at Tim Burton''s Labyrinth in Tokyo, from November 25.

After attracting more than one million visitors worldwide, the acclaimed immersive exhibition Tim Burton''s Labyrinth is finally making its way to Japan.

Running from November 25, 2026, to February 21, 2027, the exhibition will be held at CREVIA BASE Tokyo in Toyosu.

Following successful runs in Spain, France, Belgium, Germany, Italy, and Mexico, this marks the exhibition''s Japan and Asia debut, as well as Tim Burton''s first exhibition in Japan in around a decade.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267949.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267950.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267947.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267948.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/en/4118', 'en', 2, 'Winter Day-Trip to Towada: Art, Waterfalls, Aomori Cuisine', 'Discover the charm of Towada (Aomori) in winter! Explore snow-covered outdoor art, frozen waterfalls along the Oirase Gorge, and local cuisine like apple pizza and Towada Barayaki Sautéed Beef.

Towada City in Aomori Prefecture is a charming blend of modern art and breathtaking nature.

Home to the Towada Art Center, a contemporary museum showcasing world-renowned artists, Towada is also where the scenic Oirase Gorge is located. Visitors can also indulge in authentic local cuisine made with the region’s abundant fresh produce.

We took a winter day trip to Aomori to experience Towada’s perfect mix of art, nature, and exquisite food.', '["https://resources.matcha-jp.com/resize/720x2000/2017/03/03-20367.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/03-20368.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/03-20369.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/03-20370.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/en/11008', 'en', 2, 'Aomori Apple Tour in Hirosaki: Orchards, Tearoom, and Pies', 'Enjoy an "Apple Stroll" through Hirosaki in northern Japan. Tour local orchards, taste artisanal apple pies, and shop for unique Aomori souvenirs at A-Factory.

Mention Aomori, and the first thing that comes to mind is its famous apples—plump, rosy, crisp, and juicy. As Japan’s leading apple producer, Hirosaki City boasts not only breathtaking natural scenery but also a rich, deep-rooted apple culture.

Join us on an "Apple Tour" through Hirosaki as we explore the orchards at Hirosaki Apple Park, indulge in apple-infused dishes and desserts at a local tearoom, and stop by a standout pastry shop.

Table of Contents Hirosaki Apple Park: Discover How Aomori Apples Are Grown Taisho Roman Tearoom: Try Apple Curry and Seasonal Desserts Jardin Pastry Shop: Taste Award-Winning Apple Pies Hirosaki Apple Park: Discover How Aomori Apples Are Grown Hirosaki Apple Park is home to around 1,300 trees across 65 apple varieties. In the park''s hands-on orchard, you can tour the grounds and try your hand at real farming tasks—like thinning fruit, bagging, and leaf-trimming—to learn what it takes to grow these famous apples.', '["https://resources.matcha-jp.com/resize/720x2000/2022/01/06-119710.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/06-119711.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/06-119716.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/06-119715.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/en/7832', 'en', 2, 'Oirase Gorge in Aomori: Waterfall Hiking Trail to Lake Towada', 'Aomori’s Oirase Gorge is one of the best hiking destinations in Japan. Discover stunning waterfalls, best times for autumn foliage, and practical travel tips.

Towada is located in the inland region of southeastern Aomori Prefecture. Known for its quiet, sparsely populated landscapes, sightseeing here revolves around scenic mountain walking trails.

The undisputed highlight is the Oirase Mountain Stream—a destination famed for offering "a new view with every step."

Stretching 14 kilometers through lush virgin forest, this trail guides you alongside crystal-clear waterfalls and rushing torrents. Keep your camera ready, as native wildlife like squirrels and small deer frequently make an appearance along the path.', '["https://resources.matcha-jp.com/resize/720x2000/2019/08/24-84496.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/24-84497.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/24-84495.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/24-84494.webp"]'::jsonb, '2026-07-28'::timestamptz),
  ('https://matcha-jp.com/en/27369', 'en', 12, 'Narita Gion Festival: 5 Must-See Highlights and Experience Tour', 'Discover the Narita Gion Festival near Tokyo! Explore 5 must-see highlights and an immersive experience tour that lets you join the floats firsthand.

Held every year over a weekend in early July, the Narita Gion Festival boasts more than 300 years of history. As one of Chiba’s most iconic summer events, it draws roughly 450,000 visitors annually, transforming the entire temple town with electrifying energy and passion.

Spanning three days, the festival comes alive with traditional music, lively dancing, and ornate floats, all driven by the intense energy of its participants.

Deeply rooted in historic Japanese culture, the celebration unfolds in downtown Narita—just minutes from Narita Airport—making it an unmissable stop for international travelers.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267470.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267578.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267474.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267466.webp"]'::jsonb, '2026-07-27'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;

-- ================================================= ko
insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/ko/27324', 'ko', 14, '요코하마 에어 캐빈 완전 정복: 사쿠라기초역-운하파크역 가는 법, 요금 및 코스모 클락 세트권 할인, 추천 관광 코스 총정리', '요코하마의 랜드마크 도심형 케이블카 ''요코하마 에어 캐빈(YOKOHAMA AIR CABIN)''의 모든 정보를 전해드립니다! 사쿠라기초역과 운하파크역 승강장 위치 및 이동 소요시간, 편도 vs 왕복 티켓 스마트 선택 요령, 해상 인도교 기샤미치 도보 추천 코스, 대관람차 코스모 클락 21 세트권 할인 팁을 정리했습니다. 아카렌가 창고, 월드 포터즈, 컵누들 뮤지엄 등 하차 후 즐길 수 있는 주변 핵심 관광지 정보와 대기 없이 바로 타는 KKday 사전 할인 예매 방법까지 확인해 보세요.

요코하마 에어 캐빈(YOKOHAMA AIR CABIN)은 사쿠라기초역과 운하파크역을 연결하는 일본 최초의 상설 도시형 케이블카(로프웨이)입니다.

편리한 이동 수단일 뿐만 아니라, 미나토미라이의 아름다운 거리 풍경과 바다를 한눈에 조망할 수 있는 인기 관광 어트랙션으로도 큰 사랑을 받고 있습니다.

본 기사에서는 탑승장 찾아가는 법부터 요금, 알뜰한 세트권 정보, 그리고 주변의 인기 관광 명소까지 상세히 해설해 드립니다. 방문 전에 미리 루트를 파악해 두시면 더욱 매끄럽고 알찬 요코하마 여행을 즐기실 수 있습니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/24-265992.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/24-265983.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/24-265984.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/24-265985.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/27287', 'ko', 23, '나고야 레고랜드 요금 총정리: 1일권 vs 콤보 티켓 비교, 연간 패스포트 종류 및 KKday 온라인 사전 할인 예매 팁', '나고야 인기 테마파크 ''레고랜드 재팬(LEGOLAND Japan)''의 최신 요금제와 할인 꿀팁을 전해드립니다! 6단계로 변동되는 1일 패스포트 요금 비교부터 수족관 씨라이프 콤보 티켓 정보, 혜택 가득한 연간 회원권 종류(위크데이・스탠다드・프리미엄), 대기 시간을 줄여주는 ''스킵 패스'' 가격, 그리고 현장 구매 수수료(500엔)를 아끼고 할인 혜택과 포인트까지 챙길 수 있는 KKday 사전 예약 방법까지 완벽하게 안내합니다.

아이들의 환한 미소를 보고 싶어 여행 계획을 세우다가도, 티켓 종류가 너무 많고 요금 체계가 복잡해 고민하셨던 분들이 많으실 겁니다. 사실 티켓 구매 방식을 조금만 달리해도 훨씬 저렴하게 티켓을 손에 넣을 수 있습니다. KKday와 같은 온라인 예약 서비스를 통해 사전에 티켓을 구매하면 현장 창구보다 알뜰하게 구매할 수 있고, 모바일 QR코드만으로 당일 간편하고 신속하게 입장할 수 있습니다.

본 기사에서는 레고랜드의 다양한 티켓 종류와 요금 비교부터 가장 저렴하게 예매하는 꿀팁까지 알기 쉽게 소개해 드립니다.

레고랜드 재팬의 입장 요금은 방문 날짜의 혼잡도에 맞춰 총 6단계의 요금 구간이 설정되어 있습니다. 평일 오프피크(비성수기) 시즌에는 비교적 저렴하고 여유롭게 입장할 수 있는 반면, 주말이나 공휴일 및 대형 연휴 등 피크 시즌에는 요금이 높게 책정되는 시스템입니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/15-265475.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/15-265476.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/15-265477.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/15-265478.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/27286', 'ko', 23, '나고야 레고랜드 가는 법 총정리: 나고야역 출발 아오나미선 전철, 주차장 정보, 택시 요금 및 입장권 예약 팁', '나고야 인기 테마파크 ''레고랜드 재팬 리조트(LEGOLAND Japan)''로 가는 최적의 교통편을 상세히 정리했습니다! 나고야역에서 최단 24분 만에 직행하는 아오나미선 타는 법, 렌터카 드라이브 시 긴조후토 입체 주차장 이용 및 요금 정보, 무거운 캐리어 및 자녀 동반 시 추천하는 택시 승강장별 코스, 그리고 현장에서 기다리지 않고 즉시 입장할 수 있는 KKday 모바일 선매권 예약 링크까지 완벽하게 안내해 드립니다.*

레고랜드는 전 세계에서 사랑받는 대표적인 지능 발달 완구인 ''레고(LEGO)''의 세계를 현실에서 경험할 수 있는 테마파크입니다. 레고라고 하면 ''자신이 원하는 대로 자유롭게 모양을 만드는 장난감''인 만큼, 그 세계관에 걸맞게 관람객들이 스스로 모험을 즐길 수 있는 참여형 어트랙션이 가득합니다. 레고 완구의 권장 연령대인 어린이들이 생애 처음으로 즐기기에 가장 완벽한 테마파크로 손꼽히며, 특히 자녀를 동반한 가족 단위 방문객들에게 높은 인기를 자랑합니다. 대기 없이 바로 입장! 레고랜드 사전 예매 티켓 구매하기

나고야역에서 레고랜드까지는 전철, 자동차, 택시 중 어떤 교통수단을 이용하더라도 약 30분 안팎이면 도착할 수 있습니다. 레고랜드가 있는 긴조후토는 나고야항 연안에 위치해 있어 어떤 이동 수단을 선택하더라도 접근성이 매우 뛰어난 편입니다.

나고야역은 도카이도 신칸센은 물론 메이테쓰, 긴테쓰, JR선 및 지하철 등 다양한 철도 노선이 한데 모이는 초대형 터미널역입니다. 전철로 이동하실 경우, 이용하게 될 ''아오나미선(あおなみ線)'' 승강장은 나고야역 다이코 도리측 출구(서쪽 출구) 방향에 위치해 있습니다. 택시 승강장의 경우 다이코 도리 출구와 사쿠라도리 출구(동쪽 출구) 양쪽에 모두 마련되어 있으며, 어떤 경로로 레고랜드까지 이동할지에 따라 이용할 개찰구를 선택하는 것이 좋습니다. 일반 국도를 따라 이동하려면 나고야역 다이코 도리 출구 쪽에서, 고속도로를 경유해 빠르게 가려면 사쿠라도리 출구 쪽에서 택시를 타면 한결 수월합니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/14-265457.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/14-265466.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/14-265464.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/14-265465.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/27310', 'ko', 9, '닛코 도쇼구 입장료 가이드: 단독권 vs 보물관 세트 할인 비교, 현장 카드 결제 및 KKday 사전 예매 팁', '일본 도치기현 세계문화유산 ''닛코 도쇼구(日光東照宮)''의 최신 입장료 정보를 총정리했습니다! 단독 입장권(1,600엔)과 실속 있는 보물관 세트권(2,400엔)의 차이를 비교해 드립니다. 현금 결제만 가능한 현장 매표소 대신 간편하게 카드로 사전 결제하고 실물 교환으로 대기 시간을 아끼는 KKday 온라인 예매 꿀팁, 포인트 혜택, 장애인 복지 할인 정보까지 상세하게 알아보세요.

닛코 도쇼구 단독 입장권으로는 오모테몬(정문)부터 요메이몬, 하이덴(배전), 이시노마, 네무리네코가 있는 동쪽 회랑, 오쿠미야, 그리고 울음룡 천장화가 있는 혼지도(약사당) 등을 참배하고 관람하실 수 있습니다.

닛코 도쇼구 단독 입장권은 개인 요금과 단체 요금으로 나뉘며, 1~34명 규모의 개인은 1,600엔, 35명 이상의 단체는 1,440엔입니다 (2026년 6월 기준 요금이며, 추후 변동될 수 있습니다).

시기 및 요일에 따라 제례 의식이나 도쇼구 자체 행사가 진행되거나 복원 및 보수 공사가 진행되는 경우 일부 관람 구역이 제한될 수 있습니다. 방문 전 공식 홈페이지나 문의 창구를 통해 미리 확인해 보시는 것을 권장합니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/21-265740.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/21-265738.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/21-265736.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/21-265737.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/27308', 'ko', 24, '토바 수족관 가는 법 총정리: 도쿄・오사카・나고야 출발 전철 경로, 공항 리무진, 렌터카 주차 요금 및 모바일 예매 팁', '일본 최대 규모 사육 종수를 자랑하는 미에현 ''토바 수족관(鳥羽水族館)''의 교통편을 전격 비교 분석합니다! 도쿄, 오사카, 나고야에서 긴테쓰 전철 및 프리미엄 특급 ''시마카제''를 타고 가는 추천 경로와 함께 이세신궁 연계 당일치기 꿀팁, 공항 고속선 탑승 정보, 자동차 렌트 시 고속도로 요금 및 주차장 이용안내, 당일 취소 가능한 KKday 모바일 입장권 예매 링크까지 한 번에 정리했습니다.

대중교통인 전철과 비행기, 그리고 자가용이나 렌터카를 이용한 이동 방법이 대표적입니다.

가장 가까운 역은 JR·긴테쓰 ''토바역(鳥羽駅)''이며, 수족관까지는 도보로 약 10분 거리입니다. 전철이나 비행기를 이용해 방문하시는 분들은 우선 토바역을 목표로 이동하시는 것이 좋습니다.

또한, 입장할 때 유용한 것이 바로 사전에 간편하게 구매할 수 있는 모바일 전자 티켓입니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265861.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265855.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265852.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265854.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/22315', 'ko', 9, '도쿄에서 닛코 동조궁(도쇼구) 가는 방법 완벽 가이드: 전철・신칸센・버스투어 당일치기 루트 및 주변 명소 총정리', '도쿄에서 출발하는 세계유산 닛코 동조궁(도쇼구) 당일치기 교통편 총정리! 아사쿠사발 도부 특급, 신칸센, 직행 버스 및 가성비 버스 투어 일정을 비교 분석합니다. 하네다 공항에서 가는 법, 주차장 정보, 가장 가까운 역에서의 이동 수단(버스・택시・도보)과 주변 인기 명소인 게곤 폭포, 주젠지호 정보까지 한눈에 확인해 보세요!

도쿄 지역에서 세계유산인 닛코로 향하는 대표적인 교통편 3가지를 소개합니다. 이동 수단마다 저마다의 매력과 장점이 있어 여행 목적에 따라 알맞게 선택할 수 있습니다. 이동 시의 쾌적함이나 운임, 소요 시간을 비교해 보면 나에게 딱 맞는 경로를 찾을 수 있습니다. 또한, 현지에서의 일정도 함께 고려하여 선택하면 더욱 만족도 높은 여행을 완성할 수 있습니다. 그럼 각 경로의 상세한 내용을 구체적으로 살펴보겠습니다.

아사쿠사역에서 도부선 특급 열차에 탑승하면 도부닛코역까지 환승 없이 도착할 수 있습니다. 소요 시간은 약 1시간 50분이며, 운임과 특급 요금을 합쳐 성인 편도 3,000엔대부터 이용할 수 있습니다. 창밖으로 서서히 변해가는 아름다운 풍경을 감상하는 시간은 기차 여행만의 특별한 묘미입니다. 한편, 도쿄역이나 우에노역에서 출발하는 경우에는 도호쿠 신칸센을 타고 우선 우쓰노미야역으로 이동합니다. 그곳에서 JR 닛코선으로 환승하여 닛코역으로 향하는 경로입니다. 신칸센을 이용하면 매우 빠르게 이동할 수 있어 장거리 이동으로 인한 피로를 최소화할 수 있습니다. 우쓰노미야역에서의 환승을 포함해도 약 2시간이면 도착하므로, 시간을 효율적으로 쓰고 싶은 분에게 가장 적합합니다.

도쿄역 출발: 도호쿠 신칸센으로 우쓰노미야역으로 이동 후, JR 닛코선으로 환승하여 닛코역으로 (소요 시간: 약 1시간 40분 ~ 2시간)', '["https://resources.matcha-jp.com/resize/720x2000/2024/10/29-206393.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/24-265988.webp","https://resources.matcha-jp.com/resize/720x2000/2024/10/29-206401.webp","https://resources.matcha-jp.com/resize/720x2000/2025/05/16-233642.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/27309', 'ko', 9, '아시카가 플라워파크 입장료 총정리: 팁 가득한 변동 요금제 분석, 카드 결제 및 예매 할인 방법 5선', '일본 도치기현 명소 ''아시카가 플라워파크''의 실시간 변동 입장료 시스템과 저렴한 시기를 전격 비교합니다! 현금만 가능한 현장 매표소 대신 KKday로 카드 결제하고 대기 없이 입장하는 법, 100~200엔 할인 팁, 이메일 회원 혜택, 연간 패스포트 정보까지 알뜰한 여행 팁을 지금 바로 확인해 보세요!

봄·여름·가을·겨울의 꽃들이 일루미네이션, 음악, 영상 등과 어우러져 아름다운 세계를 만들어내는 ''아시카가 플라워파크''. 특히 겨울 일루미네이션은 일본 전국 랭킹 1위 단골로 꼽히며, 전국적으로도 인지도가 매우 높은 인기 관광 명소입니다.

또한 아시카가 플라워파크는 꽃의 개화 상황에 따라 매일 입장료가 변동되는 관광지로도 유명합니다. 하지만 예매 팁을 미리 알고 있다면 사전에 온라인으로 간편하게 구매할 수도 있습니다.

예를 들어 KKday를 이용하면, 현장 창구에서는 현금으로만 결제해야 하는 입장권을 신용카드나 간편결제(QR코드 결제) 등으로 편리하게 지불할 수 있습니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/22-265821.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265846.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265847.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/23-265849.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/5786', 'ko', 27, '[2026 최신] 유니버셜 스튜디오 재팬(USJ) 완벽 가이드: 10대 테마 구역 지도, 입장권&익스프레스 패스, 닌텐도 월드 대기 없이 즐기는 꿀팁 및 추천 호텔 총정리', '2026년 최신 유니버셜 스튜디오 재팬(USJ) 완벽 공략법! 10대 테마 구역 상세 분석부터 슈퍼 닌텐도 월드 신규 어트랙션 ‘동키콩의 미친 광산차’ 탑승 꿀팁, 입장권 및 익스프레스 패스 구매 가이드, 숨은 맛집과 필수 쇼핑 리스트까지. 공식 앱 활용 대기 시간 단축 비법과 인기 파트너 호텔 추천으로 초보자도 완벽하게 즐길 수 있는 USJ 여행을 계획해 보세요!

유니버셜 스튜디오 재팬은 현재 총 10개의 테마 구역으로 구성되어 있으며, 각 구역마다 독특한 영화 세계관과 시각적 충격을 선사합니다. 입장하기 전에 이 요약 지도를 미리 파악하여 동선에서 길을 잃지 않도록 대비하세요!

1930년대 뉴욕의 클래식한 거리 풍경을 완벽하게 재현한 구역입니다. 우아한 벽돌 벽과 고풍스러운 건물들이 늘어서 있어 멋진 사진을 남기기에 제격입니다. 브로드웨이의 활기찬 분위기가 가득하며, 기간 한정 이벤트나 클래식 캐릭터들과의 만남이 이루어지는 인기 장소이기도 합니다. 거닐다 보면 마치 헐리우드 영화 속에 들어온 듯한 기분을 만끽할 수 있습니다.

파크 정문을 들어서면 가장 먼저 마주하게 되는 화려한 구역입니다! 가득한 야자수와 클래식 명차들이 할리우드 명예의 거리의 전성기를 재현합니다. 배경음악을 직접 선택하여 탈 수 있는 ''할리우드 드림 더 라이드''를 비롯해 대형 기념품 플래그십 스토어들이 모여 있어, 하루의 마지막 일정으로 쇼핑을 즐기기에 완벽한 장소입니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/07-266553.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/07-266554.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/07-266558.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/07-266556.webp"]'::jsonb, '2026-07-15'::timestamptz),
  ('https://matcha-jp.com/ko/26436', 'ko', 13, '다카오산을 처음 방문하시는 분들을 위해: 즐거운 등반을 위해 미리 알아두면 좋은 다섯 가지', '다카오산은 세계에서 가장 인기 있는 등산 코스 중 하나입니다. 울창한 자연에 둘러싸여 있어 도심과 가깝다는 사실이 믿기지 않을 정도입니다. 산속에 있는 야쿠오인 절은 승려들이 여전히 밤낮으로 수행하며 자연과 기도가 어우러지는 특별한 곳입니다. 다카오산을 제대로 즐기기 위해 알아두면 좋은 다섯 가지를 소개합니다.

도쿄 중심부에서 기차로 서쪽으로 약 1시간 거리에 있는 도쿄 하치오지에 위치한 다카오산은 도심과 매우 가깝다는 사실이 믿기지 않을 정도로 풍부한 자연으로 둘러싸인 산입니다. 또한 매년 약 3백만 명의 방문객이 찾는 세계에서 가장 인기 있는 산 중 하나입니다.

다카오산구치역에 처음 내리면 많은 사람들이 놀라며 "여기가 정말 도쿄인가?"라고 생각할 것입니다.

다카오산은 풍부한 자연을 자랑할 뿐만 아니라, 야쿠오인 절을 중심으로 한 ''기도의 산''으로서의 역사도 간직하고 있습니다. 고마 수련과 슈겐도 문화가 오늘날까지 이어져 내려오고 있으며, 자연과 신앙이 한데 어우러져 있는 이곳이 바로 다카오산을 특별하게 만드는 요소입니다.', '["https://resources.matcha-jp.com/resize/720x2000/2025/12/17-253077.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/16-253072.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/16-253073.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/16-253075.webp"]'::jsonb, '2026-01-22'::timestamptz),
  ('https://matcha-jp.com/ko/26720', 'ko', 27, '오디오 가이드 "RUN RUN LEARN"을 들으며 오사카 성 주변을 뛰어다니면서 역사를 배워보세요.', '오사카성은 오사카에서 가장 유명한 관광 명소 중 하나입니다. 도심 한복판에 자리 잡은 이곳은 역사와 자연이 어우러진 곳으로, 관광 명소일 뿐만 아니라 러닝 코스로도 인기가 높습니다. 오디오 가이드를 통해 "역사를 들으며 달리는" 새로운 경험을 소개해 드리겠습니다.

오사카성은 오사카의 상징입니다. 오사카 관광객들이 꼭 방문해야 할 명소인 오사카성을 거닐다 보면 400년이 넘는 역사의 흔적이 담긴 거대한 석벽과 해자 끝에 우뚝 솟은 장엄한 성문루를 마주하게 됩니다. 이곳은 역사의 낭만이 가득한 공간으로, 오랜 세월 동안 축적된 역사의 숨결을 느낄 수 있는 곳입니다.

오사카성을 방문하면 돌담과 해자를 따라 가볍게 달리는 관광객과 러너들을 만날 수 있습니다. 오사카성은 관광 명소로 유명하지만, 아침저녁으로 많은 러너들이 찾는 인기 러닝 코스이기도 합니다.

오사카 성에서 새로운 경험이 시작되었습니다. 바로 달리면서 역사를 "듣는" 것입니다. 오디오 가이드 "RUN RUN LEARN | 오사카 성 러닝 스루 타임"은 마치 여행 스토리텔러처럼 역사 이야기를 들려주며, 관광 달리기를 더욱 특별하게 만들어 줍니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/02/07-258028.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/07-258029.webp"]'::jsonb, '2026-02-07'::timestamptz),
  ('https://matcha-jp.com/ko/26849', 'ko', 12, '나리타공항 제1터미널 리뉴얼! 족욕, 다다미 공간, 대나무 숲 디지털 아트 등 일본만의 전통 문화와 첨단 기술의 융합을 선보이다', '이번 나리타공항 제1터미널（T1）의 일부가 리뉴얼되어, 일본의 정취를 체험할 수 있는 ''SHIKISAI GARDEN -Seasonal colors-''가 탄생했습니다. 본 기사에서는 디지털 아트와 족욕, 벚꽃과 비행기를 함께 조망할 수 있는 구역 등 총 6개 구역을 현지 취재를 통해 소개합니다.

리뉴얼 공간은 출국 심사 전 일반 구역인 4층 복층 부분과 5층 대부분으로, 면적은 약 8,000㎡에 달합니다. 일본 특유의 사계절 색채를 나타내는 ''시키사이(四季彩, 사계의 색)''와 편안하게 쉴 수 있는 ''가든(GARDEN)''을 결합한 새로운 공간, ''SHIKISAI GARDEN -Seasonal colors-''로 거듭났습니다.

컨셉에 맞춘 6개의 구역은 단순히 비행기를 기다리는 시간을 ''일본 문화를 깊이 체감하며 여행을 마무리하는 과정''으로 승화시켜 줄 것입니다.

"방문객들이 일본을 느끼며 공항에서의 시간 그 자체를 즐기길 바란다"는 마음을 담아 완성된 곳이 바로 ''SHIKISAI GARDEN -Seasonal colors-''입니다. 이 광활한 구역을 하나로 잇는 핵심 요소는 ''물의 흐름''과 ''사계절''입니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262458.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262459.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262454.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262455.webp"]'::jsonb, '2026-04-09'::timestamptz),
  ('https://matcha-jp.com/ko/26780', 'ko', 12, '활주로 바로 옆에서 즐기는 꽃구경? 오직 나리타 공항에서만 만끽할 수 있는 ‘벚꽃과 비행기’의 극상 세리머니, 그 현장 리포트', '나리타 공항은 활주로 인근에서 흐드러진 벚꽃을 감상할 수 있는 특별한 공간입니다. 올봄, 그 매력을 온몸으로 체감할 수 있는 뜻깊은 행사가 열렸습니다. 이 글에서는 초청객과 미디어에게만 제한적으로 공개되었던 그날의 풍경을 담아냈습니다. 만개한 벚꽃 아래, 거대한 기체와 나리타의 전통 예술이 묘한 조화를 이루며 공명하는 모습은 세계 어디에서도 찾아볼 수 없는 호화로운 하루를 선사했습니다.

2026년 4월 9일(목), ‘나리타 국제공항 제1여객터미널 5층 SHIKISAI GARDEN 리뉴얼 오픈’을 기념하여, 활주로 바로 옆에서 만개한 벚꽃을 감상하는 세계 어디에서도 유례를 찾아볼 수 없는 호사스러운 행사가 개최되었습니다.

초대객과 언론만이 참석한 단 하루뿐인 특별한 행사의 풍경을, 현지 취재를 통해 상세히 전해드립니다.

나리타 공항이 탄생하기 전, 이곳에는 황실을 위한 ‘시모사 고료 목장’이 드넓게 펼쳐져 있었습니다. 봄이 되면 일대는 벚꽃 명소로 활기를 띠며, 10만 그루의 벚꽃을 보러 총 20만 명에 달하는 구경객이 발걸음했다고 전해집니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262437.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/17-258922.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262438.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262447.webp"]'::jsonb, '2026-03-28'::timestamptz),
  ('https://matcha-jp.com/ko/26598', 'ko', 31, '[돗토리] 다이센과 히노가와를 따라 펼쳐지는 산과 바다의 절경, 그리고 미식으로의 치유 여행', '돗토리현 서부에서 중부에 이르는 다이센 산기슭과 히노가와 유역은 발길 닿는 곳마다 절경이 가득합니다. 이 글에서는 서쪽에서 동쪽으로 향하며 사카이미나토시, 요나고시, 히에즈촌, 호키초, 고토우라초, 구라요시시를 유람하는 여행길을 제안합니다. 만화가 미즈키 시게루의 자취가 서린 명소부터 바닷가 온천, 다이센 산자락의 풍경, 그리고 역사적 정취가 흐르는 거리까지 온전히 만끽할 수 있는 여정입니다.

다이센 산기슭과 히노가와 유역은 일본해와 주구 산지 사이에 안겨 있어, 산과 바다의 절경을 동시에 품고 있는 곳입니다. JR 산인 본선과 국도 9호선이 서쪽에서 동쪽으로 시원하게 뻗어 있으며, 오카야마나 시마네 방면에서의 접근성도 훌륭합니다. 철도나 렌터카를 이용해 가벼운 마음으로 둘러볼 수 있다는 점 또한 이곳의 매력입니다.

이 지역을 상징하는 존재를 꼽으라면 단연 일본의 100대 명산 중 하나인 ‘다이센(大山)’과 그 발원지에서 흘러드는 ‘히노가와’일 것입니다. 일본해에서 산간으로 이어지는 이 땅에는 산과 강, 그리고 마을의 삶이 너르게 펼쳐져 있으며, 풍요로운 자연과 함께 일구어 온 역사 깊은 풍경이 고스란히 남아 있습니다.

사계절의 축복 또한 빼놓을 수 없습니다. 등산과 온천, 해안 산책은 물론 지역 축제까지 즐길 수 있어, 방문하는 계절마다 저마다의 다른 얼굴을 마주하게 됩니다. 특히 물이 맑기로 유명하여 지사케(지역 술) 문화와 양조장, 향토 요리 또한 다채롭게 발전해 왔습니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/01/20-256109.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/26-259734.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/26-259735.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/26-259737.webp"]'::jsonb, '2026-02-26'::timestamptz),
  ('https://matcha-jp.com/ko/26628', 'ko', 31, '【돗토리】 다이센 기슭과 히노강 유역의 원풍경으로, 도심의 소란을 뒤로하고 자연을 만끽하는 느긋한 여행', '돗토리현의 다이센 기슭과 히노강 유역 일대에는 레트로한 역사와 금전운을 불러주는 신사, 사계절 내내 즐거움을 선사하는 플라워 파크, 그리고 따스한 온천에 이르기까지 매력적인 명소들이 가득합니다. 이번 기사에서는 번잡한 일상을 벗어나 마음 깊은 곳까지 휴식을 선사할 다이센 기슭과 히노강 유역의 치유 공간들을 소개해 드립니다.

다이센 기슭과 히노강 유역의 상징이자 일본 100대 명산 중 하나인 다이센(大山)은 이 지역을 대표하는 존재입니다. 다이센의 능선과 그 기슭을 흐르는 히노강이 빚어내는 남북 지역에는 산과 강뿐만 아니라 들판과 마을, 그리고 정겨운 집락의 풍경이 펼쳐져 있습니다. 풍요로운 자연과 유구한 역사가 겹쳐지며 이곳만의 독특한 경관을 자아냅니다.

다이센 주변에는 사계절의 축복을 듬뿍 받아 등산과 온천, 해안 산책, 지역 축제 등 계절마다 다채로운 즐거움이 기다리고 있습니다. 또한 맑고 깨끗한 물 덕분에 지사케(지역 술) 문화와 양조장이 발달하였고, 향토 요리 역시 풍성하게 꽃을 피웠습니다.

이번 기사에서는 대표적인 명소는 물론, 아직 잘 알려지지 않은 숨은 명소까지 폭넓게 소개해 드립니다. 북적이는 활기 속의 매력은 물론, 인파를 벗어난 정적 속에서 분주한 일상을 잠시 잊어보시는 건 어떨까요. 자연에 안겨 마음이 온전히 채워지는 ''치유의 휴일''을 보내실 수 있을 것입니다.', '["https://resources.matcha-jp.com/resize/720x2000/2026/01/28-256843.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/25-256630.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/26-259754.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/25-256631.webp"]'::jsonb, '2026-02-26'::timestamptz),
  ('https://matcha-jp.com/ko/19452', 'ko', 47, '【babycal】 유모차를 대여하여 오키나와 여행에 나가자!', '오키나와현에서도 유모차의 렌탈 서비스 「babycal」을 이용하실 수 있게 되었습니다. 「babycal」을 이용하면, 비행기의 짐 제한에 신경쓰지 않고, 가볍게 여행에 갈 수 있습니다. 오키나와에 외출할 때는 여행을 쾌적하게 즐길 수 있도록 "babycal"을 활용하십시오.

2021년부터 시작된 새로운 서비스 「babycal」이란 예약이 가능한 유모차 대여 서비스입니다

요금은 지점마다 다르지만, 일반적으로 첫 1시간은 250~500엔부터 시작하며, 이후 30분당 100엔이 추가됩니다. 장시간 이용을 계획하시더라도 최대 12시간 1,500엔까지 청구되므로 안심하고 이용하실 수 있습니다.

쇼핑 시간이나 대기 시간 등 1시간만의 단시간 이용도 OK이므로 꼭 부담없이 사용해보세요.', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177479.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177485.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177480.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177482.webp"]'::jsonb, '2024-04-26'::timestamptz),
  ('https://matcha-jp.com/ko/18371', 'ko', 13, '【편리】 소중한 아기와의 여행은 유모차 대여 서비스 “babycal”을 활용', '관광지나 도시부(도쿄, 아사쿠사, 오사카, 교토, 요코하마, 하카타 등)에 있어서의 유모차의 상황을 소개해, 외출처에 자유롭게 꺼낼 수 있는 유모차 렌탈 서비스 「babycal 」 에 대해 소개합니다. 를 활용하면 쾌적한 여행이 될 것 틀림없습니다.

시설이나 건물 안의 이용 장소가 한정된 유모차는 있습니다만, 자유롭게 밖으로 반출할 수 없습니다

최대 하중 120kg: KJP-5(휠체어), NOPO(휠체어) 최대 하중 100kg: NEO-2(휠체어)

[가격] 첫 1시간 250엔, 이후 30분당 100엔, 12시간까지 1,500엔, 이후 30분당 100엔', '["https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166066.webp","https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166069.webp","https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166084.webp","https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166085.webp"]'::jsonb, '2024-02-09'::timestamptz),
  ('https://matcha-jp.com/ko/26638', 'ko', 12, '나리타 공항 근처 벚꽃 명소 5선! 나리타산 공원과 사쿠라 성터 공원 등', '나리타 공항 주변에서 벚꽃놀이를 즐길 수 있는 숨은 명소를 엄선했습니다. 나리타시・사가라시의 혼잡을 피하고 여유롭게 보낼 수 있는 추천 공원 5곳을 소개합니다. 접근 정보와 볼거리를 알기 쉽게 해설합니다.

나리타공항 근처에 있는 치바현의 나리타시와 사쿠라시에는 훌륭한 벚꽃 명소가 있습니다. 지역 주민들에게 사랑받는 동시에 관광객이 많이 몰리는 경우는 드물어 조용히 꽃구경을 즐기기에 최적입니다。

나리타·사쿠라의 벚꽃 개화 시기는 보통 3월 하순에서 4월 초순으로, 도쿄와 거의 같습니다。

나리타공항을 이용할 때는 도착 시나 출발 직전에 들러 시가지의 소음에서 벗어나 꽃을 즐겨보는 것을 권합니다。', '["https://resources.matcha-jp.com/resize/720x2000/2026/01/26-256728.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/26-256729.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/26-256724.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/26-256725.webp"]'::jsonb, '2026-02-19'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;

-- ================================================= cn
insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/cn/26436', 'zh-Hans', 13, '对于首次攀登高尾山的游客：以下五件事您应该事先了解，以便更好地享受登山之旅。', '高尾山是世界上最受欢迎的登山胜地之一。它被深邃的自然风光环绕，很难想象它距离城市如此之近。山中的药王院是一个特别的地方，僧侣们至今仍在日夜修行，自然与祈祷在此交融。以下五点建议将帮助您充分领略高尾山的魅力。

高尾山位于东京市中心以西约一小时火车车程处，坐落在东京八王子市，周围环绕着丰富的自然景观，很难相信它距离城市如此之近。它也是世界上游客最多的山峰之一，每年约有300万游客到访。

高尾山不仅拥有丰富的自然资源，更因其以药王院为中心的“祈祷之山”历史而闻名。护摩修行和修验道的文化至今仍保留至今，自然与信仰在此和谐共存——这正是高尾山的独特之处。

本文将介绍五种体验方式，让您深入感受高尾山的精髓，并配有语音导览“高尾山”。漫步其中，您将发现这座山峰至今仍保持原貌的原因。', '["https://resources.matcha-jp.com/resize/720x2000/2025/12/17-253077.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/16-253072.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/16-253073.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/16-253075.webp"]'::jsonb, '2026-01-22'::timestamptz),
  ('https://matcha-jp.com/cn/26720', 'zh-Hans', 27, '一边在大阪城周围奔跑，一边聆听语音导览“RUN RUN LEARN”，了解历史。', '大阪城是大阪最著名的旅游景点之一。它坐落于市中心，历史与自然在此交融，不仅是热门的旅游胜地，也是跑步爱好者的天堂。我们将通过语音导览，带您体验“边听历史边跑步”的全新感受。

大阪城是大阪的象征。作为大阪的必游景点，大阪城拥有雄伟的石墙，诉说着四百多年的历史，护城河尽头的城门庄严肃穆。这里充满历史的浪漫气息，让人真切感受到岁月沉淀的历史底蕴。

游览大阪城时，你会看到游客和跑步者沿着石墙和护城河轻快地奔跑。大阪城不仅是著名的旅游景点，也是广受欢迎的跑步路线，许多跑步者会在清晨和傍晚前来锻炼。

如今，大阪城开启了一项全新的体验：边跑边“聆听”历史。语音导览“RUN RUN LEARN | 大阪城穿越时空”如同旅行故事讲述者，让观光跑步之旅更加精彩纷呈。', '["https://resources.matcha-jp.com/resize/720x2000/2026/02/07-258028.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/07-258029.webp"]'::jsonb, '2026-02-07'::timestamptz),
  ('https://matcha-jp.com/cn/10497', 'zh-Hans', 13, '【2026】赏樱之后准备赏紫藤花！东京人气紫藤景点10选！', '迎风摇摆的紫藤花惹人怜爱，是日本春天不可或缺的绝景。想知道东京都内哪里可以欣赏这柔美的紫藤帷幕吗？除了最有人气的龟户神社之外，还有哪些可以避开人潮静下来欣赏呢？快看小编挑选的东京10处赏藤名所！

樱花凋谢后，杜鹃、花水木、牡丹等接连盛开，一片百花缭乱中，垂吊的紫藤花别具风情。日本人在很久很久以前就对紫藤着迷不已，日本最古的和歌集《万叶集》中，歌诵紫藤的诗歌多达27首。平安时代贵族们的衣着也採用藤花的图样，藤原氏的家纹也源自藤花。

紫藤早已融入日本人生活，因此即便是高楼林立的东京都内也有好几个名所可欣赏。接下来小编挑选东京都内10处欣赏紫藤的地点，轻松就可排入行程！

龟户天神社大概是东京最知名的紫藤名所吧！其历史可溯及江户时期，在着名的《名所江戸百景》中描绘了龟户天神的紫藤景色。每年四月中下旬，社内15棚100株以上的紫藤花一齐绽放，相当壮观。一串串小巧可爱、随风摇曳的紫藤花映着朱红色的太鼓桥，突显紫藤的娇嫩。自江户以来的紫藤花配上平成象徵的晴空塔，进行一场时空交错的对谈。', '["https://resources.matcha-jp.com/resize/720x2000/2021/04/23-113831.webp","https://resources.matcha-jp.com/resize/720x2000/2021/04/23-113832.webp","https://resources.matcha-jp.com/resize/720x2000/2021/04/23-113845.webp","https://resources.matcha-jp.com/resize/720x2000/2021/04/23-113833.webp"]'::jsonb, '2026-04-14'::timestamptz),
  ('https://matcha-jp.com/cn/26780', 'zh-Hans', 12, '在跑道旁赏樱？成田机场限定体验【樱花×飞机】极致春日仪式——现场实地报道', '成田机场是一座能在跑道近旁尽览樱花盛景的独特机场。今年春天，一场让人亲身感受其魅力的特别活动在此举行。本文将带您走进仅对受邀嘉宾与媒体开放的现场盛况。满开的樱花下，庞大的飞机机体与成田的传统艺能交相辉映，共同呈现出一场世界罕见的奢华体验。

2026年4月9日（周四），为庆祝成田国际机场第一航站楼5层【SHIKISAI GARDEN】全新亮相，一场罕见奢华的盛会即将开启——在跑道旁尽览盛放樱花的绝美景致，体验世界少有的独特魅力。

本次活动为一日限定，仅面向受邀嘉宾与媒体开放。精彩盛况，我们将通过现场采访为您全程呈现。

在成田机场诞生之前，这片土地曾是皇室专用的【下总御料牧场（※）】。每到春天，这里便成为热闹非凡的赏樱胜地，据传曾种植樱花多达10万株，年均吸引约20万名游客前来欣赏花海盛景。', '["https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262437.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/17-258922.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262438.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262447.webp"]'::jsonb, '2026-04-01'::timestamptz),
  ('https://matcha-jp.com/cn/26849', 'zh-Hans', 12, '成田机场第1航站楼焕然一新！足汤、榻榻米空间、竹林数字艺术，全方位呈现日本传统文化与前沿科技的完美融合', '这次，成田机场T1的部分区域经过升级改造，全新打造了可沉浸式体验日本风情的“SHIKISAI GARDEN -Seasonal colors-”。本文将通过实地探访，为大家详细介绍包括数字艺术、足浴体验，以及可同时欣赏樱花与飞机景观的区域在内的6大特色空间。

本次改造范围涵盖出境审查前的一般区域，包括4层的中庭挑空空间以及5层的大部分区域，总面积约达8,000㎡。空间以展现日本四季色彩的【四季彩（SHIKISAI）】与提供舒适休憩体验的【GARDEN】相结合，焕新为全新空间【SHIKISAI GARDEN -Seasonal colors-】。

围绕这一理念打造的6大区域，将原本单纯的候机时光，升华为一段“沉浸式日本文化体验的完美收官”。

“希望旅客在机场也能感受日本之美，并享受在此停留的时光”——这一理念，正是【SHIKISAI GARDEN -Seasonal colors-】诞生的初衷。', '["https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262458.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262459.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262454.webp","https://resources.matcha-jp.com/resize/720x2000/2026/04/09-262455.webp"]'::jsonb, '2026-04-08'::timestamptz),
  ('https://matcha-jp.com/cn/19452', 'zh-Hans', 47, '【冲绳旅游】轻松出行！婴儿车租借服务「Babycal」让家庭旅游更便利', '现在可以在冲绳县使用婴儿车租赁服务「Babycal」。透过使用「Babycal」，您可以轻装出行，无需担心飞机上的行李限制。当您前往冲绳时，请利用「Babycal」，以便您可以舒适地享受您的旅行。

费用因地点而异，一般第一个小时250～500日元起，之后每30分钟加收100日元。即使打算长期使用，12小时最高收费为1500日元，因此您可以安心使用。

Eas冲绳丰崎週边还设有「冲绳Outlet Mall Ashibinaa」和「Chura SUN Beach」，带孩子的顾客可以在这里度过一整天。

RedCaps 提供当日行李递送服务，连接石垣机场、酒店、住宿设施以及裸女石垣港离岛码头。石垣机场还提供便捷的行李寄存服务。', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177479.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177485.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177480.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177482.webp"]'::jsonb, '2024-04-26'::timestamptz),
  ('https://matcha-jp.com/cn/18371', 'zh-Hans', 13, '【方便】带着宝贝旅行时，使用婴儿车租赁服务“babycal”', '我们将向您介绍旅游胜地和市区（东京、浅草、大阪、京都、横滨、博多等）的婴儿车情况，并向您介绍婴儿车租赁服务babycal，您可以携带并使用您的婴儿车。婴儿车，无论你走到哪里。毫无疑问，使用babycal，您的旅途将会更加舒适。

承重能力120公斤：KJP-5（轮椅）、NOPO（轮椅）；承重能力100公斤：NEO-2（轮椅）

【价格】首小时250日元，之后每30分钟100日元，最多12小时1500日元，之后每30分钟100日元。

您可以在日本各地的热门旅游目的地附近租车，包括东京、浅草、名古屋、大阪、横浜、京都、札幌和冲绳（截至本文发布之日）。', '["https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166066.webp","https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166069.webp","https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166084.webp","https://resources.matcha-jp.com/resize/720x2000/2024/02/09-166085.webp"]'::jsonb, '2024-02-09'::timestamptz),
  ('https://matcha-jp.com/cn/26327', 'zh-Hans', 12, '樱花与飞机 | 成田春季最佳打卡地', '得益于得天独厚的自然环境，成田四季皆有动人美景。每到春天，这里便化身为一处隐秘的赏樱胜地，让人沉醉于转瞬即逝的烂漫樱花与气势磅礴的飞机同框共演的独特画面。

拥有秀美田园风光的成田，是资深玩家才知道的赏樱秘境。在这里，你可以欣赏到在樱花地毯上起舞的飞机、从樱花拱门下穿行而过的飞机等多彩景致。接下来，就为你一次盘点只有在成田才能看到的“飞机×樱花”绝佳打卡点！

成田市“三里塚樱花之丘”位于成田机场A跑道附近，是一个开满约130株樱花的小山丘。

在樱花地毯上疾驰而过的飞机 芝山水边之乡位于成田机场跑道南侧，是一片湿地。这里种植了多种花木和水生植物，拥有可以漫步小径的丰饶自然环境。春天，可以伴着蛙鸣声，欣赏水边的樱花。', '["https://resources.matcha-jp.com/resize/720x2000/2025/11/28-251431.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/26-256732.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/28-251451.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/28-251452.webp"]'::jsonb, '2025-12-08'::timestamptz),
  ('https://matcha-jp.com/cn/26570', 'zh-Hans', 13, '东京赤坂顶级寿司10选！必预约米其林名店', '探索赤坂十间不可错过的寿司餐厅，包含米其林一星与双星明店、传统江户前与现代创新路线。文章说明各店的主厨背景、特色醋饭与熟成手法、招牌菜及酒单搭配，并提醒读者多数吧檯需预约或预付，适合想体验不同层次寿司文化的旅客与在地美食爱好者。

这里巷弄虽小，却藏着丰富多样的寿司世界：从由一位师傅独立打理、以仪式感与调味见长的小型吧檯，到技艺与都市景观兼备的高级饭店餐厅应有尽有。

Sushi Miura（赤坂）获得2026年米其林一星，并在2024–2025年为选定餐厅，由在菊乃井与大坂Sushi Namba磨鍊手艺的三浦主厨掌厨，提供沉稳、纯熟的主厨发办料理。

服务在天然木製吧檯前展开，每贯握寿司都以呈现食材原貌为本：醋饭温度与调味精准、鱼片切法突显口感与细微差别，并以清汤或烤时蔬穿插，增添每贯之间的层次感。', '["https://resources.matcha-jp.com/resize/720x2000/2026/01/21-256357.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/21-256358.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/14-255555.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/21-256359.webp"]'::jsonb, '2026-01-22'::timestamptz),
  ('https://matcha-jp.com/cn/23065', 'zh-Hans', 13, '【带宝宝去日本旅行】车站直通 车站便利店租借婴儿车！', '推荐给想要带着宝宝去日本旅行的人使用婴儿车租赁服务“babycal”。在这篇文章中，我们将介绍可以租用“babycal”的“JR 东旅行服务中心”。除东京站、品川站、横滨站、新宿站等日本主要车站外，还广泛部署在成田机场、仙台站、东北地区的新干线车站。

如果您使用婴儿车租赁服务babycal，您可以在不携带婴儿车的情况下登机，并仅在需要时在车站租赁婴儿车，无需从家里携带婴儿车。

babycal的特点 租赁地点：全国超过 275 个地点 从北部的北海道到南部的冲绳，可以在机场、车站、酒店、旅游设施等各种地点租赁。

您可以在出行第一天在机场租用婴儿车，离开时归还，轻松出行，无需担心飞机上的行李限制！', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177441.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/26-178209.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/03-213326.webp"]'::jsonb, '2024-11-28'::timestamptz),
  ('https://matcha-jp.com/cn/24716', 'zh-Hans', 13, '【轮椅租赁】 babycal提供轮椅租赁服务，租赁期限为1小时至7天', '您在旅行时受伤了，四处走动感到很累，或者您想和祖父母一起出去。在这种情况下， babycal的轮椅租赁服务很方便。在本文中，我们将介绍“babycal”提供的轮椅租赁特点以及受欢迎的租赁地点。

东京都（浅草、池袋）、埼玉（姆明谷公园）、京都（新町三条、河原町五条）、广岛可以租借轮椅。

注册成为免费会员后，您可以通过网站进行预订。请点击此处了解如何使用该服务的详情。', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177441.webp","https://resources.matcha-jp.com/resize/720x2000/2025/04/17-231383.webp","https://resources.matcha-jp.com/resize/720x2000/2025/04/17-231384.webp","https://resources.matcha-jp.com/resize/720x2000/2025/01/27-221138.webp"]'::jsonb, '2025-04-17'::timestamptz),
  ('https://matcha-jp.com/cn/20366', 'zh-Hans', 13, '可使用婴儿车租赁服务“babycal”的JR东日本酒店集团酒店', '对于想要带着孩子去日本旅行的人来说，推荐的服务是婴儿车租赁服务“babycal”。在本文中，我们将介绍您可以租用“babycal”的 JR 东日本酒店集团酒店。

如果您使用婴儿车租赁服务“babycal”，您可以在不携带婴儿车的情况下登机并到达酒店。

babycal的特点 租赁地点：全国超过 260 个地点 从北部的北海道到南部的冲绳，可以在机场、车站、酒店、旅游设施等各种地点租赁。

费用根据地点不同而不同，一般第一个小时为250至500日元，之后每30分钟加收100日元。', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177441.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/26-178209.webp","https://resources.matcha-jp.com/resize/720x2000/2024/09/24-198715.webp","https://resources.matcha-jp.com/resize/720x2000/2024/09/24-198717.webp"]'::jsonb, '2024-06-12'::timestamptz),
  ('https://matcha-jp.com/cn/19429', 'zh-Hans', 13, '[2025] 婴儿车租赁服务“babycal”轻松游日本！', '带孩子旅行真的很困难，因为有很多行李，如牛奶、衣服、尿布等。 对于那些想要轻装出行的人来说，推荐的服务是婴儿车租赁服务“babycal”。 在这篇文章中，我们将介绍“babycal”的特点以及热门旅游景点附近的租赁点。

通过babycal，您可以在需要时、在需要的时间内从日本各地的租赁点租用婴儿车。

从北部的京都到南部的北海道，以及东京（名古屋、上野、涩谷、酒店川、浅草等）、名古屋、上野、涩谷、广岛、博多等大阪，您都可以在机场、车站、酒店、旅游设施等各种地点租到自行车，包括名古屋、神户、广岛、难波、神户、广岛、博多等地。

您可以在出行第一天在机场租用婴儿车，回程时归还，轻松出行，无需担心飞机上的行李限制！', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/19-177441.webp","https://resources.matcha-jp.com/resize/720x2000/2025/01/27-221166.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/26-178209.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/26-178204.webp"]'::jsonb, '2024-04-26'::timestamptz),
  ('https://matcha-jp.com/cn/26370', 'zh-Hans', 13, '东京车站周边寻觅米其林星级美食！「丸之内」顶级餐厅10选（寿司、和牛烧肉、串烧）', '丸之内与东京车站周边汇集多家拥有米其林等级高评价的餐厅美食，从得奖江户前寿司到高档怀石、串烧、和牛烧肉、铁板烧，每间店家皆以绝佳料理与天际线美景取胜！小编精选10家人气名店，介绍各家餐厅的料理特色、用餐氛围、预约订位建议等资讯。

以冬季灯饰与交通枢纽闻名的东京车站与丸之内地区，同时也是东京最顶级的餐饮聚集地之一。

丸之内汇集了靠近东京车站的最佳餐厅，将卓越料理与美丽天际线景观结合。丰富的选择涵盖从得奖寿司到高级怀石、铁板烧、法式与义式料理，多数坐落于高层建筑中，视野极佳。

位于Palace Hotel Tokyo 六楼的Sushi Kanesaka提供亲密的用餐氛围，可俯瞰静谧的皇居庭园。餐厅在宁静的木质吧檯中，呈现经典的江户前握寿司技艺。', '["https://resources.matcha-jp.com/resize/720x2000/2025/12/03-251954.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/03-251955.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/03-251952.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/03-251953.webp"]'::jsonb, '2025-12-08'::timestamptz),
  ('https://matcha-jp.com/cn/26169', 'zh-Hans', 20, '【轻井泽、草津、万座】东京出发的冬季高原度假之旅——尽享温泉、自然风光和美食', '从东京乘坐新干线仅需一小时，即可开启前往轻井泽、草津和万座的奢华冬季之旅。我们将带您领略这座高山度假胜地的魅力，在那里您可以享受温泉、品尝美食、欣赏壮丽景色和体验滑雪的乐趣。

从东京乘坐新干线只需一个多小时，即可抵达以轻井泽为中心的高原度假区。这里空气清新，自然风光秀丽，城镇风貌精致优雅，完美融合。冬季，整个地区银装素裹，宛如仙境，令人流连忘返。这次，我们将为您介绍轻井泽、草津和万座的冬季之旅。我们将为您详细介绍热门景点、当地美食，以及万座王子酒店的迷人魅力——这里是您旅程的完美句点。

以夏季度假胜地闻名的轻井泽，在冬季则完全变身为一座银装素裹的静谧度假胜地。街道两旁绿树成荫，环境清幽的咖啡馆和历史悠久的教堂鳞次栉比，无论走到哪里，都能欣赏到如诗如画的美景。

其中，石教堂、内村观藏纪念馆和轻井泽高原教堂尤为著名。石教堂以其独特的有机曲线建筑设计而闻名，光与石交织营造出的奇妙空间令游客流连忘返。而轻井泽高原教堂则是一座隐匿于自然怀抱中的木质教堂，散发着宁静温暖的神圣气息。冬季，教堂灯火通明，在白雪和灯光的映衬下，景色美不胜收，成为众多情侣和游客的热门拍照打卡地。', '["https://resources.matcha-jp.com/resize/720x2000/2025/11/07-249274.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/07-249275.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/07-249276.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/07-249318.webp"]'::jsonb, '2025-11-07'::timestamptz),
  ('https://matcha-jp.com/cn/26321', 'zh-Hans', 13, '新宿必吃！奢华米其林美食8选（寿司、烧肉、炸物、铁板烧）', '本篇整理新宿近郊八家米其林风格或获奖餐厅，囊括江户前寿司、铁板烧、烧肉与天妇罗等类型，从六席亲密寿司吧到适合家庭或团体的大空间，并标註距离各车站的步行时间。文章说明菜型特色、是否有英文服务或多语菜单、预订与付款注意事项，方便旅客依用餐预算与场合选择合适餐厅并提前预订。

作为东京最有活力的核心地区之一，新宿 的餐饮场景完美结合了传统工艺与现代风格。从六席的江户前寿司柜檯到铁板烧与天妇罗吧，应有尽有。

本指南收录了多家获奖餐厅——包括亲密的寿司吧、烧肉（烤肉）和天妇罗名店，许多店家也曾入选《米其林指南：东京》。所有列出的餐厅均可自新宿或新宿御苑前车站轻松到达。

Sushi Sagane 将经典的江户前技法萃取为一场于六席吧檯进行的静谧精緻omakase，使用来自丰洲的鱼货，製作出以质地为主的精确握寿司。', '["https://resources.matcha-jp.com/resize/720x2000/2025/11/14-249878.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/14-249886.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/28-251317.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/28-251330.webp"]'::jsonb, '2025-12-01'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;

-- ================================================= tw
insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/tw/27466', 'zh-Hant', 13, '美國鬼才導演「提姆・波頓」展覽首度登陸日本！11月東京盛大登場', '11月25日起，在東京舉辦的「提姆・波頓的迷宮（Tim Burton''s Labyrinth）」中，一起走進《剪刀手愛德華》、《陰間大法師》與《聖誕夜驚魂》等作品充滿奇幻想像的世界。

在全球吸引超過 100 萬人次參觀、廣受好評的沉浸式展覽 「Tim Burton''s Labyrinth」，終於即將來到日本。

展覽將於 2026 年 11 月 25 日至 2027 年 2 月 21 日期間，在東京豐洲的 CREVIA BASE Tokyo 舉辦。

繼西班牙、法國、比利時、德國、義大利與墨西哥成功展出後，本次不僅是展覽首度登陸日本與亞洲，也是提姆・波頓（Tim Burton）睽違約 10 年再次於日本舉辦展覽。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267949.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267950.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267947.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/28-267948.webp"]'::jsonb, '2026-08-07'::timestamptz),
  ('https://matcha-jp.com/tw/27419', 'zh-Hant', 27, '2026環球影城「萬聖節驚魂夜」！活動完整攻略一次看', '2026年9月10日～11 月 8 日，前往 USJ 體驗「Universal Extreme Autumn Discover U!!!」！除了萬聖節驚魂夜外，還有大規模殭屍大軍現身，以及全新《惡靈古堡》恐怖體驗，帶來前所未有的驚悚刺激！

日本環球影城（以下簡稱USJ）將於2026年9月10日至11月8日推出史無前例的秋季特別企劃。

適逢園區迎來開園25週年，今年秋天也迎接「萬聖驚魂夜（Halloween Horror Nights）」15週年（自9月11日正式展開）。自2011年首次舉辦以來，這項活動已徹底改變日本秋季娛樂文化。

迎來15週年的今年，活動將以跨越次元的恐怖世界為主題，從園區街頭殭屍、沉浸式生存恐怖遊戲，到大型動漫聯名合作，打造歷年最震撼的萬聖節陣容。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267325.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267324.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267320.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267316.webp"]'::jsonb, '2026-08-06'::timestamptz),
  ('https://matcha-jp.com/tw/27358', 'zh-Hant', 13, '東京旅行絕不可錯過！GINZA SIX 獨家「限定伴手禮」與「美食體驗」完全指南', '匯聚世界頂級精品品牌、當代藝術與美食的「GINZA SIX」，是銀座最具代表性的時尚地標。本文將帶你探索 GINZA SIX 獨有的魅力，從精緻伴手禮、名店美食到優雅的下午茶時光，感受銀座充滿品味的生活風景。

說到銀座購物和逛街，「GINZA SIX」可以說是最具代表性的銀座象徵地標，這裡集結全球頂級奢侈品牌、美妝、當代藝術、精緻美食和甜點。

建築為地下 6 層、地上 13 層的複合式商業設施，其中 9 個商業樓層匯集了約 240 家品牌店家進駐。而地下 3 樓則設有可以觀賞日本傳統藝能「能劇」的「觀世能樂堂」，在購物之餘，也能親身體驗日本傳統文化。

除了匯聚超過 30 間以上的頂級餐廳、咖啡廳和酒吧之外，地下二樓的伴手禮區大家一定會逛到不想離開！', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266419.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266420.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266421.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266422.webp"]'::jsonb, '2026-07-04'::timestamptz),
  ('https://matcha-jp.com/tw/27487', 'zh-Hant', 27, '反派「惡」主題！大阪梅田「THE★JOJO WORLD OSAKA」常設店2026年冬季開幕', '繼2025年7月於東京澀谷 PARCO 盛大開幕的常設體驗型旗艦店「THE★JOJO WORLD」後，官方正式宣布全日本第二家常設體驗型專賣店 「THE★JOJO WORLD OSAKA」將於2026年冬季在大阪梅田地標 LUCUA SOUTH 10 樓登場！

由荒木飛呂彦所著的漫畫作品《JOJO的奇妙冒險》，其常設體驗型官方專賣店「THE★JOJO WORLD OSAKA」，將於 2026 年冬季在大阪梅田的 LUCUA SOUTH 10 樓盛大開幕。

「THE★JOJO WORLD OSAKA」是繼 2025 年 7 月於東京澀谷 PARCO 開幕的「THE★JOJO WORLD」之後的第二家常設店鋪。

店內除了販售原創周邊商品外，只要踏入其中，就能沉浸在《JOJO的奇妙冒險》獨特世界觀中的「體驗型」專賣店。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268154.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/31-268153.webp"]'::jsonb, '2026-07-31'::timestamptz),
  ('https://matcha-jp.com/tw/27422', 'zh-Hant', 26, '2026年8月關西盛夏指南！大阪、京都、奈良、神戶慶典與活動總整理', '一起探索大阪、京都、奈良與神戶最具代表性的8月盛事！從享譽盛名的京都五山送火、夢幻浪漫的奈良燈花會，到震撼全場的琵琶湖花火大會，一起享受關西熱鬧又感性的夏日夜空吧！

日本 8 月最矚目的焦點莫過於盂蘭盆節（Obon），這是月中專為祭奠先祖而舉辦的傳統活動時期。

包含大阪、京都、奈良與神戶在內的關西地區，將舉辦多場指標性祭典，能讓您深入體驗日本文化。

主要盛事包括點亮環繞城市五座山頭巨大送火的京都「五山送火」、以 20,000 盞搖曳燭光妝點奈良公園的「奈良燈花會」，以及壯觀的「琵琶湖大煙火大會」。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267741.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267742.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267743.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267744.webp"]'::jsonb, '2026-07-30'::timestamptz),
  ('https://matcha-jp.com/tw/27479', 'zh-Hant', 14, '橫濱首間「有形文化財」星巴克！8/10 橫濱海之公園開幕', '咖啡迷與建築控看過來！日本星巴克宣布將於8月10日在橫濱海濱名勝「海之公園」盛大開設全新門市「星巴克咖啡 橫濱海之公園店」。是橫濱第一間進駐公園的星巴克，更是橫濱首家落腳於國家「登錄有形文化財」的星巴克。

日本星巴克將於 2026 年 8 月 10 日（一） 在橫濱「海之公園」開設全新門市「星巴克咖啡 橫濱海之公園店」！

「星巴克咖啡 橫濱海之公園店」不僅是橫濱首間開在登錄有形文化財內的星巴克，也是橫濱首家開在公園內的門市。

門市進駐的建築為明治 28 年（1895年）興建的「舊長濱檢疫所一號停留所」。該建築最初是作為高階船客的停留休憩設施，並在關東大地震後復元，是一座極具歷史意義的古蹟。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/30-268051.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/30-268050.webp"]'::jsonb, '2026-07-30'::timestamptz),
  ('https://matcha-jp.com/tw/27369', 'zh-Hant', 12, '【千葉】豪華絢爛又熱血！「成田祇園祭」深度攻略：必看 5 大重點、獨家體驗指南', '東京近郊有可以感受到熱血的日本夏日祭典嗎？那千葉縣「成田祇園祭」絕對是推薦首選！這次小編連續三天親自走訪祭典現場，除了為大家整理出成田祇園祭必看的 5大精采亮點，更要介紹能親自融入其中的深度體驗行程，給計畫前來感受日本盛夏熱情的你最完整的實用情報！

目次 成田祇園祭是什麼樣的祭典？ 成田祇園祭舉辦地點與交通方式 成田祇園祭五大必看重點彙整 要更加融入成田祇園祭就參加「成田祇園祭Premium體驗活動」！ 來千葉參加一年一度的「成田祇園祭」吧！ 成田祇園祭是什麼樣的祭典？ 喜歡日本的旅客一定都知道被稱為日本三大祭「京都祇園祭」，但成田機場所在地的千葉縣成田市也有「成田祇園祭」大家知道嗎？在每年七月上旬週末舉辦的成田祇園祭距今已有300年以上的歷史，是千葉縣內相當著名的祭典，每年都會吸引約45萬人的觀光客前來參與這場盛會，整個成田市也滿溢著祭典的歡愉氣氛。

每年都會連續舉辦三天，祭典上會出現許多日本傳統的音樂、舞蹈，壯觀華麗的山車，還有參加者們的熱情與魄力，讓整個祭典活動氣氛上升至最高點。同時祭典也兼具傳統與日本之美，舉辦的成田市區也距離成田機場相當近，是個相當值得海外旅客共襄盛舉的祭典。

成田祇園祭這三天內究竟要怎麼看？小編最推薦一項不漏全程參與，但如果要趕行程的話，推薦以下五個必看重點。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267470.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267578.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267474.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267466.webp"]'::jsonb, '2026-07-06'::timestamptz),
  ('https://matcha-jp.com/tw/27421', 'zh-Hant', 13, '2026年8月東京人氣活動總整理！煙火、阿波舞、水燈節', '從高圓寺阿波舞祭到各式夏日盛事，一起欣賞絢爛煙火、夢幻水燈、傳統舞蹈等更多精彩絕倫的慶典活動吧！

無論是想在歷史悠久的潑水狂歡遊行中感受清涼、在六本木附近品嚐精緻美食，還是遠離喧囂前往被罕見野生花卉覆蓋的涼爽山頂都可以。

準備好投入這場終極夏日盛宴了嗎？拿起扇子，一起探索這 8 個橫跨東京各地、絕對不容錯過的盛大活動吧！

從新宿站搭乘電車僅需約 8 分鐘，阿佐谷便呈現出溫馨迷人的街區魅力與濃厚的東京懷舊復古氛圍。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267733.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267485.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/23-267732.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267349.webp"]'::jsonb, '2026-07-23'::timestamptz),
  ('https://matcha-jp.com/tw/27423', 'zh-Hant', 13, '「深大寺」東京調布慢步調一日遊！去了還想再去！', '從新宿搭乘京王線最快僅需17分鐘即可抵達「調布站」！本篇文章將帶大家深度造訪東京第二古老避邪名剎「深大寺」、並在 70 年老店品嚐現擀手打蕎麥麵、泡黑漆漆的溫泉、讓粉絲瘋狂的鬼太郎茶屋等。

東京歷史第二悠久「深大寺」周邊和大家印象中的東京截然不同，這裡有滿滿的大自然！跟著小編的腳步，一起出發慢步調的深大寺一日遊吧！有寺廟、美食、大自然、溫泉，最後再回到調布站逛街購物。

東京歷史最悠久的寺廟是淺草寺，接下來就是位於東京西邊的「深大寺」擁有近 1,300 年的歷史。

深大寺的「元三大師堂」供奉被尊為消災祖師的「元三大師」，且每天都會舉行密教的「護摩祈願」，不管是在東京還是全日本都享有極高聲譽。', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/21-267544.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267353.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267384.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/17-267385.webp"]'::jsonb, '2026-07-17'::timestamptz),
  ('https://matcha-jp.com/tw/27394', 'zh-Hant', 13, '2026年7月東京人氣活動總整理！精彩祭典、煙火大會', '探索2026年7月在東京舉辦的最佳年度祭典與活動，一起體驗絢麗的花火大會、夢幻的水燈放流，以及充滿活力的夏日祭典吧！

隨著潮濕悶熱的白日褪去，迎來涼爽的夜晚，這座城市的歷史街區、神社與寺院境內，紛紛因熱鬧的夜市、韻律感十足的和太鼓鼓聲以及閃爍的燈籠而變得充滿活力。

在 2026 年 7 月 25 日，遊客可以觀賞超過 20,000 發絢麗的煙火在夜空中綻放，將東京晴空塔烘托在璀璨繽紛的彩芒之中。

該祭典以從兩個河畔據點施放的大規模震撼煙火為特色，包含連發速射煙火以及令人血脈賁張的花火競技大賽。', '["https://resources.matcha-jp.com/resize/720x2000/2019/07/18-81849.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/10-266930.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/16-267236.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/10-266929.webp"]'::jsonb, '2026-07-23'::timestamptz),
  ('https://matcha-jp.com/tw/27295', 'zh-Hant', 21, '【岐阜】盡興度過長良川的夏夜！從傳統鸕鶿捕魚、絕品香魚料理到夜市巡遊的充實行程', '擁有1300多年歷史的岐阜長良川鸕鶿捕魚，是岐阜最具代表性的傳統文化之一。以清流長良川為舞台，在曾作為織田信長居城的岐阜城映襯下，展現獨特的歷史風情與夏夜魅力。除了欣賞鸕鶿捕魚，還能品嘗香魚料理、漫步夜市與老街，一次感受長良川夏夜的多元風貌。

目次 傳承1300年的岐阜長良川鸕鶿捕魚文化 乘坐觀覽船近距離感受岐阜長良川鸕鶿捕魚的魅力 品味長良川的香魚文化 融入在地日常的夏夜時光，漫步長良川夜市與河畔風景 在長良川畔度過完整又獨特的夏夜 傳承1300年的岐阜長良川鸕鶿捕魚文化 長良川鸕鶿匠的獨特地位 Picture courtesy of 岐阜市 岐阜長良川鸕鶿捕魚能夠延續1300多年，與地方特有的世襲制度密不可分。目前長良川僅有6名鸕鶿匠，由家族代代傳承技藝，並由宮內廳任命為「式部職鸕鶿匠」，身負向皇室奉納香魚的重要職責。每年更會於禁漁區(※)舉行8次御料鸕鶿捕魚，將捕獲的香魚奉納給皇室。

此外，每年還會舉辦兩次外交團鸕鶿捕魚，邀請駐日外國大使及公使夫妻觀覽，而這項官方接待活動也僅於長良川舉行，展現其獨特的歷史傳統地位。

即使鸕鶿捕魚休漁期間，鸕鶿匠也鮮少有真正的休息時間。除了照顧鸕鶿的生活起居外，還需要準備腰簑、草鞋等傳統裝備，整理薪材，並進行鸕鶿船的維修與保養，為下一個岐阜長良川鸕鶿捕魚的季節做好萬全準備。', '["https://resources.matcha-jp.com/resize/720x2000/2026/06/22-265746.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/22-265747.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/22-265745.webp","https://resources.matcha-jp.com/resize/720x2000/2026/06/17-265581.webp"]'::jsonb, '2026-06-17'::timestamptz),
  ('https://matcha-jp.com/tw/27424', 'zh-Hant', 13, '走進奇幻夜晚！虎之門之丘「東尼．奧斯勒」大型個展、體驗沉浸式活動「深夜的策展人」', '位於東京都港區虎之門之丘的資訊發信據點 TOKYO NODE，自 2026 年 7 月起推出美國當代藝術大師東尼．奧斯勒（Tony Oursler）在日本的首場大型個展 「Tony Oursler：技術與靈知之間」，同時舉辦能夠沉浸於其作品世界觀的夜間限定體驗活動 「有點奇妙的職業體驗：深夜的策展人」！

2026 年 7 月 3 日（五）至 9 月 27 日（日），美國具代表性的多媒體藝術先驅東尼．奧斯勒（Tony Oursler）將在日本舉辦首次大型個展。

奧斯勒以結合影像、雕塑、聲音與光線的奇幻裝置藝術聞名，長年透過作品探討科技、人類心理與超自然現象等主題。

談及日本文化時，他表示：「自從 1970 年代開始研究歌舞伎與日本版畫以來，日本文化便持續吸引著我，並對我的創作產生了極其重要的影響。」', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/18-267396.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/18-267395.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/18-267398.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/18-267399.webp"]'::jsonb, '2026-07-21'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;

