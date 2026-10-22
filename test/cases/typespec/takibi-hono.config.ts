import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/main.tsp',
  schema: 'valibot',
  openapi: true,
  output: '__generated__/typespec/src/handlers',
  components: { output: '__generated__/typespec/src/components/index.ts' },
})
