import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { type } from 'arktype'

export const get202401ReportsHandler = defineHandler({
  response: { '~standard': type('string[]')['~standard'] },
})(async (c) => {})

export const _202401Handler = new Hono().get('/2024-01/reports', get202401ReportsHandler)
