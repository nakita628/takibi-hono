import { Hono } from 'hono'
import { _202401Handler, rootHandler, petsHandler } from './handlers'

const app = new Hono().basePath('/api')

export const _202401 = app.route('/', _202401Handler)

export const __root = app.route('/', rootHandler)

export const pets = app.route('/', petsHandler)

export default app
