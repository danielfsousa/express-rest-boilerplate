import { createBirdEmulatorFetch } from '@starter/email';
import { createLogger, createServer, onShutdown, readEnv } from '@starter/runtime';

const env = readEnv();
const logger = createLogger({ level: env['LOG_LEVEL'] ?? 'info' });
const birdPort = Number.parseInt(env['BIRD_EMULATOR_PORT'] ?? '4010', 10);

const birdServer = await createServer({
  port: Number.isNaN(birdPort) ? 4010 : birdPort,
  hostname: '127.0.0.1',
  fetch: createBirdEmulatorFetch(),
});

logger.info({ url: birdServer.url }, 'Bird email emulator listening');

onShutdown(
  async () => {
    await birdServer.close();
    logger.info('Emulators stopped');
  },
  { drainTimeoutMs: 5000, logger },
);
