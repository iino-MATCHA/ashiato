-- MATCHAの記事 en の 2/3（50件）。この1ファイルをそのまま実行する。
-- upsert なので、同じものを二度貼っても増えない。

insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/en/8105', 'en', 20, 'Nagano''s Tateshina Area: Top 6 Spots For Day-Tripping And Nature', 'Nagano Prefecture''s Tateshina is a scenic highland sitting at an altitude of 1,000 meters. Even if you aren''t keen on driving, it''s only two hours from Tokyo via the limited express train. Today, we''ll introduce six spots to soak up Tateshina''s nature—all accessible by bus from JR Chino Station.

With its magnificent natural surroundings, Nagano Prefecture is an ideal destination for either a one night stay or a day trip from Tokyo.

Nagano also boasts many excellent hiking spots including Karuizawa and Kamikochi.

We especially recommend Tateshina Highlands. Two hours away from Shinjuku Station in Tokyo by limited express train, you can soak up nature on a day trip here from the city.', '["https://resources.matcha-jp.com/resize/720x2000/2019/10/13-88141.webp","https://resources.matcha-jp.com/resize/720x2000/2019/10/13-88142.webp","https://resources.matcha-jp.com/resize/720x2000/2019/10/13-88143.webp","https://resources.matcha-jp.com/resize/720x2000/2019/10/13-88144.webp"]'::jsonb, '2020-01-16'::timestamptz),
  ('https://matcha-jp.com/en/9533', 'en', 20, 'The 5 Best Local Dishes to Enjoy in Matsumoto, Nagano', 'Matsumoto, home to the beautiful Matsumoto Castle, is one of the must-visit cities in Nagano. In addition to the castle and museums, Matsumoto is an excellent place for dining. There are certain regional foods in the city that any visitor should try, like soba, oyaki, and miso ramen.

Matsumoto, one of the most beautiful places in Nagano, is definitely a key destination for visitors because it has one of Japan’s best castles: Matsumoto Castle.

But, besides having a magnificent castle and interesting museums, Matsumoto is a city of culinary delight. There are many delicious types of cuisine and fine restaurants. However, the must-eats are the dishes that are unique to Matsumoto, along with other regional foods.

The five unique dishes of Matsumoto or Nagano introduced below are what you should definitely enjoy while you spend time touring the city of the crow castle.', '["https://resources.matcha-jp.com/resize/720x2000/2020/04/14-101406.webp","https://resources.matcha-jp.com/resize/720x2000/2020/04/14-101390.webp","https://resources.matcha-jp.com/resize/720x2000/2020/04/14-101392.webp","https://resources.matcha-jp.com/resize/720x2000/2020/04/14-101393.webp"]'::jsonb, '2020-03-09'::timestamptz),
  ('https://matcha-jp.com/en/1497', 'en', 21, 'Shirakawago: Highlights, 2026 Winter Light-up, Access, and Hotels', 'Shirakawa-go is a World Heritage Site in Gifu, renowned for its scenery of traditional thatched roof homes. Learn the dates of the Shirakawa-go Winter Light-up in January - February 2026, places to visit, local dishes, and how to travel to Shirakawa from Tokyo and other major cities.

Shirakawago is a village renowned for its beautifully preserved traditional landscape, located in Gifu Prefecture in central Japan. In 1995, the village was registered as a World Cultural Heritage Site along with Gokayama in neighboring Toyama Prefecture.

The Shirakawa-go Village has about 100 buildings made in gassho-zukuri style (*1), common in agricultural villages of old Japan.

*1 Gassho-zukuri: a traditional Japanese architecture style with thatched roofs with steep slopes that resemble two hands in a prayer position.', '["https://resources.matcha-jp.com/resize/720x2000/2019/06/10-79087.webp","https://resources.matcha-jp.com/resize/720x2000/2025/11/20-250353.webp","https://resources.matcha-jp.com/resize/720x2000/2019/04/10-74811.webp","https://resources.matcha-jp.com/resize/720x2000/2019/04/10-74800.webp"]'::jsonb, '2016-05-13'::timestamptz),
  ('https://matcha-jp.com/en/3149', 'en', 21, 'Hida Takayama Travel Guide - Shirakawa-go, Beautiful Views, Onsen, And More!', 'Indulge in the traditions of Japan at Hida Takayama, Gifu prefecture. Get in-depth information about access, local food, weather in order to have a great time at the World Heritage site Shirakawa-go, castle towns, and hot springs in Gifu.

Gifu prefecture, located in the Chubu region of Japan, is known for its rich nature and history. The Hida region in northern Gifu is surrounded by the Hida mountain range (also known as the Northern Japanese Alps) and is a popular tourist spot for its beautiful, yet rough scenery.

Takayama city in Gifu prefecture''s Hida region is frequently known as Hida Takayama. Only two and a half hours away from Nagoya, it is a great spot for those who wish to go off the beaten path. Here, you will be able to see historic towns, wonderful natural scenery, hot springs, and the World Heritage site Shirakawa-go. This area is rightly one of Japan''s most popular tourist destinations.

In the heart of Takayama city, you will be able to see well-preserved castle towns and businesses from the Edo period; the historic town is also referred to as Hida''s Little Kyoto. Recently, it has been widely recognized as ”a town with nostalgic Japanese scenery” and many tourists visit from all over. Why not enjoy venturing through Takayama using this guide as a reference!', '["https://resources.matcha-jp.com/resize/720x2000/2017/01/28-15186.webp","https://resources.matcha-jp.com/old_thumbnails/720x2000/33.webp","https://resources.matcha-jp.com/resize/720x2000/2016/10/14-4915.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/24-127101.webp"]'::jsonb, '2019-04-08'::timestamptz),
  ('https://matcha-jp.com/en/4233', 'en', 21, 'Takayama Festival 2026: Dates, Highlights, Access, and Tips', 'Takayama Festival, or Takayama Matsuri, is a major event held each spring and fall in Takayama, Gifu Prefecture. With a parade of gorgeous floats and people in traditional samurai garb, the festival will take you back in time through history.

The Takayama Spring Festival (held every April 14 and 15) is an annual festival of Hie Shrine in Takayama City. It is celebrated with 12 extravagantly decorated yatai floats (*1) that are carried around the city. Hie Shrine is also called Sanno-san, so this festival is known as the Spring Sanno Festival, as well.

The Takayama Autumn Festival (every year on October 9 and 10) is an annual festival of Sakurayama Hachimangu Shrine. It is also known as the Hachiman Festival. During this festival, 11 floats are paraded through the city.

Both festivals boast glorious floats. Festival-goers can also see participants wearing kamishimo (*2), or samurai costume, in the parades. During the festival period, the whole town slips back in time to the Edo Period (1603-1868). It is said that every year 200,000 people visit each festival to admire the magnificent floats and people parading through the city.', '["https://resources.matcha-jp.com/resize/720x2000/2017/03/29-22684.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/29-22691.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/29-22705.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/29-22686.webp"]'::jsonb, '2017-04-12'::timestamptz),
  ('https://matcha-jp.com/en/3890', 'en', 22, 'Atami''s 20 Best Hot Springs: Onsen Resorts, Luxury Hotels, Traditional Inns', 'Atami is a hot spring resort on the outskirts of Tokyo, famous for the effects of its hot spring waters. This article introduces Atami''s best hot springs, hotels and other useful information for everyone who would like to enjoy Atami.

The Nakamisedoori Shopping Street in Atami. Photo by Pixta Atami is an onsen resort area in Shizuoka Prefecture, 50 minutes away from Tokyo by shinkansen, which makes it great for day trips. One of Japan’s leading onsen areas, it boasts a plethora of hot spring options, and a vast number of bathing facilities.

Atami Onsen is rich with history, having originally opened in the Nara era (710-794), and appears in books dated as far back as the year 1200.

In addition, the first Edo-era shogun, Tokugawa Ieyasu, took a liking to the springs, and actually took casks of the water back to Edo (now Tokyo). For that reason, other daimyo (feudal lords) made frequent trips to Atami, and many literary figures also visited during the Meiji era.', '["https://resources.matcha-jp.com/resize/720x2000/2023/05/14-138119.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/01-16449.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/01-16452.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/14-138120.webp"]'::jsonb, '2018-05-15'::timestamptz),
  ('https://matcha-jp.com/en/3938', 'en', 22, 'Atami Travel Guide: 10 Places to Visit, Hotels, Hot Springs, Festivals, and Access', 'Atami in Shizuoka Prefecture is around 50 minutes from Tokyo, making it a great day trip or weekend getaway from the city. This travel guide includes how to get to Atami, recommended hot springs, things to do, where to stay, and everything needed for a memorable, relaxing trip by the sea.

Atami is a town famous for its hot springs on the coast of Shizuoka Prefecture. Visitors come to Atami from all over the country to take in the resort feel at this coastal hot spring town. Atami also has gorgeous fireworks shows held throughout the year

50 minutes away from Tokyo by Shinkansen and two hours by local traifn, it is also a popular weekend and day trip destination for greater Tokyo area suburbanites. Continue reading for suggestions for high-quality, natural hot springs, things to do, how to get to Atami, and tips for enjoying the charming atmosphere of Atami.

It is said that the famous Atami Umezono Plum Park is where you can see the earliest plum blossoms in Japan. Every year, the first plum flowers bloom in late November to early December. The park has 59 varieties and 472 plum trees that blossom in full glory, including ancient trees that are over a century old. Every year, from January to March, there is a Plum Festival, and foot baths and souvenir shops open in the park during this time. Depending on the day, the festival has events like free amazake tastings, and is busy with people.', '["https://resources.matcha-jp.com/resize/720x2000/2017/09/16-36235.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/03-17500.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/03-17501.webp","https://resources.matcha-jp.com/resize/720x2000/2024/09/30-199818.webp"]'::jsonb, '2017-09-16'::timestamptz),
  ('https://matcha-jp.com/en/6031', 'en', 22, 'Shizuoka: 20 Things to Do and Scenic Places to Visit', 'Shizuoka is located close to Tokyo and is most famous for being home to Mt. Fuji, the symbol of Japan. We introduce 20 places to visit and things to do in Shizuoka, from scenic locations like the Jogasaki Coast and Lake Hamana to museums, hot springs, and more!

To many, Shizuoka prefecture is best known as the home of Mt. Fuji, Japan''s most prominent national symbol and a World Heritage site.

Shizuoka is also famous for its green tea production. There are hundreds of tea fields throughout the prefecture, and many spots to enjoy freshly brewed green tea all year round.

However, there is so much more to see and do in Shizuoka! Here are twenty must-visit places in the nature-rich, exciting prefecture of Shizuoka - many of which can easily be visited on a day trip from Tokyo!', '["https://resources.matcha-jp.com/resize/720x2000/2018/05/22-54539.webp","https://resources.matcha-jp.com/resize/720x2000/2018/04/24-52909.webp","https://resources.matcha-jp.com/resize/720x2000/2018/04/24-52910.webp","https://resources.matcha-jp.com/resize/720x2000/2018/04/24-52911.webp"]'::jsonb, '2019-04-10'::timestamptz),
  ('https://matcha-jp.com/en/6436', 'en', 23, 'Nagoya Guide: 30 Things to Do, Ghibli Park, Dining, and Travel Tips', 'Nagoya is one of Japan''s largest and most famous cities. This travel guide introduces 30 things to do in Nagoya, from visiting Nagoya Castle to Ghibli Park, as well as local food, recommended itineraries for various interests, hotels, shopping facilities, and travel tips.

This article introduces 30 things to enjoy in or near Nagoya, recommended itineraries, hotels, and transportation tips.

Since opening in November 2022, the Ghibli Park has become one of the most popular places to visit in Aichi Prefecture where Nagoya is located. However, please note that the Ghibli Park is not located in Nagoya City but in Nagakute.

The park can be accessed within about one hour by train from Nagoya, and about three hours from Tokyo by using the bullet train to Nagoya and changing to a regular train at Nagoya Station.', '["https://resources.matcha-jp.com/resize/720x2000/2023/01/27-134213.webp","https://resources.matcha-jp.com/resize/720x2000/2022/12/28-133395.webp","https://resources.matcha-jp.com/resize/720x2000/2018/08/28-61398.webp","https://resources.matcha-jp.com/resize/720x2000/2023/11/24-153740.webp"]'::jsonb, '2018-09-30'::timestamptz),
  ('https://matcha-jp.com/en/7303', 'en', 23, 'Nagoya Station Guide: Train Lines, Places to Visit Nearby, and Shops', 'Nagoya Station is said to be one of the most complicated stations in Japan. We introduce information on train lines, elevators, and other tips for navigating Nagoya Station, along with places to visit nearby and shopping facilities.

Nagoya Station is an important transportation hub in Nagoya, featuring JR lines, Shinkansen, Meitetsu-Nagoya lines, Kintetsu Line, Aonami Line, subways, and bus stations. More than 1 million people pass through each day.

One of the most frustrating things about Nagoya Station is the lack of escalators. To avoid exhaustion from carrying your luggage up the stairs, check out this article for information on elevators and nearest exits.

When purchasing tickets for the μ-SKY Limited Express Train, I suggest purchasing them in advance since they are cheaper than regular ticket purchases. You can save time by avoiding on-site ticket purchasing. It’s a great deal!', '["https://resources.matcha-jp.com/resize/720x2000/2020/04/17-101628.webp","https://resources.matcha-jp.com/resize/720x2000/2019/04/15-75093.webp","https://resources.matcha-jp.com/resize/720x2000/2019/04/15-75096.webp","https://resources.matcha-jp.com/resize/720x2000/2019/04/15-75097.webp"]'::jsonb, '2024-12-08'::timestamptz),
  ('https://matcha-jp.com/en/9689', 'en', 23, 'Nagoya''s Best Outlets and Shopping Malls in 2026', 'Discover the best shopping spots in Nagoya, from outlet malls on the outskirts of the city to shopping malls and department stores downtown.

Nagoya in Aichi Prefecture is one of Japan''s three major cities alongside Tokyo and Osaka.

With a population of nearly 2.3 million within the city, it boasts a vibrant shopping scene, including shopping centers, outlets, department stores, and local select shops.

In this article, we have compiled highly recommended shopping malls and outlets in Nagoya and its surroundings.', '["https://resources.matcha-jp.com/resize/720x2000/2020/04/21-101801.webp","https://resources.matcha-jp.com/resize/720x2000/2020/04/21-101802.webp","https://resources.matcha-jp.com/resize/720x2000/2020/04/21-101803.webp","https://resources.matcha-jp.com/resize/720x2000/2020/04/21-101815.webp"]'::jsonb, '2022-10-29'::timestamptz),
  ('https://matcha-jp.com/en/11812', 'en', 1, '10 of Japan''s Most Underrated Travel Destinations', 'Discover 10 of Japan’s best-hidden gems, from sacred shrines like Izumo Taisha or Ise Jingu to Kyoto''s coastline, and the stunning, history-rich island of Sado.

Japan is renowned worldwide for its iconic cities and incredibly photogenic locations, and visitors flock every year to hugely popular sights in major tourist areas such as Tokyo and Kyoto.

However, some of the country’s most breathtaking and historically important sites tend to be overlooked! Below we list 10 of Japan’s most underrated locations.

Kyoto is no doubt one of the most popular destinations in the country for both overseas and domestic tourists - its wealth of heritage sites and rich history and culture attract scores of visitors throughout the year.', '["https://resources.matcha-jp.com/resize/720x2000/2023/03/14-135977.webp","https://resources.matcha-jp.com/resize/720x2000/2023/03/14-135978.webp","https://resources.matcha-jp.com/resize/720x2000/2023/03/14-135981.webp","https://resources.matcha-jp.com/resize/720x2000/2023/03/14-135982.webp"]'::jsonb, '2023-03-14'::timestamptz),
  ('https://matcha-jp.com/en/23977', 'en', 24, 'A Complete Guide to Matsusaka City: Food and Sightseeing', 'Matsusaka City, located at the central area of Mie Prefecture, is a mine of fine food, including the famous Matsusaka beef; grilled chicken, which is favored by the locals; and various confections. This article is about the eateries to visit, along with the historic sightseeing spots.

Matsusaka is a city in the central area of Mie Prefecture, facing Nara Prefecture to the west, and Ise Bay to the east.

When Matsusaka City is mentioned, the world-famous Matsusaka beef may be the first thing that comes to mind.

The city also boasts Matsusaka pork and grilled chicken. It is truly a city of meat.', '["https://resources.matcha-jp.com/resize/720x2000/2025/02/06-223094.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/20-225268.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/06-223009.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/06-223019.webp"]'::jsonb, '2025-03-06'::timestamptz),
  ('https://matcha-jp.com/en/1365', 'en', 25, 'Kansai Region - Japanese Encyclopedia', 'In this article, we explain the term "Kansai," which designates the region located in the mid-west area of the main island of Japan. We mention the region''s prefectures and some of its famous places to visit.

The Kansai Region comprises the mid-western area of Honshu, the largest of the islands that makes up the Japanese archipelago, found in the center of the country. The region consists of six prefectures.

The Kansai Region encompasses the prefectures of Osaka, Kyoto, Hyogo, Nara, Shiga and Wakayama. There is another appellation for this area when Mie prefecture is added: Kinki Region, which is often used in the names of local companies and groups in the area.

In Osaka, you will find Umeda and Dotonbori, places where you can shop and enjoy local food, as well as the Osaka Aquarium Kaiyukan and theme parks. You will never run out of things to do in Osaka.', '["https://resources.matcha-jp.com/archive_files/jp/2015/11/kansai_map_20151106.webp","https://resources.matcha-jp.com/resize/720x2000/2022/07/28-128706.webp","https://resources.matcha-jp.com/resize/720x2000/2022/07/28-128707.webp"]'::jsonb, '2016-02-05'::timestamptz),
  ('https://matcha-jp.com/en/3092', 'en', 26, 'Kyoto: 50 Things to Do, Places to Visit, Hotels, and Travel Tips', 'This Kyoto guide features the best things to do and famous places to visit - from iconic locations such as Kinkakuji (Golden Pavilion) and Fushimi Inari Taisha Shrine to lesser-known destinations. Travel tips on navigating Kyoto''s areas, day trips from Kyoto, and hotels are also included!

Kyoto is a popular sightseeing destination among worldwide travelers. The city is filled with diverse charms from historical shrines and temples to photogenic landscapes and delicious Japanese cuisine.

It may be confusing to decide where to go first in Kyoto due to the multitude of famous places to visit.

Our suggestion is to decide on two or three main spots to visit and explore their neighboring areas. In this article, we’ve put together a guide for first-time visitors to Kyoto that introduces the best things to enjoy and places to visit alongside nearby attractions in the area!', '["https://resources.matcha-jp.com/resize/720x2000/2023/04/17-137228.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/18-132014.webp","https://resources.matcha-jp.com/resize/720x2000/2023/04/11-136918.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/12-120301.webp"]'::jsonb, '2016-11-13'::timestamptz),
  ('https://matcha-jp.com/en/758', 'en', 26, 'The KitKat Chocolatory Ginza - Handmade Chocolate And Sweets', 'Do you love KitKat bars? Then you''ll love the KitKat Chocolatory in Japan! They offer a great variety of limited edition KitKats. The Chocolatory in Ginza even includes a cafe space offering sweet delights including the special KitKats.

KitKats are available in most countries but the flavor often is limited to dark, milk and white chocolate. Japanese KitKats have risen to fame for their huge variety and are a popular souvenir amongst visitors. It is easy to understand why once you encounter the huge variety of limited edition KitKat that even includes varieties made from regional products only available in certain regions of Japan.

This year marks KitKat''s 45th Anniversary and to celebrate, we have visited the KitKat Chocolatory in Ginza, Tokyo.

The KitKat Chocolatory is a specialty store opened in collaboration with the Japanese chocolatier Yasumasa Takagi. He is the pastry chef of LE PATISSIER TAKAGI and has created many unique flavors for KitKat over the years.', '["https://resources.matcha-jp.com/resize/720x2000/2019/07/01-80637.webp","https://resources.matcha-jp.com/resize/720x2000/2019/07/01-80638.webp","https://resources.matcha-jp.com/resize/720x2000/2019/03/06-72629.webp","https://resources.matcha-jp.com/resize/720x2000/2019/03/06-72631.webp"]'::jsonb, '2015-03-16'::timestamptz),
  ('https://matcha-jp.com/en/967', 'en', 26, 'Tanabata Festival at Kifune Shrine: A Kyoto Summer Tradition', 'Kifune Shrine in Kyoto holds special illuminations of Tanabata Festival decorations between July 1 and August 15. Don''t miss the dreamlike atmosphere of this event!

The Legend of Tanabata is an ancient story about two stars, Orihime (Vega) and Hikoboshi (Altair).

After falling deeply in love, they began neglecting their work. This angered the Heavenly King, who separated the lovers and decreed they could only meet once a year—on the night of the Tanabata Star Festival. Motivated by this brief reunion, the two work hard throughout the rest of the year.

To celebrate the Tanabata Festival on July 7th, people write wishes on colorful paper strips called tanzaku and tie them to bamboo branches, hoping the Heavenly King will grant their requests.', '["https://resources.matcha-jp.com/resize/720x2000/2023/05/31-138737.webp","https://resources.matcha-jp.com/archive_files/jp/2015/07/DSC07280-001.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/31-138735.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/31-138736.webp"]'::jsonb, '2017-06-27'::timestamptz),
  ('https://matcha-jp.com/en/1259', 'en', 26, 'Kiyomizudera Temple: Features, History, and Best Time to Visit', 'Kyoto''s Kiyomizudera Temple is a historic place you don''t want to miss. We feature the highlights of this World Heritage Site along with tips for those visiting during the cherry blossom and fall foliage season.

Kyoto is home to various shrines and temples. Along with Tokyo, it''s one of Japan''s major travel destinations. Kyoto City is full of history and tradition starting with historic spots such as Fushimi Inari Shrine and Kinkakuji Temple. It also has old-fashioned shops and artisan studios, as well as Japanese restaurants with excellent cuisine.

Among the many popular places to see, Kiyomizudera Temple is visited by almost everyone when sightseeing in Kyoto.

We introduce the highlights of Kiyomizudera Temple along with information on cherry blossom and fall foliage light-ups.', '["https://resources.matcha-jp.com/resize/720x2000/2023/03/22-136203.webp","https://resources.matcha-jp.com/resize/720x2000/2023/03/22-136204.webp","https://resources.matcha-jp.com/resize/720x2000/2019/09/17-86102.webp","https://resources.matcha-jp.com/resize/720x2000/2019/09/17-86103.webp"]'::jsonb, '2017-11-08'::timestamptz),
  ('https://matcha-jp.com/en/7398', 'en', 27, 'The Origins of Takoyaki! Taste the Original Recipe at Aizuya in Osaka', 'Do you know the origin of takoyaki, one of Osaka’s famous street foods? Nowadays, it’s served with various toppings, but the original recipe is quite different. Taste the original flavor of these savory snacks at Aizuya!

When it comes to Osaka, takoyaki is one of the area''s most famous foods.

This savory snack is made with large pieces of octopus, fried in a ball of batter. Cooked until golden brown, it''s served with savory sauce, green onions, and paper-thin shavings of katsuobushi (dried bonito). Takoyaki is the ultimate mouth-watering soul food.

But did you know that the original takoyaki was a simple dish that didn''t have sauce or katsuobushi? Let’s head to the birthplace of takoyaki and learn all about its history!', '["https://resources.matcha-jp.com/resize/720x2000/2019/05/14-76774.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/14-76779.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/14-76780.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/14-76782.webp"]'::jsonb, '2021-02-08'::timestamptz),
  ('https://matcha-jp.com/en/3094', 'en', 27, 'Osaka Travel Guide: 52 Things to Do, Hotels, Dining, and Tips', 'Osaka is a popular travel destination and Japan''s second-largest city. Learn the best things to do in Osaka along with travel tips on local food, hotels, and access to major attractions such as Universal Studios Japan (USJ).

Osaka is home to places full of local charm like Dotonbori and world-famous theme parks like Universal Studios Japan (USJ). When exploring Osaka, we recommend checking the highlights in each major area before planning your trip.

Read on to learn 52 fun things to do in Osaka, hotels, restaurants, and day trip destinations. We''ve also included information on scenic locations outside Osaka City, so keep reading if you’re searching for a day trip.

Osaka started to develop as a large city at the end of the 16th century mainly due to the famous military commander Toyotomi Hideyoshi (1537-1598) being based in Osaka.', '["https://resources.matcha-jp.com/resize/720x2000/2023/04/27-137572.webp","https://resources.matcha-jp.com/resize/720x2000/2022/06/17-127608.webp","https://resources.matcha-jp.com/resize/720x2000/2016/10/14-4915.webp","https://resources.matcha-jp.com/resize/720x2000/2023/04/30-137673.webp"]'::jsonb, '2016-12-16'::timestamptz),
  ('https://matcha-jp.com/en/2742', 'en', 28, 'Osaka to Kobe Travel: The Best Way to Get There', 'Kobe is one of Japan’s leading port cities, blending Western and Japanese cultures. Don’t miss the amazing Kobe beef, Kitano Ijinkan - the historic foreign settlement quarter’s beautiful architecture, or the breathtaking night view of Mount Rokko. Just 30 minutes from Osaka, it’s a great destination for sightseeing and gourmet food.

No visit to Kobe is complete without indulging in its world-famous Kobe beef and other exquisite local cuisine. The city is also known for its unique Western-inspired sweets, such as Kobe pudding and traditional German-style bread, which make excellent souvenirs for dessert lovers.

Kobe is just a 30-minute train ride from Osaka, making it extremely accessible and an easy addition to an Osaka trip. Whether you''re looking for sightseeing, gourmet experiences, or shopping, Kobe offers endless ways to enjoy your visit. Don''t miss the chance to explore this fascinating city!

The most typical way to travel to Kobe from Osaka is by trains serviced by JR (Japan Railway), Hankyu Railway, or Hanshin Electric Railway. The route is simple without passengers having to make any transfers. However, taking the bus, driving a car, or boarding a ferry may be more convenient depending on your travel route and situation.', '["https://resources.matcha-jp.com/resize/720x2000/2022/04/12-125511.webp","https://resources.matcha-jp.com/resize/720x2000/2018/03/06-49568.webp","https://resources.matcha-jp.com/resize/720x2000/2018/03/06-49569.webp","https://resources.matcha-jp.com/resize/720x2000/2023/02/09-134636.webp"]'::jsonb, '2019-02-04'::timestamptz),
  ('https://matcha-jp.com/en/3879', 'en', 28, 'Himeji Guide: The Castle, Museums, And Other Sightseeing Spots', 'Himeji is best known for its World Heritage site, Himeji Castle, but it actually has many more wonderful points of interest. We explain how to reach Himeji from Kyoto or Osaka and introduce fun things to do and places to visit in the city.

Himeji is in the southwestern part of Hyogo Prefecture, which is in the Kansai region. It is part of the Banshu region, and is known as a day trip destination for tourists coming from Osaka and Kyoto. Himeji is also famous for being the home of places like the World Heritage Site Himeji Castle, as well as Engyoji Temple - called the “Mt. Hiei of the west” - in addition to crafts like Himeji tops and Myochin long metal chopsticks.

Read about how to get around Himeji and learn about its famous products, to help you enjoy your Himeji trip to the fullest.

You can get to Himeji from Tokyo by Shinkansen or airplane. When going by air, you have to go through Kobe Airport and switch to local trains from there. If you want to save time commuting, please take the Shinkansen.', '["https://resources.matcha-jp.com/resize/720x2000/2017/01/18-14052.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/18-14043.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/18-14046.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/18-14047.webp"]'::jsonb, '2017-03-18'::timestamptz),
  ('https://matcha-jp.com/en/4072', 'en', 28, 'Things to Do in Arima Onsen, Best Restaurants and Day Trip Ideas', 'Arima Onsen in Kobe is Japan''s most ancient hot spring resort town, thought to be founded over 1,000 years ago. In this guide, we''ll introduce how to get here, the best hot springs, cafes, and other ways to enjoy this area.

Although the area is compact, covering about a kilometer from the main resort, it is home to numerous hot spring inns and shops particularly on the hilly main street, Yumotozaka. If you venture down the side alleyways, you''ll discover many hidden gems waiting to be explored.

Arima Onsen is easily accessible from various locations in western Japan, including Osaka and Kyoto. While day trips are enjoyable, staying for one or two nights allows you to fully immerse yourself in the beauty of Arima Onsen.

Read on to learn the best hot springs at Arima Onsen, hotels, cafes, and souvenir shops, as well as access information.', '["https://resources.matcha-jp.com/resize/720x2000/2024/11/30-213104.webp","https://resources.matcha-jp.com/resize/720x2000/2018/08/21-61081.webp","https://resources.matcha-jp.com/resize/720x2000/2018/08/23-61193.webp","https://resources.matcha-jp.com/resize/720x2000/2018/08/08-60089.webp"]'::jsonb, '2017-02-27'::timestamptz),
  ('https://matcha-jp.com/en/1918', 'en', 29, 'How to Get to Nara From Osaka and Kyoto: Fare Comparison', 'Learn how to access Nara from Osaka and Kyoto in less than one hour. Find out which trains and transportation to take to efficiently travel to Japan''s ancient capital and explore famous historical spots like Todaiji and Horyuji.

Taking under one hour for transportation, Nara can be reached easily from Kyoto and Osaka. In general, those in the greater Kansai region can visit Nara easily.

However, there are no direct railroad routes to Nara from Tokyo. Visitors must travel to Kyoto or Osaka, and switch trains from there. Continue reading to learn how to reach Nara from Kyoto and Osaka.

From Osaka and Kyoto, there are two routes to Nara. Using the limited express of Kintetsu Railway (Kintetsu), or using the local trains of JR Nara Line.', '["https://resources.matcha-jp.com/resize/720x2000/2022/07/11-128222.webp","https://resources.matcha-jp.com/resize/720x2000/2018/03/19-50753.webp","https://resources.matcha-jp.com/resize/720x2000/2018/03/19-50741.webp","https://resources.matcha-jp.com/resize/720x2000/2018/03/20-50843.webp"]'::jsonb, '2016-06-16'::timestamptz),
  ('https://matcha-jp.com/en/6023', 'en', 29, 'Nara''s Bowing Deer - 5 Tips On How To Treat Them The Right Way', 'Many people visit Nara to meet famous bowing deer of Nara Park. You might have heard scary stories of deer kicking people, biting and stealing food but there are some simple steps you can take to prevent this.

Many people visit Nara for the historical sights and the lovable bowing deer of Nara Park. Unfortunately, in the recent years, the number of sick animals and accidents has increased.

Nara''s deer are really calm and accustomed to the presence of humans. However, just like humans, animals can have a bad day. Many of these accidents can actually be prevented if visitors follow some simple steps to keep themselves and the animals safe.

The most important point to remember is that the deer in Nara are living there because they have been considered sacred animals. Even though they are very used to the presence of humans, they have not been domesticated and they aren''t pets. If they don''t like what you are doing to them they will bite or kick.', '["https://resources.matcha-jp.com/resize/720x2000/2018/04/20-52694.webp","https://resources.matcha-jp.com/resize/720x2000/2018/04/20-52697.webp","https://resources.matcha-jp.com/resize/720x2000/2018/04/20-52696.webp","https://resources.matcha-jp.com/resize/720x2000/2018/04/20-52699.webp"]'::jsonb, '2019-05-31'::timestamptz),
  ('https://matcha-jp.com/en/19260', 'en', 25, '15 Hidden Gems in Osaka and Kyoto for Serene Exploration', 'Escape the crowds with these 15 hidden gems in Kansai! Discover peaceful spots in Osaka, Kyoto, and Hyogo, perfect for a relaxing day trip. Plan your serene Japan getaway.

Kyoto and Osaka are year-round favorites, often bustling with crowds. To help you escape the rush, we’ve handpicked 15 hidden gems in these cities and their suburbs that offer a more tranquil experience.

Even during Golden Week—Japan’s busiest travel season—these locations remain manageable, making them the perfect choice for a relaxing day out.

Get the best deals on train tickets in Japan!', '["https://resources.matcha-jp.com/resize/720x2000/2024/04/01-175852.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/01-175853.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/01-175854.webp","https://resources.matcha-jp.com/resize/720x2000/2024/04/01-175855.webp"]'::jsonb, '2024-04-01'::timestamptz),
  ('https://matcha-jp.com/en/4136', 'en', 30, 'Shirahama Onsen In Wakayama - Access, One-Day Hot Springs, And Inns', 'Shirahama is a popular resort spot with great beaches and hot springs. Find out more about how to reach Shirahama Onsen and getting the most out of your time there.

Shirahama is a tourist spot on the southern side of Wakayama prefecture. It is also referred to as the Nanki Shirahama and it is a well-known resort area with beaches and hot springs. It is especially popular among the people of the Kansai area.

Shirahama Onsen, located in Shirahama, is a historical hot spring that is said to be one of the three oldest hot springs in Japan along with Arima Onsen and Dogo Onsen. There are records of the emperor visiting Shirahama Onsen from the sixth to eighth centuries. Shirahama Onsen has great outdoor and foot baths and hot spring hopping is part of the fun. You can enjoy the amazing view of the Pacific Ocean right by the open bath.

To get to Shirahama Onsen, head toward Shirahama Station and transfer to the bus. You will be on the bus for about 20 minutes and it costs 400 yen. In the next section, we will explain how to get to Shirahama Station from various parts of Japan.', '["https://resources.matcha-jp.com/resize/720x2000/2017/03/06-20648.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/06-20649.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/06-20650.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/06-20651.webp"]'::jsonb, '2017-05-03'::timestamptz),
  ('https://matcha-jp.com/en/23224', 'en', 30, 'Wakayama Food Guide: Best Dishes and 10 Local Eateries', 'The local food specialties of Wakayama include Wakayama ramen, nare-zushi, and mehari-zushi. We introduce their features along with eateries where you can sample them.

Wakayama boasts historic sites and breathtaking scenery that attract many visitors.

Our Wakayama food guide introduces must-try dishes to savor while exploring the region, along with recommended eateries to enjoy them.

Wakayama is known for three major specialties: Wakayama ramen, nare-zushi, and mehari-zushi. Among these, ramen is the most popular and can be enjoyed at numerous restaurants throughout Wakayama City.', '["https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215024.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215025.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215026.webp","https://resources.matcha-jp.com/resize/720x2000/2024/12/13-215027.webp"]'::jsonb, '2024-12-28'::timestamptz),
  ('https://matcha-jp.com/en/5602', 'en', 31, 'Japan''s Most Beautiful Starry Sky! Night Tours And Lodgings In Tottori', 'Tottori is said to be Japan’s best spot for stargazing as the Milky Way can be seen in all the cities during the summer. We will introduce you to night tours and recommended lodging facilities where you can enjoy bonfires and fireflies!

Humans have felt awe and wonder at the starry sky since long ago; this has even been mentioned in Greek mythology.

Japan also has the legend of Tanabata (Star Festival) that was introduced from China. It is a love story between Orihime of the star Vega in the Lyra constellation and Hikoboshi of the star Altair in the Aquila constellation. The two lovers can only meet once a year on July 7th.

Why don’t you, too, gaze at the starry sky while immersing yourself in these mystical feelings when you visit Japan?', '["https://resources.matcha-jp.com/resize/720x2000/2018/01/04-45233.webp","https://resources.matcha-jp.com/resize/720x2000/2018/01/19-46367.webp","https://resources.matcha-jp.com/resize/720x2000/2018/01/04-45234.webp","https://resources.matcha-jp.com/resize/720x2000/2018/01/04-45238.webp"]'::jsonb, '2018-04-02'::timestamptz),
  ('https://matcha-jp.com/en/5556', 'en', 31, 'The Climate Of Tottori Prefecture - Seasons And What To Wear', 'In Tottori, visitors can enjoy various activities throughout the year. Read on to learn more about the features of its four seasons. From cherry blossoms spots in spring to the heavy snow in winter, there is a lot to enjoy in Tottori in every season!

When people see the Tottori Sand Dunes, a popular sightseeing spot which resembles a desert, many of them imagine Tottori prefecture to be a hot and dry land.

But visitors can enjoy a different aspect of Tottori in every season. Spring brings warm weather, along with the sakura (cherry blossoms), and summer is the season to go swimming or go for a stroll in the woods.

In fall, the climate becomes cool, and the autumn leaves appear. There is a lot of snow in winter, making it possible for visitors to enjoy sports such as skiing.', '["https://resources.matcha-jp.com/resize/720x2000/2017/12/22-44755.webp","https://resources.matcha-jp.com/resize/720x2000/2017/12/22-44695.webp","https://resources.matcha-jp.com/resize/720x2000/2017/12/22-44756.webp","https://resources.matcha-jp.com/resize/720x2000/2017/12/22-44693.webp"]'::jsonb, '2018-04-02'::timestamptz),
  ('https://matcha-jp.com/en/26628', 'en', 31, 'Tottori Prefecture: Slow Travel in Mt. Daisen’s Foothills and the Hino River', 'The Mt. Daisen-Hino River area in Tottori Prefecture offers a retro train station, a shrine known for good fortune, a year-round flower park, and hot springs. This article highlights tranquil spots where you can truly relax away from the crowds.

Mount Daisen, a symbol of the Daisen foothills and the Hino River basin and one of the 100 Famous Mountains of Japan, stands as a defining presence of the region. Across the north-south expanse shaped by the mountain range and the Hino River flowing at its foot, there are rural landscapes, satoyama woodlands, and tranquil villages, creating a distinct scenery where rich nature and history intertwine.

The Daisen area is blessed with nature in every season, enjoyed in various ways including hiking, hot springs, walks on the beach, and local festivals. Its pure water has fostered a thriving sake culture and breweries, while a wide variety of local dishes has evolved over time.

In this article, we introduce a wide range of attractions, from classic spots to lesser-known hidden gems. While there is an appeal to lively destinations, why not step away from the crowds and momentarily forget about the rush of daily life in tranquil surroundings? Enjoy a restorative day off surrounded by nature, that will leave you fulfilled.', '["https://resources.matcha-jp.com/resize/720x2000/2026/01/28-256843.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/25-256630.webp","https://resources.matcha-jp.com/resize/720x2000/2026/02/26-259754.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/25-256631.webp"]'::jsonb, '2026-02-26'::timestamptz),
  ('https://matcha-jp.com/en/3988', 'en', 32, 'Matsue Castle In Shimane - Beautiful Sights To Enjoy Every Season!', 'Presenting Matsue Castle in Shimane prefecture, built in the Edo Period. One of Japan''s National Treasures since 2015, it is a beautiful sight to behold each season, with cherry blossoms, snow, boats and much more. Read about it down below.

Matsue Castle was built during the Edo period in 1611, by Yoshiharu Horio, a feudal lord governing the Matsue Domain at that time. However, many of its facilities were destroyed one after another at the end of Edo, and at the beginning of the Meiji Period, with only the Tenshukaku (the castle tower) remaining intact thanks to one sympathizer who bought it and had it preserved. Matsue Castle was enlisted as one of Important Cultural Properties of Japan in 1950 and was even added to the list of National Treasures of Japan on the 8th of July, 2015.

To get to Matsue Castle from Kyoto or Osaka, you have to ride JR Sanyo shinkansen to get to Okayama Station. At Okayama Station catch the Limited Express Yakumo of the JR Sanin Main Line bound for Izumo Station, and get off upon arriving at Matsue Station. It will take you from about three and a half to four hours, and around 11,000 to 12,000 yen for a one-way ticket. When you arrive at Matsue Station, hop on the Lakeline Bus and don’t forget to get off at the bus stop near Matsue Castle, Otemae bus stop. It shouldn’t take more than ten minutes to reach the castle.

Visitors can enter Matsue Castle on any day since it is opened all year around, but its opening hours vary depending on the season. During spring and summer (from April to September), it opens at 8:30 and closes at 18:30, and in fall and winter (from October until March), it opens at 8:30 and closes a little bit earlier, at 17:00. However, keep in mind that the last possible admission is thirty minutes before closure!', '["https://resources.matcha-jp.com/resize/720x2000/2017/02/03-17559.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/03-17560.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/03-17561.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/03-17556.webp"]'::jsonb, '2017-06-09'::timestamptz),
  ('https://matcha-jp.com/en/3804', 'en', 32, 'Adachi Museum Of Art, Shimane - See Japan''s Number One Ranked Gardens', 'Today we take you to the magnificent Japanese gardens at the Adachi Museum of Art in Shimane prefecture. Here you can enjoy the beauty of the natural surroundings and also see an impressive collection of Japanese art.

The Adachi Museum of Art is located in Shimane prefecture''s Yasugi city. This highly regarded museum is located on a site covering an area of 50,000 tsubo, or about 165,000 square meters. The impressive art collection focuses on Japanese painting, and the magnificent and grand gardens, which include a dry landscape garden, harmonize with the surrounding natural environment.

The gardens here have been ranked number one for an impressive 17 consecutive years (as of 2020) among Japanese gardens in ''SUKIYA LIVING MAGAZINE'', an American publication devoted exclusively to Japanese-style gardens, and now, both in name and reality, they serve as Japan''s representative gardens.

If you look out from the main building of this museum you can see the many gardens and inside there''s also a collection of Japanese painting and ceramics on display, and in the new annex building there''s an exhibition of modern Japanese painting. Let''s go over to the main building and take a look at the gardens.', '["https://resources.matcha-jp.com/resize/720x2000/2017/01/28-15155.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/28-15151.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/28-15161.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/28-15162.webp"]'::jsonb, '2017-03-08'::timestamptz),
  ('https://matcha-jp.com/en/7439', 'en', 33, 'Okayama Two-Day Travel Itinerary – Must-Visit Places, Shopping, And Food', 'Okayama is home to both major sightseeing spots such as the charming city of Kurashiki and lesser-known but beautiful places. We introduce places, facilities, stores, and local food that you should definitely try in Okayama.

Okayama has a warm climate and faces out towards the Seto Inland Sea. While it is home to many local specialties, it is famous for its delicious fruit.

In this article, we’ll introduce a two-day travel itinerary to iconic places such as Kurashiki in Okayama Prefecture. We’ve also compiled a list of spots with scenic views that you''ll want to share on your Instagram—even if you need to travel a bit further. Alluring shops and local cuisine have also been added to this article. This will surely become a satisfying trip where you can enjoy both Japanese scenery and flavors.

There are various ways to access Okayama but the most convenient is by flying into Okayama Momotaro Airport.', '["https://resources.matcha-jp.com/resize/720x2000/2019/05/19-77215.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/19-77216.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/19-77217.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/22-77531.webp"]'::jsonb, '2019-06-23'::timestamptz),
  ('https://matcha-jp.com/en/11073', 'en', 33, 'Idyllic Scenery and Local Treats! 5 Places to Visit in Misaki, Okayama', 'Misaki, located an hour by train from Okayama City, is home to the scenic Ohaganishi Rice Terraces, Miyasumi Park, and Honzanji Temple. This article introduces five destinations that shouldn''t be missed in Misaki, as well as the region’s famous raw egg over rice, cafes, and accommodations.

Ohaganishi Rice Paddies in autumn. Photo by Pixta

Okayama Prefecture, situated between Hiroshima and Osaka, is a popular sightseeing destination in western Japan. Some of its famous highlights include the Kurashiki Bikan Historical Quarter, Okayama Castle, and Okayama Korakuen Garden.

Misaki is a town located just one hour by train from Okayama City, the prefecture''s capital. Misaki boasts idyllic scenery and attractions that ate unique to the tranquil rural areas. These include the Ohaganishi Rice Terraces that offer splendid scenery in all seasons, and a three-storied pagoda nestled in the forest.', '["https://resources.matcha-jp.com/resize/720x2000/2022/02/09-122441.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/09-122431.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/09-122451.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/09-122432.webp"]'::jsonb, '2022-02-28'::timestamptz),
  ('https://matcha-jp.com/en/3387', 'en', 33, 'Okayama and Kurashiki Guide: Travel, Local Food, Festivals', 'This travel guide introduces the charms of Okayama, a region famous for its wonderful hot springs, traditional atmosphere of the old townscapes, fine food, and festivals.

Okayama Prefecture is located in western Japan, by the Seto Inland Sea. The prefecture is known for its rich natural environment and hot springs.

Kurashiki City, a famous jokamachi (castle town) where visitors can enjoy the Edo Period scenery, and Korakuen, one of the three great Japanese gardens, are both located in Okayama.

There are three routes by which one can reach Okayama from Tokyo: Shinkansen, bus, and airplane.', '["https://resources.matcha-jp.com/resize/720x2000/2022/05/13-126573.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/13-126574.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/13-126575.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/13-126576.webp"]'::jsonb, '2018-01-22'::timestamptz),
  ('https://matcha-jp.com/en/4435', 'en', 34, 'Hiroshima - Visiting The Peace Memorial Park And A-Bomb Dome', 'Interested in visiting the Atomic Bomb Dome and other facilities at the Hiroshima Peace Memorial Park? Here''s what the park has to offer, and how to get there.

The Hiroshima Peace Memorial Park, a public park in the Naka ward of Hiroshima City, Hiroshima, was built near the blast epicenter of the bomb which America dropped on the city on August 6th, 1945. The grounds are home to three facilities: the Atomic Bomb Dome, which is a UNESCO World Heritage site, the Hiroshima Peace Memorial Museum, which features exhibits about the atomic bomb being dropped, and the National Peace Memorial Hall for the Atomic Bomb Victims, which honors those who died.

In addition to these facilities, the park contains the Cenotaph for the Atomic Bomb Victims to grieve for the lost, as well as the Children’s Peace Monument, which was built to mourn the children who died, including Sadako Sasaki, who died from radiation exposure-induced leukemia. The park also has Phoenix trees, which survived radiation exposure without wilting and continue to thrive to this day.

Every August 6th, the Cenotaph is where a Peace Memorial Ceremony is held to comfort the souls of the atomic bomb victims.', '["https://resources.matcha-jp.com/resize/720x2000/2017/05/16-26513.webp","https://resources.matcha-jp.com/resize/720x2000/2017/05/16-26512.webp","https://resources.matcha-jp.com/resize/720x2000/2017/05/16-26511.webp"]'::jsonb, '2017-06-06'::timestamptz),
  ('https://matcha-jp.com/en/2612', 'en', 34, 'More Than Just Itsukushima Shrine - All The Charming Places In Miyajima', 'Miyajima Island is famous for Itsukushima Shrine with its sacred torii gate floating on the ocean. However, there are many more wonderful places and views to Miyajima! Daishoin Temple, Momijidani Park, Toyokuni Shrine are just some of them!

Miyajima is an island in Hiroshima prefecture and a must-see spot when sightseeing in the area. Many travelers make a point in visiting this island along with Hiroshima itself. Home to Itsukushima Shrine, a UNESCO recognized World Cultural Heritage site with its 1400 year old history, to places to purchase wonderful souvenirs and to spots where you can meet wild deer up close, this is an island full of fascinating attractions.

There are beautiful, colorful leaves here in the fall. In addition, in every season there are many other unique things here that would make a trip to Miyajima a memorable one.

The symbol of Itsukushima Shrine is the vermilion 16 meter tall torii gate with a 10 cm circumference brace. When the tide is out, it is even possible to walk about the base of the torii on the sea floor. If you are interested in this fascinating opportunity, there is a table outlining the ebb and flow of the water available in the information center at the shrine itself. And if you are able to, by all means feel free to touch the actual shrine gate itself too when you walk out to it.', '["https://resources.matcha-jp.com/resize/720x2000/2022/05/17-126612.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/17-126614.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/17-126613.webp","https://resources.matcha-jp.com/resize/720x2000/2022/05/17-126615.webp"]'::jsonb, '2016-10-22'::timestamptz),
  ('https://matcha-jp.com/en/3802', 'en', 34, 'The Charm Of Sensuijima Island, A Resort On The Seto Inland Sea', 'Sensuijima is an uninhabited island in Fukuyama''s Tomonoura harbor that has a wealth of natural vistas to explore. Join us as we look at Sensuijima''s top spots to visit.

The island of Sensuijima, located in the Tomonoura harbor of Fukuyama City, Hiroshima, is surrounded by clear blue waters and covered in lush greenery.

On this beautiful, fascinating island, you can feel the awesome power of nature, as shown by the lava rocks and ash crags formed by volcanic activity; you can also enjoy leisure activities like swimming and hiking.

Sensuijima can be accessed by ferry from Tomonoura, and is only five minutes away. Before you visit the island, we’ll introduce you to some spots that you should definitely explore on Sensuijima, as well as other fascinating aspects of the island.', '["https://resources.matcha-jp.com/resize/720x2000/2016/12/29-12828.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/29-12798.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/29-12799.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/29-12800.webp"]'::jsonb, '2017-02-10'::timestamptz),
  ('https://matcha-jp.com/en/1704', 'en', 35, 'Iwakuni Castle, Yamaguchi - Superb Views From The Top', 'Iwakuni, Yamaguchi prefecture is perhaps best known for its Kintai Bridge, but if you''d like to see the sights while learning about Iwakuni''s history, be sure to visit Iwakuni Castle.

Iwakuni city in Yamaguchi prefecture is perhaps best known for its Kintai Bridge. But around this amazing bridge are a great number of interesting sightseeing spots including Iwakuni Castle, a sight not to be missed by visitors to Yamaguchi.

Today, let''s take a closer look at Iwakuni Castle and its many charms as it rises from its mountain peak.

Iwakuni Castle is a fortress located on the summit of Mount Yokoyama near Kintai Bridge. The base of the castle can be reached via a ropeway (cable car) which costs 550 yen round trip and takes roughly three minutes to reach the top.', '["https://resources.matcha-jp.com/resize/720x2000/2017/01/03-13021.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/03-13022.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/03-13023.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/03-13024.webp"]'::jsonb, '2017-01-05'::timestamptz),
  ('https://matcha-jp.com/en/1603', 'en', 35, 'Motonosumi Inari Shrine: Walk Through an Endless Row of Red Torii Gates!', 'Motonosumi Inari Shrine, located in Yamaguchi by the sea, was featured on CNN''s "Japan''s 31 Most Beautiful Places". Learn more about the background of this shrine, its endless row of torii gates, and other highlights.

The standard practice at all Japanese shrines is to place a few coins in the offertory box before praying. At the majority of shrines, you typically toss your offering of coins into the box and that''s that, but there are also shrines where you practically pay to have your troubles taken away.

We visited Motonosumi Inari Shrine where, along with its internationally known superb scenery, you have to work in order to have your wish granted.

Motonosumi Inari Shrine is located in picturesque Nagato city, in Yamaguchi, a place well known for its abundant natural scenery, mountains and ocean views. This shrine was constructed in 1955. A fisherman in the region had a dream wherein he encountered a white fox that said "If you deify me in a shrine, I will bring good luck to this area", and believing this to be a divine message, did just that.', '["https://resources.matcha-jp.com/old_thumbnails/200x2000/822.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123262.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123263.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123264.webp"]'::jsonb, '2016-08-09'::timestamptz),
  ('https://matcha-jp.com/en/4169', 'en', 36, 'Awa Odori Festival 2026: Tokushima''s Summer Dance Festival', 'Experience the Awa Odori Festival 2026 in Tokushima from August 11–15. Discover festival highlights, venue access, and tips to enjoy Japan’s biggest summer dance event.

The Awa Odori Festival in Tokushima is one of the most famous dance festivals in Japan. Along with Gifu’s Gujo Odori Dance and Akita’s Nishimonai Bon Odori, it has a history of over 400 years and is counted as one of Japan’s three most important Bon Odori Festivals (*1).

*1 Bon or Obon... The custom of remembering ancestors and deceased family by visiting their graves, which is usually performed in August.

During the Awa Odori Festival, thousands of people are dancing to the Awa Yoshikono chant "The dancers are fools, and the watchers are fools. If both are fools, then why not dance?"', '["https://resources.matcha-jp.com/resize/720x2000/2017/03/22-21909.webp","https://resources.matcha-jp.com/resize/720x2000/2023/06/16-139567.webp","https://resources.matcha-jp.com/resize/720x2000/2023/06/16-139568.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/22-21910.webp"]'::jsonb, '2018-08-02'::timestamptz),
  ('https://matcha-jp.com/en/12008', 'en', 36, 'Tokushima: Top 12 Things to Do, Scenic Places, Food, and Events', 'Tokushima, located in Japan''s Shikoku region, is famous for its breathtaking natural scenery such as the Naruto Whirlpools and Iya Valley. This guide features 12 famous destinations in Tokushima, things to do, local cuisine, and events such as the exciting Awa Odori festival.

Tokushima is known for the Naruto Strait whirlpools and the scenic Iya Valley with its Iya Kazurabashi Bridge, one of Japan''s three rare bridges made from twisting vines. Awa Odori, a traditional performing art and festival with a history spanning 400 years, is the most famous cultural feature of the region.

Read on to learn about the best places to visit and things to enjoy in Tokushima, alongside cuisine, regional events, and accessibility.

The Naruto Strait is known as one of the three greatest tidal currents in the world, along with the Strait of Messina in Italy and the Seymour Narrows in Canada. The strait stretches from Naruto City, Tokushima Prefecture to Minamiawaji City, Hyogo Prefecture.', '["https://resources.matcha-jp.com/resize/720x2000/2023/06/13-139419.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/15-138208.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/15-138207.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/15-138209.webp"]'::jsonb, '2023-06-05'::timestamptz),
  ('https://matcha-jp.com/en/7696', 'en', 37, 'Tsushima Shrine In Kagawa - Visit The Guardian Deity Of Children', 'Tsushima Shrine is a mystical spot on a small island in Kagawa only accessible on August 4 and 5 during the Great Summer Festival. JR Tsushimanomiya Station, aka “The Station With The Shortest Operating Hours” in Japan, also opens in conjunction and is a must-visit for train enthusiasts.

Tsushima Shrine, located in Mitoyo City, Kagawa, is a sacred place only accessible on August 4 and 5 during the Great Summer Festival. The beauty of this small island in the Seto Inland Sea paired with the shrine’s deities—protectors of marriage, easy child-birth, and children’s well-being—make it a popular spot for couples and families with children.

Tsushimanomiya Station is also popular with train enthusiasts as “The Station Where Trains Only Stop Two Days A Year.” In this article, we will provide a history of the shrine, access information, and our on-site festival report!

One summer in the 1590s, the voice of a woman singing was heard from the island that has now become home to Tsushima Shrine. The nearby villagers found this occurrence bizarre and, through the help of a medium, received a revelation.', '["https://resources.matcha-jp.com/resize/720x2000/2019/08/05-83017.webp","https://resources.matcha-jp.com/resize/720x2000/2019/07/29-82551.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/05-83021.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/05-83022.webp"]'::jsonb, '2019-08-19'::timestamptz),
  ('https://matcha-jp.com/en/7604', 'en', 37, 'Shodoshima Island: Things to Do, Access, and Accommodation', 'Shodoshima Island in Western Japan is part of the internationally-known Setouchi Triennale and is an artsy, popular travel destination. Learn how to get to this charming island, activities you can enjoy year-round, and where to stay.

Shodoshima Island is a large outlying island in the Setouchi Sea, an area known for the famous Setouchi Triennale.

Visiting the island is great for a day trip spot from Okayama Prefecture, Kagawa Prefecture, or even Osaka. It is reachable via ferry from Takamatsu in about an hour. Shodoshima is also an ideal addition for those island-hopping in the area to see art, and has exhibits to see year-round at the Setouchi Triennale.

Continue to read to learn about sightseeing spots and things to do, such as visiting Angel Road, a scenic path that appears during low tide, or the Marukin Soy Sauce Museum, where you can learn how this staple Japanese condiment is made.', '["https://resources.matcha-jp.com/resize/720x2000/2019/07/01-80627.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/26-15043.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/26-15042.webp","https://resources.matcha-jp.com/resize/720x2000/2019/07/01-80628.webp"]'::jsonb, '2019-06-27'::timestamptz),
  ('https://matcha-jp.com/en/3936', 'en', 37, 'Takamatsu Travel Guide - Activities, Where To Stay, And Transportation', 'Takamatsu, Kagawa, is a large city and travel destination close to Osaka and Kyoto. Visitors can enjoy island hopping around Naoshima, Teshima, and Toshima by ferry, as well as enjoy the city with its Japanese gardens to delicious udon noodles. This guide covers things to do and travel tips.

Takamatsu is the largest city in Kagawa Prefecture, part of the Shikoku region of Japan. This scenic location is by the Seto Inland Sea, within accessible distance from Osaka, Kyoto, and the Kansai area.

Takamatsu is also a great spot to stay when island hopping around art-filled Shodoshima, Naoshima, and Toshima, as well as dozens of other small islands. Its harbors make it a great place to stay when the Setouchi Triennale is held.

Continue reading to learn what activities you can enjoy in Takamatsu, where to stay, and how to get there. Read also Shodoshima Island: Things to Do, Access, and Accommodation Kagawa', '["https://resources.matcha-jp.com/resize/720x2000/2019/07/01-80659.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/26-15046.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/26-15048.webp","https://resources.matcha-jp.com/resize/720x2000/2019/07/01-80661.webp"]'::jsonb, '2017-10-27'::timestamptz),
  ('https://matcha-jp.com/en/4334', 'en', 38, 'The Unique Wooden Tower Of Ozu Castle: Access, Highlights And More!', 'Ozu Castle, located in Ozu, Ehime prefecture, features both a faithfully reconstructed wooden castle tower and several original guard towers, making it one of Japan''s top 100 castles. Here are the highlights and access routes to this unique castle!

Ozu Castle, located in Ehime prefecture, Shikoku, is unusual in that it has a beautifully preserved wooden castle tower, making it one of Japan''s top 100 castles. Here are the highlights and access routes to this unique castle.

Built from the 14th to 17th century, many of Ozu Castle''s original structures were dismantled, save for some of the towers. In 2004, based on extant historical documents from the Edo era, the four storey tenshu (*1) was restored to its original appearance. The restoration was completed thanks to generous donations from local citizens, and the castle itself is beloved by the town''s residents.

This tenshu was fully rebuilt using traditional construction methods and Japanese timber. This makes for a rather unusual reconstruction, as the majority of Japanese castles today were rebuilt using modern materials like reinforced bars and concrete. This tower is roughly twenty meters tall, which also makes it one of the tallest castle towers nationwide.', '["https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25134.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25133.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25135.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25136.webp"]'::jsonb, '2017-05-22'::timestamptz),
  ('https://matcha-jp.com/en/4029', 'en', 38, 'Ride The Ropeway Up The Mountain To Matsuyama Castle, Ehime', 'One of Japan''s 100 Castles, Matsuyama Castle in Ehime can be accessed via ropeway. We will introduce this beautiful historic castle and a nearby major festival.

Photo provided by: Matsuyama Tourism Convention Association

Matsuyama Castle is located in the city of Matsuyama in Ehime, one of the prefectures in the Shikoku region. The castle was constructed on a mountain, at an elevation of 132 meters. While you can climb up to the castle via stairs, there is a cable car ropeway installed, so we recommend you take that in order to enjoy the contrast between the historical castle and the convenient modern vehicle. Matsuyama Castle was named one of Japan’s Top 100 castles, and was later chosen along with Matsuyama City’s Dogo Onsen as one of Japan’s Top 100 Beautiful Natural Views. It’s said that those who visit have all their expectations fulfilled, and more.

While several fire outbreaks prior to 1949 caused the loss of some of the castle structures, 21 buildings - including the great keep - still stand today, and some of those burnt-out structures have been reconstructed. The Matsuyama Castle keep is one of only twelve castle keeps in Japan whose construction dates back to before the Edo period.', '["https://resources.matcha-jp.com/resize/720x2000/2017/02/23-19624.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/22-19469.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/23-19571.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/23-19625.webp"]'::jsonb, '2017-03-09'::timestamptz),
  ('https://matcha-jp.com/en/3768', 'en', 38, 'Visit The World Of "Botchan" - Matsuyama City In Ehime', 'Soseki Natsume is regarded as one of the founders of Japanese modern literature. "Botchan", which is one of his representative works, was written based on his experiences when he was sent to Matsuyama Middle School for a year.

The Meiji period (1868-1912) writer Soseki Natsume is one of the best-known Japanese authors. He is well-known not only because he is one of the founders of modern Japanese literature, but also for the fact that his portrait used to be on the 1000 yen note that was in circulation until 2007.

One of Soseki Natsume''s most famous works is the novel "Botchan". The unique cast of characters in this novel, including Botchan ("young master"), Yama Arashi ("mountain storm"), Madonna, Uranari ("unripe calabash"), Aka Shatsu ("red shirt") and Nodaiko ("field radish") leave quite the impression on readers. It is a valuable novel that teaches about the morals of the Meiji period in Japan.

This novel has been adapted into films and dramas many times over, and the version starring Kazunari Ninomiya filmed in 2016 became very popular.', '["https://resources.matcha-jp.com/resize/720x2000/2016/12/23-12355.webp"]'::jsonb, '2017-01-20'::timestamptz),
  ('https://matcha-jp.com/en/7851', 'en', 39, '10 Things To Do In Kochi: Scenic Spots, History, And Cuisine', 'Kochi Prefecture is located in Japan’s Shikoku Island. It is a less touristy place full of stunning nature, history, and delicious food. In this article, we introduce ten places to explore, things to do, and local dishes to taste in Kochi.

Kochi, located in Japan’s Shikoku Island, is famous for scenic nature and delicious skipjack tuna as well as for its yuzu production. Kochi also boasts a rich history with one of Japan''s most famous samurai, Ryoma Sakamoto, being born in here.

Prior to the Meiji Restoration, Kochi was known as the Tosa Province. Nowadays, there still is a city named Tosa in Kochi Prefecture.

We introduce ten activities and things to enjoy in Kochi, a beautiful though lesser-known region of Japan.', '["https://resources.matcha-jp.com/resize/720x2000/2019/09/02-85065.webp","https://resources.matcha-jp.com/resize/720x2000/2019/09/02-85062.webp","https://resources.matcha-jp.com/resize/720x2000/2019/09/03-85127.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/29-84869.webp"]'::jsonb, '2019-08-28'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;
