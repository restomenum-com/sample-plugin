# Restomenum — Örnek Eklenti (starter)

Çalışan eklenti iskeleti — protokol işini **resmi [`@restomenum/plugin-sdk`](https://www.npmjs.com/package/@restomenum/plugin-sdk)**
yapar (webhook imza doğrulama, OAuth token exchange, Callback API istemcisi, event/scope katalogu, modeller).
Uçtan uca akışı gösterir: **Connect → token exchange → webhook (imza doğrulama) → senkron aksiyon**.
Profesyonel katmanlı yapı (routes / lib / store) — klonla, referans al, kendi eklentine başla.

> Öğretici amaçlıdır. Üretimde: credential'ları gerçek DB'de sakla, ağır işi kuyruğa al, idempotency'i
> kalıcı + TTL'li tut, hata/retry yönetimi ekle. Güvenlik-kritik protokol (imza/OAuth) **SDK'da** — kendin yazma.

## Gereksinim
- Node **20+** (`--env-file` ve global `fetch` için)
- `npm install` (tek bağımlılık: `@restomenum/plugin-sdk`)
- Portal'da bir eklenti + **Client Secret** (portal → eklenti → "Client Secret üret")
- Yerelde test için bir **https tünel** (ngrok / cloudflared) — Restomenum webhook'ları https ister ve
  `webhookUrl`/`connectUrl` manifest'te **aynı registered domain** olmalı.

## Hızlı başlangıç
```bash
npm install                   # @restomenum/plugin-sdk
cp .env.example .env          # CLIENT_ID, CLIENT_SECRET, PUBLIC_URL doldur
cloudflared tunnel --url http://localhost:3000   # → https://....trycloudflare.com  (PUBLIC_URL'e yaz)
npm start                     # = node --env-file=.env src/index.mjs
```
Sonra eklentini bir **test mağazasına kur** (portal → Test Mağazaları). Kurulumda Restomenum tarayıcıyı
senin `connectUrl`'ine (`/connect`) `?code=&state=` ile yönlendirir; sunucu code'u credential'a çevirir.

## Proje yapısı
Protokol primitifleri **SDK'dan** gelir (imza, OAuth exchange, Callback API, envelope/model). Bu repo yalnız
**uygulamaya özel glue**'yu tutar: ince router, route handler'ları, http I/O, CSRF state, depo.
```
src/
├── index.mjs              # entry — bootstrap (config + DI + server başlat)
├── config.mjs            # ortam değişkenleri (tek kaynak; base = SDK BASES)
├── server.mjs            # ince router (isteği route'a yönlendirir)
├── routes/               # her endpoint ayrı dosya (ince handler — SDK'yı çağırır)
│   ├── connectRoute.mjs  # SDK exchangeCode + RestomenumClient
│   ├── webhookRoute.mjs  # SDK verifyAndParseWebhook
│   └── actionRoute.mjs   # SDK verifyWebhookSignature + actionResponse
├── lib/                  # uygulama I/O yardımcıları (SDK kapsamı dışı)
│   ├── http.mjs          # readRawBody / sendJson / sendHtml
│   └── state.mjs         # OAuth Connect CSRF state (stub — üretimde gerçek depo)
└── store/                # repository (demo: bellek; gerçek: DB)
    ├── InstallStore.mjs  # SDK InstallCredentials saklar (tenantId → credential)
    └── SeenEventStore.mjs
```

## SDK kullanımı (bu sample'da)
| SDK sembolü | Nerede | İş |
|----|----|----|
| `exchangeCode()` | connectRoute | tek-kullanımlık code → `InstallCredentials` |
| `RestomenumClient` | connectRoute | Callback API (`client.packets.open()` …) |
| `verifyAndParseWebhook()` | webhookRoute | parse + tenant secret + HMAC doğrula → envelope \| null |
| `verifyWebhookSignature()` | actionRoute | action aynı imza şemasını doğrular |
| `actionResponse()` | actionRoute | `{ success, message, level, display }` kurar |
| `BASES` | config | sandbox/production kökü |

Kurulum: `npm i @restomenum/plugin-sdk` · Dokümanlar: https://dev.restomenum.com/docs

## Manifest (portalda)
Bu sunucunun uçlarını eklentinin sürüm manifestine gir:
- `connectUrl` → `https://<PUBLIC_URL>/connect`  ← Restomenum kurulumda buraya `?code=&state=` yönlendirir
- `webhookUrl` → `https://<PUBLIC_URL>/webhook`
- (buton kullanıyorsan) `actionUrl` → `https://<PUBLIC_URL>/action`
- `events: ["table.created", ...]` + `events:subscribe` scope

Üçü de **aynı domain** altında olmalı (single-apex politikası).

## Uçlar
| Uç | İş |
|----|----|
| `GET /connect` | **Connect redirect hedefi** — `state` CSRF doğrulanır, `code` SDK `exchangeCode` ile `apiKey`+`webhookSecret`'a çevrilir, tenant başına saklanır |
| `POST /webhook` | Event + lifecycle alıcısı — SDK `verifyAndParseWebhook` ile **HMAC imza doğrular** (±5 dk, timing-safe), `id` ile **dedup** eder, hızlı `2xx` döner |
| `POST /action` | Senkron buton/hook — imzalı; SDK `actionResponse` ile `{success, message, level, display}` döner (≤8 sn) |

## Öne çıkan güvenlik desenleri
- **İmza doğrulama** ham gövde üzerinde (`t=<unixSec>,v1=HMAC_SHA256(webhookSecret,"<t>.<rawBody>")`, ±5 dk, timing-safe) — SDK `verifyAndParseWebhook`/`verifyWebhookSignature`.
- Geçersiz/şekilsiz imzaya **401** (parse detayını imzasız çağırana sızdırma).
- **Idempotency**: aynı `envelope.id` tekrar gelebilir → işle-bir-kez (`SeenEventStore`).
- **Ham gövde tavanı** (1 MB, `readRawBody`) — imzasız çağrı bellek tüketmesin (413).
- Etkileşim yalnız **id** taşır → dolu veriyi SDK Callback API istemcisiyle çek (`client.packets.get(id)`).
- `client_secret` yalnız `exchangeCode` (sunucu) çağrısında; tarayıcıya/iframe'e gitmez.

## İlgili dokümanlar
- Mimari & akış: https://dev.restomenum.com/docs/concepts
- İmza şeması: https://dev.restomenum.com/docs/webhook-signature
- Token exchange: https://dev.restomenum.com/docs/token
- Event kataloğu: https://dev.restomenum.com/docs/events
- SDK: https://www.npmjs.com/package/@restomenum/plugin-sdk
