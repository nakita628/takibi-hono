import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'valibot',
  basePath: '/api',
  output: '__generated__/plain-valibot/src/handlers',
  components: { output: '__generated__/plain-valibot/src/components' },
})
