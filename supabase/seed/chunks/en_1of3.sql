-- MATCHAの記事 en の 1/3（50件）。この1ファイルをそのまま実行する。
-- upsert なので、同じものを二度貼っても増えない。

insert into matcha_articles (url, lang, prefecture_code, title, body, images, published_at)
values
  ('https://matcha-jp.com/en/2946', 'en', 1, 'Hokkaido: 40 Places to Visit by Region and Travel Tips', 'Discover the best things to do in Hokkaido with our updated 2026 guide. From places to visit in Sapporo and Niseko skiing to local food, autumn foliage, and hot springs, find your travel inspiration here.

Hokkaido is known for its magnificent landscapes of pure nature, ski resorts with powder snow, and the freshest local seafood and vegetables.

Located at the northernmost point of Japan, this region enjoys gentle breezes in the summer and beautiful snowscapes in the winter. Hokkaido attracts visitors from both within and outside of Japan throughout the year.

To enjoy Hokkaido to the fullest, this article features everything you need to know about this region: 40 great places to visit, exciting things to do in Hokkaido, and information on local food specialties.', '["https://resources.matcha-jp.com/resize/720x2000/2023/01/13-133732.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/30-132424.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/30-132425.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/30-132426.webp"]'::jsonb, '2016-11-18'::timestamptz),
  ('https://matcha-jp.com/en/6168', 'en', 1, 'Furano-Biei in Hokkaido: Things to Do in Summer and Winter', 'Explore the top 8 things to do in the scenic towns of Furano and Biei, Hokkaido. Discover the best time to see lavender blooms, winter landscapes, and year-round nature spots in Central Hokkaido.

Furano, situated in the center of Hokkaido. Sometimes referred to as the "navel" of Hokkaido, it is a city abundant with nature, surrounded by large mountains including the Tokachi Mountains in the Daisetsuzan Volcanic Group, Mt. Ashibetsu, and Mt. Yubari.

The area has lots of fun activities like hiking and rafting in the spring, and skiing in the winter. There are also a great number of people that come to see the flower fields with different full bloom times every month.

Especially famous is lavender, which has become synonymous with Furano. Around the middle of July, when the flowers approach full bloom, visitors are overwhelmed with the carpets of purple that can be seen everywhere throughout the city.', '["https://resources.matcha-jp.com/resize/720x2000/2018/06/04-55592.webp","https://resources.matcha-jp.com/resize/720x2000/2018/06/01-55512.webp","https://resources.matcha-jp.com/resize/720x2000/2018/06/01-55510.webp","https://resources.matcha-jp.com/resize/720x2000/2018/06/01-55506.webp"]'::jsonb, '2018-07-03'::timestamptz),
  ('https://matcha-jp.com/en/3545', 'en', 1, 'Sapporo Guide: Best Places to Visit, Food, Weather, and Tips', 'Plan your trip with our Sapporo travel guide. Discover the best things to do in Hokkaido’s capital, from historic sites to gourmet food. Get expert tips on Sapporo weather, seasonal packing, and top-rated attractions for every budget.

Hokkaido, Japan’s vast northern frontier, finds its vibrant heart in Sapporo. As the island''s political and cultural hub, the city captivates travelers with its legendary food scene—featuring world-class seafood, savory ramen, and the iconic Jingisukan (grilled mutton).

Whether you''re drawn by the snowy winters or lush summers, Sapporo’s seasonal beauty never fails to enchant.

This guide covers everything you need for the perfect trip, from 15 must-visit attractions to local culinary secrets and essential seasonal packing tips.', '["https://resources.matcha-jp.com/resize/720x2000/2022/03/08-123610.webp","https://resources.matcha-jp.com/resize/720x2000/2018/05/25-54992.webp","https://resources.matcha-jp.com/resize/720x2000/2026/01/09-255225.webp","https://resources.matcha-jp.com/resize/720x2000/2018/05/25-54993.webp"]'::jsonb, '2018-06-27'::timestamptz),
  ('https://matcha-jp.com/en/27358', 'en', 13, 'GINZA SIX: Exclusive Tokyo Gifts and Gourmet Cuisine', 'Tokyo''s GINZA SIX is home to luxury brands, modern art, and gourmet food. Today we feature a refined Ginza experience through the unique charms of GINZA SIX―from premium gifts and gourmet dining at famous restaurants all the way to elegant cafes.

If your plan is to enjoy a day of shopping in Tokyo''s Ginza district, then you don''t want to miss one of the area''s iconic landmarks, GINZA SIX.

Housed inside this commercial facility are a wide range of irresistible attractions: from luxury brands representing the world, all the way to cosmetics and modern art. There are even fine dining restaurants and confectionery shops.

This facility consists of six basement floors and rises thirteen stories above ground. Nine floors within this complex are lined with a total of 240 shops.', '["https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266419.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266420.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266421.webp","https://resources.matcha-jp.com/resize/720x2000/2026/07/02-266422.webp"]'::jsonb, '2026-07-30'::timestamptz),
  ('https://matcha-jp.com/en/1555', 'en', 4, 'Tohoku Region - Japanese Encyclopedia', 'Tohoku is the northern region on the main island of Japan, Honshu, consisting of six prefectures: Aomori, Iwate, Miyagi, Akita, Yamagata, and Fukushima. We introduce the festivals this region is famous for, as well as major heritage sites and travel destinations.

Tohoku comprises the six most northern prefectures of Japan''s main island, Honshu. These prefectures are: Aomori, Iwate, Miyagi, Akita, Yamagata, and Fukushima. The largest major city in the Tohoku Region is Sendai, with a population of 1.5 million. In order to reach the other large cities in Tohoku, it''s typical to travel from Sendai.

Traveling to Sendai from Tokyo by car takes four hours, two hours by bullet train, five hours by highway bus and roughly one hour by plane. It is best to chose your method of travel to the Tohoku Region based on your schedule and budget.

Nature untouched by human hands is abundant in the Tohoku Region. With an elevation of roughly 1000 m above sea level, Shirakami-sanchi mountain range was the first place in Japan to be registered on the UNESCO World Natural Heritage site list.', '["https://resources.matcha-jp.com/resize/720x2000/2022/05/16-126610.webp","https://resources.matcha-jp.com/resize/720x2000/2021/03/17-113229.webp","https://resources.matcha-jp.com/resize/720x2000/2021/03/17-113230.webp","https://resources.matcha-jp.com/resize/720x2000/2021/03/17-113231.webp"]'::jsonb, '2017-05-01'::timestamptz),
  ('https://matcha-jp.com/en/3970', 'en', 2, 'Aomori Nebuta Festival 2026: Dates and Highlights', 'The Aomori Nebuta Festival is a vibrant celebration held annually in northeastern Japan, featuring giant glowing floats. Explore the 2026 dates and highlights.

It is said that the Nebuta Festival was originally based on the toro nagashi, a tradition of releasing lanterns (toro) down the river and into the sea on the night of the Tanabata Star Festival(*1), with participants praying for good health. In the Tohoku region, this tradition was referred to as "neburi nagashi," which later became condensed to nebuta, the festival name that is currently used today.

Then, in the middle of the Edo period, about 1716, people started dancing in the festival with lanterns in their hands and decorated floats called "dashi" were also introduced. It wasn’t until the late Edo period that gigantic lantern floats, inspired by the art of kabuki theater, first appeared and livened up the summertime festival.

Another unique trademark of the Nebuta Festival is the boisterous dance performed by dancers called haneto. This article introduces information regarding the annual dates and venues of the Aomori Nebuta Festival, along with some tips on how to enjoy it to the fullest.', '["https://resources.matcha-jp.com/resize/720x2000/2017/04/03-23160.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/03-23157.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/03-23158.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/03-23159.webp"]'::jsonb, '2019-04-10'::timestamptz),
  ('https://matcha-jp.com/en/22576', 'en', 3, 'Morioka: 12 Places to Visit, Local Food, Hotels, and Travel Tips', 'Morioka, a city in northeastern Japan, is home to Western-style buildings from the Meiji period (1869-1912) and other historical sites that make it an irresistible destination. We explain how to get to Morioka and introduce the best places to visit in the city along with travel tips.

The city retains several Western-style buildings from the Meiji period (1868-1912) and other historical sites that make it an excellent choice for a leisurely day trip.

Additionally, Morioka City is home to memorial museums dedicated to famous literary figures, including Kenji Miyazawa and Takuboku Ishikawa, who were born in or near Morioka. You''ll have plenty of opportunities to learn about their backgrounds and stories!

This article aims to provide a comprehensive introduction to this charming city, including information on Morioka festivals, transportation, attractions, cuisine, and accommodations, all of which can be found below. Allow us to guide you as we explore Morioka City in Iwate Prefecture!', '["https://resources.matcha-jp.com/resize/720x2000/2024/11/14-209310.webp","https://resources.matcha-jp.com/resize/720x2000/2024/11/09-208235.webp","https://resources.matcha-jp.com/resize/720x2000/2024/10/05-200599.webp","https://resources.matcha-jp.com/resize/720x2000/2024/11/05-207557.webp"]'::jsonb, '2024-11-18'::timestamptz),
  ('https://matcha-jp.com/en/15704', 'en', 2, 'A Seafood Paradise! 19 Excellent Products From Eastern Japan', 'The Pacific coast of Japan’s Tohoku and Kanto regions is known as one of the world’s greatest fishing grounds. In this article, we introduce 19 top seafood products made with the catches in these areas including scallop, squid, mackerel, and more!

When it comes to food in Japan, an island country surrounded by the ocean, we have to talk about the abundant variety of seafood.

Fatty and plump seafood is made into tasty processed seafood products that are then delivered all across the country and abroad from Iwate Prefecture and Miyagi Prefecture, which faces the Sanriku and Kinkazan Coast, as well as the nearby Aomori Prefecture. The Sanriku and Kinkazan Coast ranks as one of the world’s three major fishing grounds due to the colliding between the Oyashio (cold current) from the north and Kuroshio (warm current) from the south, which results in a concentration of numerous fish species.

Additionally, Chiba Prefecture in Kanto near Tokyo is home to Kujukuri which has the largest sardine catch in Japan. There are also many excellent fishing grounds in Ibaraki Prefecture with catches such as Japanese spiny lobster, mackerel, and sardines.', '["https://resources.matcha-jp.com/resize/720x2000/2023/11/15-152416.webp","https://resources.matcha-jp.com/resize/720x2000/2022/08/01-128818.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/05-119338.webp","https://resources.matcha-jp.com/resize/720x2000/2020/12/17-110892.webp"]'::jsonb, '2023-12-09'::timestamptz),
  ('https://matcha-jp.com/en/3535', 'en', 4, 'Sendai Travel Guide: 20 Places to Visit, Events, Food', 'Explore the best things to do in Sendai--from the historic ruins of Sendai Castle and the Zuihoden Mausoleum to nature and festivals. Discover local food, top sightseeing spots, and easy transportation tips from Tokyo.

Sendai, in Miyagi Prefecture, is the most populated city in the Tohoku region. It is the heart of the government, economy, and culture of this region.

In the outskirts of the city, you can go to the hot spring districts of Akiu Onsen and Sakunami Onsen, or travel 30 minutes by train to Matsushima, an area boasting one of Japan’s three most scenic views. The city is also convenient when sightseeing in the Tohoku region.

The city’s history begins from the construction of Sendai Castle in 1600 by Date Masamune (1567-1636), a daimyo (feudal lord) during the Sengoku period. He was a popular military commander and many people came to visit the area associated with him.', '["https://resources.matcha-jp.com/resize/720x2000/2019/02/15-71440.webp","https://resources.matcha-jp.com/resize/720x2000/2019/03/20-73467.webp","https://resources.matcha-jp.com/resize/720x2000/2016/11/23-10025.webp","https://resources.matcha-jp.com/resize/720x2000/2019/03/25-73736.webp"]'::jsonb, '2017-01-03'::timestamptz),
  ('https://matcha-jp.com/en/6880', 'en', 4, 'Unique Japanese Souvenirs - Yukitakeya In Matsushima', 'Yukitakeya is a souvenir shop in Matsushima in Japan''s northern Tohoku region. This shop has exclusively handmade souvenirs and signature rice crackers. We will introduce these delicious rice crackers what keepsakes and gifts to look for.

Matsushima is a famous travel destination located a 30-minute train ride away from Sendai Station in the Tohoku region. It is known for its stunning views of the islands of the Matsushima Bay and pine trees scattered across the landscape. Matsushima Bay is regarded as one of the Three Views Of Japan, along with Miyajima, Hiroshima Prefecture''s Itsukushima Shrine and Amanohashidate in Kyoto.

There are also tourist attractions such as the Zuiganji Temple, a Zen temple that is one of Japan''s national treasures, and the Fukuura Bridge, a vivid vermillion bridge. Travelers will also find treats and goods that make excellent souvenirs and gifts. Matsushima is a location you will fall in love with and want to visit again.

In this article, we will be introducing Yukitakeya, a souvenir shop that specializes in products of the Japanese culture, exclusive to Matsushima.', '["https://resources.matcha-jp.com/resize/720x2000/2018/12/06-67592.webp","https://resources.matcha-jp.com/resize/720x2000/2018/12/06-67593.webp","https://resources.matcha-jp.com/resize/720x2000/2018/12/04-67331.webp","https://resources.matcha-jp.com/resize/720x2000/2018/12/06-67594.webp"]'::jsonb, '2019-01-21'::timestamptz),
  ('https://matcha-jp.com/en/6750', 'en', 4, 'Tashirojima: 10 Things to Do on Japan''s Cat Island, Hotels, and Dining', 'Tashirojima Island, known as a cat island in Japan, is located off the coast of Ishinomaki City in Miyagi Prefecture. Several hundred cats live among the islanders here. We introduce the best things to enjoy on Tashirojima along with tips on how to get to the Island.

Tashirojima Island is a small island off the coast of Ishinomaki City in eastern Miyagi Prefecture in eastern Japan. Over 130 cats live alongside the human residents on this 11km island. There are more cats than people on the island, resulting in it being known as one of Japan''s cat islands, gathering attention from cat lovers.

The easiest way to get to Tashirojima Island is to take a bus and ferry from Ishinomaki Station. Ishinomaki Station is about an hour from Sendai by train. A detailed way of getting here is introduced in the latter half of this article.

Tashirojima Island''s abundant cat population has roots deeply intertwined with the island''s history and cultural beliefs. Initially brought in to tackle the island''s rodent problem that threatened the silkworm industry, cats quickly proved their worth as efficient hunters, helping to preserve the silk trade that was crucial to the local economy.', '["https://resources.matcha-jp.com/resize/720x2000/2018/10/29-65432.webp","https://resources.matcha-jp.com/resize/720x2000/2024/06/21-184587.webp","https://resources.matcha-jp.com/resize/720x2000/2018/11/02-65659.webp","https://resources.matcha-jp.com/resize/720x2000/2018/10/29-65431.webp"]'::jsonb, '2018-12-05'::timestamptz),
  ('https://matcha-jp.com/en/4198', 'en', 5, 'Akita Kanto Festival 2026: a Parade of 10,000 Lanterns', 'The Akita Kanto Festival is held August 3-6 to pray for health and a good harvest. Check the dates and highlights to witness 10,000 lanterns fill the night sky.

The Akita Kanto Matsuri, or Akita Kanto Festival is an annual festival held in summer in Akita City, northern Japan.

Together with the Nebuta Festival in Aomori, and the Tanabata Festival in Sendai, it is considered to be one of the Three Great Tohoku Festivals, and it certainly is one magnificent festival the Tohoku region is proud of.

It is believed that the origins of the Akita Kanto Festival could be tracked down to the old custom of neburi nagashi, often performed during the Tanabata, Obon, and other festivals of the old Japanese calendar (*1).', '["https://resources.matcha-jp.com/resize/720x2000/2017/03/21-21813.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/21-21814.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/21-21810.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/21-21809.webp"]'::jsonb, '2017-07-24'::timestamptz),
  ('https://matcha-jp.com/en/3183', 'en', 5, 'Northern Japan in Autumn: 15 Fall Foliage Spots in 2025', 'In northern Japan, the fall foliage can be enjoyed earlier than Tokyo and Kyoto - from around mid-October. Learn the best 15 fall spots in Sendai, Aomori, Lake Towada, Fukushima, and other areas in Tohoku.

2025 fall foliage map based on information from Weathernews

The Tohoku region, which encompasses six prefectures in the northeastern part of Japan''s Honshu Island, is home to both magnificent natural scenery and historical structures.

Shirakami-Sanchi—a World Heritage Site in Aomori, Lake Towada, and the countless cultural heritage sites in Iwate''s Hiraizumi are very beautiful in the fall.', '["https://resources.matcha-jp.com/resize/720x2000/2025/10/07-246219.webp","https://resources.matcha-jp.com/resize/720x2000/2023/07/29-142187.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/01-82825.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/01-82751.webp"]'::jsonb, '2019-04-10'::timestamptz),
  ('https://matcha-jp.com/en/25099', 'en', 5, '[Akita] With over 100 years of history! Japan''s No. 1 fireworks competition - "Omagari Fireworks Festival"', 'The Omagari Fireworks Festival is one of Japan''s leading fireworks festivals, held annually in Daisen City (formerly Omagari City), Akita Prefecture. This festival has a long history of over 100 years. It is known as "Japan''s No. 1 fireworks competition" due to its technical skill and high level of prestige.

The origins of this event date back to 1910 (Meiji 43), and it is a historic and prestigious event that has been handed down for over 100 years since then. Today, it is highly regarded as Japan''s most prestigious fireworks competition, where top fireworks makers selected from around the country gather to compete in skill and artistry.

The biggest feature of Omagari Fireworks is that the fireworks are not just for viewing, but are positioned as a "competition." Only a select few fireworks companies can participate, and all the fireworks that are launched boast an extremely high level of perfection in terms of composition, color, timing, and creativity.

The event is divided into "Daytime Fireworks" and "Night Fireworks." The daytime fireworks feature a visual and technical display using the colors and shapes of the smoke.', '["https://resources.matcha-jp.com/resize/720x2000/2025/06/06-235675.webp","https://resources.matcha-jp.com/resize/720x2000/2025/06/06-235676.webp","https://resources.matcha-jp.com/resize/720x2000/2025/06/06-235678.webp","https://resources.matcha-jp.com/resize/720x2000/2025/06/06-235680.webp"]'::jsonb, '2025-06-06'::timestamptz),
  ('https://matcha-jp.com/en/3807', 'en', 6, 'Taisho Retro - Memories of Old Japan at Ginzan Onsen, Yamagata', 'Ginzan Onsen is a wonderful hot springs town, famous for its traditional architecture and one of the top travel destinations in Tohoku. This article introduces some of the charms of Ginzan Onsen, from famous ryokan to activities and local souvenirs.

These days, a visit to Ginzan Onsen is hardly an excursion off the beaten path, but it is a delightful trip into the past. Located in a remote valley, the town looks like a historic movie set and a visit at any time of the year will be unforgettable.

In winter, the scenery is at its most impressive. This area of Japan gets over two meters of heavy snow during the season and you can enjoy the experience driving through the snow-covered countryside before finally arriving at Ginzan, located at the end of route 188 from Obanazawa, Yamagata prefecture.

The narrow streets are barely wide enough for cars, so after parking at the entrance to Ginzan you stroll down the hillside to the village. The Ginzan River flows through a narrow gorge and, in winter, steam rising through the snow looks especially dramatic.', '["https://resources.matcha-jp.com/resize/720x2000/2017/01/04-13057.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/04-13059.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/04-13060.webp","https://resources.matcha-jp.com/resize/720x2000/2017/01/04-13056.webp"]'::jsonb, '2017-01-04'::timestamptz),
  ('https://matcha-jp.com/en/3697', 'en', 6, 'Risshakuji - Yamadera''s Intriguing Mountain Temple', 'Risshakuji Temple, built twelve centuries ago up a steep riverside cliff in Yamagata prefecture, has a rich history. Its scenic setting make it one of the top destinations in Tohoku!

Yamagata, an important agricultural prefecture in the Tohoku region, is home to one of the most interesting temples in Japan. This is the Risshakuji Temple complex at Yamadera, where Yakushi Nyorai, the Buddha of healing and medicine, is enshrined.

This intriguing Yama-dera "mountain temple" clings to the hillside in a gorgeous location above a river valley. It is a nationally designated place of scenic beauty and listed as a historic site.

Although built in 860 AD, over the centuries it has been destroyed more than once, and the current temple dates from the 16th century by which time it had become a rich and important religious center of the Tendai sect of Buddhism. It is a Tendai pilgrimage site, along with three other temples in Tohoku: Zuiganji in Matsushima (Miyagi prefecture), and Chusonji and Motsuji, both in Hiraizumi (Iwate prefecture).', '["https://resources.matcha-jp.com/resize/720x2000/2016/12/07-11120.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/07-11117.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/07-11119.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/07-11121.webp"]'::jsonb, '2016-12-08'::timestamptz),
  ('https://matcha-jp.com/en/4099', 'en', 6, 'Ginzan Onsen Complete Guide: Hot Springs, Hotels, How to Get There', 'Yamagata''s Ginzan Onsen is one of the most charming hot spring towns in Japan with a nostalgic early 20th-century atmosphere. This guide explains how to get to Ginzan Onsen and offers lodging and activity recommendations.

Ginzan Onsen is in Obanazawa, Yamagata Prefecture, which is located in the Tohoku Region. The hot spring town is right by the prefectural border with Iwate. It is said to have received its name from a giant silver mine ("ginzan" in Japanese) called Nobezawa Ginzan which prospered in the past.

The current hot spring town was established after a large flood at the beginning of the 20th century. Wooden ryokans line both sides of the river, and the area has maintained its townscape as it was when these ryokans were built. Here at Ginzan Onsen you will be able to feel the history of the region.

Continue reading to learn about how to make a trip to Ginzan Onsen the best it can be.', '["https://resources.matcha-jp.com/resize/720x2000/2019/04/12-75072.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/28-20051.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/28-20053.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/28-20054.webp"]'::jsonb, '2017-06-09'::timestamptz),
  ('https://matcha-jp.com/en/8650', 'en', 7, 'Tamura, Fukushima: Adventure Outdoors In Rural Japan', 'Japan''s countryside offers natural beauty and many things not found in crowded cities. Tamura City in Fukushima Prefecture is one such place. Explore highlight attractions like Abukuma Cave, the nature park, Mushi Mushi Land, and stunning seasonal sceneries.

A typical trip to Japan involves visiting convenient, busy urban areas.

However, these crowded cities with neon lights are a stark contrast to the peaceful, natural beauty Japan has to offer. The Japanese countryside is where you can experience life in harmony with nature.

This article features a different side of Japan found in Tamura City, Fukushima Prefecture.', '["https://resources.matcha-jp.com/resize/720x2000/2020/01/02-94376.webp","https://resources.matcha-jp.com/resize/720x2000/2020/01/02-94377.webp","https://resources.matcha-jp.com/resize/720x2000/2020/01/02-94378.webp","https://resources.matcha-jp.com/resize/720x2000/2020/01/02-94379.webp"]'::jsonb, '2020-02-07'::timestamptz),
  ('https://matcha-jp.com/en/22235', 'en', 7, 'Fukushima Autumn Foliage in 2026: Hidden Gems and Light-ups', 'Discover the best Fukushima autumn foliage spots, from Tsurugajo Castle Park to the historic streets of Ouchi-juku. Plan your trip with our 2026 guide to peak viewing times and autumn festivals in Fukushima.

Fukushima Prefecture is known for its sublime autumn colors. It features many renowned spots for enjoying the vibrant fall foliage created by its rich nature. This article introduces recommended autumn foliage spots within Fukushima to enjoy seasonal scenic sites.

Every year, from mid-October to early November, this area is enveloped in colorful autumn leaves.

From parks where families can have fun to the beautiful foliage of historic buildings, we will showcase spots where you can sense the deepening of autumn along with the peak of the fall colors in Fukushima.', '["https://resources.matcha-jp.com/resize/720x2000/2024/10/03-200293.webp","https://resources.matcha-jp.com/resize/720x2000/2024/10/23-204411.webp","https://resources.matcha-jp.com/resize/720x2000/2024/10/23-204412.webp","https://resources.matcha-jp.com/resize/720x2000/2024/10/23-204413.webp"]'::jsonb, '2024-10-24'::timestamptz),
  ('https://matcha-jp.com/en/24299', 'en', 7, 'Tsuruga Castle Park Cherry Blossom Festival: Highlights and Tips', 'Tsuruga Castle Park hosts cherry blossom light-ups alongside the Tsuruga Castle Cherry Blossom Festival. Read on to learn the dates and festival highlights.

Tsuruga Castle (Wakamatsu Castle), located in Aizuwakamatsu City, is surrounded by approximately 1,000 cherry blossom trees, creating a magnificent scene in spring.

Tsuruga Castle Park has been selected among the "100 Famous Cherry Blossom Spots in Japan" for its beauty, making it a signature cherry blossom spot in Aizu.

Every year, many domestic and international tourists visit to enjoy hanami (flower viewing) during the cherry blossom season.', '["https://resources.matcha-jp.com/resize/720x2000/2025/02/27-226232.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/27-226234.webp","https://resources.matcha-jp.com/resize/720x2000/2025/02/27-226233.webp","https://resources.matcha-jp.com/resize/720x2000/2025/12/26-254092.webp"]'::jsonb, '2025-03-11'::timestamptz),
  ('https://matcha-jp.com/en/4360', 'en', 8, 'Hitachi Seaside Park: Ibaraki’s Blue Nemophila Flower Garden', 'Visit Hitachi Seaside Park in Japan to see the famous blue Nemophila bloom! Discover stunning seasonal flower fields and scenic parks in their peak May beauty.

Hitachi Seaside Park is a wide public park in Ibaraki stretching over an area of around 350 hectares. This park is famous countrywide for its various seasonal flowers blooming throughout the year - narcissus and tulips in spring, nemophila and roses in early summer, zinnias in summer, and kochia and cosmos flowers in the fall.

However, when speaking of Hitachi Seaside Park, people will immediately think of its famous Nemophila flowers. It will soon be the season for this flower to bloom! Let''s see some of the reasons why you should definitely check out this garden around the beginning of May.

See beautiful Nemophila and Wisteria flowers on a one-day tour from Shinjuku!', '["https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25066.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25067.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25068.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/25-25069.webp"]'::jsonb, '2017-04-25'::timestamptz),
  ('https://matcha-jp.com/en/5256', 'en', 8, 'Mount Tsukuba: Take A Day Trip From Tokyo To See Unforgettable Vistas!', 'Today we introduce Mount Tsukuba, ranked alongside Mount Fuji as one of Japan''s great mountains. We recommend Mount Tsukuba''s summit for those who''d like to enjoy Japan''s rural nature and scenery, and for those interested in shrines and temples.

Mount Tsukuba is a mountain in Ibaraki prefecture, with two separate peaks. Since ancient times, both Mount Tsukuba and Mount Fuji, Japan''s tallest mountain, have been referred to as nishi no Fuji, higashi no Tsukuba, or Mount Fuji to the west and Mount Tsukuba to the east.

Mount Tsukuba stands at an elevation of 877 meters. The mountain is serviced by a cable car, a ropeway, and a road leading up to the summit. So visitors don''t need to bring any trekking equipment in order to have an enjoyable experience.

On the mountainside there''s also Mount Tsukuba Shrine, famous for its matchmaking powers, and this revered mountain is a recommended spot for those interested in nature, and shrines and temples.', '["https://resources.matcha-jp.com/resize/720x2000/2017/10/25-39634.webp","https://resources.matcha-jp.com/resize/720x2000/2017/10/25-39635.webp","https://resources.matcha-jp.com/resize/720x2000/2017/10/25-39619.webp","https://resources.matcha-jp.com/resize/720x2000/2017/10/25-39617.webp"]'::jsonb, '2019-03-25'::timestamptz),
  ('https://matcha-jp.com/en/12698', 'en', 8, 'Kasumigaura: Enjoy Food and Activities at the Second-Largest Lake in Japan', 'Kasumigaura in Ibaraki Prefecture, the second-largest lake in Japan, is accessible in about an hour from Tokyo. Since ancient times, fish caught at the lake have been made into sweet-salty tsukudani dishes. This article features a tsukudani product with attractions and sightseeing spots in the area!

Kasumigaura, located in southeastern Ibaraki, is Japan''s second-largest lake, measuring 252 kilometers in circumference. It is a popular sightseeing spot in the Kanto region, about an hour away from Tokyo.

There are various attractions while enjoying the lake view, such as boarding a traditional fishing boat (hobikibune) or the cycling course.

Kasumigaura, a freshwater lake, boasts an abundance of seafood, such as wakasagi (pond smelt), shira-uo (Japanese icefish), and shrimp. Many fishery processing plants are in the area, delivering unique local products.', '["https://resources.matcha-jp.com/resize/720x2000/2023/08/30-144617.webp","https://resources.matcha-jp.com/resize/720x2000/2023/08/30-144613.webp","https://resources.matcha-jp.com/resize/720x2000/2023/08/30-144606.webp","https://resources.matcha-jp.com/resize/720x2000/2023/08/30-144614.webp"]'::jsonb, '2023-10-06'::timestamptz),
  ('https://matcha-jp.com/en/3055', 'en', 9, 'Nikko: 20 Things to Do, Must-Visit Sites, Dining, Access', 'Nikko, just two hours from Tokyo by train, is renowned for its World Heritage sites and the rich nature in Nikko National Park. Read on to learn 20 things to enjoy in Nikko, from Nikko Toshogu Shrine to Lake Chuzenji, hot springs, and local food.

Nikko in Tochigi Prefecture is one of Japan''s most famous travel destinations due to World Heritage sites such as Nikko Toshogu Shrine and the rich natural environment in Nikko National Park. Nikko can be accessed in just two hours from Tokyo via Tobu Railway lines and JR lines.

The Nikko area has a long history, flourishing as a sacred land for Shinto mountain worship since the Kamakura Period (1185 – 1333). Nikko Toshogu Shrine was constructed during the Edo Period (1603-1868) to enshrine the souls of shoguns Tokugawa Ieyasu and Tokugawa Iemitsu.

In the Meiji period (1868-1912), Nikko was a popular summer resort due to its rich nature and cool temperatures. The Imperial family owned a summer retreat here. Several foreign embassies had summer villas in Nikko by Lake Chuzenji and the city was popular as a holiday destination for diplomats.', '["https://resources.matcha-jp.com/resize/720x2000/2019/05/31-78390.webp","https://resources.matcha-jp.com/resize/720x2000/2019/11/26-91688.webp","https://resources.matcha-jp.com/resize/720x2000/2019/12/03-92144.webp","https://resources.matcha-jp.com/resize/720x2000/2023/07/18-141308.webp"]'::jsonb, '2016-11-30'::timestamptz),
  ('https://matcha-jp.com/en/1344', 'en', 9, 'Nikko Toshogu Shrine: Highlights of Japan''s 400-Year World Heritage Site', 'Nikko, home to several World Heritage sites, is a popular travel destination all year round. This article provides an in-depth guide to Nikko Toshogu Shrine, a UNESCO World Heritage Site famous for its golden gate and elaborate wooden carvings.

Nikko is a popular travel destination all year round. Nikko Toshogu Shrine is a highlight of the sightseeing location.

You may have seen the elaborate shrine pictured in a travel guide. As the burial site of Japan''s military hero Ieyasu Tokugawa, the Toshogu has had a significant influence on Japan''s history and culture.

This article covers Toshogu''s history, its standout features, and what visitors can do at this renowned site. We hope this will enhance your visit to the shrine.', '["https://resources.matcha-jp.com/resize/720x2000/2019/05/31-78390.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/31-78391.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/31-78392.webp","https://resources.matcha-jp.com/resize/720x2000/2019/08/01-82749.webp"]'::jsonb, '2018-01-24'::timestamptz),
  ('https://matcha-jp.com/en/7337', 'en', 10, 'Kusatsu Onsen Guide: Best Hot Springs, Travel Tips and Where to Stay', 'Kusatsu Onsen, one of the top three hot springs in Japan, can be easily accessed by direct bus from Tokyo. Learn more about the best natural hot springs in Kusatsu, food, souvenirs, and where to stay.

There are many restaurants and cafes in Kusatsu Onsen, making the area lively even at night. Hot springs flow from the waterfall-like Yubatake in the town center, where visitors can see the large amounts of steam rising.

This article introduces the features of Kusatsu Onsen, places to visit, food, and accommodations for a relaxing hot spring trip.

Kusatsu Onsen is easy to access from Tokyo. You can get there in about four hours via express bus from the Shinjuku Bus Terminal.', '["https://resources.matcha-jp.com/resize/720x2000/2023/11/10-151777.webp","https://resources.matcha-jp.com/old_thumbnails/200x2000/1949.webp","https://resources.matcha-jp.com/resize/720x2000/2019/04/24-75961.webp","https://resources.matcha-jp.com/resize/720x2000/2019/05/09-76485.webp"]'::jsonb, '2019-05-28'::timestamptz),
  ('https://matcha-jp.com/en/1710', 'en', 10, 'The Beauty Of Kusatsu Onsen In Winter: Snowflakes And Hot Springs', 'Kusatsu Onsen in Gunma prefecture is one of the best quality hot spring resorts in Japan. When winter comes, the snow covers the houses creating an amazing landscape. Visit Kusatsu Onsen and get warm in its wonderful hot springs!

Tokyo and Osaka are the most popular travel destinations among international travelers. But how about considering Kusatsu Onsen (Kusatsu hot spring resort) in Gunma prefecture if you wish to visit other places in Japan? Along with Arima Onsen in Hyogo prefecture and Gero Onsen in Gifu prefecture, Kusatsu Onsen ranks as one of the three highest-quality hot springs that are loved also by the Japanese.

In winter, snow fall in Kusatsu. Travelers visit Kusatsu Onsen resort to view the landscape with snow, while soaking in a hot spring to get rid of their fatigue.

In Kusatsu, in addition to hot spring resorts, Japanese-style houses and stores are found along a beautifully paved street which makes you feel amazing just by walking along it.', '["https://resources.matcha-jp.com/archive_files/tw/2016/02/Kusatsu1_20160216.webp","https://resources.matcha-jp.com/archive_files/tw/2016/02/Kusatsu3_20160216.webp","https://resources.matcha-jp.com/archive_files/tw/2016/02/Kusatsu9_20160216.webp","https://resources.matcha-jp.com/archive_files/tw/2016/02/Kusatsu_20160216.webp"]'::jsonb, '2017-10-15'::timestamptz),
  ('https://matcha-jp.com/en/3235', 'en', 11, 'Enhance Your Love Life: 8 Must-Do Activities at Hikawa Shrine in Kawagoe', 'Hikawa Shrine in Kawagoe is well-known as a shrine of relationships and matchmaking. We have listed up eight things that you shouldn''t miss out when visiting Hikawa JInja.

Have you ever wished to encounter your true love in the most romantic storybook way possible? Perhaps Kawagoe Hikawa Shrine in Kawagoe city, Saitama, would be able to grant that wish.

In this article, we will introduce you to things you can do at Kawagoe Hikawa Shrine, such as sending off dolls down the river and trying out red snapper good luck lotteries.

The Kawagoe Hikawa Shrine is said to be approximately 1500 years old and is where five deities are enshrined: Susanoo no Mikoto, Kushinadahime no Mikoto, Ashinazuchi no Mikoto, Tenazuchi no Mikoto, and Oonamuchi no Mikoto.', '["https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123231.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123232.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123233.webp","https://resources.matcha-jp.com/resize/720x2000/2022/02/25-123234.webp"]'::jsonb, '2016-12-17'::timestamptz),
  ('https://matcha-jp.com/en/5079', 'en', 11, 'A Walk Through Totoro''s Forest In Saitama', 'The Forest of Totoro is a gem hidden in the mountain area of Saitama. Most popular as a hiking destination in summer, it presents itself even more beautiful in the autumn, when it''s dipped in fall colors.

If you are a fan of Studio Ghibli’s movies and the beauty of Japanese nature, the Totoro Forest in Saitama will be a destination you don’t want to miss.

Just one hour from Tokyo''s center by train or bus, you will find yourself being immersed in the generosity of mother nature. A deep forest with beautiful lakes, a vast sky and thousands of amazing living creatures awaits you.

You will see signboards decorated with the caharacters from "My Neighbor Totoro" on the way', '["https://resources.matcha-jp.com/resize/720x2000/2017/09/21-36564.webp","https://resources.matcha-jp.com/resize/720x2000/2017/09/21-36563.webp","https://resources.matcha-jp.com/resize/720x2000/2017/09/21-36565.webp","https://resources.matcha-jp.com/resize/720x2000/2017/09/21-36566.webp"]'::jsonb, '2017-10-01'::timestamptz),
  ('https://matcha-jp.com/en/5405', 'en', 11, 'Nagatoro - Enjoy Amazing Natural Scenery And Great Local Food Near Tokyo!', 'Nagatoro in Saitama is a great spot to view the autumn leaves. A train ride to Nagatoro takes only two hours from Shinjuku. We introduce a one-day plan to enjoy the amazing sights and great local dishes of Nagatoro.

Nagatoro, a town located in the Chichibu district of Saitama prefecture, is a popular sightseeing spot, blessed with beautiful natural scenery and fine cuisine.

Along with the surrounding mountains, Nagatoro has a wide variety of unique landscapes, created by ancient tectonic movements.

The most famous of these is the huge rock formation called Iwadatami along the Arakawa river, which spreads out over a distance of 500 meters and stands eighty meters wide.', '["https://resources.matcha-jp.com/resize/720x2000/2017/11/24-42148.webp","https://resources.matcha-jp.com/resize/720x2000/2017/11/24-42149.webp","https://resources.matcha-jp.com/resize/720x2000/2017/11/24-42150.webp","https://resources.matcha-jp.com/resize/720x2000/2017/12/15-43888.webp"]'::jsonb, '2017-12-21'::timestamptz),
  ('https://matcha-jp.com/en/4070', 'en', 12, 'Narita Airport Complete Guide: From Free SIM Cards To Free Transit Tours!', 'Narita International Airport is the gateway to Japan for many travelers, and offers numerous services to make their stay a memorable one. Let''s take a look at what you can make use of when arriving, departing, or on a layover at Narita.

Narita Airport is used by many travelers who come and visit Japan. As a result, within Narita''s terminals a number of services are offered in order to increase its overall convenience for guests.

Their Wi-Fi environment is one of them. Free Wi-Fi is available throughout the airport, making it easy for travelers to look up any information they need to organize their plans after arrival, as well as get in touch with family before making the journey home.

Narita Airport has three terminals, which are connected by a free shuttle bus. The boarding area for this shuttle bus is very well marked, so you needn''t worry about not being able to find it.', '["https://resources.matcha-jp.com/resize/720x2000/2017/02/22-19536.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/22-19535.webp","https://resources.matcha-jp.com/resize/720x2000/2017/03/22-21887.webp","https://resources.matcha-jp.com/resize/720x2000/2017/02/22-19537.webp"]'::jsonb, '2018-04-16'::timestamptz),
  ('https://matcha-jp.com/en/14', 'en', 13, 'Cat Street: Fresh Boutique Fashions', 'Want to walk from Shibuya to Harajuku, but don''t want to suffer through the crowds? Head to Cat Street where you can shop as you walk at some amazing boutiques.

If you are walking from Shibuya to Harajuku, then you may see lots of stylish people suddenly breaking away from the main road and heading down a narrower, more crowded street. If you are feeling brave enough to head down that way too, you will find yourself on a street full of amazing boutiques and gorgeous cafes - a purr-fect place to shop.

Cat Street is the nickname for the road connecting Shibuya and Harajuku; this road takes one towards Miyashita Park on Meiji Street and near the Shibuya Welfare Center for the Disabled.

This street is the perfect segue from the bright lights of Shibuya to the fashion-forward, individualistic shops of Harajuku. It has been constantly adapted and is now a rather upmarket home to some of the best Japanese and international brands that cater to fashion-conscious youth.', '["https://resources.matcha-jp.com/resize/720x2000/2022/03/08-123641.webp","https://resources.matcha-jp.com/resize/720x2000/2022/03/08-123640.webp","https://resources.matcha-jp.com/resize/720x2000/2022/03/08-123646.webp"]'::jsonb, '2014-02-03'::timestamptz),
  ('https://matcha-jp.com/en/27', 'en', 13, 'Ameyoko: An Old Shopping Street with Amazing Discount Prices!', 'If you want to experience an authentic Japanese shopping street, then a trip to Ameyoko is in order! You can find amazing Japanese products of all kinds and even bargain items, too.

Ameyoko is a historical shopping street that connects JR Ueno Station and Okachimachi Station. While it may not initially appear like an exciting place, this fantastic shopping area is where you can find incredible deals on Japanese food products, clothing, jewelry, leather goods, daily necessities, and other surprising items in one market.

The formal name of this area is Ameyoko Shopping Street, which is affectionately nicknamed "Ameyoko" by residents, shop staff, and customers alike.

In the photo above, you can see the signboard above the alleyway with “Ameyoko” written in Japanese characters. This is only a small portion of the market. There are plenty of shops to see along the street.', '["https://resources.matcha-jp.com/resize/720x2000/2022/04/28-126200.webp","https://resources.matcha-jp.com/resize/720x2000/2022/04/28-126201.webp","https://resources.matcha-jp.com/resize/720x2000/2022/04/28-126202.webp","https://resources.matcha-jp.com/resize/720x2000/2022/04/28-126203.webp"]'::jsonb, '2017-06-07'::timestamptz),
  ('https://matcha-jp.com/en/44', 'en', 13, '5 Must-Visit Anime Stores In Akihabara, Tokyo', 'Akihabara in Tokyo is renowned for its shops and culture of Japanese anime, manga, and games. This article features five stores that visitors should definitely check out for shopping and unique souvenirs, from Animate to Kotobukiya.

Akihabara in Tokyo is a very popular district for fans of Japanese anime, manga and games. Visitors will find countless anime- and manga-related goods nearly everywhere, making for great shopping for souvenirs and goods.

Continue reading to learn about the five top places to go to in Akihabara to encounter this otaku culture. Each shop is welcoming to all guests regardless of their knowledge of anime and manga.

GAMERS is ideal for finding seasonal anime, comic books, computer games and other related goods. On the first floor, there is an impressive pile of the latest anime magazines and comics. There are seven floors in total, making it easy to spend hours here browsing and shopping.', '["https://resources.matcha-jp.com/resize/720x2000/2024/10/16-202905.webp","https://resources.matcha-jp.com/archive_files/jp/2014/02/shop3-1024x682.webp","https://resources.matcha-jp.com/resize/720x2000/2024/10/16-202907.webp","https://resources.matcha-jp.com/archive_files/jp/2014/02/shop7-1024x766.webp"]'::jsonb, '2014-02-28'::timestamptz),
  ('https://matcha-jp.com/en/1519', 'en', 14, 'The Top 8 Sightseeing Spots in Enoshima, Kanagawa', 'Enoshima is a popular travel spot next to Kamakura and a little over an hour away from Tokyo via train. With its ocean scenery, Shinto shrines, and seafood, there is much to see and do. Learn eight must-visit places in Enoshima for a memorable trip.

Located one hour and a half away from Tokyo via train and 30 minutes from Kamakura, Enoshima is a small island in Fujisawa, Kanagawa Prefecture. It is a popular tourist spot with its beautiful scenery surrounded by the ocean, historical shrines and plenty of delicious restaurants. Here are the eight spots and things to do you if you’re visiting Enoshima.

Enoshima Shrine, the cornerstone of Enoshima’s history, is one of Japan''s three major shrines enshrining Nihon-Sandai-Benzaiten (*1). It is said to have been opened in the year 552.

Enoshima Shrine does not consist of one building, but of three shrines which are scattered across the island. Each of these three shrines enshrines one of the three of the Munakata-Sanjoshin (*2). Many people visit, because these are the goddesses of the sea, water, fortune and wealth. Moreover, they are said to give the blessing of increased art skills to the ones who pray to them. This is such an important place that one can probably say they’ve visited Enoshima simply by visiting Enoshima Shrine.', '["https://resources.matcha-jp.com/resize/720x2000/2022/04/18-125790.webp","https://resources.matcha-jp.com/resize/720x2000/2022/04/18-125791.webp","https://resources.matcha-jp.com/resize/720x2000/2022/04/18-125792.webp","https://resources.matcha-jp.com/resize/720x2000/2022/04/18-125793.webp"]'::jsonb, '2016-03-17'::timestamptz),
  ('https://matcha-jp.com/en/1938', 'en', 14, 'Tokyo to Kamakura: Train Routes, JR Pass, Cost, and Distance', 'Kamakura, with its temples, Giant Buddha, and seaside, is about 50 km from Tokyo, accessible in 50-60 mins by JR train. Discover the best routes and their fees.

The old capital of Kamakura, accessible from Tokyo in just one hour, has a relaxed ambiance with its many temples, shrines, and rich greenery.

Tsurugaoka-Hachimangu Shrine, famous for its beautiful cherry blossoms, Kotoku-in Temple with its Great Buddha statue (Daibutsu), and Hasedera Temple, known for its elegant June hydrangeas, are all found in the Kamakura area.

We introduce the easiest and best ways to reach Kamakura from Tokyo.', '["https://resources.matcha-jp.com/resize/720x2000/2020/05/25-103279.webp","https://resources.matcha-jp.com/resize/720x2000/2022/07/26-128654.webp","https://resources.matcha-jp.com/resize/720x2000/2022/07/26-128655.webp","https://resources.matcha-jp.com/resize/720x2000/2022/07/26-128658.webp"]'::jsonb, '2017-11-07'::timestamptz),
  ('https://matcha-jp.com/en/1989', 'en', 12, 'Beach Fireworks Near Tokyo: 6 Events Held by the Ocean 2026', 'Discover 6 spectacular beach fireworks festivals near Tokyo for 2026! Plan your summer with top events in Kamakura, Hayama, Yokosuka, and Chiba.

Today we feature some special firework displays from Kanagawa Prefecture and Chiba Prefecture, carefully chosen from the many firework festivals in the Tokyo area.

All of these festivals are held by the beach, so you can enjoy the sight of fireworks flickering on the surface of the ocean!

The Kamakura Fireworks Festival is a cherished tradition on the Kamakura coastline that dates back to 1948.', '["https://resources.matcha-jp.com/resize/720x2000/2024/07/16-187990.webp","https://resources.matcha-jp.com/resize/720x2000/2024/07/16-187991.webp","https://resources.matcha-jp.com/resize/720x2000/2024/07/16-187992.webp","https://resources.matcha-jp.com/resize/720x2000/2024/07/16-187994.webp"]'::jsonb, '2017-07-05'::timestamptz),
  ('https://matcha-jp.com/en/4341', 'en', 15, 'Niigata''s Retro-Cute Nuttari Terrace Street: Charming Cafes And Shops', 'The old and new exists together on Nuttari Terrace Street. It may be slightly different from a district lined with daily commodities for purchase, but you will always be met with a warm smile. Please stop by if you’re visiting Niigata.

The Nuttari area has been overflowing with energy since long ago as the Nuttari Marketplace. It was once an area reduced to a street of shutters after a decrease in the number of stores, but a new shopping street has risen and has become an area overflowing with liveliness.

This street began once more when the delicatessen Ruruck Kitchen opened in 2010, spurring requests to open stores to come one after another. The following year, the handmade furniture and café ISANA opened and was followed by the ceramics art studio and class Aotogama the year after that.

Gradually, young men and women who felt the charm of this street brought more new stores to the area, bringing the total store count to 25. Thus the new start to Nuttari Terrace Street began.', '["https://resources.matcha-jp.com/resize/720x2000/2017/07/25-32018.webp","https://resources.matcha-jp.com/resize/720x2000/2017/07/25-32017.webp","https://resources.matcha-jp.com/resize/720x2000/2017/07/08-30642.webp"]'::jsonb, '2017-10-06'::timestamptz),
  ('https://matcha-jp.com/en/10128', 'en', 15, '4 Spectacular Day Trips From Niigata City', 'Niigata, known for its fabulous natural scenery and sake production, can be reached in about two hours from Tokyo. We introduce four towns that are easily accessible from Niigata City. Discover amazing sake culture, hot springs, ancient shrines, and the home town of nishikigoi carps.

For the adventurous traveler looking to fill their Japan holiday with fascinating day-trips, Niigata City is the perfect destination! The areas surrounding the city are renowned for their lush nature, deep histories, and unique cultures.

We’ve chosen four regions, all reachable by local trains, that show why you should add Niigata to your next Japan itinerary. These places are all rarely visited by international travelers, so if you’re desperate to get off the beaten track and find a fresh face of Japan, Niigata City is where to start!

Directly up the coast from Niigata City, the ancient town of Murakami is one of Japan’s most alluring hidden destinations. During mid-autumn, the city’s network of rivers and streams is taken over by the ‘salmon run.’ Many of these salmon returning to their birthplace are caught, hand-salted, and strung up around the town to ferment.', '["https://resources.matcha-jp.com/resize/720x2000/2020/09/15-107190.webp","https://resources.matcha-jp.com/resize/720x2000/2020/09/15-107192.webp","https://resources.matcha-jp.com/resize/720x2000/2020/09/15-107193.webp","https://resources.matcha-jp.com/resize/720x2000/2020/09/15-107195.webp"]'::jsonb, '2020-09-15'::timestamptz),
  ('https://matcha-jp.com/en/1932', 'en', 15, 'Niigata''s Nagaoka Firework Festival 2026: Tickets and Location', 'The Nagaoka Firework Festival is one of Japan’s Three Great Fireworks Festivals. Discover the 2026 schedule, highlights, features, and access tips!

Nagaoka Fireworks Festival: History and Concept The Nagaoka Fireworks Festival is one of Japan''s three major fireworks festivals. At its origins a memorial, it''s a festival born out the locals''s wishes for peace.

On August 1, 1945, before the end of World War II, Nagaoka was bombed, and as much as 80% of the city was destroyed, resulting in 1,488 casualties. To comfort the grieving citizens, the "Nagaoka Revival Festival," which is the predecessor of the Nagaoka Festival Fireworks Festival, was held starting the following year.

This article will introduce the dates, access, highlights, hidden spots, and Japan''s unique fireworks culture of the Nagaoka Festival Fireworks Festival held annually in early August in Niigata''s Nagaoka City.', '["https://resources.matcha-jp.com/resize/720x2000/2025/01/17-219608.webp","https://resources.matcha-jp.com/resize/720x2000/2024/06/19-184097.webp","https://resources.matcha-jp.com/resize/720x2000/2024/06/19-184121.webp","https://resources.matcha-jp.com/resize/720x2000/2023/05/30-138699.webp"]'::jsonb, '2016-06-29'::timestamptz),
  ('https://matcha-jp.com/en/2728', 'en', 16, 'Visit Doraemon''s Hometown! Takaoka City in Toyama Prefecture', 'Doraemon is one of the most popular anime characters in Japan. If you like him or have grown up watching Doraemon''s adventures, visit Takaoka city in Toyama prefecture, the place where Doraemon''s creator, Fujiko F.Fujio, was born. We feature three Takaoka locations related to Doraemon.

With the opening of the Hokuriku bullet train line in 2015, the Hokuriku region became a popular destination for many travelers.

Did you know that the city of Takaoka in Toyama prefecture is not only a great travel destination but also the hometown of Doraemon''s creator, Fujiko F. Fujio?

Many places that appear in the popular manga and anime series have been recreated in Takaoka. The town is overflowing with Doraemon-related things and spots. It''s a must-go place for Doraemon fans!', '["https://resources.matcha-jp.com/resize/720x2000/2025/01/30-221643.webp","https://resources.matcha-jp.com/resize/720x2000/2025/01/30-221644.webp","https://resources.matcha-jp.com/archive_files/jp/2016/09/e7a200f7d9e3e6690544bc9d1327eee9.webp","https://resources.matcha-jp.com/archive_files/jp/2016/09/b6ce0054c49f2f10562589227854beb6.webp"]'::jsonb, '2016-10-19'::timestamptz),
  ('https://matcha-jp.com/en/24767', 'en', 16, 'Tateyama Kurobe Weather by Month: What to Wear, Activities', 'This is a weather guide for the Tateyama Kurobe area with average temperatures by month, clothing tips, opening schedule, and important precautions.

The Tateyama Kurobe area is located at the border of Toyama and Nagano Prefectures, situated within the high-altitude Northern Alps.

As a result, the region experiences distinct seasons with significant climate variations depending on mountain altitude. Precipitation is abundant year-round, especially with deep snow during winter, making it one of Japan’s renowned heavy snowfall regions.

The summer climate is cool and refreshing, perfect for escaping the heat; spring and autumn are ideal times to enjoy flowers and fall foliage; winter, from November to April, transforms the area into a snow-covered winter wonderland.', '["https://resources.matcha-jp.com/resize/720x2000/2025/04/24-231947.webp","https://resources.matcha-jp.com/resize/720x2000/2025/04/24-231950.webp"]'::jsonb, '2025-04-30'::timestamptz),
  ('https://matcha-jp.com/en/2596', 'en', 17, 'Kanazawa: 15 Things to Do in Japan''s City of Crafts', 'Kanazawa is a history-rich city in Ishikawa Prefecture that can be reached from Tokyo and Osaka in about two and a half hours. We introduce 15 things to do in Kanazawa, from the famous Kenroku Garden to the 21st Century Museum of Contemporary Art, Kanazawa.

Kanazawa, located in Ishikawa, is accessible from Tokyo or Osaka via Hokuriku Shinkansen (bullet train) in only about two and a half hours.

A nostalgic Japanese streetscape still remains in the city, and popular spots such as the 21st Century Museum of Contemporary Art, Kanazawa Castle, and Kenrokuen Garden attract a lot of visitors every day.

The popular spots that you just can’t miss in Kanazawa are Kenrokuen Garden and Kanazawa Castle.', '["https://resources.matcha-jp.com/resize/720x2000/2024/08/22-193617.webp","https://resources.matcha-jp.com/resize/720x2000/2022/03/14-124004.webp","https://resources.matcha-jp.com/resize/720x2000/2022/03/14-124005.webp","https://resources.matcha-jp.com/resize/720x2000/2022/03/14-124001.webp"]'::jsonb, '2016-10-16'::timestamptz),
  ('https://matcha-jp.com/en/2586', 'en', 17, 'How to Travel to Kanazawa: From Tokyo, Osaka, or Kyoto 2026', 'Looking for the fastest way to Kanazawa? Reach the city in under 3 hours from Tokyo or via the Thunderbird-Shinkansen transfer from Osaka and Kyoto. Compare train times, bus options, and discount passes in 2026.

Kanazawa, a city in Ishikawa Prefecture, prospered approximately 400 years ago as the domain of the powerful lord Toshiie Maeda.

Even today, Kanazawa’s teahouse quarters and samurai homes remain as vestiges of that time. Visitors to Kanazawa can come into contact with samurai culture and the atmosphere of olden-day Japan.

In terms of distance, Kanazawa is relatively closer to Kyoto and Osaka (approx. 260 km) than to Tokyo (approx. 475 km).', '["https://resources.matcha-jp.com/resize/720x2000/2022/11/10-131770.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/10-131771.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/10-131772.webp","https://resources.matcha-jp.com/resize/720x2000/2022/11/10-131773.webp"]'::jsonb, '2018-06-22'::timestamptz),
  ('https://matcha-jp.com/en/3785', 'en', 18, 'Visiting Eiheiji, A Zen Buddhist Temple In Fukui Prefecture', 'Eiheiji is a temple in Fukui prefecture. A Zen Buddhist monastery, where visitors can experience the ascetic life of Buddhist monks, Eiheiji is also well-known for its impressive architecture.

Eiheiji is located amidst the foothills of Eiheiji city in Fukui Prefecture. Its name "Eiheiji" translates in English to "Temple of Eternal Peace". Eiheiji is the main temple of the Soto school of Zen Buddhism, which is the largest of the traditional schools of Zen Buddhism in Japan.

Dogen Zenji, the founder of Eiheiji, is also the founder of the Soto school of Zen Buddhism, as he introduced its teachings from his studies in China near the start of the 13th century.

Eiheiji Temple was established in 1244 during Japan''s Kamakura period (1185 - 1333). It was at the start of this era that the first Shogunate (a feudal military government) was established, and is marked for its great turmoil as ruling factions within different territories waged wars, as well as the invasion of Japan by the Mongol Empire.', '["https://resources.matcha-jp.com/resize/720x2000/2016/12/25-12454.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/25-12452.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/25-12453.webp","https://resources.matcha-jp.com/resize/720x2000/2016/12/25-12451.webp"]'::jsonb, '2017-01-01'::timestamptz),
  ('https://matcha-jp.com/en/9571', 'en', 18, 'Fukui: 13 Fun Things to Do, With Easy Access from Kanazawa', 'Fukui Prefecture has many highlights such as the scenic Tojinbo and delicious Echizen Crab. You can also visit Fukui from Kanazawa on a day trip. We introduce 13 things to do, places to visit, and local cuisine for first-time Fukui visitors.

Fukui Prefecture is located in Japan''s Hokuriku Region. It faces the Sea of Japan and is a long and narrow prefecture stretching from north to south.

Fukui''s northern area borders Ishikawa, home to Kanazawa City, and is a place where the Hokuriku Region''s strong culture has taken a foothold. In contrast to this, Fukui''s southern area is situated close to Kyoto, and from ancient times it was influenced by the culture of the Kansai Region.

Moreover, this is an area where you can feel the distinct changes of the four seasons. So, in addition to the beautiful scenery of each season, Fukui is blessed with excellent seasonal food and ingredients. This includes sea urchin (uni) and mussels (kaki) in the summer, and crab and fugu fish in the winter.', '["https://resources.matcha-jp.com/resize/720x2000/2020/04/01-100701.webp","https://resources.matcha-jp.com/resize/720x2000/2020/03/25-100242.webp","https://resources.matcha-jp.com/resize/720x2000/2020/03/25-100252.webp","https://resources.matcha-jp.com/resize/720x2000/2020/03/25-100251.webp"]'::jsonb, '2023-05-22'::timestamptz),
  ('https://matcha-jp.com/en/3182', 'en', 22, 'Mount Fuji 2026: How to Climb Japan''s Famous Mountain Safely', 'This guide introduces the main hiking trails on Mount Fuji with information on necessary equipment, mountain huts, climbing season, weather, and other tips.

Mount Fuji is a Japanese icon, rising to an altitude of 3,776 meters (12,388 feet). It is the tallest mountain in Japan, and gathers twenty to thirty thousand climbers every year.

From the trailhead, the climb takes about six to seven hours to the summit. There are mountain huts where you can rest along the well-maintained trail, so Mt. Fuji is fit for intermediate-level climbers.

For well-prepared climbers with experience, the climb should take one to two days. Beginners should be well aware of the various risks. Accidents and health problems may occur if you try to climb Mt. Fuji casually. These difficulties will also vary depending on the trail and the timing.', '["https://resources.matcha-jp.com/resize/720x2000/2018/08/22-61090.webp","https://resources.matcha-jp.com/resize/720x2000/2018/08/22-61086.webp","https://resources.matcha-jp.com/resize/720x2000/2018/07/12-58316.webp","https://resources.matcha-jp.com/resize/720x2000/2018/08/22-61087.webp"]'::jsonb, '2018-09-18'::timestamptz),
  ('https://matcha-jp.com/en/10937', 'en', 19, 'Koshu Day Trip: Exploring the Heart of Japan''s Wine Culture', 'Koshu, easily accessible from Tokyo by train in less than 90 minutes, is famous as the place where winemaking began in Japan. We introduce an itinerary that allows you to taste several types of Koshu wines, visit a wine museum, and enjoy delicious local treats!

Koshu City, located just west of Tokyo in Yamanashi Prefecture, is the ideal destination for wine lovers! Winemaking began here in the early Meiji period (1868-1912) and has developed into the area''s iconic brand.

It is neither far nor expensive to travel from Tokyo to this serene area surrounded by mountains. We introduce a day trip itinerary that includes a facility where you can taste hundreds of Koshu wines, to Chateau Mercian Visitor Center, which is home to a wine museum, and a facility dedicated to wine glasses and glass crafts with a stylish cafe famous for its delicious pancakes.

The fastest way to reach Koshu from Tokyo is by limited express train from Shinjuku Station. All seats are reserved on this train so please buy a ticket beforehand at the JR Ticket Center. The train departs from platform 9 of JR Shinjuku Station. Once you arrive at Katsunuma Budokyo Station, it is easy to get around by car or by taxi as buses are few and not very frequent.', '["https://resources.matcha-jp.com/resize/720x2000/2022/01/11-120129.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/11-120130.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/11-120131.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/11-120134.webp"]'::jsonb, '2021-11-13'::timestamptz),
  ('https://matcha-jp.com/en/11029', 'en', 19, 'Glamping Near Tokyo: 9 Locations Easy to Access', 'Glamping is gaining popularity in Japan. Read on to discover nine excellent glamping locations outside of Tokyo. There are many popular spots with amazing views, chic tents, hot springs, and more!

Glamping is popular among outdoor novices and those seeking a casual encounter with nature. There are several glamping facilities near Tokyo that can be accessed by public transportation like trains and buses.

Read on to learn about nine excellent glamping facilities near Tokyo that can be accessed without a car! Our list includes glamping by Mount Fuji, rooms equipped with private hot springs, and other exciting features.

There are three types of lodgings housed on this massive ground. The most popular is the Amazing Dome, a semicircular transparent tent. It is crafted so guests can see nature even while inside, making it possible to experience being one with the natural elements.', '["https://resources.matcha-jp.com/resize/720x2000/2022/01/17-120731.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/17-120732.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/19-120908.webp","https://resources.matcha-jp.com/resize/720x2000/2022/01/19-120911.webp"]'::jsonb, '2022-04-11'::timestamptz),
  ('https://matcha-jp.com/en/4021', 'en', 20, 'Matsumoto Castle In Nagano - Explore The ”Crow Castle”!', 'Matsumoto Castle in Nagano was constructed around the seventeenth century. It is the oldest six story high, five layered pagoda-style castle in Japan. This article features its highlights and information on how to access the castle.

One of the many castles in Nagano prefecture is Matsumoto Castle, which was constructed between the sixteenth and eighteenth centuries. The tenshu (main castle tower, *1) that was said to have been constructed during the seventeenth century still stands today and is the oldest standing tenshu out of the six story high, five layered castle. The tenshu is the national treasure and a part of the castle is a national landmark.

Unlike Himeji castle with its brilliant white walls, Matsumoto Castle has solid black walls. Therefore, Matsumoto Castle is often referred to as the crow castle for its black exterior.

From Matsumoto Castle, you can see the Northern Japanese Alps (*2). And in the grounds, you can take panoramic photos of the castle along with the mountains too. Here, we have collected information regarding Matsumoto Castle, its highlights and how it can be reached.', '["https://resources.matcha-jp.com/resize/720x2000/2017/05/09-26137.webp","https://resources.matcha-jp.com/resize/720x2000/2017/04/17-24458.webp"]'::jsonb, '2019-04-09'::timestamptz)
on conflict (url, lang) do update set
  prefecture_code = excluded.prefecture_code,
  title = excluded.title,
  body = excluded.body,
  images = excluded.images,
  published_at = excluded.published_at;
