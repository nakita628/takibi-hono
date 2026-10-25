import { Hono } from 'hono'
import { get202401ReportsHandler } from '@/routes'

export const _202401Handler = new Hono().get(
  '/2024-01/reports',
  get202401ReportsHandler(async (c) => {}),
)
