import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'effect',
  basePath: '/api',
  output: '__generated__/plain-effect/src/handlers',
  components: { output: '__generated__/plain-effect/src/components/index.ts' },
})
