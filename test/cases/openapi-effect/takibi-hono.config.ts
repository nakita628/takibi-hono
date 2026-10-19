import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'effect',
  openapi: true,
  basePath: '/api',
  output: '__generated__/openapi-effect/src/handlers',
  components: { output: '__generated__/openapi-effect/src/components' },
})
