import type { IncomingMessage, ServerResponse } from 'node:http';
import { getCachedDatabase } from '../server/db';
import { handleApiRequest } from '../server/routes';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const store = await getCachedDatabase();
  await handleApiRequest(req, res, store, { serveStatic: false });
}
