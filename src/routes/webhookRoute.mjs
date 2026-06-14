// POST /webhook — event + lifecycle alıcısı.
// SDK verifyAndParseWebhook: ham gövde + imza header + tenant secret → doğrulanmış envelope ya da null (→401).
// Adımlar: ham gövde oku → SDK doğrula+parse → dedup → işle → 2xx.
import { verifyAndParseWebhook } from '@restomenum/plugin-sdk';
import { readRawBody, sendJson } from '../lib/http.mjs';

export function makeWebhookRoute({ installStore, seenEventStore }) {
  return async function webhookRoute(req, res) {
    let rawBody;
    try {
      rawBody = await readRawBody(req, res); // boyut tavanını aşarsa 413 yazıp reject eder
    } catch {
      return; // yanıt zaten yazıldı (413) / transport hatası
    }

    // SDK tek adımda: parse (tenantId için) → getSecret(tenantId) → HMAC doğrula (ham gövde, ±5 dk, timing-safe).
    // null → şekil/imza geçersiz → 401 (parse detayını imzasız çağırana sızdırma).
    const envelope = await verifyAndParseWebhook(rawBody, req.headers['x-restomenum-signature'], {
      getSecret: (tenantId) => installStore.find(tenantId)?.webhookSecret,
    });
    if (!envelope) return sendJson(res, 401, { error: 'invalid_signature' });

    // Idempotency: aynı envelope.id tekrar gelebilir → bir kez işle.
    if (seenEventStore.has(envelope.id)) return sendJson(res, 200, { ok: true, dedup: true });

    // İşle ÖNCE (demo: logla; üretimde kuyruğa al), BAŞARILIYSA seen işaretle —
    // işleme hata verirse id seen kalmasın ki at-least-once redelivery dedup'a takılmasın.
    console.log(`webhook: ${envelope.type} tenant=${envelope.tenantId} id=${envelope.id}`);
    seenEventStore.add(envelope.id);

    sendJson(res, 200, { ok: true });
  };
}
