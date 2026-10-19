import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'typebox',
  basePath: '/api',
  output: '__generated__/plain-typebox/src/handlers',
  components: { output: '__generated__/plain-typebox/src/components' },
})
