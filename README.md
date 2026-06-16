# NextReach — Web Chatbot İletişim Agent'ı

Landing page'deki "Bize Ulaşın" formunu, ziyaretçiyle konuşarak ihtiyacını anlayan ve satış
ekibi için kullanılabilir bir iletişim talebi oluşturan bir chatbot ile değiştiren proje.

**Canlı önizleme:** https://nextreach-gilt.vercel.app/

**Geliştirme:** Bu proje [Claude Code] ile geliştirilmiştir.

**Toplam harcanan süre:** 4 saat 10 dakika
-Çalışma saatleri: 10:00 - 13:30
-Çalışma saatleri: 15:00 - 15:40

## Nasıl çalıştırılır (lokalde)

1. Bağımlılıkları kur:

   ```bash
   npm install
   ```

2. `.env.example` dosyasını `.env` olarak kopyala ve doldur:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL`: bir Postgres bağlantı dizesi (Neon, Supabase ya da lokal bir Postgres).
     Lokalde hızlıca denemek için Docker ile birlikte gelen `docker-compose.yml` kullanılabilir:
     `docker compose up -d` -- `.env.example`'daki `DATABASE_URL` zaten bu container'a işaret eder.
   - `ANTHROPIC_API_KEY`: https://console.anthropic.com üzerinden alınan bir API key.
   - `ADMIN_SECRET`: `/admin` panel girişi için seçtiğin bir parola.

3. Veritabanı şemasını uygula:

   ```bash
   npx prisma migrate dev
   ```

4. Geliştirme sunucusunu başlat:

   ```bash
   npm run dev
   ```

   - Landing page: http://localhost:3000
   - Admin view: http://localhost:3000/admin (girişte `ADMIN_SECRET` değerini parola olarak gir)

## Hangi teknolojiler ve neden

- **Next.js (App Router) + TypeScript** — Frontend, chatbot API'si ve admin view'i tek bir
  projede, tek bir deploy ile (Vercel) yönetebilmek için. 6 saatlik bir kapsamda ayrı bir
  backend servisi kurmanın getirisi yoktu.
- **Tailwind CSS** — Hızlı ve tutarlı bir arayüz için; özel bir tasarım sistemine zaman
  ayırmak bu kapsamda öncelik değildi.
- **PostgreSQL + Prisma** — Tip güvenli veritabanı erişimi için Prisma, veritabanı için ise
  Postgres seçildi: Vercel gibi serverless ortamlarda dosya tabanlı bir DB (SQLite) kalıcı
  değil, bu yüzden hosted bir Postgres (Neon/Supabase) gerekiyordu. Lokal geliştirme için
  ayrıca bir `docker-compose.yml` ekledim, böylece hosted bir DB'ye ihtiyaç olmadan da
  çalıştırılabiliyor.
- **Anthropic Claude (`claude-haiku-4-5`) + tool use** — Konuşmanın akışını yönetmek,
  ziyaretçinin "yeter" olup olmadığına karar vermek ve yapılandırılmış bir lead özeti
  çıkarmak tek bir mekanizmaya (tool calling) oturdu: model, yeterli bilgiyi topladığında
  `submit_lead` adlı bir fonksiyonu yapılandırılmış argümanlarla çağırıyor, biz de bunu
  doğrulayıp veritabanına yazıyoruz. Haiku modeli, bu görevin gecikme/maliyet ihtiyaçları
  için yeterli güçte ve hızlı.
- **Zod** — Hem `/api/chat` isteklerini hem de modelin `submit_lead` çağrısının
  argümanlarını çalışma zamanında doğrulamak için.

## PRD'de muğlak bırakılan noktalar ve yorumlarım

- **Chatbot ne soracak, hangi sırada, ne zaman "yeter" diyecek?** Sistem promptu (bkz.
  `src/lib/chat.ts`) sıralı bir hedef listesi tanımlıyor: (1) ulaşma sebebi (karşılama
  ekranındaki Fiyat bilgisi/Demo talebi/Ürün hakkında bilgi/Diğer butonlarından gelebilir),
  (2) şirket, (3) analitik tarafında çözülmek istenen şey, (4) aylık ziyaretçi sayısı
  (quick-reply butonlarıyla), (5) e-posta, (6) opsiyonel ek not. Model bunları doğal bir
  sohbet akışında, tek mesajda tek soru sorarak topluyor; opsiyonel alanlarda "Atla"
  seçeneği sunabiliyor. Ziyaretçi bir maddeyi cevaplamak istemezse ısrar etmiyor, o alanı
  boş/UNKNOWN bırakıp listede ilerliyor. "Yeter" kararını model kendisi veriyor: listedeki
  6 maddenin hepsi ele alındığında (cevaplanmış ya da bilerek atlanmış) `submit_lead`'i
  çağırıp görüşmeyi sonlandırıyor — **e-posta olmadan lead açılmıyor**, çünkü satış ekibi
  onsuz geri dönüş yapamaz; e-posta verilmezse bir kez daha sorup hâlâ alamazsa
  `submit_lead` çağırmadan nazikçe kapatıyor. Sohbet 10 ziyaretçi turunu geçerse sisteme ek
  bir talimat ekleniyor ("elindekiyle kapat"), 50 mesajı geçerse istek tamamen reddediliyor
  — sohbetin sonsuza kadar uzamasını istemedim.
- **Ton ve kişilik.** Asistana "Reach" adını verdim: sıcak, kısa cümleler kuran, emoji
  kullanmayan, abartılı satış dili kullanmayan bir karakter. Amaç, PRD'deki "form çok
  soğuk" şikayetini çözerken NextReach'i hala profesyonel bir B2B SaaS olarak temsil
  etmekti.
- **İyi lead'i kötüsünden nasıl ayırt eder satış ekibi?** Model her görüşmenin sonunda
  `quality` (LOW/MEDIUM/HIGH) ve bunun tek cümlelik gerekçesini (`qualityNote`)
  üretiyor; `urgency` ayrı bir sinyal olarak tutuluyor. Bunların üzerine, satış ekibinin
  ilk önce hangi lead'e dönmesi gerektiğini tek bakışta görebilmesi için deterministik bir
  lead-score formülü ekledim (`src/lib/leadScore.ts`): kurumsal e-posta +20, demo talebi
  +20, 100K+ aylık trafik +30, yüksek kalite +20, şüpheli/spam işaretli ise -20 (0-100
  arasına sıkıştırılır, 70+ Hot / 40-69 Warm / altı Cold). Skor kasıtlı olarak veritabanına
  yazılmıyor -- mevcut alanlardan (`email`, `intent`, `monthlyVisitors`, `quality`,
  `flagged`) her render'da türetiliyor, böylece formül değişse bile eski lead'ler donup
  kalmıyor. Admin view'de bunlar rozet olarak öne çıkıyor, liste skora göre sıralanıyor,
  talep listesi bunlara göre taranabiliyor.
- **Admin view'de hangi bilgi nasıl gösterilir?** Sol tarafta talep listesi (isim/şirket,
  ulaşma sebebi özeti, aciliyet/kalite rozetleri, tarih), sağda seçilen talebin tam
  detayı: iletişim bilgileri, AI'ın kalite gerekçesi, durum güncelleme butonları (Yeni /
  İletişime geçildi / Kapatıldı) ve görüşmenin tam dökümü. Amaç, ekibin transkripti
  okumadan da rozetlerle hızlıca önceliklendirebilmesi, gerektiğinde de tam bağlama
  inebilmesi.
- **Kötü niyetli kullanım (spam, bot trafiği).** Tek bir önlem yeterli olmayacağı için
  birkaçını üst üste kullandım: (1) görünmez bir honeypot alanı — gerçek kullanıcılar
  görmez, formu otomatik dolduran botlar doldurur; (2) widget'ın açılışından ilk mesaja
  kadar geçen süre çok kısaysa (`<1.2s`) şüpheli işaretleniyor — bir insanın karşılama
  mesajını okuyup yazması bu kadar hızlı olamaz; (3) IP bazlı rate limit (10 dakikada 30
  istek); (4) mesaj başına ve konuşma başına uzunluk sınırı; (5) basit bir spam-pattern
  kontrolü (`looksLikeSpam` içinde `src/app/api/chat/route.ts`) — "test", tamamı rakam,
  ya da "asdasdasd" gibi tekrarlayan kalıpları yakalıyor; (6) e-posta artık zorunlu ve
  Zod'un `.email()` doğrulamasından geçiyor, biçimsel olarak geçersiz bir e-postayla lead
  açılamıyor. Şüpheli görüşmeleri **silmiyorum**, `flagged` olarak işaretleyip admin
  view'de varsayılan olarak gizliyorum — yanlış pozitif riskine karşı ekip isterse
  görebilsin diye.
- **Ziyaretçi bir soruyu cevaplamak istemezse?** Sistem promptu modele ısrar etmemesini,
  o alanı boş geçip sohbete devam etmesini söylüyor. Bu, "form" hissinden kaçınmanın da
  bir parçası — chatbot bir anket gibi davranmıyor.

## Daha fazla zamanda eklerdim

- **Daha güçlü bot koruması.** Honeypot + zamanlama sinyali + IP rate limit, sofistike
  bir bot/headless tarayıcıyı durdurmaz. Daha fazla zamanla hCaptcha/Cloudflare Turnstile
  gibi gerçek bir CAPTCHA eklerdim.
- **Dağıtık rate limiting.** Şu anki limiter bellek içi (`src/lib/rateLimit.ts`) ve
  process'e özel; Vercel'de her serverless instance kendi sayacını tutar, bu yüzden
  gerçek bir garanti değil, yumuşak bir caydırıcı. Upstash Redis ya da Vercel KV ile
  paylaşılan bir sayaç daha sağlam olurdu.
- **Tekrarlanan spam lead'lere karşı özel bir limit.** Şu anki rate limiter sadece genel
  istek sayısına bakıyor (10 dakikada 30 istek); bir IP zaten `flagged` bir lead
  oluşturduysa bunu hatırlayıp o IP'yi daha sıkı sınırlayan bir mekanizma yok.
  `resetConversation()` (`ChatWidget.tsx`) sadece client state'i sıfırladığı için bir
  bot/kötü niyetli kullanıcı sohbeti sıfırlayıp aynı 10 dakikalık istek bütçesi içinde
  tekrar tekrar flagged lead üretebiliyor. Daha fazla zamanla, `submit_lead` başarıyla
  çağrıldığında IP başına bir sayaç tutup flagged geçmişi olan IP'leri daha agresif
  limitleyen (ya da tamamen bloklayan) bir katman eklerdim.
- **Otomatik testler.** Zaman kısıtı nedeniyle hem `/api/chat` mantığı hem de admin view
  için unit/e2e test yazamadım; doğrulamayı manuel olarak (lint, build, smoke test) yaptım.
- **Admin view'de arama ve sayfalama.** Talep sayısı büyüdüğünde şu anki tek sayfalık
  liste yetersiz kalır.
- **Bildirim.** PRD e-posta/SMS entegrasyonunu kapsam dışı bıraktığı için eklemedim, ama
  ekibin "yeni talep var" diye App içinde fark etmesi için en azından basit bir
  okundu/okunmadı işaretleme daha fazla zamanla eklenebilirdi.
- **Quick-reply marker'ının güvenilirliği.** Şirket büyüklüğü gibi sorularda model,
  mesajının sonuna `[[QUICK_REPLIES: ...]]` ekleyerek buton göstermemizi sağlıyor; bu
  küçük/hızlı bir modelde (Haiku) her zaman garanti edilen bir format değil. Model
  marker'ı unutursa sohbet düz metinle devam ediyor (kırılmıyor), ama daha güvenilir bir
  çözüm ayrı bir tool-call ya da client-side adım bazlı bir UI olurdu.
- **Telefon numarası alternatifi.** Akış sadece e-posta topluyor; e-posta vermek
  istemeyen ama telefonla aranmayı kabul edecek ziyaretçiler için bir alternatif yok.
- **Lead score ağırlıkları kod-sabiti.** Skor formülü (`src/lib/leadScore.ts`) satış
  ekibinin admin'den ağırlıkları değiştirebileceği bir ayar değil, deploy gerektiren bir
  kod değişikliği.
- **Landing page tasarımı.** Daha fazla zamanda landing page'in görsel tarafını
  geliştirirdim: ürün ekran görüntüleri, dashboard önizlemeleri, daha güçlü bir görsel
  hiyerarşi ve dönüşüm odaklı içerikle sayfa daha profesyonel ve ikna edici hale
  getirilebilir.
- **Template yanıtlar ve semantic cache.** Tekrar eden kullanıcı niyetleri için
  sabit/template yanıtlar ve bir semantic cache mekanizması eklenebilir. Buton tabanlı
  akışlarda (quick-reply'lar) modeli hiç çağırmadan deterministik cevaplar döndürerek
  maliyet ve yanıt süresi azaltılabilir. LLM'i ise yalnızca serbest metni anlamlandırma,
  niyet çıkarımı ve lead özeti üretme gibi gerçekten değer kattığı noktalarda
  kullanılabilir.