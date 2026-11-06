# Handoff — Computer Survivor

Son güncelleme: 2026-11-06. Teknoloji ve mimari kuralları için önce `CLAUDE.md` dosyasını oku. Bu dosya güncel durumu, şimdiye kadar alınan bütün kararları ve kalan bütün işleri içerir.

Kullanıcı Türkçe yazar ve **yalnızca Türkçe**, sade yanıt almalıdır. Kod, kod yorumları ve commit mesajları İngilizce kalır; bu dosya kullanıcının isteğiyle Türkçedir. Bir şey yapmadan önce sondaki "Çalışma anlaşması" bölümüne bak.

## Neredeyiz

Aşağıdaki her şey commit edildi ve Vercel'in yayınladığı `main` dalına gönderildi (son commit 2026-11-06 akşamı: İş 4'ün kod aşaması (karakterler, skinler, Gem, Characters ekranları), zor modun menü adı Nightmare, bu dosya; ondan önce `4da116f`: zor mod (İş 3), liste ataleti; ondan önce `6705238`: mobil tasarım geçişi, HUD sahnesi, cihaz piksel oranı, yeni menüler, can barı, `?maxed`, Expansion Bay). Commit'ler artık doğrudan `main` üzerinde; `playtest-feedback-fixes` dalı geride kaldı, kullanılmıyor.

Oyun **sonsuz** bir survivors-like: bir oyun yalnızca ölünce biter. İlk oyuna özel eğitim, 20 boss, mini bosslar, slot makineleri, kırılabilir bilgisayarlar, 19 silah ve üç renk XP gem'i var.

**İş 1 (Atölye) ve İş 2 (ekonomi) kapandı: kullanıcı 2026-11-05 akşamı fiyatları yer tutucu haliyle bıraktı ("şu an iyi, çok da zor olmaması lazım"). Aynı akşam mobil tasarım geçişi yapıldı (aşağıda "Bu dönemde yapılanlar", 2026-11-05 akşamı maddeleri): kartlar satır düzenine geçti ve tür etiketi aldı, HUD kendi sahnesine taşındı, kamera telefonda uzaklaşıyor, tuval cihaz piksel oranında çiziyor, menü, Atölye ve Müze yeniden yazıldı, can barı yenilendi. Kullanıcı kartları, kamerayı, Atölye'yi ve can barını gördü; menü ve Müze'yi henüz telefonda görmedi. 2026-11-06'da İş 3 (zor mod) yapıldı ve simülasyonla ayarlandı, Atölye ve Müze listelerine atalet geldi; kullanıcı ikisini de henüz oynamadı. Aynı gün İş 4'ün kod aşaması yapıldı (karakterler şimdilik teknisyenin renk kopyaları) ve zor modun ekrandaki adı Nightmare oldu. Sıradaki adım İş 4'ün sanat partileri, 1. parti Brick Phone, Floppy Disk, CRT Monitor.** Her işin planı o işten hemen önce sunulur ve kullanıcının onayı beklenir. 2026-11-04'te ayrıca 8 yeni pasif eklendi, artık 19 silahın 19 ayrı anahtarı var (aşağıda "Bu dönemde yapılanlar"). **2026-11-04'te zorluk işleri Atölye'nin önüne alındı:** kullanıcı oyuncuların 100-200 düşmanlık orduyla bütün oyun kaçtığını gördü. Yapılanlar: C nefes aldıran kota eğrisi ve B kota dolumunu bütçeye bağlama, ikisi de kullanıcı oynarken ayarlanıyor; ilk oyundan sonra kotalar 3. dakikadan itibaren yaklaşık %25 artırıldı. A (temas hasarına tavan: en sert düşman tam, diğerleri %25) denendi ve aynı gün kaldırıldı, çünkü kullanıcı "asla ölünmüyor" dedi; temas hasarı tamamen toplanır, tavan veya dokunulmazlık tekrar önerilmez. Ayrıntılar "Zorluk karşılaştırması" bölümünde.

Oyun tasarım dokümanı https://claude.ai/artifact/8yApVH6VuMDwYmPwAqVosy adresinde (Türkçe, docs araçlarıyla okunur). Sonsuz oyun, bosslar, slotlar ve düşenlerden önce yazıldı, bu yüzden farklı oldukları yerde `src/data/*.ts` ve bu dosya geçerlidir.

## Kalan işler, sırayla

### İş 1: Atölye

Kullanıcı sonsuz oyunun çok daha fazla içeriğe ihtiyacı olduğu konusunda kesindi: "kesinlikle artması gerekiyor, çok fazla". Bosslar, silahlar ve Atölye bitti. Temel fikir oyuncunun kendini geliştirmeden ilerleyememesi. Plan 2026-11-04'te onaylandı, fiyat sayıları İş 2'ye kalır. **İki parça da aynı gün yapıldı:** 18 yükseltme, `prices` üreticisi; toplam 100.220 Data (istatistikler 67.260, mekanikler 32.960), eskiden 6.000. Kullanıcı 2026-11-05'te denedi; ekran aynı akşam yeniden tasarlandı (sekmeler ve kaydırmalı liste, aşağıda).
- **1. parça (saf veri ve ekran):** 12 istatistik yükseltmesi, her biri 10 seviye (Dual Core 1): Armor Plate +10 can, Firmware +%3 hasar, Overdrive +%2 hız, Long Cable +%5 çekim, Cache +%3 XP, Turbo Clock −%2 bekleme, Big Screen +%3 alan, Spare Battery +%4 süre, Fiber Line +%4 mermi hızı, Thermal Paste −%2 alınan hasar, Antivirus Sub +0,2 can/sn, Dual Core +1 mermi (en pahalı). Mevcut beşinin seviye başı değeri küçülür, kayıtlı seviyeler zayıflar (test aşamasında kabul edildi). Fiyatlar `prices(başlangıç, seviye, çarpan)` üreticisiyle, `prices(50, 10, 1.5)`. Sayfalama 2026-11-05 akşamı kalktı: STATS (12) ve MECHANICS (6) sekmeleri, parmakla kaydırılan satır listesi (`ScrollList`), satır başına fiyat düğmesi; hangi yükseltmenin hangi sekmede olduğu `WorkshopDef.tab` alanında.
- **2. parça (mekanikler, her biri ayrı küçük iş):** Lucky Coin (slotta 2 ve 3 vuruş +%2, 5 seviye, `rollHits`'e `luck` stat'ı; kullanıcı "bayağı mantıklı" dedi, kalır), Data Miner (oyun sonu Data +%5, 10 seviye, `settleRun`), Reroll (seviye kartlarını oyun başına 1 kez yenile, 3 seviye, UpgradeScene düğmesi), Wide Menu (3 yerine 4 kart, 1 seviye), Scrap Radar (bilgisayar ihtimali +%3, 5 seviye), Expansion Bay (2026-11-05'ten beri +1 silah **ve** +1 pasif yuvası, 1 seviye, 12.000; `bonusSlots` stat'ı iki sınıra da eklenir, envanter çubuğunun iki satırı da uzar; kullanıcı "silah 5'e çıkıyorsa pasif de 5 olsun" dedi).
- Dirilme Atölye'de yok, ödüllü reklama saklandı. Atölye toplamı 100.220, Müze 15.900 Data. 120 oyunluk kariyer simülasyonunda (2026-11-05 akşamı) iyi bot Müze'yi 50, Atölye'yi 70 oyunda dolduruyor; kullanıcı bunu gördü ve fiyatları olduğu gibi bıraktı (İş 2).

### İş 2: Ekonomi ve son denge

**Kapandı, 2026-11-05 akşamı.** Zorluk kısmı aynı gün insan gibi botla ölçülüp uygulandı (aşağıda "Ölçüm"). Kullanıcı kendi oyunlarında ortalama 10 dakika dayandığını söyledi; 120 oyunluk kariyer simülasyonu 10 dakikalık oyunun 500-750 Data verdiğini, iyi botun Atölye'yi 70 oyunda doldurduğunu ve 20 dakikaya ulaşınca gelirin oyun başına 4.000'in üstüne çıktığını (24.000 öldürme tek başına 2.400) gösterdi. Fiyat eğrisini dikleştirme planı (stat büyümesi 1,5'ten 1,7'ye, mekanikler orantılı) sunuldu, kullanıcı önce onayladı sonra vazgeçti: "Şu anki haliyle kalsın, şu an iyi, çok da zor olmaması lazım." Yer tutucu fiyatlar gerçek fiyat oldu; ödül formülü de aynı. Kullanıcı açmadıkça fiyat ve ödülü yeniden önerme. Simülasyon izni bu işe aitti.

Eski süre hedefleri, artık bağlayıcı değil (kullanıcı 2026-11-05 akşamı bugünkü süreleri yeterli buldu; ilk oyun 7:30-12:30 kabul):

| Oyuncu | Hedef |
|---|---|
| İlk oyunlar | 6-7 dakika, iyi oyuncu için bile |
| Yaklaşık 10 oyundan sonra | 9-10 dakika |
| Yaklaşık 30 oyundan sonra | 13-15 dakika |
| Atölye büyük ölçüde dolu | 20+ dakika |

Kullanıcının gerçek verisi: eski dalgalarda 3-4 Atölye yıldızlı hesapta 8+ dakika (botun kalibrasyon çapası), bugünkü dalgalarda Atölye yıldızlı hesabıyla ortalama 10 dakika (2026-11-05 akşamı). Yeni oyuncu için tahmin en fazla 3-5 dakika.

### İş 3: Zor mod

**Yapıldı, 2026-11-06; kullanıcı henüz oynamadı.** Son çarpanlar (`src/data/difficulty.ts`): düşman sayısı, düşman canı, temas hasarı x1,5; kota dolumu x2; boss canı ve boss hasarı **x2**; oyun sonu Data x2. Planla farkları: (1) ayrı `hardUnlocked` alanı yok, zor mod normal rekor (`bestTime`) `HARD_UNLOCK_SECONDS` (600) veya üstüyse açıktır; aynı davranış, eski kayıtlar kendiliğinden açılır, `?maxed` rekoru 600 sayar. (2) Seçili mod `progress.difficulty`'de, kilitliyken her zaman `normal` döner. (3) Simülatöre `SIM_DIFFICULTY_SET='{"bossHp":2}'` eklendi: veri dosyasına dokunmadan aday çarpan dener.

