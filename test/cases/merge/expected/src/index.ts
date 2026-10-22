import { Hono } from 'hono'
import { _202401Handler, rootHandler, petsHandler } from './handlers'
import { logger } from 'hono/logger'

const app = new Hono().basePath('/api')

app.use(logger())

export const api = app.route('/', _202401Handler).route('/', rootHandler).route('/', petsHandler)

app.notFound((c) => c.text('custom not found', 404))

export default app
