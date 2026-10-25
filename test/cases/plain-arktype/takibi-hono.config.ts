import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'arktype',
  basePath: '/api',
  output: '__generated__/plain-arktype/src/handlers',
  components: { output: '__generated__/plain-arktype/src/components/index.ts' },
})
