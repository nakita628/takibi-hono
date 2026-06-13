import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'webhooks.yaml',
  schema: 'zod',
  openapi: true,
  output: 'src/handlers',
  components: {
    schemas: { output: 'src/schemas.ts', exportTypes: true },
  },
})
