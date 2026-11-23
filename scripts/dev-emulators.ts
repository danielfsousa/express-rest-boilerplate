import 'varlock/auto-load';
import { createBirdClient, createBirdEmulatorFetch, syncBirdTemplates } from '@starter/email';
import { compileBirdEmailTemplates } from '@starter/email/templates';
import { createLogger, createServer, onShutdown } from '@starter/runtime';
import { createEmulator } from 'emulate';
import { ENV } from 'varlock/env';

const logger = createLogger({ level: ENV.LOG_LEVEL });
const birdPort = ENV.BIRD_EMULATOR_PORT;
const stripePort = ENV.STRIPE_API_PORT ?? 4009;

const [birdServer, stripeEmulator] = await Promise.all([
  createServer({
    port: birdPort,
    hostname: '127.0.0.1',
    fetch: createBirdEmulatorFetch(),
  }),
  createEmulator({
    service: 'stripe',
    port: stripePort,
    hostname: '127.0.0.1',
  }),
]);

const templates = await compileBirdEmailTemplates();
const syncResults = await syncBirdTemplates({
  client: createBirdClient({
    apiKey: ENV.BIRD_API_KEY,
    apiBaseUrl: birdServer.url,
  }),
  templates,
  logger,
});

logger.info(
  { url: birdServer.url, templates: syncResults.length },
  'Bird email emulator listening',
);
logger.info({ url: stripeEmulator.url }, 'Stripe emulator listening');

onShutdown(
  async () => {
    await Promise.all([birdServer.close(), stripeEmulator.close()]);
    logger.info('Emulators stopped');
  },
  { drainTimeoutMs: 5000, logger },
);
