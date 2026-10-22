import { Hono } from 'hono'
import {
  cookiesHandler,
  defaultsHandler,
  openHandler,
  optionalHandler,
  requiredHandler,
} from './handlers'

const app = new Hono()

export const api = app
  .route('/', cookiesHandler)
  .route('/', defaultsHandler)
  .route('/', openHandler)
  .route('/', optionalHandler)
  .route('/', requiredHandler)

export default app
