import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const getHandler = defineHandler({ response: z.object({ status: z.literal('ok') }) })(async (
  c,
) => {})

export const rootHandler = new Hono().get('/', getHandler)
