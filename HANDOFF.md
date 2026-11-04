# Handoff — Computer Survivor

Son güncelleme: 2026-11-01. Teknoloji ve mimari kuralları için önce `CLAUDE.md` dosyasını oku. Bu dosya güncel durumu, şimdiye kadar alınan bütün kararları ve kalan bütün işleri içerir.

Kullanıcı Türkçe yazar ve **yalnızca Türkçe**, sade yanıt almalıdır. Kod, kod yorumları ve commit mesajları İngilizce kalır; bu dosya kullanıcının isteğiyle Türkçedir. Bir şey yapmadan önce sondaki "Çalışma anlaşması" bölümüne bak.

## Neredeyiz

Aşağıdaki her şey commit edildi ve Vercel'in yayınladığı `main` dalına gönderildi. `playtest-feedback-fixes` dalı artık `main`'in gerisinde.

Oyun **sonsuz** bir survivors-like: bir oyun yalnızca ölünce biter. İlk oyuna özel eğitim, 20 boss, mini bosslar, slot makineleri, kırılabilir bilgisayarlar, 19 silah ve üç renk XP gem'i var.

**Sıradaki iş Atölye (Workshop)** (aşağıda İş 1). Önce planını kısaca göster ve kullanıcının onayını al, çünkü kuralı her işin planının o işten hemen önce sunulmasıdır. Dalga zorluğu 2026-11-01'de düşürüldü ve kullanıcı bunu oynayarak test ediyor, sonucu "Zorluk karşılaştırması" bölümünü değiştirebilir.

Oyun tasarım dokümanı https://claude.ai/artifact/8yApVH6VuMDwYmPwAqVosy adresinde (Türkçe, docs araçlarıyla okunur). Sonsuz oyun, bosslar, slotlar ve düşenlerden önce yazıldı, bu yüzden farklı oldukları yerde `src/data/*.ts` ve bu dosya geçerlidir.

## Kalan işler, sırayla

### İş 1: Atölye

Kullanıcı sonsuz oyunun çok daha fazla içeriğe ihtiyacı olduğu konusunda kesindi: "kesinlikle artması gerekiyor, çok fazla". Bosslar ve silahlar bitti, geriye şunlar kaldı:
- **Atölye:** 5 yükseltmeden yaklaşık 15-20'ye çıkacak, her birinin seviyesi de artacak. Şu an çok sığ: Atölye'nin tamamı 6.000 Data ediyor, oysa temel fikir oyuncunun kendini geliştirmeden ilerleyememesi. Müze'nin toplamı artık 16.300 Data.
- Yeni pasifler yalnızca gerekirse eklenecek. Evrimler şu an pasifleri paylaşıyor (`magnet` bir evrimde, çoğu iki evrimde kullanılıyor).

### İş 2: Ekonomi ve son denge

Her şey burada tek seferde, kullanıcının oyunlarına bakarak ayarlanacak. Simülasyon yalnızca kullanıcı isterse kullanılır. Fiyatlar en sona kalıyor ve oyuncuyu gerçekten zorlamalı. "Güncel sayılar" bölümündeki her şey bu işe kadar geçicidir.

Claude'un önerdiği, ayrıntıları henüz onaylanmamış süre hedefleri (oyun sayıları öneridir):

| Oyuncu | Hedef |
|---|---|
| İlk oyunlar | 6-7 dakika, iyi oyuncu için bile |
| Yaklaşık 10 oyundan sonra | 9-10 dakika |
| Yaklaşık 30 oyundan sonra | 13-15 dakika |
| Atölye büyük ölçüde dolu | 20+ dakika |

Kullanıcıdan gelen son gerçek veri: 3-4 Atölye yıldızlı hesapta 8+ dakika, yeni oyuncu için tahminen en fazla 3-5 dakika. Bu hedefe yakın olduğu için bir şey değiştirilmedi.

### Bilerek sonraya bırakılanlar

