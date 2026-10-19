import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'valibot',
  openapi: true,
  basePath: '/api',
  output: '__generated__/openapi-valibot/src/handlers',
  components: { output: '__generated__/openapi-valibot/src/components' },
})
