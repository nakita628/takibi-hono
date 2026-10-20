import { Hono } from 'hono'
import { defaultsHandler, headersHandler, optionalHandler, requiredHandler } from './handlers'

const app = new Hono()

export const api = app
  .route('/', defaultsHandler)
  .route('/', headersHandler)
  .route('/', optionalHandler)
  .route('/', requiredHandler)

export default app
