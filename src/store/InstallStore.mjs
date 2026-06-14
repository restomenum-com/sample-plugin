// Kurulum deposu — DEMO: bellek içi. Gerçekte DB; save/find arayüzü aynı kalır.
// Sakladığı değer SDK'nın InstallCredentials nesnesidir: { tenantId, apiKey, webhookSecret, scopes }.
export class InstallStore {
  /** @type {Map<string, import('@restomenum/plugin-sdk').InstallCredentials>} */
  #byTenant = new Map();

  /** @param {import('@restomenum/plugin-sdk').InstallCredentials} install */
  save(install) {
    this.#byTenant.set(install.tenantId, install);
  }

  /** @param {string} tenantId @returns {import('@restomenum/plugin-sdk').InstallCredentials|null} */
  find(tenantId) {
    return this.#byTenant.get(tenantId) ?? null;
  }
}
