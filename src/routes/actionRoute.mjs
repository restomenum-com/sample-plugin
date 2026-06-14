// POST /action — senkron buton/hook isteği.
// Action, webhook ile AYNI imzayı kullanır → SDK verifyWebhookSignature. SDK'da ayrı action-parser yok;
// imza secret'ini seçmek için tenantId şart olduğundan minimal sınır doğrulaması inline yapılır
// (gövde şekli: SDK'nın ActionRequest tipi). Yanıt SDK actionResponse() ile kurulur.
// Adımlar: ham gövde oku → parse + tenantId → imza doğrula → { success, message, level, display } (≤8 sn).
import { verifyWebhookSignature, actionResponse } from '@restomenum/plugin-sdk';
import { readRawBody, sendJson } from '../lib/http.mjs';

export function makeActionRoute({ installStore }) {
  return async function actionRoute(req, res) {
    let rawBody;
    try {
      rawBody = await readRawBody(req, res);
    } catch {
      return; // 413 / transport hatası
    }

    // tenantId imza secret'ini seçmek için gerekli → minimal parse (ağır iş imzadan SONRA).
    let action;
    try {
      action = JSON.parse(rawBody);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }
    if (!action || typeof action !== 'object' || !action.tenantId) {
      return sendJson(res, 400, { error: 'invalid_action' });
    }

    const secret = installStore.find(action.tenantId)?.webhookSecret;
    if (!verifyWebhookSignature(rawBody, req.headers['x-restomenum-signature'], secret)) {
      return sendJson(res, 401, { error: 'invalid_signature' });
    }

    // Etkileşim yalnız id taşır → dolu veriyi SDK Callback API istemcisiyle çek (sync pencere ≤8 sn — hızlı tut).
    // Veri çekeceksen makeActionRoute'a connectRoute gibi restomenumBase'i DI ile geç, sonra:
    //   const install = installStore.find(action.tenantId);
    //   const client = new RestomenumClient({ apiKey: install.apiKey, baseUrl: restomenumBase });
    //   const packet = await client.packets.get(action.target.id);
    console.log(`action: hook=${action.hook} target=${action.target?.id} actor=${action.actor?.userId}`);
    return sendJson(
      res,
      200,
      actionResponse(true, `İşlem alındı: ${action.target?.id ?? ''}`, {
        level: 'success', // info | success | warning | error
        display: 'toast', // toast | popup
      }),
    );
  };
}
