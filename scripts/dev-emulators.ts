import 'varlock/auto-load';
import { ENV } from 'varlock/env';
import { createBirdEmulatorFetch } from '@starter/email';
import { createLogger, createServer, onShutdown } from '@starter/runtime';
import { createEmulator } from 'emulate';

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

logger.info({ url: birdServer.url }, 'Bird email emulator listening');
logger.info({ url: stripeEmulator.url }, 'Stripe emulator listening');

onShutdown(
  async () => {
    await Promise.all([birdServer.close(), stripeEmulator.close()]);
    logger.info('Emulators stopped');
  },
  { drainTimeoutMs: 5000, logger },
);
