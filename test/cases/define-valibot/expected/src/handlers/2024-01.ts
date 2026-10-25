import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as v from 'valibot'

export const get202401ReportsHandler = defineHandler({ response: v.array(v.string()) })(async (
  c,
) => {})

export const _202401Handler = new Hono().get('/2024-01/reports', get202401ReportsHandler)
