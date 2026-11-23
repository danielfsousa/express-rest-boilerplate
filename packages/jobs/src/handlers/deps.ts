import type { Database } from '@starter/db';
import type { Mailer } from '@starter/email';
import type { ObjectStorage } from '@starter/runtime/storage';
import type { RuntimeLogger } from '@starter/runtime/types';

export interface JobHandlersDeps {
  drizzleDb: Database;
  mailer: Mailer;
  storage: ObjectStorage;
  logger: RuntimeLogger;
}
