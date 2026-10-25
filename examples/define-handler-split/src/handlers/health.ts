import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const getHealthHandler = defineHandler({ response: z.object({ status: z.literal('ok') }) })(
  async (c) => ({ status: 'ok' as const }),
)

export const healthHandler = new Hono().get('/health', getHealthHandler)
