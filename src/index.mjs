// Entry — yalnız bootstrap: config yükle, bağımlılıkları kur (DI), route'ları bağla, server'ı başlat.
// İş mantığı YOK; protokol primitifleri (imza, OAuth exchange, Callback API) @restomenum/plugin-sdk'tan gelir.
import { config, assertConfig } from './config.mjs';
import { InstallStore } from './store/InstallStore.mjs';
import { SeenEventStore } from './store/SeenEventStore.mjs';
import { createServer } from './server.mjs';
import { makeConnectRoute } from './routes/connectRoute.mjs';
import { makeWebhookRoute } from './routes/webhookRoute.mjs';
import { makeActionRoute } from './routes/actionRoute.mjs';

assertConfig();

// Depolar (constructor DI — global state yok). Kalıcı credential + idempotency demo amaçlı bellek içi.
const installStore = new InstallStore();
const seenEventStore = new SeenEventStore();

// Route handler'lar (her endpoint kendi dosyasında). OAuth/imza/Callback işini SDK yapar; route'lar ince kalır.
const routes = {
  connect: makeConnectRoute({
    installStore,
    restomenumBase: config.restomenumBase,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  }),
  webhook: makeWebhookRoute({ installStore, seenEventStore }),
  action: makeActionRoute({ installStore }),
};

createServer({ config, routes }).listen(config.port, () => {
  console.log(`▶ örnek eklenti http://localhost:${config.port}  (base: ${config.restomenumBase})`);
});
