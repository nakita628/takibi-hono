import { Hono } from 'hono'

export const oldHandler = new Hono().get('/old', (c) => c.text('no path maps here any more'))
