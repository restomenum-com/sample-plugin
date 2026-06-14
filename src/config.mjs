// Ortam yapılandırması — TEK kaynak. process.env yalnız burada okunur; başka dosya env'e dokunmaz.
import { BASES } from '@restomenum/plugin-sdk';

const port = Number(process.env.PORT || 3000);

export const config = {
  port,
  // Restomenum plugin API kökü — varsayılan SDK sabitinden (sandbox); prod için RESTOMENUM_BASE ver.
  restomenumBase: (process.env.RESTOMENUM_BASE || BASES.sandbox).replace(/\/+$/, ''),
  // Portal'dan alınan plugin kimlikleri
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  // Bu sunucunun herkese açık https kökü (manifest webhookUrl/connectUrl ile aynı registered domain)
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  // İmza replay penceresi SDK varsayılanıdır (±5 dk, SIGNATURE_TOLERANCE_SEC) — burada ayar gerekmez.
};

/** Zorunlu yapılandırma eksikse uyar (başlatmayı engellemez — placeholder ile çalışılabilir). */
export function assertConfig() {
  const missing = ['clientId', 'clientSecret'].filter((k) => !config[k]);
  if (missing.length) {
    console.warn(`⚠ eksik config: ${missing.join(', ')} — .env doldur (portal → eklenti → Client Secret üret).`);
  }
}
