import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'valibot',
  openapi: true,
  output: '__generated__/components-valibot/src/handlers',
  components: { output: '__generated__/components-valibot/src/components.ts' },
})
