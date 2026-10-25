import { Hono } from 'hono'
import { getHandler } from '../routes'

export const rootHandler = new Hono().get(
  '/',
  getHandler(async (c) => {}),
)
