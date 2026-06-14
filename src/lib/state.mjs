// OAuth Connect CSRF — state doğrulama.
// DOĞRU AKIŞ: kurulumu BAŞLATIRKEN rastgele bir state üret + tarayıcı oturumuna/depoya yaz; Restomenum
// dönüşte aynı state'i `?state=` ile geri verir; burada timing-safe karşılaştır + tek-kullan (consume).
// Bu minimal sample "initiate" adımını modellemediğinden doğrulama STUB'dur — üretimde gerçek depo ile değiştir.
export function verifyConnectState(state) {
  if (!state) {
    console.warn('⚠ CSRF: state yok — ÜRETİMDE state ZORUNLU (kurulumda üret + burada doğrula). Stub geçiyor.');
    return true; // stub: sample'ın çalışması için. ÜRETİMDE: aşağıdaki gerçek doğrulamayı kullan, false dön.
  }
  // ÜRETİM: const issued = stateStore.consume(state); return issued === true;  (timing-safe + tek-kullan)
  return true;
}
