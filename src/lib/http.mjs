// HTTP yardımcıları — ham gövde okuma + yanıt yazma. Saf I/O sarmalayıcı; iş mantığı içermez.

/** Pre-auth gövde boyutu tavanı — imzasız çağrılar bellek tüketmesin (DoS). */
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

/**
 * İstek gövdesini HAM string olarak oku (imza doğrulama ham bayt ister).
 * Buffer parçalarını biriktirip SONUNDA bir kez decode eder — çok-baytlı UTF-8 karakter (ş, İ…)
 * iki TCP chunk'ına bölünse bile bozulmaz (aksi halde imza eşleşmez → yanlış 401).
 * Tavanı aşan gövde 413 ile reddedilir.
 */
export function readRawBody(req, res) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        res.writeHead(413, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'payload_too_large' }));
        req.destroy();
        reject(new Error('payload_too_large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** JSON yanıt yaz. */
export function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** HTML yanıt yaz. */
export function sendHtml(res, status, html) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}
