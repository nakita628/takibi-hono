import { Hono } from 'hono'

export const rootHandler = new Hono().get('/', (c) => {})
