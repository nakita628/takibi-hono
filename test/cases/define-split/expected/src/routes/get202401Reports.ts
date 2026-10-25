import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const get202401ReportsHandler = defineHandler({ response: z.array(z.string()) })
