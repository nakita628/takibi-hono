import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'openapi.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/src/handlers',
  components: { output: '__generated__/src/components' },
})
