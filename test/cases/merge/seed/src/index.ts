import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { petsHandler } from './handlers'

const app = new Hono().basePath('/api')

app.use(logger())

export const api = app.route('/', petsHandler)

app.notFound((c) => c.text('custom not found', 404))

export default app