- **Telefon performansı:** Kullanıcı sonra bakacak. Geç oyunda 450 düşmana çıkılıyor ve bu gerçek telefonda ölçülmedi.
- **Debug yazıları (FPS, ENEMIES, KILLS):** Test sürdüğü müddetçe kalacak. Kullanıcı kaldırılmasının çok uzak olduğunu söyledi, istenmeden kaldırma.
- **Ses:** Henüz yok.
- **Mobil paketleme:** Capacitor, gerçek telefon testi, safe-area, yön kilidi, kaydı `localStorage` dışına taşıma.
- **Ödüllü reklamlar:** Tasarlandı, yapılmadı (oyun başına bir kez dirilme, sonuç ekranında Data'yı ikiye katlama).
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
- 19 silah; Cassette Tape, kullanıcı deneyip beğenmeyince çıkarıldı. Yeniler: CD-ROM, Trackball, Fax Machine, Robot Vacuum, Flatbed Scanner, Ethernet Cable, Pager, Pocket Calculator, Boombox, her birinin evrimi var. Müze sayfalara bölündü.
- Bütün silahların gerçek dalgalarda dengelenmesi. Kullanıcı CRT'nin fazla büyüdüğünü söyleyince CRT ve Degausser küçültüldü, Widescreen seviye başına +%6'ya indi.
- Dalga zorluğu düşürüldü, çünkü kullanıcı 5:00'ten sonra kalabalığın çok arttığını, 7:00'den sonra hiçbir şeyin kesilemediğini söyledi. Kotalar ve can çarpanları azaldı, 7. dakika Worm ağırlıklı olmaktan çıktı, aralıklı doğuma tavan geldi. Kullanıcının isteğiyle 5. dakikanın karışımına dokunulmadı.

## Güncel sayılar (hepsi `src/data` içinde, hepsi geçici)

- **Dalgalar (`waves.ts`):** Dakikaya göre kotalar 20, 40, 60, 85, 110, 135, 160, 185, 210, 240. Can çarpanları 1, 1.1, 1.3, 1.5, 1.8, 2.1, 2.4, 2.8, 3.2, 3.6. Aralıklar 0.7, 0.45, 0.2, 0.3, 0.2, 0.2, 0.12, 0.25, 0.14, 0.1. Aralıklı doğanlar kotanın üstüne birikir, ama canlı sayısı kotanın `CROWD_OVERFLOW` (1.25) katını veya 450'yi geçince durur. Kota dolumları tavandan etkilenmez.
- **Kolay başlangıç:** İlk 15 saniyede doğan her şeyin canı 1'dir.
- **Uzatma (son dalgadan sonra, her tam dakikada):** 450'ye kadar +40 kota, +%6 can, +%4 temas hasarı. Kullanıcı zorluğun sayıdan gelmesini, can ve hasarın az artmasını istiyor. 450 sınırı telefonlar içindir.
- **XP (`progression.ts`):** `5 + 6(L-1) + L²/2`. Elle ayarlanmış daha hızlı ilk seviyeler denendi, evrimi çok erkene çektiği için kullanıcı iptal etti.
- **Gem'ler (`gems.ts`):** Mavi x1, yeşil x2, mor x4. Worm %30 yeşil, Pop-Up %40, Phisher %40 ve %10 mor, Adware %30, Trojan %50 ve %30 mor. Normal düşmanlardan mor 6:00'da başlar. Mini bosslar yeşil veya mor düşürür, mor %10'dan başlar ve dakikada +%10 artar. Bosslar her zaman mor düşürür, 30 x 4 = 120 XP.
- **Bosslar (`bosses.ts`):** 8 grupta 20 boss. Her gruptan rastgele bir boss, 2:30'dan 20:00'ye kadar 2:30'da bir. Sonra gruplar baştan başlar ve bir önceki turda gönderdikleri boss'u göndermezler. Can = 3000 x 1.7^sıra x `hpMult`, yani 20:00'de yaklaşık 246.000, bu hiç test edilmedi. Saldırı hasarı tur başına x1.5. Duvar 25 DPS; RANSOMWARE'inki saniyede 3 pikselle 320'den 180'e kapanır. Öldürünce 50 can gelir ve her zaman slot makinesi düşer.
- **Mini bosslar (`miniBosses.ts`):** 1:00'den itibaren 60 saniyede bir, boss anlarını atlayarak (5:00, 10:00). 1.5 kat boyut, mor kenar, 5 kat XP. Önce Bug, 2:00'den Worm, 4:00'ten Phisher, 6:00'dan Trojan. Can = 60 x (t/30)^1.6.
- **Slotlar (`slots.ts`):** Mini bosslar %40 ihtimalle düşürür. 2 ve 3 yükseltme ihtimali: mini boss %7 ve %1, boss %16 ve %4. Slot yalnızca sahip olunanı yükseltir, %20 silah ve %80 pasif. Pasif yoksa %80'lik kısım yerine 30 can verir, çünkü silaha düşmek tek silaha yığılmayı ödüllendirip evrimi 3:04'e çekiyordu. Pasifler dolunca silahlara geçer. Slotlar evrim yapmaz.
- **Bilgisayarlar (`drops.ts`, `Breakables.ts`):** 640x640'lık parça başına %20 ihtimal (kullanıcı iki kez azaltılmasını istedi), en az 320 piksel arayla, 30 can, her zaman en az 2 vuruş. Düşenler: Can 25 (%35), 5 Data (%35), 15 Data (%15), 40 Data (%4), Magnet (%7), Nuke (%4).
- **Repair kartı:** 10 can (eskiden 30'du, tekrarlanan kartlar bir oyunda yaklaşık 800 can veriyordu).
- **Ödüller (`meta.ts`):** 10 öldürme başına 1 Data, dakika başına 5, boss başına 30, milestone boss başına 100, ilk evrim başına 100. `runData` sayacın, ödülün ve simülatörün ortak formülüdür.

## Zorluk karşılaştırması (2026-11-01)

Yalnızca veri dosyalarından hesaplandı, oyunda ölçülmedi. Sahadaki toplam can (kota x ortalama can) dakikaya göre: 3:00'te 2.444, 4:00'te 3.086, 5:00'te 7.088, 6:00'da 4.267, 7:00'de 13.380, 8:00'de 16.680, 9:00'da 22.378, 10:00'da yaklaşık 27.700, 15:00'te yaklaşık 57.000. 7:00'den önceki eski değer 43.500'dü.

Vampire Survivors'ın Mad Forest haritasıyla (vampire.survivors.wiki) kıyas:
- Bizim normal silahlarımız onlarınkine yakın: Cursor 1. seviyede 11,4, son seviyede 133 DPS; Magic Wand 8,3 ve 120. Evrimli tarafta Holy Wand 240, Auto-Clicker 93 DPS, yani orada gerideyiz.
- VS'nin bilinen dakikalarıyla kıyaslayınca, silah gücü hesaba katılmış halde bizim oyun ortalama 7-8 kat ağır. Kalan farkı VS'nin canı bulunamayan dakikalar, alan silahları ve 6 silah yuvası etkiler, kesin sayı gibi kullanma.
- VS'de normal modda genel can çarpanı yok, kota iniş çıkışlı (100, 30, 10, 300, 20), 300 canlıda normal doğum duruyor ve 300'lük dakikada düşmanlar 15 canlı. Bizde sayı, can çarpanı ve düşman türü aynı anda ve hep yukarı gidiyor.
- Bizde temas hasarı birikir ve dokunulmazlık yoktur, 8 Worm oyuncuyu 1,25 saniyede öldürür. VS'de 240 ms dokunulmazlık var, wiki bunun temas hasarına uygulandığını açıkça söylemiyor.

Testten sonra bakılacaklar: 5. dakikadaki Trojan oranı (önerilen karışım 24 Bug, 1 Trojan, 2 Pop-Up), nefes aldıran iniş çıkışlı kotalar, evrimli silah gücü, 10:00 sonrası 450 düşman.

## Denge ölçümü

**Kullanıcı istemedikçe bot simülasyonu çalıştırmak için her zaman sor.** 2026-10-31'de kullanıcı birini durdurdu ve simülasyonların çok uzun sürdüğünü, bütün token'ları bitirdiğini söyledi. Değişikliği yap, ölçülmediğini söyle ve oynayarak değerlendirmesine bırak. Gerçek denge işi için izin veriyor, 2026-11-01'de silahlar için verdiği gibi.

`npm run sim -- <runs> <sections>`, örneğin `npm run sim -- 8 new,maxed`. Bölümler: `still`, `solo`, `build`, `random`, `late`, `new`, `maxed`, `boss`, `weapons`. `tools/balance-sim/game.js`, `GameScene.update` kare sırasını kopyalar, ikisini uyumlu tut.

Yeni hesaptaki bot artık ilk boss kavgasında ölüyor, bu yüzden sonraki bosslara yalnızca `boss` bölümü ulaşır: ölümsüz `circle` botu sabit daireler çizer ve kavga başına boss saldırı hasarını raporlar. Yana kayan botun sayıları sürü temasına boğulur, boss değerlendiremez. Son `boss` ölçümü ileri nişan sınırından ve rastgele havuzdan öncedir, sayıları artık geçerli değil.

`npm run sim -- 3 weapons <clock> [ids]` her silah halini tek başına dalgaların bir noktasına koyar, dakikada öldürme, temas hasarı ve boss hasarını raporlar. Birinci ve son seviyeyi 300'de, evrimleri 600'de oku. **Silahları asla küçük sabit hedef kümesinde karşılaştırma:** alan silahları düşman sayısıyla güçlenir, 24 hedefli bir kontrol birinci seviye silahların evrimlileri geçtiğini gizlemişti. Birinci seviye alan silahlarının 600'de yüksek görünmesi yalnızca ölümsüz botun kalabalığa gömülmesindendir. Printer'ın boss hasarının 0 çıkması silahtan değil, botun baktığı yöndendir. 5:00'teki son aralıklar: birinci seviye en fazla yaklaşık 60, son seviye 44-487, evrimli 228-780; 10:00'da evrimli en fazla yaklaşık 1.040.

**Bot sürelerini asla oyuncunun ulaşacağı süre gibi sunma.** Bot bossları kovalamaz, gerçekten kaçamaz (bunun yerine kaçınılabilir hasarın %40'ını alır) ve çok daha zayıftır: yeni hesapta ortalaması yaklaşık 5 dakikayken kullanıcı yükseltmesiz, bilerek ölerek 12:56'ya ulaştı ve botun 276'sına karşı yaklaşık 1.800 DPS yaptı. Botu seçenekleri karşılaştırmak için kullan. Güç eğrileri için ölümsüz bot (`damageTaken: 0`) kullan. Boss canını kullanıcının gerçek kavgalarına göre ayarla.

Son ölümsüz bot, Cursor odaklı, yeni hesap, mor boss gem'lerinden önce: 1:00'de seviye 3, 2:00'de 6, 3:00'te 10, 5:00'te 12, 10:00'da 27, ilk evrim yaklaşık 5:00. Hedef, 2:30 boss'undan önce evrim olmamasıdır.

Geçici bir ölçüm için gerçek kod Vite ile repo dışında paketlenip prototipler yamalanabilir (`Arena.prototype.start`, `Upgrades.prototype.spin`, ...). `Arena.update` yamasının değerini döndürmesi gerekir.

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
- **Temas hasarı:** Saniye başına, değen her düşman için toplanır, dokunulmazlık karesi yok.
- **Kartlar ve katmanlar:** Seçim yalnızca basış aynı kartta başlayıp bitiyorsa sayılır. Katman açıldıktan sonraki 0,4 saniye dokunuşlar yok sayılır, çünkü parmak genelde joystick üzerindedir.
- **Boss arenası:** Oyuncunun etrafında halka kapanır, dışarıdaki düşmanlar gem veya öldürme vermeden yok olur, kavga boyunca dalgalar ve oyun saati durur.
- **Evrim:** Son seviyede silah ve herhangi bir seviyede eşi olan pasif gerekir; bir sonraki seviye atlamada altın kart olarak çıkar.
- **Brick Phone:** Sahte 3B yayla atılır. **Magnet pasifi:** Seviye başına +%5, bilerek zayıf.

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

## Test ipuçları

- Maks build testi: `?perfect` adresi Play'e basınca 8:00'den, 30. seviyede, 4 evrimli silah ve 4 maks pasifle başlar. 7:30'a kadarki bosslar geçilmiş sayılır, eğitim çıkmaz, hiçbir şey kaydedilmez. Ayarlar `upgrades.ts` içinde `PERFECT_TEST`.
- Stres testi: Geçici olarak ilk dalganın `minimum` değerini `500` yap. Commit'ten önce geri al.
- Geç dalgalar: `src/systems/Spawner.ts` içinde `elapsed` değerini geçici olarak örneğin `8 * 60` başlat, `nextMiniBoss` değerini de buna uydur.
- Bosslar: `elapsed` değerini boss anından birkaç saniye önce başlat (örneğin `145`). Daha sonraki boss için `src/systems/Arena.ts` içindeki `bossesStarted` değerini de başlat.
- Hızlı seviye atlama: Geçici olarak `xpToNext` değerini düşür.
- Tek silah deneme: Oyunu `?weapon=usbStick` ile aç, silah Cursor'ın yanına eklenir. Evrimli adlar da çalışır.
- Bütün bossları görme: Oyunu `?bosstest` ile aç. Sırayla 400 canla gelirler, oyuncunun 100.000 canı olur. Burada kazanılan Data kayda geçer.
- Eğitimi tekrar oynama: Oyunu gizli pencerede aç veya `localStorage` içinden `computer-survivor-save` kaydını sil.
- Kullanıcının bir görseli değerlendirmesi için gerçek sahneyi jsDelivr'den gelen Phaser ile çalıştıran geçici bir Artifact sayfası yayınla, dosyalarını scratchpad'de tut ve kararından sonra sil. Bu slot makinesinde işe yaradı.

## Kod haritası

| Dosya | Görevi |
|---|---|
| `src/main.ts` | Phaser ayarları (`RESIZE`), sahne listesi |
| `src/scenes/GameScene.ts` | Her şeyi bağlar; kare sırası burada |
| `src/scenes/UpgradeScene.ts` | Seviye atlama katmanı; `guided` eğitim elini ekler |
| `src/scenes/SlotScene.ts` | Slot makinesi katmanı: makaralar, kol, paralar, sonuç satırları |
| `src/scenes/SpotlightScene.ts` | Tek nokta dışını grileştiren eğitim katmanı |
| `src/scenes/MenuScene.ts` | Açılış ekranı: Play, Müze, Atölye, günlük görevler, en iyi süre |
| `src/scenes/MuseumScene.ts`, `WorkshopScene.ts` | Silah açma ve kalıcı yükseltmeler |
| `src/scenes/GameOverScene.ts` | Sonuç katmanı: istatistikler, rekor, Data, Restart, Menu, Workshop |
| `src/input/VirtualJoystick.ts` | Yüzen joystick, birim `direction`, duraklatmadan önce `reset()` |
| `src/entities/Player.ts` | Hareket, `radius`, `velocity` ve `turnRate`, değişken `stats` ve `hp` |
| `src/systems/SpatialHash.ts` | Bellek ayırmayan ızgara, her karede yeniden kurulur |
| `src/systems/EnemyManager.ts` | Düşman havuzu, hareket, ayrılma, temas, prop'lar, ertelenmiş ölüm (`removeDead`) |
| `src/systems/Spawner.ts` | Dalgalar, uzatma, Botnet hatları, mini bosslar, geri dönüşüm; oyun saati burada |
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
| `src/systems/Progress.ts`, `SaveData.ts` | Data, açılanlar, Atölye, günlük görevler, en iyi süre, eğitim bayrağı; kayıt |
| `src/systems/Scenery.ts` | Hash'ten parça başına hurda; `hash` dışa verir |
| `src/ui/XpBar.ts`, `HpBar.ts`, `RunTimer.ts`, `BossBar.ts`, `InventoryBar.ts`, `DataCounter.ts` | Arayüz göstergeleri |
| `src/ui/HurtFlash.ts`, `HintBox.ts`, `Hand.ts` | Hasar parlaması, eğitim metin kutusu, eğitim eli |
| `src/ui/Button.ts` | Piksel yazı, paneller, yıldızlar, korumalı düğme, ızgara düzeni, arayüz renkleri |
| `src/data/*.ts` | Oyuncu değerleri, düşmanlar, silahlar, yükseltmeler, dalgalar, bosslar, mini bosslar, slotlar, düşenler, gem'ler, seviye eğrisi, geri dönüş döngüsü için `meta.ts` |
| `src/art/` | Görseller, yazı tipi, palet, `slotMachine.ts`; `loadArt` atlası `MenuScene` içinden bir kez kurar |
| `src/textures.ts` | Üretilen disk, çizgi, vignette ve spot dokuları |
| `tools/balance-sim/` | Ekransız simülatör, oyun derlemesinin parçası değil |

`GameScene.update` kare sırası: girdi → eğitim beklemesi → oyuncu → eğitim → arena (hasar döndürür) → can çubuğu konumu → spawner ve zamanlayıcı (kavga veya eğitim sırasında atlanır) ya da boss çubuğu → düşmanlar (hash'i kurar, temas hasarı) → düşman mermileri → can yenileme, can, hasar parlaması, ölüm kontrolü → silahlar → mermiler → efektler → `removeDead` → eşyalar → Data sayacı → bilgisayarlar → gem'ler → XP ve seviye atlama → kamera, zemin, manzara. Düşman indeksleri yalnızca `removeDead` öncesine kadar sabittir; `breakables.update` havuza ekleyip çıkardığı için ondan sonra çalışır.

Katmanlar `GameScene` sahnesini `scene.pause()` ile duraklatır ve önce joystick'i sıfırlar, çünkü duraklatılmış sahne `pointerup` almaz.

## Bilerek ertelenenler

- Yoğun gruplarda kalabalık titremesi: Çakışmanın kare başına yalnızca bir kısmını çöz. Gerçek yoğunluklarla tekrar bak.
- Yüksek DPR ekranlarda bulanık görüntü (Phaser 3 CSS pikseliyle çizer).
- Phaser 4 var; kararla 3.90'da kaldık.

## Açık sorular

- 450+ düşmanla gerçek telefonda FPS.
- Ses: ne zaman ve nasıl.
- Farklı oyuncu karakterleri (kullanıcı şu an önemli olmadığını söyledi).
- İlerlemeyi yeni telefona taşıma (kullanıcı çok sonranın işi olduğunu söyledi).

## Çalışma anlaşması

- **Yalnızca Türkçe**, sade yanıt ver; kullanıcı İngilizce yanıtları takip edemiyor. Kod, kod yorumları ve commit mesajları İngilizce olur, bu dosya Türkçe kalır.
- Doğrudan ol. Yanlış bir şey varsa söyle, zayıf fikirlere katılmak yerine bunu belirt.
- **Her işin planını o işten hemen önce sun ve kullanıcının düzeltmelerini bekle.** Tasarımı sık sık değiştirir, bir onay sonraki işleri kapsamaz. Küçük doğrudan istekler hemen yapılabilir.
- Onaylanan yaklaşım çalışmazsa dur ve bildir, sessizce başka yola geçme. Slot geri dönüş kuralında bu oldu.
- Bütün görsel testleri kullanıcı yapar: tarayıcı veya görsel test çalıştırma. Ekranda neyin görülmediğini açıkça söyle. Bir simülasyon sayısını oyuncunun yaşayacağı şey gibi sunma.
- `npx tsc --noEmit` ile doğrula. İstenmedikçe bot simülasyonu yok, "Denge ölçümü" bölümüne bak. Değişikliklerden sonra dev sunucusunun yeni kodu sunduğunu kontrol et.
- Yalnızca istenince commit ve push yap. İstenince: `npm run build`, `playtest-feedback-fixes` dalında commit, `git merge --ff-only` ile `main` ileri al, `git push origin main`, orada dur.
- Değişiklikleri küçük tut, sormadan yeni bağımlılık ekleme, istenmedikçe doküman dosyası oluşturma.
