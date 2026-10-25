import { Hono } from 'hono'

import { getHealthHandler } from '../routes'

export const healthHandler = new Hono().get(
  '/health',
  getHealthHandler(async () => ({ status: 'ok' as const })),
)
