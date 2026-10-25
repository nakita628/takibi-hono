import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'arktype',
  openapi: true,
  basePath: '/api',
  output: '__generated__/openapi-arktype/src/handlers',
  components: { output: '__generated__/openapi-arktype/src/components/index.ts' },
})
