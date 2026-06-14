// GET /connect — OAuth Connect redirect hedefi.
// Restomenum, tenant kurulumunda tarayıcıyı buraya ?code=&state= ile yönlendirir.
// Adımlar: state CSRF doğrula → code'u credential'a çevir (SDK exchangeCode) → sakla → post-install sağlık çağrısı.
import { exchangeCode, RestomenumClient } from '@restomenum/plugin-sdk';
import { sendJson, sendHtml } from '../lib/http.mjs';
import { verifyConnectState } from '../lib/state.mjs';

/** Bağımlılıklar DI ile geçer (global state yok). @returns route handler */
export function makeConnectRoute({ installStore, restomenumBase, clientId, clientSecret }) {
  return async function connectRoute(req, res, url) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code) return sendJson(res, 400, { error: 'missing_code' });
    if (!verifyConnectState(state)) return sendJson(res, 400, { error: 'invalid_state' });

    let install;
    try {
      // SDK: tek-kullanımlık code → kalıcı InstallCredentials { tenantId, apiKey, webhookSecret, scopes, … }.
      // client_secret YALNIZ bu sunucu çağrısında kullanılır; OAuthError (RFC 6749) fırlatabilir.
      install = await exchangeCode({ code, clientId, clientSecret }, { baseUrl: restomenumBase });
    } catch (error) {
      // OAuthError mesajı güvenli olsa da transport hatası iç host sızdırabilir → kullanıcıya genel mesaj + sunucu log.
      console.error('connect exchange failed', error);
      return sendJson(res, 400, { error: 'connect_failed' });
    }

    installStore.save(install);
    console.log(`✓ kuruldu: tenant=${install.tenantId} scopes=${install.scopes.join(',')}`);

    // Post-install sağlık: SDK Callback API istemcisiyle bir okuma dene (etkileşim yalnız id taşır → veri buradan).
    const client = new RestomenumClient({ apiKey: install.apiKey, baseUrl: restomenumBase });
    client.packets.open()
      .then((packets) => console.log(`açık paket: ${Array.isArray(packets) ? packets.length : 0}`))
      .catch(() => {}); // sağlık kontrolü best-effort — kurulumu bozmasın

    sendHtml(res, 200, '<h2>Kurulum tamam ✓</h2><p>Bu pencereyi kapatabilirsin.</p>');
  };
}
