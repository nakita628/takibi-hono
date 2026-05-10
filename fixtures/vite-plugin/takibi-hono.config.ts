import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'webhooks.yaml',
  schema: 'zod',
  openapi: true,
  'takibi-hono': {
    handlers: { output: 'src/handlers' },
    components: {
      schemas: { output: 'src/schemas.ts', exportTypes: true },
    },
  },
})
