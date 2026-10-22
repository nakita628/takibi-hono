import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  basePath: '/api',
  output: '__generated__/plain-zod/src/handlers',
  components: { output: '__generated__/plain-zod/src/components/index.ts' },
})
