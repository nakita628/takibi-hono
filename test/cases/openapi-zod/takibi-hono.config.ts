import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  basePath: '/api',
  output: '__generated__/openapi-zod/src/handlers',
  components: { output: '__generated__/openapi-zod/src/components' },
})
