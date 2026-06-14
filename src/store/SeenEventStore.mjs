// İşlenmiş event id'leri — idempotency (at-least-once teslim → aynı id tekrar gelebilir).
// DEMO: bellek (Set). Gerçekte kalıcı depo + TTL (örn. Redis SETEX) kullan.
export class SeenEventStore {
  /** @type {Set<string>} */
  #seen = new Set();

  has(id) {
    return this.#seen.has(id);
  }

  add(id) {
    this.#seen.add(id);
  }
}
