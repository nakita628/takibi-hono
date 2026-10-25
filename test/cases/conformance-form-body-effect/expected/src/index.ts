import { Hono } from 'hono'
import { componentHandler, jsonHandler, multipartHandler, urlencodedHandler } from './handlers'

const app = new Hono()

export const api = app
  .route('/', componentHandler)
  .route('/', jsonHandler)
  .route('/', multipartHandler)
  .route('/', urlencodedHandler)

export default app