**Ölçüm (2026-11-06, `GOOD` bot, `human` bölümü, 12-16 koşu):** Normalde dolu hesap (Atölye tam, her şey açık) 12/12 koşuda 20:00 bossunda ölür; eski "20:00'ı her oyunda geçiyor" bilgisi yanlıştı. Zor modda boss çarpanına göre dolu hesabın ortancası: 1,5/1,5 → 20:00 (10:00-20:00), **2/2 → 15:00 (10:00-20:00, 16 koşuda doğrulandı)**, 2,25/2,25 → 10:00 (10:00-17:30), 2,5/2,5 → 10:00, 2 can/3 hasar → 10:00 (10:00-15:00). Ölümlerin neredeyse hepsi boss mermisi, temas yüzde 1; kalabalık çarpanları dolu hesabı zorlamaz, zorluğu bosslar taşır. Bosslar 2:30'da bir geldiği için sonuç basamaklıdır; 2,25 ve üstü 10:00 milestone bossunu duvar yapar. Yeni kayıtlı iyi oyuncu zorda ortanca 5:00 (2:30-10:00). Dolu hesap zorda 15:00'lık oyunda yaklaşık 4.800 Data alır (normalde 20:00'lık oyunda 3.600). Simülasyon izni bu işe aitti.

Aşağısı onaylanan istek ve plan, kayıt için duruyor.

Kullanıcı 2026-11-05'te istedi: çok iyi, Atölye'si dolu oyuncuların bile zorlanacağı bir mod. "Eski zorluk tabloları zor mod olsun" fikri konuşuldu ve reddedildi: eski halin sorunu yapısaldı (anında dolan kota, nefes anı yok, herkesin kaçtığı ordu) ve bugünkü içerikle ölçülmedi. Zor mod bugünkü sistemin üstüne **tek bir çarpan seti**dir; nefes alma ve dolum düzeni aynı kalır, her şey sıkılaşır.

- **Veri:** `src/data/difficulty.ts`, iki kayıt: `normal` (hepsi 1) ve `hard`. Başlangıç önerisi, simülatörle ayarlanacak: düşman sayısı x1,5, düşman canı x1,5, temas hasarı x1,5, kota dolumu iki kat hızlı, boss canı x1,5, boss saldırı hasarı x1,5, oyun sonu Data x2. **Hedef:** `GOOD` bot + Atölye tamamen dolu + Müze tamamen açık hesap, zorda ortanca 10-15 dakikada ölsün (normalde o hesap 20:00 bossunda ölüyor, yukarıdaki ölçüm). Yeni başlayan için zor mod düşünülmez, zaten kilitli.
- **Uygulama:** çarpanlar Spawner (kota, dolum), EnemyManager (can, temas hasarı), Arena ve BossBrain (boss canı ve hasarı), `settleRun` (Data) içinde tek yerden okunur; sistem koduna sayı girmez. Seçili mod GameScene'e `init` verisiyle gelir.
- **Açılış:** normalde bir kez 10:00'a ulaşmak (10:00 bossunu görmek). Açılana kadar menüde görünmez; açılınca bir kez "Hard mode unlocked" satırı sonuç ekranında.
- **Menü:** PLAY'in altında NORMAL | HARD seçici, Atölye sekmeleri gibi (`createButton` `primary`). Seçim kayda yazılır (`SaveState.difficulty`), oyun o modla başlar.
- **Kayıt:** zor mod için ayrı rekor (`bestTimeHard`); menünün BEST rozeti seçili modun rekorunu gösterir; sonuç ekranındaki "New record" aynı şekilde moda göre. Günlük görevler iki modda da sayılır.
- **Simülatör:** `SIM_DIFFICULTY=hard` ile bütün bölümler aynı çarpanlarla koşar; `human` ve `career` bölümleri hedefi ölçer. Çarpanlar veri dosyasına girer, `tweaks.js`'e aday olarak değil.
- **Sıra:** veri ve çarpanların okunması → menü seçici ve kayıt → açılış ve rekor → simülasyonla sayı ayarı → kullanıcı oynar.

**Uygulama planı (2026-11-05 akşamı sunuldu, 2026-11-06'da onaylanıp uygulandı; farklar yukarıda):**
- `src/data/difficulty.ts`: `DifficultyId = 'normal' | 'hard'`, `DIFFICULTIES` kaydı (`enemies`, `enemyHp`, `contactDamage`, `refillSpeed`, `bossHp`, `bossDamage`, `dataMult`), `HARD_UNLOCK_SECONDS = 600`. Hard başlangıcı: 1,5 / 1,5 / 1,5 / 2 / 1,5 / 1,5 / 2.
- `Spawner` kurucuya zorluk alır: `minimum = min((wave.minimum + uzatma) x enemies, OVERTIME.maxEnemies)` (450'lik havuz tavanı kalır), doğan düşman canı x `enemyHp` (kolay başlangıcın 15 saniyesi hariç, mini bosslar dahil), dolum `minimum / (REFILL.seconds / refillSpeed)` ve `minPerSecond x refillSpeed`, `damageMult` getter'ı x `contactDamage` (GameScene temas hasarını zaten `spawner.damageMult` ile çarpıyor).
- `Arena` kurucuya zorluk alır: `bossMaxHp` x `bossHp` (`bossTest` hariç), `brain.begin`'e giden çarpan `BOSS_LOOP_DAMAGE_MULT ** fightRound x bossDamage` (mermi, dash, iz, patlama hepsi oradan geçer).
- Data: `runData`'nın son çarpanı `player.stats.dataMult x difficulty.dataMult`, canlı sayaç ve `endRun` aynı; evrim ve günlük görev ödülleri çarpılmaz.
- `SaveState`: `difficulty` (varsayılan `normal`), `hardUnlocked` (false), `bestTimeHard` (0); eski kayıtlar `loadSave`'deki birleştirmeyle gelir. `Progress`: `difficulty` get/set (yazar), `hardUnlocked`, `bestTimeFor(id)`. `RunSummary.difficulty`; `settleRun` normalde `time >= 600` ise `hardUnlocked = true` ve "Hard mode unlocked" satırı; rekor karşılaştırması moda göre.
- `GameScene` ve `GameOverScene` modu `progress.difficulty`'den okur, sahneler arası veri taşınmaz; Restart aynı modda açar. `GameOverSceneData` rekor metni için modu bilir.
- `MenuScene`: PLAY'in altında NORMAL | HARD seçici (iki `createButton`, seçili `primary`), yalnızca `hardUnlocked` ise; seçim `progress.difficulty`'ye yazılır ve `layout` yeniden çalışır, BEST rozeti seçili modun rekorunu gösterir. HUD'da süre sayacı zor modda kırmızı (`HudSceneData.hard`, tek satır; kullanıcı istemezse kalkar).
- Simülatör: `report.js` `SIM_DIFFICULTY` ortam değişkenini okur, `game.js` Spawner, Arena ve `runData`'ya verir. Ölçüm: `GOOD` bot, Atölye tamamen dolu ve Müze tamamen açık hesapla (`maxedPlayer` senaryosu) `human` ve `career`; hedef ortanca 10-15 dakika; 1,5'ler buna göre oynar. Simülasyon için izin istenecek.
- Dokunulan dosyalar: `difficulty.ts` (yeni), `Spawner.ts`, `Arena.ts`, `GameScene.ts`, `HudScene.ts`, `RunTimer.ts`, `SaveData.ts`, `Progress.ts`, `MenuScene.ts`, `GameOverScene.ts`, `tools/balance-sim/game.js`, `report.js`. Performans etkisi yok.

### İş 4: Karakterler ve skinler

**Kod aşaması yapıldı, 2026-11-06; sanat partileri sırada.** Kullanıcının son kararları aşağıdaki eski taslağın önüne geçer:
- **Skinler:** 1. skin karakterin kendisidir ve **görevle** açılır: silahını evrimleştirmek ("Evolve the X"); kullanıcı "ilk skin de görevle açılmalı" diye vurguladı. Yalnızca başlangıç karakteri Cursor baştan açık. Karakterin açık olduğu ayrıca kaydedilmez, `SaveState.evolutions`'dan okunur (eski evrimler karakteri hemen açar). 2. skin görevle: o karakterle 15:00 (`SKIN_TASK_SECONDS`, iki modda da). 3. skin her zaman en şaşalısıdır ve **Gem** ile alınır (`PREMIUM_SKIN_PRICE` 100).
- **Gem:** gerçek parayla satılacak yeni premium para (`SaveState.gems`). **Şimdilik herkese sınırsız ve bedava: `src/data/meta.ts` içinde `FREE_GEMS = true`. Yayından önce mutlaka `false` yapılmalı** (kullanıcı: "unutma sonradan bunu düzeltmek lazım"). Mağaza mobil paketlemeyle gelir.
- **İmza özellikleri:** her biri yaklaşık 1-2 pasif seviyesi, hepsi farklı stat (`characters.ts`): Cursor +%15 hasar, Brick Phone +%15 mermi boyutu, Floppy +%10 çekim, CRT değene 8 DPS, 8-Bit −%12 bekleme, Dial-up +%15 menzil, Cooling Fan +%9 alan, Printer +%15 mermi hızı, USB +%15 süre, Satellite +0,75 can/sn, CD-ROM −%9 alınan hasar, Trackball +1 delme, Fax +%12 XP, Robot Vacuum +%15 hareket, Scanner +%8 kritik, Ethernet +0,4 can/öldürme, Pager +%15 Data, Calculator +%15 boss hasarı, Boombox +30 can. Ölçülmedi.
- **Öldürme sayacı yok:** silah başına öldürme sayımı bütün hasar yollarına dokunmayı gerektirdiği için görev şablonundan çıkarıldı.
- **Ekranlar (PNG mockup ile onaylandı; ilk liste hali reddedildi, "bilgi eksikliği" vardı):** `CharactersScene` iki sütun kareler (üstte ad, küçük platformda karakter; kullanılan altın çerçeve ve "Used"; kilitli siluet ve "???"); kareye dokununca `CharacterScene`: büyük karakter platformda, oklar ve yatay kaydırmayla sonsuz skin döngüsü, ad, üç nokta, altta panel ve düğme. Panel: sahip olunan skinde başlangıç silahı (ikonla) ve özellik, kilitli 2. skinde "??? : Unlock to – Reach 15:00 as X" ve karakter başına en iyi süre çubuğu (`SaveState.characterBest`), 3. skinde fiyat ve pembe "Get free"/"Buy" düğmesi, kilitli karakterde "Evolve the X" ve gerekiyorsa "Buy the X in the Museum first". Menüde Museum/Workshop altında tam genişlikte Characters düğmesi (kullanıcı "rastgele yap, sonra bakarız" dedi); menü kahramanı seçili karakter ve skin.
- **Sanat yapısı:** `src/art/characters.ts` her karakterin 3 karesini ve 3 skinin palet eşlemesini tutar; atlas açılışta `char-<id>-<skin>-<stand|stepA|stepB>` karelerini üretir. Şimdilik herkes teknisyen çizgisi, farklı iş kıyafeti renkleri; 3. skin yer tutucusu altın şapka ve bordo tulum. Karakter adları şimdilik silah adları, skin adları Classic/Veteran/Deluxe; gerçek adlar sanat partileriyle önerilecek. 3. skin "şaşalı" olacağı için palet yetmezse skin başına kare değişimi eklenebilir.
- **Oyun:** GameScene seçili karakterin silahıyla başlar ve özelliğini Atölye bonusundan sonra uygular; `?perfect` hep Cursor ile başlar; `?maxed` bütün karakter ve skinleri açar. Sonuç ekranı "New character" ve "New skin" satırlarını yazar.

Aşağısı 2026-11-05'in ilk taslağı, kayıt için duruyor.

Kullanıcı 2026-11-05'te istedi: her silaha bir karakter (19 karakter; şimdiki kahraman Cursor'ın karakteri), her karakterde 3 skin (baz + 2), hepsi **gizli görevlerle** açılır, oyuncu görevleri bilmez. Kararlar: imza özelliği **olsun**, skinler **palet değişimi**, kilitliler **siluet** olarak görünsün.

- **Karakter ne verir:** kendi silahıyla başlar (Cursor yerine) ve bir imza özelliği taşır (küçük bir stat, örneğin Printer +%10 menzil, Boombox +20 can, Floppy +%5 çekim). Yalnızca başlangıç silahı olsaydı karakterler kopya olurdu; özellik onları ayırır ve zayıf başlayan silahları dengeler. Hepsi `PlayerStats` üzerinden gider, Atölye bonusu gibi `applyBonus` ile.
- **Veri:** `src/data/characters.ts`: `id`, `name`, `weapon`, `trait` (stat kısmi nesnesi, bir satır açıklama), `unlock` (gizli görev), `skins` (3 kayıt: `id`, `name`, palet eşlemesi, `unlock`). Baz skin karakterle birlikte açılır. Palet değişimi `PALETTE` harflerinin karakter başına yeniden eşlenmesidir: aynı çizgi, farklı şapka, tulum, ten rengi; atlas her skin için ayrı kareler üretir (dur, iki adım). 19 x 3 kare = 57 çizim, skinler çizim istemez.
- **Kayıt:** `SaveState.characters: Record<id, string[]>` (açık skin id'leri; boş dizi = karakter kilitli, kayıt yok = kilitli), `selectedCharacter`, `selectedSkin`. Eski kayıtlar `cursor` karakteri ve baz skini açık sayılır.
- **Gizli görevler:** oyun sonunda `settleRun` içinde değerlendirilir, tür olarak günlük görevlere benzer: `evolve` (silahı evrimleştir), `survive` (o silahla N dakika; silah oyun sonunda eldeyse sayılır), `kills` (o silahla N öldürme; **yeni sayaç**: Weapon/ProjectileManager öldürmeyi silah id'sine yazar, `RunSummary.killsByWeapon`), `boss` (o silah eldeyken N. bossu öldür), `level` (o silahla seviye N). Her karakterin görevi kendi silahına bağlı; skin görevleri **o karakterle** daha ileri hedefler (örneğin "bu karakterle 15 dakika", "bu karakterle 20:00 bossu"). Koşul metni yalnızca açıldıktan sonra görünür. Sayılar `characters.ts`'te, ilk sohbette kullanıcıya listelenip onaylanır.
- **Gizlilik ve geri bildirim:** Karakterler ekranında kilitli karakter siyah siluet ve "???" adıyla durur, koşul yazmaz; kilitli skin kutusu boş çerçeve. Açılınca sonuç ekranına "New character: X" / "New skin: Y" satırı ve o anda koşul açıklanır ("Evolved the Floppy Disk"). Açılan karakter kaydedilir, Data ödülü yok (ödül karakterin kendisi).
- **Ekranlar:** menüde kum şeridindeki kahraman seçili karakteri ve skini gösterir; şeridin altında küçük CHARACTERS düğmesi (Museum/Workshop satırı üç düğme olur veya şeridin üstüne ikinci satır; menüde karar verilir). Yeni `CharactersScene`: Müze gibi `ScrollList` satırları: portre (baz skin), ad, imza özelliği, sağda üç skin kutusu; satıra dokununca karakter, kutuya dokununca skin seçilir; seçili olan altın çerçeve. Kilitli satır siluet + "???".
- **Oyun:** `Player` seçili karakterin karelerini kullanır (`PLAYER_FRAMES` karaktere göre), `GameScene` `addWeapon(character.weapon)` ile başlar, `applyBonus` Atölye bonusu + imza özelliği. Eğitim, `?perfect` ve `?weapon` aynı çalışır. Simülatörde `start` parametresi zaten var; imza özelliği `bonus` ile verilir.
- **Sanat:** her karakter için 3 kare (dur, adım A, adım B), 16x20, `sprites.ts`'teki `TECH_BODY` + bacak deseniyle aynı yapı. Ben çizer, PNG olarak gönderirim, kullanıcı onaylar ("Test ipuçları"ndaki PNG betiği). Skin paletleri karakterle birlikte önerilir.
- **Sıra:** (a) veri, kayıt, Karakterler ekranı, Player kareleri, başlangıç silahı, görev değerlendirmesi; şimdiki kahramanın palet kopyalarıyla test edilir. (b) Sanat partileri: **1. parti** dört başlangıç silahı (Cursor mevcut, Brick Phone, Floppy Disk, CRT Monitor); **2. parti** 8-Bit Computer, Dial-up Modem, Cooling Fan, USB Stick, Satellite Dish; **3. parti** Dot Matrix Printer, CD-ROM, Trackball, Fax Machine, Robot Vacuum; **4. parti** Flatbed Scanner, Ethernet Cable, Pager, Pocket Calculator, Boombox. (c) Her karakter simülatörde `start` ile ölçülür, imza özellikleri dengelenir.
- **Bağımlılık:** İş 3 (zor mod) ile çakışmaz; zor mod menüye PLAY'in altında 36 piksellik NORMAL | HARD satırı ekledi, karakter düğmesi yerleştirilirken bu satır ve kısa ekranlar hesaba katılır. Karakter görevleri zor modda da sayılır.

### Bilerek sonraya bırakılanlar

- **Telefon performansı:** Kullanıcı sonra bakacak. Geç oyunda 450 düşmana çıkılıyor ve bu gerçek telefonda ölçülmedi; 2026-11-05 akşamından beri tuval cihaz çözünürlüğünde (375 CSS'lik DPR 3 telefonda 1125x2436), GPU yükü arttı. `Button.ts`'teki `MAX_DPR` 3; zorlanan cihaz çıkarsa 2'ye çekilir.
- **Debug yazıları (FPS, ENEMIES, KILLS):** Test sürdüğü müddetçe kalacak. Kullanıcı kaldırılmasının çok uzak olduğunu söyledi, istenmeden kaldırma.
- **Ses:** Henüz yok.
- **Mobil paketleme:** Capacitor, gerçek telefon testi, safe-area, yön kilidi, kaydı `localStorage` dışına taşıma.
- **Ödüllü reklamlar:** Tasarlandı, yapılmadı (oyun başına bir kez dirilme, sonuç ekranında Data'yı ikiye katlama).
- **Gem mağazası:** Gem gerçek parayla satılacak; o iş gelince `FREE_GEMS` `false` yapılır.
- **Kapalı test ve yayın hazırlığı.**

## Bu dönemde yapılanlar (oyun testi geri bildirimleri, 2026-10-31)

- XP hatası: 500 gem'de yeni öldürmeler hiç gem düşürmüyordu. Artık en uzaktaki gem yanıyor, yenisi öldürülen yerde çıkıyor. XP'sini taşımak denendi ve reddedildi, çünkü seviyeler kontrolden çıktı.
- Hasar geri bildirimi: kırmızı ekran kenarları ve kırmızı oyuncu (`HurtFlash`), istek üzerine bir kez yumuşatıldı.
- Çoklu atış: bir mermi her zaman doğrudan hedefe gider, diğerleri sırayla iki yana açılır. Çift sayılı atışlar eskiden hedefin iki yanından geçiyordu.
- İlk oyuna özel eğitim (aşağıda).
- Fazları, uyarıları, rastgele saldırıları ve yakan duvarı olan 4 ayrı boss.
- Kırılabilir bilgisayarlar ve düşenler.
- Sonsuz oyun, en iyi süre, boss döngüsü.
- Yeniden denge: baştan daha çok düşman, daha yavaş XP, daha zayıf Repair, sıraya göre boss canı.
- Mavi, yeşil ve mor gem'ler.
- Mini bosslar ve piksel sanatı slot makinesi.
- Canlı Data sayacı.
- Derinleştirilmiş bosslar, çünkü daire çizerek koşmak hepsini yeniyordu. ROOTKIT hamlesinden sonra hafif bir yola nişanlı atış yapar, yarı canın altında bazen oyuncunun etrafına Bug halkası çağırır. SPYWARE'in yelpazeleri yola nişan alır, geri çekilirken gecikmeli işaretler bırakır. FORK BOMB'un ilk işareti oyuncunun yoluna düşer, yarı canın altında Spam'leri oyuncuyu sarar. RANSOMWARE'in duvarı kapanır, son fazında saldırıları zincirler. Henüz değerlendirilmeyenler: RANSOMWARE dar halkada fazla sert olabilir (ilk ayar: `minRadius` 220), FORK BOMB'un işaretleri üst üste binebilir, Bug'lar uzak duran oyuncular için ROOTKIT'i uzatabilir.
- 8 rastgele grupta 20 boss, kullanıcının isteğiyle Claude tasarladı. Yeni saldırı türleri: `front` (boşluklu mermi duvarı), `sweep` (işaret hatları), `blink` (uyarı işaretli ışınlanma), `pull` (oyuncuyu çeker), ayrıca fazlarda `speedMult` ve izlerde `always`. Kullanıcı çoğunu onayladı, sayılar ilk tahmindir.
- 19 silah; Cassette Tape, kullanıcı deneyip beğenmeyince çıkarıldı. Yeniler: CD-ROM, Trackball, Fax Machine, Robot Vacuum, Flatbed Scanner, Ethernet Cable, Pager, Pocket Calculator, Boombox, her birinin evrimi var. Müze sayfalara bölündü (2026-11-05 akşamından beri sayfa yok, kaydırmalı liste).
- Bütün silahların gerçek dalgalarda dengelenmesi. Kullanıcı CRT'nin fazla büyüdüğünü söyleyince CRT ve Degausser küçültüldü, Widescreen seviye başına +%6'ya indi.
- Dalga zorluğu düşürüldü, çünkü kullanıcı 5:00'ten sonra kalabalığın çok arttığını, 7:00'den sonra hiçbir şeyin kesilemediğini söyledi. Kotalar ve can çarpanları azaldı, 7. dakika Worm ağırlıklı olmaktan çıktı, aralıklı doğuma tavan geldi. Kullanıcının isteğiyle 5. dakikanın karışımına dokunulmadı.
- 8 yeni pasif (2026-11-04), çünkü kullanıcı oyun içi seçimi az buldu ve sonradan eklenen 9 silah eski pasifleri anahtar olarak paylaşıyordu: Memory Card (+%8 XP, Fax), Antenna (+%10 menzil, Pager), Debugger (boss ve mini bosslara +%10 hasar, Calculator), Spiked Case (değen düşmanlara 5 DPS, Boombox), Repair Kit (öldürme başına +0,3 can, Ethernet), Ball Bearings (+1 delme, 2 seviye, Trackball), Calibration (+%5 kritik, 2 kat, Scanner), Lens Cleaner (+%10 mermi boyutu, CD-ROM). Yeni stat'lar `player.ts` içinde. Slot ihtimali veren Lucky Dongle önerildi ve reddedildi: oyun içinde hissedilmeyen pasif istenmiyor. Kritik sessizdir, görseli yok. İkonlar `sprites.ts` içinde; ızgaralar palete göre PNG'ye dökülüp sohbette gösterildi, kullanıcı onayladı. Görsel işlerde hep böyle yap: kullanıcı "göremiyorum" cevabını kabul etmiyor, PNG ister.
- Atölye 5'ten 18 yükseltmeye (2026-11-04), ayrıntısı İş 1'de. Müze pager'ı `Button.ts`'e taşındı (sonradan silindi), UpgradeScene'e Reroll düğmesi ve 4 kart için dikey 2x2 düzen geldi, envanter çubuğu yuva sayısını GameScene'den alıyor.
- Zorluk (2026-11-04): temas tavanı A denendi ve kaldırıldı, nefes aldıran kota eğrisi C ve dolum bütçesi B kaldı, ayrıntısı "Güncel sayılar"da.
- Simülatör (2026-11-05): insan gibi bot, kariyer ve ekonomi döngüsü, eski dalga tabloları, aday değişiklikler; ayrıntısı "Denge ölçümü"nde. Kullanıcı paralel ajan kullanmaya da izin verdi ("daha hızlı bitireceksen, kaliteden ödün verme"); kariyer ve eski dalga modülleri öyle yazıldı.
- Kalabalık artışı (2026-11-05): 4. dakikadan itibaren %20, uzatma +35; boss eğrisi kullanıcının kararıyla eski halinde.
- `?maxed` test adresi (2026-11-05 akşamı): `SaveData.ts`'te tek bayrak, bütün silahlar açık, 18 Atölye yükseltmesi maks, evrimler görülmüş, eğitim bitmiş, 999.999 Data, hiçbir şey kaydedilmez; `?maxed&perfect` ikisini birleştirir.
- Ekonomi kararı (2026-11-05 akşamı): fiyatlar ve ödül formülü yer tutucu haliyle kesinleşti, ayrıntısı İş 2'de.
- **Mobil tasarım geçişi (2026-11-05 akşamı).** Kullanıcı dört ekran görüntüsüyle geldi: kart yazıları farklı boyutlarda ve üst üste biniyor, telefonda ekran bomboş kalıyor ve karakter çok yakın, arena ekrana sığmıyor, menüler kötü. Teşhis: kartlar üç dar sütunda 117 pikseldi ve 12'lik fonta 8 harf sığıyordu, uzun kelimeler 6'ya düşüyordu; kamera zoom'u her cihazda 1'di (masaüstü 1920x1080 dünya pikseli görürken telefon 375x812), doğum halkası köşegene bağlı olduğu için düşmanlar yandan 300 piksel yürüyüp görünüyordu; arena çapı 640 zaten 375'e sığmazdı; menüler oyun zemini üstünde aynı stildi. Beş PNG mockup çizildi (oyunun gerçek fontu ve sprite'larıyla, "Test ipuçları"ndaki yöntem), kullanıcı hepsini beğendi ve sırayla onayladı:
  - **Kartlar:** tek sütun satır kartlar (en fazla 420 piksel; ekran kısaysa yükseklik sığdırılır), solda 72'lik ikon kutusu, altında tür etiketi (WEAPON cyan, PASSIVE yeşil, EVOLUTION altın, REPAIR gri; kutu çerçevesi aynı renk, arkadaşları silahla pasifi ayırt edemediği için eklendi), sağda ad, aynı satırda yıldızlar (`starRow`, tek sıra) ve rozet (NEW cyan çerçeve, EVOLVES ve silah sprite'ı), altında açıklama; her yazı 12, küçülme yok. Eğitim eli ortadaki satıra gider.
  - **HUD sahnesi:** Phaser'da kamera zoom'u `scrollFactor 0` nesneleri de küçülttüğü için HUD (XP, sayaç, boss çubuğu, Data, envanter, hasar flaşı, debug yazısı, joystick görseli, eğitim ipucu ve eli) yeni `HudScene`'e taşındı; GameScene onu `launch` eder, `onReady` ile bağlar, bağlanana kadar `update` döner (ilk kare). Joystick girdiyi GameScene'den okur, HUD'a çizer.
  - **Kamera:** `VIEW_SHORT_SIDE = 560`: kısa kenar 560 dünya pikselinden azsa kamera uzaklaşır, zoom "sanat pikseli = tam sayı cihaz pikseli" olacak şekilde yuvarlanır (375@3 → 2, 390@2 → 1,5, 430@3 → 2,5, masaüstü → 1). Zemin tileSprite'ı görünen dünya boyunda ve her kare görünüm köşesine taşınır (`viewX/Y`, `worldView` update'te bayat). Doğum halkası, kırılabilir alanı, Nuke alanı ve dekor görünen dünyayı (`displayWidth/Height`) okur; doğum halkası telefonda 513'ten yaklaşık 720 piksele çıktı.
  - **Cihaz piksel oranı:** `main.ts` `Phaser.Scale.NONE`, tuval pencere x `DPR`, `zoom: 1/DPR`, pencere `resize` olayı elle; her arayüz sahnesi `fitCamera` ile kamerasını `DPR` zoom'una alıp CSS piksel boyutunu okur; HUD sınıflarından `setScrollFactor(0)` kaldırıldı; işaretçi koordinatları `DPR`'ye bölünür. Eski "yüksek DPR'da bulanıklık" ertelemesi böylece kapandı.
  - **Menü:** koyu noktalı zemin (`addDarkBackdrop`), üstte BEST ve Data rozetleri, gölgeli iki satır logo, "SURVIVE THE SWARM", ekran boyu kum şeridinde kahraman ve çöpler, altın dolgulu PLAY, ikonlu MUSEUM ve WORKSHOP, günlük görevler paneli (kutucuk, metin, ilerleme çubuğu, sayaç; yükseklik metne göre). 740'tan kısa ekranda slogan kalkar ve şerit 64'e iner, 680'den kısada şerit de kalkar. Yatay düzen kalktı; masaüstünde aynı sütun ortada.
  - **Atölye ve Müze:** ortak `addScreenHeader` (BACK, başlık, Data rozeti; şerit dokunmayı yutar), `ScrollList` (parmakla sürüklenen maskeli liste, kaydırma çubuğu), Atölye'de STATS/MECHANICS sekmeleri ve satır başına fiyat düğmesi (etki yazısı sarılır, satır büyür), Müze'de ikon kutusu, ad, "WITH <pasif>", EVOLVED/OWNED/fiyat; `addPager`, `gridCells` ve kum `addBackdrop` silindi. Düğmelere 10 CSS piksellik dokunma payı geldi (sürükleme tıklama sayılmaz).
  - **Can barı:** renk kademesi (%50 üstü yeşil, %25-50 sarı, altı kırmızı ve yanıp sönme), hasar izi (açık katman 0,3 saniye bekleyip saniyede 1,5 bar hızıyla erir), 44x5 dünya pikseli. 48x8 kenarlıklı sürüm "çok kalın, kötü" diye reddedildi.
  - Simülatörün sahte kamerası 562x1218 görünümlü telefon oldu (`displayWidth/Height`).
- **Zor mod (2026-11-06):** ayrıntısı İş 3'te.
- **Liste ataleti (2026-11-06):** kullanıcı Atölye ve Müze'de hızlı kaydırmanın dibe inmediğini söyledi; liste parmak kalkınca dururdu. `ScrollList` artık parmağın son hızını ölçer (yumuşatılmış), bırakınca o hızla kayar ve `FLING_DECAY_MS` (325) ile yavaşlar; parmak 80 ms durup kalkarsa kaymaz. Kayarken alanın üstüne görünmez bir `Zone` (`flingShield`) gelir: durdurmak için yapılan dokunuş Atölye'nin fiyat düğmesine geçmez, yanlışlıkla alım olmaz. Telefonda denenmedi.
- Kullanıcının "hareket ederken pikselleşme" gözlemi (2026-11-05 akşamı): masaüstünde F12 cihaz emülasyonuyla (16 Pro Max, DPR 3) bakıyordu; DevTools 1290 piksellik tuvali monitöre sığdırmak için kesirli küçültüyor, kıpırtı ondan. Gerçek telefonda sanat pikseli tam sayı fiziksel piksel. Kod değişmedi.

## Güncel sayılar (hepsi `src/data` içinde, hepsi geçici)

- **Dalgalar (`waves.ts`, 2026-11-04):** Kalabalık dakikalar (2, 4, 6, 8) çok ama zayıf düşman ve kısa aralık, tank dakikalar (3, 5, 7, 9) az ama sert düşman ve uzun aralık; VS'nin iniş çıkışlı kotasından alındı. Dakikaya göre kotalar 20, 35, 55, 50, 120, 78, 162, 90, 204, 120 (2026-11-05'te 4. dakikadan itibaren %20 artırıldı; simülasyonda kalabalık iyi oyuncuyu öldürmüyor ama XP ve Data besliyor). Can çarpanları 1, 1, 1.1, 1.3, 1.4, 1.6, 1.7, 1.9, 2, 2.2. Aralıklar 0.7, 0.45, 0.2, 0.5, 0.2, 0.5, 0.12, 0.4, 0.14, 0.3. Aralıklı doğanlar kotanın üstüne birikir, ama canlı sayısı kotanın `CROWD_OVERFLOW` (1.25) katını veya 450'yi geçince durur. Kota dolumları tavandan etkilenmez.
- **Kota dolumu (`REFILL`, 2026-11-04):** Anında değil bütçeyle: saniyede kota/12, en az 3; boş saha yaklaşık 12 saniyede dolar. Oyunun ilk karesi kotayı anında doldurur (kolay başlangıç patlaması), saha doluyken bütçe birikmez. Büyük alan vuruşu, Nuke ve boss kavgası sonrası 10 saniyelik boşluk bırakır; fazla sakinse 12'yi 8'e çek.
- **Kolay başlangıç:** İlk 15 saniyede doğan her şeyin canı 1'dir.
- **Uzatma (son dalgadan sonra, her tam dakikada):** 450'ye kadar +35 kota (tavana 19. dakika civarında ulaşılır), +%6 can, +%4 temas hasarı. Kullanıcı zorluğun sayıdan gelmesini, can ve hasarın az artmasını istiyor. 450 sınırı telefonlar içindir.
- **XP (`progression.ts`):** `5 + 6(L-1) + L²/2`. Elle ayarlanmış daha hızlı ilk seviyeler denendi, evrimi çok erkene çektiği için kullanıcı iptal etti.
- **Gem'ler (`gems.ts`):** Mavi x1, yeşil x2, mor x4. Worm %30 yeşil, Pop-Up %40, Phisher %40 ve %10 mor, Adware %30, Trojan %50 ve %30 mor. Normal düşmanlardan mor 6:00'da başlar. Mini bosslar yeşil veya mor düşürür, mor %10'dan başlar ve dakikada +%10 artar. Bosslar her zaman mor düşürür, 30 x 4 = 120 XP.
- **Bosslar (`bosses.ts`):** 8 grupta 20 boss. Her gruptan rastgele bir boss, 2:30'dan 20:00'ye kadar 2:30'da bir. Sonra gruplar baştan başlar ve bir önceki turda gönderdikleri boss'u göndermezler. Can = 3000 x 1.7^sıra x `hpMult`: sırayla 3.000, 5.100, 8.670, 29.500 (10:00, milestone çarpanı 2), 25.000, 42.600, 72.400, 246.000 (20:00). 2026-11-05'te simülasyon 10:00 bossunu maks build dışında herkes için duvar gösterdi ve 1.5 büyüme önerildi; kullanıcı bossları bilerek eski halinde bıraktı. Saldırı hasarı tur başına x1.5. Duvar 25 DPS; RANSOMWARE'inki saniyede 3 pikselle 320'den 180'e kapanır. Öldürünce 50 can gelir ve her zaman slot makinesi düşer.
- **Mini bosslar (`miniBosses.ts`):** 1:00'den itibaren 60 saniyede bir, boss anlarını atlayarak (5:00, 10:00). 1.5 kat boyut, mor kenar, 5 kat XP. Önce Bug, 2:00'den Worm, 4:00'ten Phisher, 6:00'dan Trojan. Can = 60 x (t/30)^1.6.
- **Slotlar (`slots.ts`):** Mini bosslar %40 ihtimalle düşürür. 2 ve 3 yükseltme ihtimali: mini boss %7 ve %1, boss %16 ve %4. Slot yalnızca sahip olunanı yükseltir, %20 silah ve %80 pasif. Pasif yoksa %80'lik kısım yerine 30 can verir, çünkü silaha düşmek tek silaha yığılmayı ödüllendirip evrimi 3:04'e çekiyordu. Pasifler dolunca silahlara geçer. Slotlar evrim yapmaz.
- **Bilgisayarlar (`drops.ts`, `Breakables.ts`):** 640x640'lık parça başına %20 ihtimal (kullanıcı iki kez azaltılmasını istedi), en az 320 piksel arayla, 30 can, her zaman en az 2 vuruş. Düşenler: Can 25 (%35), 5 Data (%35), 15 Data (%15), 40 Data (%4), Magnet (%7), Nuke (%4).
- **Repair kartı:** 10 can (eskiden 30'du, tekrarlanan kartlar bir oyunda yaklaşık 800 can veriyordu).
- **Atölye (`meta.ts`):** 18 yükseltme. 11 istatistik yükseltmesi 10 seviye, fiyatları `prices(50, 10, 1.5)` = 50, 80, 110, 170, 250, 380, 570, 850, 1280, 1920 (toplam 5.660); Dual Core tek seviye 5.000. Mekanikler: Lucky Coin `prices(200, 5, 1.6)`, Data Miner `prices(100, 10, 1.5)`, Reroll `prices(300, 3, 2)`, Wide Menu 2.000, Scrap Radar `prices(150, 5, 1.6)`, Expansion Bay 12.000. Toplam 100.220, Müze 15.900. Ekran: STATS ve MECHANICS sekmeleri (`WorkshopDef.tab`), `ScrollList` satırları (tek satırlı metin 84, iki satırlı 102 piksel), satır başına fiyat düğmesi; alınamayan soluk, dolu olan altın MAX.
- **Atölye mekanikleri:** Hepsi oyuncu stat'ı olarak taşınır (`luck`, `dataMult`, `rerolls`, `bonusCards`, `computerChance`, `bonusSlots` `player.ts` içinde), tek bonus yolu. Luck slot açılırken `withLuck` ile iki ihtimale de eklenir. Data Miner `runData`'nın son çarpanıdır, canlı sayaç ve oyun sonu aynı sayıyı verir; evrim ve günlük görev ödülleri çarpılmaz. Reroll hakkı `Upgrades.rerollsLeft`, düğme kartların altında 48 piksellik yerde, eğitimde ve hak bitince yok. 4 kart dikey listede dört satır olur, 667 yükseklikte bile sığar. Scrap Radar parça eşiğine puan ekler (20'den en çok 35'e). Expansion Bay'in `bonusSlots`'u silah ve pasif sınırına birlikte eklenir, envanter çubuğunun iki satırını da bir hücre uzatır.
- **Ödüller (`meta.ts`):** 10 öldürme başına 1 Data, dakika başına 5, boss başına 30, milestone boss başına 100, ilk evrim başına 100. `runData` sayacın, ödülün ve simülatörün ortak formülüdür.

## Zorluk karşılaştırması (2026-11-01)

Yalnızca veri dosyalarından hesaplandı, oyunda ölçülmedi. Sahadaki toplam can (kota x ortalama can) dakikaya göre, 2026-11-05 kota artışı sonrası: 3:00'te 1.544, 4:00'te 1.383, 5:00'te 3.120, 6:00'da 3.060, 7:00'de 7.196, 8:00'de 5.368, 9:00'da 9.315, 10:00'da yaklaşık 12.760, 15:00'te 34.850, 20:00'de 58.000. Bu VS'nin 1,9-5,4 katı; VS'nin 10-20 düşmanlık nefes dakikalarında (10:00, 12:00) daha çok. C'den önce 3:00'te 2.444, 5:00'te 7.088, 8:00'de 16.681, 15:00'te 57.063 idi.

Vampire Survivors'ın Mad Forest haritasıyla (vampire.survivors.wiki) kıyas:
- Bizim normal silahlarımız onlarınkine yakın: Cursor 1. seviyede 11,4, son seviyede 133 DPS; Magic Wand 8,3 ve 120. Evrimli tarafta Holy Wand 240, Auto-Clicker 93 DPS, yani orada gerideyiz.
- VS'nin bilinen dakikalarıyla kıyaslayınca, silah gücü hesaba katılmış halde bizim oyun ortalama 7-8 kat ağır. Kalan farkı VS'nin canı bulunamayan dakikalar, alan silahları ve 6 silah yuvası etkiler, kesin sayı gibi kullanma.
- VS'de normal modda genel can çarpanı yok, kota iniş çıkışlı (100, 30, 10, 300, 20), 300 canlıda normal doğum duruyor ve 300'lük dakikada düşmanlar 15 canlı. Bizde sayı, can çarpanı ve düşman türü aynı anda ve hep yukarı gidiyor.
- Bizde dokunulmazlık yoktur ve temas hasarı tamamen birikir: 6 Bug dolu canı 2,8 saniyede, 8 Worm 1,25 saniyede bitirir. 2026-11-04'te "en sert düşman tam, diğerleri %25" kuralı denendi ve kaldırıldı, oyuncu hiç ölmüyordu. VS'de her vuruştan sonra kısa bir dokunulmazlık penceresi var (süresi wiki'de yok, kaynaklar 0,25-0,5 sn diyor), kalabalığın büyüklüğü hasarı artırmaz.
- 2026-11-04 analizi: asıl fark miktar değil yapı. Bizde her düşman oyuncudan yavaş (200'e karşı en hızlısı Spam 140), kota anında dolan ve hiç inmeyen bir taban (20'den 450'ye tek yönlü), can çarpanı, sayı ve tür aynı anda büyüyor. VS'nin kotası iniş çıkışlı (15, 30, 50, 40, 30, 10, 20, 80, 100, 30, 10, 300...), kalabalık dakikalarda düşmanlar zayıf, tank dakikalarda az, Normal modda can çarpanı 1. Sahadaki toplam can dakikaya göre bizde VS'nin 2-30 katı, ortanca 5 kat; silah DPS'leri ise eşit (Cursor 11,4-133, Magic Wand 8,3-120).

**Ölçüm (2026-11-05, insan botu, bugünkü dalgalar):** Yeni kayıtta iyi oyuncu ortanca 10:00 (5:00-10:00), hep 10:00 bossunda ölür, temasla hiç ölmez; yeni oyuncu 5:00 (2:30-7:30), 2:30 ve 5:00 bosslarında. Bossuz koşuda kalabalık tek başına yeni kayıtlı oyuncuyu 8 dakikada öldürür (seviye 9), maks build iyi oyuncuyu 40 dakikada bile öldüremez. Maks build bosslarla 20:00 bossunda ölür (246.000 can). Kariyer (30 oyun, aralarda alım): iyi oyuncu 30 oyunun 29'unda 10:00'da ölür, bir kez 17:30; oyun başına 430-790 Data, 30 oyunda yaklaşık 18.000 Data harcar (Atölye+Müze toplamı 112.000'in %16'sı, seviye sayısının %63'ü çünkü ilk seviyeler ucuz); yeni oyuncu 7:30 bossunu 30 oyunda da geçemez, 110-275 Data/oyun. Sonuç: kalabalık iyi oyuncu için tehdit değil, zorluğun tamamı bosslarda ve 10:00 milestone bossu maks build dışında herkes için duvar; hedef tablonun 30 oyunda 13-15 dakikası bu yüzden tutmuyor. Adaylar `tweaks.js` ile ölçüldü. Kullanıcı 2026-11-05'te önce "boss + kalabalık" paketini seçti, sonra bossları bilerek eski eğriye döndürdü ve yalnızca kalabalık artışını tuttu: 4. dakikadan itibaren %20 daha çok düşman, uzatma +35. Tek başına kalabalık artışının ölçümü ("crowdUp"): iyi oyuncu 1. oyun 10:00, 10. oyun 10:00, 15. oyun 15:00 (bir koşu), 10:00 bossu duvar olmayı sürdürür; yeni oyuncu 2:30-7:30. Boss yumuşatmanın ölçümü ("bossSoft": büyüme 1,5, milestone 1,5) kayıtta dursun: iyi oyuncu 10. oyun 10:00-12:30, 20. oyun 12:30-15:00; birlikte: 1. oyun 7:30-12:30, 10. oyun 11:30-14:45, 20. oyun 15:00-17:20. Kullanıcı 10:00 duvarını tekrar açmak isterse `tweaks.js` içindeki `bossSofter` kalıbı ve bu sayılar başlangıç noktası. Simülasyonun çözemediği: iyi oyuncunun ilk oyunu 6-7 dakikada bitmiyor (7:30-12:30); kullanıcı 2026-11-05 akşamı bu süreyi kabul etti (İş 2), değiştirilmeyecek. Fiyatlara dokunulmadı.

Testten sonra bakılacaklar: 5. dakikadaki Trojan oranı (önerilen karışım 24 Bug, 1 Trojan, 2 Pop-Up), tank dakikalarının (3, 5, 7, 9) fazla boş kalması, dolum bütçesinin seviye atlamayı yavaşlatması (daha az öldürme, daha az gem), evrimli silah gücü, uzatmada 450 düşman.

## Denge ölçümü

**Kullanıcı istemedikçe bot simülasyonu çalıştırmak için her zaman sor.** 2026-10-31'de kullanıcı birini durdurdu ve simülasyonların çok uzun sürdüğünü, bütün token'ları bitirdiğini söyledi. Değişikliği yap, ölçülmediğini söyle ve oynayarak değerlendirmesine bırak. Gerçek denge işi için izin veriyor: 2026-11-01'de silahlar için, 2026-11-05'te İş 2 (ekonomi ve zorluk) için sınırsız, 2026-11-06'da İş 3 (zor mod) için. Dolu hesapla koşular yavaştır (oyun başına 15-20 dakika, 10.000+ öldürme; 16 koşuluk bir tur birkaç dakika); kullanıcı 2026-11-06'da beklemeden sıkıldı ("ne bu bu kadar uzun süren"), az tur ve az koşu yap, elde yeterli sonuç varsa durmayı öner. O izin o işe aittir, başka işlerde yine sor.

`npm run sim -- <runs> <sections>`, örneğin `npm run sim -- 8 new,maxed`. Bölümler: `still`, `solo`, `build`, `random`, `late`, `new`, `maxed`, `boss`, `weapons`, ve 2026-11-05'ten beri `human`, `crowd`, `calibrate`, `career`, `tune`, `fight1`. `tools/balance-sim/game.js`, `GameScene.update` kare sırasını kopyalar, ikisini uyumlu tut. Simülatör hızlıdır: 10 dakikalık bir oyun bir saniyeden az sürer, 10 koşuluk bir bölüm bir iki dakikada biter; uzunları arka planda, çıktıyı dosyaya yazarak koştur.

**İnsan gibi bot (`human.js`, 2026-11-05):** Kullanıcı ekonomi işi için (İş 2) sınırsız simülasyon izni verdi, şartı botların insan gibi oynamasıydı. Bot 16 yöne bakıp en açık yönü seçer, ekranın tamamına (520 px) bakarak kalabalık büyüdükçe boş alana kıvrılır, yavaş düşmanları gem çekim yarıçapının içinde tutar (`engage`), gem'leri havuz olarak görür, canı %60'ın altındayken iyileşme eşyasına baskı altında bile gider, kartları planla seçer (ana silah maksa, anahtar pasif, can düşükken savunma). Boss kavgasında arena merkezinde daire çizer ve yalnızca gerçek bir isabet yaklaşınca ters döner; uyarı işaretlerini göremediği için `dodge` payı boss mermilerinin bir kısmını da (`ARENA_BULLET_READ`) okur. İki profil: `NEWBIE` (0,6 sn tepki, dar görüş, rastgele kart) ve `GOOD` (0,15 sn, geniş görüş, planlı kart). `SIM_VERBOSE=1` koşu başına satır (can ve temas hasarı dakika dakika, kartlar, kavga süresi/hasarı), `SIM_TRACE=1` ölümden önceki 15 saniye, `SIM_WAVES=softened,hard` eski dalga tabloları (`legacy.js`), `SIM_DIFFICULTY=hard` zor mod çarpanları, `SIM_DIFFICULTY_SET='{"bossHp":2}'` aday çarpanlar (2026-11-06), `SIM_TWEAK=bossSofter,crowdUp10` aday değişiklikler (`tweaks.js`, veri dosyalarına dokunmadan yerinde uygular; veri dosyasına giren bir aday listeden çıkarılır, yoksa üst üste biner). `career.js` art arda oyunları, Data kazancını, günlük görevleri ve Atölye ile Müze alımını simüle eder (`human` alım politikası: %60 Atölye, en ucuzdan).

**Kalibrasyon (2026-11-05, eski dalgalarda, yeni kayıt):** `GOOD` + 4 eski Atölye yıldızı yumuşatılmış dalgalarda ortanca 9:53 (kullanıcı 3-4 yıldızla 8+ dakika demişti), yıldızsız 6:07; `NEWBIE` 2:30-5:00 (kullanıcı tahmini 3-5). Bilinen zayıflık: bot 2:30'da daire botundan 1-2 seviye geride kalır ve 5:00 bossunu insandan sık kaybeder; sayıları karşılaştırma olarak oku, mutlak değil. Daire botu (`circle`) ilk bossu 90-130 saniyede keser, insan botu ortanca 140.

Eski `strafe` botu yeni hesapta ilk boss kavgasında ölür ve sürüye sıkışınca titrer; hayatta kalma ölçümü için artık `human` kullan. `boss` bölümü ölümsüz `circle` botuyla kavga başına boss saldırı hasarını verir ve hâlâ işe yarar. 2026-11-05 ölçümü (süre / ham saldırı hasarı): yeni kayıt #1 108 s / 29, #2 61 s / 108, #3 94 s / 223, #4 206 s / 1.337, #5 191 s / 689, #6 355 s / 3.331, #7-8 bitiremedi; maks build #1 22 s / 5, #2 12 s / 18, #3 16 s / 0, #4 41 s / 247, #5 39 s / 149, #6 55 s / 547, #7 66 s / 539, #8 142 s / 2.384. Yani 10:00 ve 20:00 bossları DPS sınavı: kavga uzadıkça mermi hasarı oyuncuyu bitirir.

`npm run sim -- 3 weapons <clock> [ids]` her silah halini tek başına dalgaların bir noktasına koyar, dakikada öldürme, temas hasarı ve boss hasarını raporlar. Birinci ve son seviyeyi 300'de, evrimleri 600'de oku. **Silahları asla küçük sabit hedef kümesinde karşılaştırma:** alan silahları düşman sayısıyla güçlenir, 24 hedefli bir kontrol birinci seviye silahların evrimlileri geçtiğini gizlemişti. Birinci seviye alan silahlarının 600'de yüksek görünmesi yalnızca ölümsüz botun kalabalığa gömülmesindendir. Printer'ın boss hasarının 0 çıkması silahtan değil, botun baktığı yöndendir. 5:00'teki son aralıklar: birinci seviye en fazla yaklaşık 60, son seviye 44-487, evrimli 228-780; 10:00'da evrimli en fazla yaklaşık 1.040.

**Bot sürelerini asla oyuncunun ulaşacağı süre gibi sunma.** Eski `strafe` botu bossları kovalamaz, gerçekten kaçamaz (kaçınılabilir hasarın %40'ını alır) ve çok zayıftır: yeni hesapta ortalaması yaklaşık 5 dakikayken kullanıcı yükseltmesiz, bilerek ölerek 12:56'ya ulaşmıştı. O 12:56 artık kalibrasyon çapası değil: 10-31'in sert dalgalarında, 30 canlık Repair spam'iyle ve 4 düşük canlı bossla oynandı, bugünkü oyunla kıyaslanamaz. İnsan botunun çapası yukarıdaki "Kalibrasyon" paragrafı. Botu seçenekleri karşılaştırmak için kullan. Güç eğrileri için ölümsüz bot (`damageTaken: 0`) kullan. Boss canını kullanıcının gerçek kavgalarına göre ayarla.

Son ölümsüz bot, Cursor odaklı, yeni hesap, mor boss gem'lerinden önce: 1:00'de seviye 3, 2:00'de 6, 3:00'te 10, 5:00'te 12, 10:00'da 27, ilk evrim yaklaşık 5:00. İnsan botu (`GOOD`, yeni kayıt, bugünkü dalgalar): 2:30'da 5-7, 5:00'te 10, 10:00'da 17-19, ilk evrim yaklaşık 6:30. Hedef, 2:30 boss'undan önce evrim olmamasıdır.

Geçici bir ölçüm için gerçek kod Vite ile repo dışında paketlenip prototipler yamalanabilir (`Arena.prototype.start`, `Upgrades.prototype.spin`, ...). `Arena.update` yamasının değerini döndürmesi gerekir.

**Kamera değişikliği ve ölçümler (2026-11-05 akşamı):** Spawner doğum halkasını artık görünen dünyanın köşegeninden alıyor; sahte kamera `displayWidth 562, displayHeight 1218` (DPR 3 telefon, zoom 2), halka yaklaşık 720 piksel. Bu satırdan önceki bütün sayılar 390x844'lük eski görünümle (halka 513) ölçüldü; düşmanlar artık daha uzaktan yürüdüğü için erken dakikalar biraz kolaylaşmış olabilir, kullanıcı henüz "kolaylaştı" demedi. Aynı akşamın 120 oyunluk kariyer sonucu (eski halka): iyi bot 10 dakikalık oyunlarda 500-750 Data (öldürme 330-460, süre 50, üç boss 90, bulunan gerisi), Müze 50. oyunda, Atölye 70. oyunda dolu, 20 dakikaya ulaşınca oyun başına 4.000+ Data ve 120. oyunda 200.000 birikim; acemi bot 120 oyunda %88. İlk 9:00 iyi botta 2. oyun, 13:00 6. oyun, 20:00 42. oyun.

## Kararlar

Sonsuz oyun:
- Kazanma yok: bir oyun yalnızca ölünce biter, sonuç ekranında en iyi süre rekoru var. 10:00 ve 20:00 bossları 100 Data veren ve slot düşüren milestone'lardır.
- 10:00'dan sonra dalgalar sürer, 20:00'den sonra bosslar daha sert tekrar eder. Yükseltmeler biterken düşmanlar büyüdüğü için kendiliğinden bir duvar oluşur.
- Yükseltmeler bitince kartlar ve slotlar can verir. Şimdilik sonsuz bonus kart yok, duvarı aşındırırdı.

Mini bosslar dalgalardan gelen mor kenarlı seçkin düşmanlardır; **"normal boss" kullanıcının dilinde de arena bossları demektir**. Kodda `RUN_REWARDS.boss` arena boss ödülüdür.

Eğitim: yalnızca ilk oyunda, oyunun parçası olarak oynanır, atlama düğmesi yoktur. Bir el sürüklemeyi gösterir, bir Bug otomatik ateşi gösterir, sonra ekran çip dışında griye döner, çipi toplamak ilk seviyeyi verir ve bir el karta dokunur. Oyun saati ve dalgalar bekler, bu sırada bilgisayar çıkmaz. Herhangi bir kart seçilebilir. Oyundan çıkılırsa bir dahaki sefere tekrar oynanır. Son satırı `Survive as long as you can`.

Bilgisayarlar: ekrana yakınken düşman havuzunda `prop` düşman olarak durur, böylece bütün silahlar ek kod olmadan hedefler ve vurur. Oyuncuyu engeller (takılabilir), düşmanlar içinden geçer, öldürme veya dalga kotası sayılmaz, Nuke onları yok sayar. Eşyalar tam bilgisayarın durduğu yere düşer ve üstünden geçince toplanır. Silahlar en yakın hedefse bilgisayara ateş eder; kullanıcıyı rahatsız ederse "önce düşmanlar" kuralı kolaydır.

Bosslar: her saldırının uyarısı var (yanıp sönme, hamleden 0,25 saniye önce kilitlenen nişan çizgisi, yerde fitil). Saldırılar rastgeledir, aynısı üst üste gelmez. Duvar değince yakar, tam dibinde durmak da sayılır, yani kenar asla güvenli değildir. Halkanın dışındaki bilgisayarlar kavga boyunca gizlenir.

Silahlar: ekranı yalnızca Nuke temizleyebilir. Kullanıcı bunu yapan Pager'ı kabul edilemez buldu, bu yüzden Pager rastgele birkaç düşmana vurur. Bazı kurulumlar daha güçlü olabilir, ama katlarca değil. Robot Vacuum asla geri dönmez: kendine en yakın düşmana gider, menzilinin sınırında durur ve o düşmanla sınır boyunca kayar. Oyuncuya dönen robot kötü görünüyordu.

İleri nişan: `predictPlayer` oyuncunun üzerinde olduğu eğriyi izler (`Player.turnRate`), çünkü düz tahmin daire çizen birini ıskalar. En fazla `MAX_LEAD_SECONDS` (0.6) ileriye bakar, çünkü kullanıcı daha uzun nişanları saçma buldu: atışlar ve işaretler 360+ piksel uzağa, dikey ekranın dışına düşüyordu. Yalnızca ilk işaret yola düşer, diğerleri oyuncunun etrafına saçılır. Kapanan duvar boss canına göre değil zamana göre işler, böylece boss'a hızlı hasar vermek cezalandırılmaz. Silahlar en yakın hedefe ateş ettiği için çağrılanlar boss'u korur: ROOTKIT'in halkası yalnızca 8 Bug'dır ve halka seyrek kalsın diye hamlesi listede iki kez geçer.

Hâlâ geçerli eski kararlar:
- **Ad: Computer Survivor.** Silahlar bilgisayar ve telefon tarihinin ikonik cihazlarıdır. Düşmanlar bilgisayar tehditleridir.
- **Gerçek marka adı veya birebir benzerlik yok**, mağazadan kaldırılma riski yüzünden. Referans türün kendisidir, başka bir oyunun içerik tablolarını asla kopyalama.
- **Her şey piksel sanatı.** Eski elektronik hurdalığı ve Teknisyen oyuncu. Görseller `src/art/sprites.ts` içinde metin ızgaralarıdır, `src/art/atlas.ts` tek atlasa paketler, yeni bağımlılık yok. Büyük görseller `src/art/slotMachine.ts` içinde kodla çizilir. Yazı tipi elle yapılmış 5x7 bitmap'tir, boyutlar 6'nın katı olmalıdır. Oyun içi metinler İngilizce kalır.
- **Gelir modeli:** Ödüllü reklamlarla ücretsiz, ayrıca bu ödülleri reklamsız veren tek seferlik satın alma. Güç veya Data satışı yok, zorunlu reklam yok.
- **İlerleme cihazda durur**, hesap veya sunucu yok.
- **Temas hasarı:** Saniye başına, değen her düşman için toplanır, dokunulmazlık karesi yok. 2026-11-04'te tavan denendi (en sert tam, diğerleri %25) ve kullanıcı kaldırttı: kimse ölmüyordu.
- **Kartlar ve katmanlar:** Seçim yalnızca basış aynı kartta başlayıp bitiyorsa sayılır. Katman açıldıktan sonraki 0,4 saniye dokunuşlar yok sayılır, çünkü parmak genelde joystick üzerindedir.
- **Boss arenası:** Oyuncunun etrafında halka kapanır, dışarıdaki düşmanlar gem veya öldürme vermeden yok olur, kavga boyunca dalgalar ve oyun saati durur.
- **Evrim:** Son seviyede silah ve herhangi bir seviyede eşi olan pasif gerekir; bir sonraki seviye atlamada altın kart olarak çıkar. 2026-11-04'ten beri 19 silahın 19 ayrı anahtarı var; sahip olunan silahın anahtar pasifi kartlarda 2 kat ağırlıklı (`KEY_PASSIVE_WEIGHT`), yoksa 4 yuvaya 19 pasifle evrim nadir olurdu.
- **Brick Phone:** Sahte 3B yayla atılır. **Magnet pasifi:** Seviye başına +%5, bilerek zayıf.

2026-11-05 akşamı kararları:
- **Ekonomi:** yer tutucu fiyatlar ve ödül formülü kesin; iyi oyuncu Atölye'yi 70 oyunda doldurur, geç oyunda gelir patlar, kullanıcı bilerek böyle bıraktı.
- **Tasarım dili:** menüler koyu lacivert zemin ve nokta ızgarası üstünde, kum yalnızca oyun zemini ve menüdeki kahraman şeridi. Altın (`accent`) başlık, çerçeve ve etiket; cyan (`data`) Data ve silah; yeşil pasif. Tek sütun düzen, en fazla 420 piksel, masaüstünde ortada; yatay telefon desteklenmiyor, yön kilidi paketleme işinde. Bütün yazılar 12, başlıklar 18/24, logo 36; 6'lık yazı yalnızca debug satırında.
- **Kartlar türünü yazar:** arkadaşlar silahla pasifi ayırt edemedi; etiket ve renk birlikte.
- **Piksel kuralı:** dünyada sanat pikseli her cihazda tam sayı cihaz pikseli (zoom yuvarlanır); arayüzde kamera tam `DPR`, tam sayı olmayan DPR'li Android'lerde yazı hafif eşitsiz, kabul edildi. Masaüstünde Windows ölçeği %125 ise dünya zoom'u 1,5'e yuvarlanır ve her şey eskisinden %20 büyük görünür, kabul edildi.
- **Kaydırma yerine sayfalama yok:** Atölye ve Müze `ScrollList` ile kaydırılır; 2026-11-06'dan beri ataletli.

2026-11-06 kararları:
- **Zor mod:** boss canı ve hasarı x2, diğerleri x1,5, dolum ve Data x2; 10:00 normal rekoruyla açılır; ayrı rekor; zor modda süre sayacı kırmızı (kullanıcı istemezse kalkar). Ekrandaki adı **Nightmare** ("Hard hoş durmuyor"); kodda `hard` kaldı.
- **Karakterler:** 1. skin görevle (silahı evrimleştir), 2. skin görevle (15:00), 3. skin Gem ile; Gem şimdilik bedava; ayrıntı İş 4'te.
- **Can barı ince kalır:** 44x5, renk kademeli, hasar izli. Kalın ve kenarlıklı sürüm reddedildi.
- **Zor mod eski tablolar değildir:** bugünkü dalgaların üstüne tek çarpan seti (İş 3). Kullanıcı "full olan insanların bile zorlanacağı" bir mod istiyor.
- **Karakterler:** her silaha bir karakter, imza özelliği var, skinler palet değişimi, kilitliler siluet ve "???", görevler gizli, sanat dört parti (İş 4).

## Tuzaklar

- **Vercel dağıtımlarını asla kontrol etme, bekleme veya raporlama.** Kullanıcı buna kızdı; push işin sonudur. Yerelde de test ediyor.
- **Vite dev sunucusu bir keresinde `Arena.ts` değişikliğini kaçırdı** ve eski dosyayı yenilerin yanında sundu. Bu, canı `NaN` yaptı (can çubuğu yok, kırmızı parlama yok, ölüm yok) ve boss'un saldırısını durdurdu. Davranış anlamsızsa `http://localhost:5173/src/...` adresini çekip karşılaştır, sonra dosyaya dokun veya `npm run dev` komutunu yeniden başlat. Derlenmiş çıktı kaynaktan farklıdır (`0.7` `.7` olur, `24000` `24e3` olur, türler silinir), yani metin eşleşmemesi tek başına kanıt değildir.
- Tek karede `NaN` bir `damage`, bütün oyun boyunca canı bozar.
- `pixelText` büyük harfe çevirir, `BitmapText.setText` çevirmez; metni kendin büyüt.
- `pixelArt: true` dokuları nearest-neighbor yapar. Yumuşak dokular `createVignette` gibi `setFilter(LINEAR)` ister.
- Sahne nesnesi oyunlardan uzun yaşar, sahnede saklanan her şey `create` içinde sıfırlanmalıdır.
- Havuzdaki görseller renk ve ölçeğini korur: `BossBrain.stop` rengi temizler, `EnemyManager.spawn` ölçeği ayarlar.
- `Arena.update` hasar döndürür, her çağıran bunu eklemelidir.
- Oyuncu bossları iter (`pushOutOf`), bu yüzden `BossBrain.update` onları dururken bile her karede duvarın içinde tutar. Bu olmazsa boss duvardan dışarı itilir ve dışarıdan ateş eder.
- Simülasyonları arka planda paralel koştururken çıktı klasörü değişkenini `&` zincirinin dışında, kendi satırında tanımla; zincir içindeki atama sonraki komuta geçmez ve çıktı kök dizine düşer. İki batch bu yüzden yarım kaldı.
- `tweaks.js`'deki bir aday veri dosyasına girince listeden silinir; kalırsa `SIM_TWEAK` onu bir daha üstüne uygular.
- Kabuk içinde `node -e` ile backtick içeren metin düzenleme bozulur; düzenleme betiğini dosyaya yazıp çalıştır.
- **Kamera zoom'u altında `setScrollFactor(0)` kullanma.** Phaser zoom'u scrollFactor 0 nesneleri de kamera merkezi etrafında ölçekler; `fitCamera`'lı arayüz sahnelerinde (zoom = `DPR`) böyle bir nesne ekranın dışına uçar. HUD kendi sahnesinde, kamerası sabit, scrollFactor gerekmez.
- **İşaretçi koordinatları cihaz pikselidir** (`pointer.x`), arayüz CSS pikselinde yerleşir: `DPR`'ye böl (joystick, `ScrollList`, `TAP_SLOP`).
- `camera.worldView` yalnızca çizimde güncellenir; `update` içinde görünümün köşesi `oyuncu - displayWidth / 2` ile elle hesaplanır (`viewX/Y`), yoksa zemin bir kare geride kalır.
- `HudScene` bir kare geç bağlanır; GameScene `update` `hud` yokken döner, HUD'a dokunan kodlar `this.hud?.` kullanır. Oyun yeniden başlarken GameScene `SHUTDOWN` HudScene'i durdurur, `create` yeniden `launch` eder.
- `ScrollList` sahne `clearScene` ile temizlenmeden önce `destroy()` ister: işaretçi ve `update` dinleyicileri ve maske grafiği yoksa sızar. Maske girdiyi kırpmaz; başlık şeridi `setInteractive()` ile altına kayan satırların dokunuşunu yutar, liste alanı bu yüzden ekranın dibine kadar iner.
- `Rectangle.setSize` ve `BitmapText.height` ile panel yüksekliği metinden sonra belirlenir; çizim sırası için panel önce yaratılıp sonra boyutlanır (menü görevleri, Atölye satırları).
- Chrome DevTools cihaz emülasyonu DPR 3 tuvali kesirli küçültür; orada görülen "pikselleşme" ve kıpırtı gerçek değildir. Telefonla LAN adresinden bak ya da DevTools yakınlaştırmasını %100 yap.
- `Phaser.Scale.RESIZE` zoom'u yok sayar; cihaz piksel oranı için `NONE` + elle `scale.resize` kullanılır (`main.ts`). `innerWidth/innerHeight` ile tuval boyutu pencere her değişince yenilenir.

## Test ipuçları

- Maks build testi: `?perfect` adresi Play'e basınca 8:00'den, 30. seviyede, 4 evrimli silah ve 4 maks pasifle başlar. 7:30'a kadarki bosslar geçilmiş sayılır, eğitim çıkmaz, hiçbir şey kaydedilmez. Ayarlar `upgrades.ts` içinde `PERFECT_TEST`.
- Stres testi: Geçici olarak ilk dalganın `minimum` değerini ve `OVERTIME.maxEnemies` (450, kotayı keser) değerini `500` yap. Commit'ten önce geri al.
- Zor mod: normal rekor 10:00 veya üstüyse menüde NORMAL | NIGHTMARE çıkar; `?maxed` ile hep açıktır. Seçim kayda yazılır.
- Karakterler: `?maxed` bütün karakterleri ve skinleri açar. Gerçek kayıtta karakter, silahı bir kez evrimleşmişse açıktır.
- Geç dalgalar: `src/systems/Spawner.ts` içinde `elapsed` değerini geçici olarak örneğin `8 * 60` başlat, `nextMiniBoss` değerini de buna uydur.
- Bosslar: `elapsed` değerini boss anından birkaç saniye önce başlat (örneğin `145`). Daha sonraki boss için `src/systems/Arena.ts` içindeki `bossesStarted` değerini de başlat.
- Hızlı seviye atlama: Geçici olarak `xpToNext` değerini düşür.
- Tek silah deneme: Oyunu `?weapon=usbStick` ile aç, silah Cursor'ın yanına eklenir. Evrimli adlar da çalışır.
- Bütün bossları görme: Oyunu `?bosstest` ile aç. Sırayla 400 canla gelirler, oyuncunun 100.000 canı olur. Burada kazanılan Data kayda geçer.
- Eğitimi tekrar oynama: Oyunu gizli pencerede aç veya `localStorage` içinden `computer-survivor-save` kaydını sil.
- Kullanıcının bir görseli değerlendirmesi için gerçek sahneyi jsDelivr'den gelen Phaser ile çalıştıran geçici bir Artifact sayfası yayınla, dosyalarını scratchpad'de tut ve kararından sonra sil. Bu slot makinesinde işe yaradı.
- Piksel ızgaralarını (ikonlar) kontrol etmek için 60 satırlık bir node betiği yeter: vite ile paketle (`@art` takma adı `src/art`'a, `phaser` `tools/balance-sim/phaser-stub.js`'e, `ssr.noExternal: true`), `PALETTE` harflerini RGBA'ya çevir, 8 kat büyüt, `zlib.deflateSync` ile elle IHDR/IDAT/IEND yazıp PNG üret, kart zemini `0x2a2f3a`; sonra görseli sohbete gönder ve önce kendin bak. 2026-11-04'te 8 ikon böyle onaylandı; betik scratchpad'deydi, yeniden yaz.
- Pasifler için adres kısayolu yok; kartlardan seçilir, sahip olunan silahın anahtarı 2 kat sık gelir.
- Her şey açık hesap: `?maxed` (2026-11-05). Bütün silahlar açık, 18 Atölye yükseltmesi maks (5 silah ve 5 pasif yuvası, 4 kart, Reroll), evrimler görülmüş, eğitim bitmiş, 999.999 Data; hiçbir şey kaydedilmez, adresi kaldırınca gerçek kayıt geri gelir. `?maxed&perfect` maks hesapla 8:00'den başlar. Oyun sonu ekranı Data gösterir ama yazmaz.
- Telefon görünümünü masaüstünde doğru görmek: DevTools cihaz emülasyonu tuvali kesirli küçültür (bkz. Tuzaklar); yakınlaştırmayı %100 yap ya da telefonla `npm run dev`'in LAN adresinden aç. Masaüstü Windows ölçeği %125 ise dünya zoom'u 1,5'tir.
- **Tasarım mockup'ı:** kullanıcı tasarım önerisini PNG olarak ister ve yapılamayacak şey görmek istemez. Yöntem (2026-11-05): scratchpad'de `entry.ts` ile `src/art/sprites.ts`'i (saf veri: `PALETTE`, `SPRITES`, `FONT_GLYPHS`) Vite `lib`/`iife` olarak paketle, küçük bir Node http sunucusu (statik + `POST /save/<ad>`) ve bir canvas sayfası yaz: glyph'leri 6x8 hücrede `size/6` birimle, sprite'ları tam sayı ölçekle, panelleri dikdörtgenle çiz, `toBlob` ile sunucuya gönder; sayfayı yerleşik tarayıcıda aç, PNG'leri `Read` ile kendin gör, sonra kullanıcıya gönder, sunucuyu kapat. Beş ekran böyle onaylandı; betikler scratchpad'deydi, yeniden yaz.

## Kod haritası

| Dosya | Görevi |
|---|---|
| `src/main.ts` | Phaser ayarları: `Scale.NONE`, tuval pencere x `DPR`, `zoom 1/DPR`, pencere `resize` dinleyicisi, sahne listesi |
| `src/scenes/GameScene.ts` | Her şeyi bağlar; kare sırası burada; `worldZoom` kuralı (`VIEW_SHORT_SIDE`), zemin ve `viewX/Y`, `HudScene`'i `launch` edip `bindHud` ile bağlar |
| `src/scenes/HudScene.ts` | Oyun HUD'ı kendi sahnesinde (kamera `DPR`): XP, sayaç, boss çubuğu, Data, envanter, hasar flaşı, debug satırı; `width` CSS piksel |
| `src/scenes/UpgradeScene.ts` | Seviye atlama katmanı: tek sütun satır kartlar, tür etiketi, yıldız ve rozet satırı, `guided` eğitim eli, Reroll düğmesi |
| `src/scenes/SlotScene.ts` | Slot makinesi katmanı: makaralar, kol, paralar, sonuç satırları |
| `src/scenes/SpotlightScene.ts` | Tek nokta dışını grileştiren eğitim katmanı |
| `src/scenes/MenuScene.ts` | Açılış ekranı: rozetler, logo, kahraman şeridi, PLAY, Müze ve Atölye, günlük görevler; kısa ekran düzenleri |
| `src/scenes/MuseumScene.ts`, `WorkshopScene.ts` | Silah açma ve kalıcı yükseltmeler: `addScreenHeader` + `ScrollList` satırları, Atölye'de sekmeler |
| `src/scenes/GameOverScene.ts` | Sonuç katmanı: istatistikler, rekor, Data, Restart, Menu, Workshop |
| `src/input/VirtualJoystick.ts` | Yüzen joystick, birim `direction`, duraklatmadan önce `reset()`; girdiyi GameScene'den okur, HUD sahnesine `DPR`'ye bölerek çizer |
| `src/entities/Player.ts` | Hareket, `radius`, `velocity` ve `turnRate`, değişken `stats` ve `hp` |
| `src/systems/SpatialHash.ts` | Bellek ayırmayan ızgara, her karede yeniden kurulur |
| `src/systems/EnemyManager.ts` | Düşman havuzu, hareket, ayrılma, temas, prop'lar, ertelenmiş ölüm (`removeDead`) |
| `src/systems/Spawner.ts` | Dalgalar, kota dolum bütçesi, uzatma, Botnet hatları, mini bosslar, geri dönüşüm; oyun saati burada |
| `src/systems/Arena.ts` | Boss kavgaları: duvar, sıra, can, boss döngüsü, oyuncuyu tutma ve yakma |
| `src/systems/BossBrain.ts` | Kavgadaki tek boss: yürüme, uyarı, saldırı, fazlar |
| `src/systems/DangerZones.ts` | Fitilden sonra patlayan havuzlu yer işaretleri |
| `src/systems/Breakables.ts` | Parça başına bilgisayar yerleştirir, ekrana yakınken havuza ekler, kırılanları hatırlar |
| `src/systems/Pickups.ts` | Havuzlu yer eşyaları ve etkileri; `dataFound` |
| `src/systems/GemManager.ts` | Gem havuzu, çekim, taşma, `attractAll` |
| `src/systems/Experience.ts` | Seviye ve XP durumu |
| `src/systems/Upgrades.ts` | Alınan seviyeler, slot sınırları, kart seçimi, slot makineleri için `spin` |
| `src/systems/Tutorial.ts` | İlk oyun eğitiminin adımları |
| `src/systems/ProjectileManager.ts` | Mermi havuzu, uçuş, patlamalar, düşman hash'iyle isabet testleri |
| `src/systems/Weapon.ts` | Bekleme süresi, hedefleme, her davranış için bir saldırı, `evolve` |
| `src/systems/Effects.ts` | Havuzlu patlama ve çizgi görselleri |
| `src/systems/EnemyBullets.ts` | Havuzlu düşman mermileri |
| `src/systems/Progress.ts`, `SaveData.ts` | Data, açılanlar, Atölye, günlük görevler, moda göre en iyi süre (`bestTimeFor`), seçili mod, eğitim bayrağı; kayıt |
| `src/systems/Scenery.ts` | Hash'ten parça başına hurda, görünen dünya dikdörtgenini alır; `hash` dışa verir |
| `src/ui/XpBar.ts`, `RunTimer.ts`, `BossBar.ts`, `InventoryBar.ts`, `DataCounter.ts` | HUD göstergeleri, `HudScene` içinde |
| `src/ui/HpBar.ts` | Oyuncunun altındaki dünya can çubuğu: renk kademesi, kırmızıda yanıp sönme, hasar izi; `update(hp, max, delta)` |
| `src/ui/HurtFlash.ts`, `HintBox.ts`, `Hand.ts` | Hasar parlaması, eğitim metin kutusu, eğitim eli (HUD sahnesinde) |
| `src/ui/Button.ts` | `DPR` ve `fitCamera`, renkler, piksel yazı, paneller, yıldız satırları, korumalı düğme (`primary`, `inlineIcon`, dokunma payı), Data rozeti, ekran başlığı, koyu zemin |
| `src/ui/ScrollList.ts` | Parmakla kaydırılan maskeli liste, atalet, kayarken dokunuş kalkanı ve kaydırma çubuğu; `destroy()` şart |
| `src/data/characters.ts` | 19 karakter (id = başlangıç silahının id'si), imza özellikleri, skin adları, görev eşiği, Gem fiyatı |
| `src/art/characters.ts` | Karakter kareleri ve skin paletleri, `characterFrame`/`characterFrames` adları |
| `src/scenes/CharactersScene.ts`, `CharacterScene.ts` | Karakter ızgarası; tek karakter sayfası (platform, skin döngüsü, panel) |
| `src/ui/Pedestal.ts` | Karakterlerin durduğu basamaklı piksel platform |
| `src/data/difficulty.ts` | Normal ve zor mod çarpanları, `HARD_UNLOCK_SECONDS`; Spawner, Arena ve GameScene'in Data çarpanı buradan okur |
| `src/data/*.ts` | Oyuncu değerleri, düşmanlar, silahlar, yükseltmeler, dalgalar, bosslar, mini bosslar, slotlar, düşenler, gem'ler, seviye eğrisi, geri dönüş döngüsü için `meta.ts` |
| `src/art/` | Görseller, yazı tipi, palet, `slotMachine.ts`; `loadArt` atlası `MenuScene` içinden bir kez kurar |
| `src/textures.ts` | Üretilen disk, çizgi, vignette, spot ve menü nokta dokuları |
| `tools/balance-sim/` | Ekransız simülatör, oyun derlemesinin parçası değil: `game.js` bir oyun, `human.js` insan gibi bot, `career.js` oyun kariyeri ve ekonomi, `legacy.js` eski dalga tabloları, `tweaks.js` aday değişiklikler, `report.js` komut satırı |

`GameScene.update` kare sırası: girdi → eğitim beklemesi → oyuncu → eğitim → arena (hasar döndürür) → can çubuğu konumu → spawner ve zamanlayıcı (kavga veya eğitim sırasında atlanır) ya da boss çubuğu → düşmanlar (hash'i kurar, temas hasarı) → düşman mermileri → can yenileme, can, hasar parlaması, ölüm kontrolü → silahlar → mermiler → efektler → `removeDead` → eşyalar → Data sayacı → bilgisayarlar → gem'ler → XP ve seviye atlama → kamera, zemin, manzara. Düşman indeksleri yalnızca `removeDead` öncesine kadar sabittir; `breakables.update` havuza ekleyip çıkardığı için ondan sonra çalışır.

Katmanlar `GameScene` sahnesini `scene.pause()` ile duraklatır ve önce joystick'i sıfırlar, çünkü duraklatılmış sahne `pointerup` almaz. HUD ayrı sahnede çizildiği için duraklamadan etkilenmez; katmanlar (kartlar, slot, spotlight, oyun sonu) HUD'dan sonra `launch` edildiği için üstte kalır.

Koordinat sistemleri: tuval cihaz pikselidir; arayüz sahneleri `fitCamera` ile CSS pikselinde yerleşir (`scale.width / DPR`); dünya kamerasının zoom'u `worldZoom`; dünyadan ekrana çevirme `(x - viewX) * cam.zoom / DPR` (spotlight).

## Bilerek ertelenenler

- Yoğun gruplarda kalabalık titremesi: Çakışmanın kare başına yalnızca bir kısmını çöz. Gerçek yoğunluklarla tekrar bak.
- Yatay telefon düzeni: tek sütun düzenler dikey içindir, yatayda kartlar ve menü sıkışır; yön kilidi paketleme işinde.
- `ScrollList`'te kenarda geri sekme yok (atalet 2026-11-06'da geldi); kullanıcı isterse eklenir.
- Phaser 4 var; kararla 3.90'da kaldık.

## Açık sorular

- 450+ düşmanla gerçek telefonda FPS.
- Ses: ne zaman ve nasıl.
- İlerlemeyi yeni telefona taşıma (kullanıcı çok sonranın işi olduğunu söyledi).
- Zor mod simülasyonla ayarlandı ama kullanıcı oynamadı; boss x2 ona göre değişebilir. Karakter görevlerinin sayıları yazılmadı (İş 4).
- Zor mod seçicisi menüye 52 piksel ekledi; kısa telefonlarda görev paneli dibe taşabilir.
- Liste ataletinin mesafesi (`FLING_DECAY_MS` 325) telefonda denenmedi.
- Menü Characters düğmesiyle bir satır daha uzadı; kısa ekranlarda görev paneli taşabilir. Characters ve karakter sayfası oyunda görülmedi.
- Karakter imza özellikleri ölçülmedi.
- Doğum halkasının 513'ten 720'ye çıkması erken dakikaları kolaylaştırdı mı? Kullanıcı oynayınca söyleyecek; gerekirse kotalar artar.
- Menü ve Müze'nin yeni halleri telefonda görülmedi; 640 yüksekliğindeki telefonlarda görev paneli üç uzun görevle dibe sığmayabilir.
- 10:00 bossu duvar kalsın mı? Kullanıcı 2026-11-05'te boss eğrisini bilerek eski halinde bıraktı; ölçüm maks build dışında herkesin orada öldüğünü söylüyor. Kullanıcı açmadıkça tekrar önerme, açarsa `bossSoft` sayıları "Ölçüm"de.
- Telefonda cihaz çözünürlüğündeki tuvalin (DPR 3'te 1125x2436) kare hızı; `MAX_DPR` 3, zorlanırsa 2.

## Çalışma anlaşması

- **Yalnızca Türkçe**, sade yanıt ver; kullanıcı İngilizce yanıtları takip edemiyor. Kod, kod yorumları ve commit mesajları İngilizce olur, bu dosya Türkçe kalır.
- Doğrudan ol. Yanlış bir şey varsa söyle, zayıf fikirlere katılmak yerine bunu belirt.
- **Her işin planını o işten hemen önce sun ve kullanıcının düzeltmelerini bekle.** Tasarımı sık sık değiştirir, bir onay sonraki işleri kapsamaz. Küçük doğrudan istekler hemen yapılabilir.
- Onaylanan yaklaşım çalışmazsa dur ve bildir, sessizce başka yola geçme. Slot geri dönüş kuralında bu oldu.
- Bütün görsel testleri kullanıcı yapar: tarayıcı veya görsel test çalıştırma. Ekranda neyin görülmediğini açıkça söyle. Bir simülasyon sayısını oyuncunun yaşayacağı şey gibi sunma.
- Tasarım önerisini PNG mockup olarak ver, oyunun gerçek fontu ve sprite'larıyla ("Test ipuçları"); kullanıcı yapılamayacak şey görmek istemiyor, mockup'ta ne varsa Phaser'da birebir yapılır.
- Kullanıcı bir değişikliği beğenmezse ("çok kalın, kötü") tartışmadan geri al veya küçült; sayıları sorup ona bırak.
- `npx tsc --noEmit` ile doğrula. İstenmedikçe bot simülasyonu yok, "Denge ölçümü" bölümüne bak; İş 2 için izin var. Değişikliklerden sonra dev sunucusunun yeni kodu sunduğunu kontrol et.
- Yalnızca istenince commit ve push yap. İstenince: `npm run build`, doğrudan `main` üzerinde commit (Co-Authored-By satırıyla), `git push origin main`, orada dur. Push'u sen teklif etme, kullanıcı ister.
- Kullanıcı paralel ajanlara izin verdi; bağımsız modülleri ajana ver, tasarım ağırlıklı işi kendin yap, ajanların dosyalarıyla seninkiler çakışmasın.
- Değişiklikleri küçük tut, sormadan yeni bağımlılık ekleme, istenmedikçe doküman dosyası oluşturma.
