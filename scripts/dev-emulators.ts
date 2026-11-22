import 'varlock/auto-load';
import { createBirdEmulatorFetch } from '@starter/email';
import { createLogger, createServer, onShutdown, readEnv } from '@starter/runtime';
import { createEmulator } from 'emulate';

const env = readEnv();
const logger = createLogger({ level: env['LOG_LEVEL'] ?? 'info' });
const birdPort = Number.parseInt(env['BIRD_EMULATOR_PORT'] ?? '4010', 10);
const stripePort = Number.parseInt(env['STRIPE_API_PORT'] ?? '4009', 10);

const [birdServer, stripeEmulator] = await Promise.all([
  createServer({
    port: Number.isNaN(birdPort) ? 4010 : birdPort,
    hostname: '127.0.0.1',
    fetch: createBirdEmulatorFetch(),
  }),
  createEmulator({
    service: 'stripe',
    port: Number.isNaN(stripePort) ? 4009 : stripePort,
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
