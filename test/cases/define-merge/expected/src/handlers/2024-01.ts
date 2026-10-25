import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const get202401ReportsHandler = defineHandler({ response: z.array(z.string()) })(async (
  c,
) => {})

export const _202401Handler = new Hono().get('/2024-01/reports', get202401ReportsHandler)
