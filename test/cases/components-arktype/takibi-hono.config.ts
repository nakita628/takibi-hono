import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'arktype',
  openapi: true,
  output: '__generated__/components-arktype/src/handlers',
  components: { output: '__generated__/components-arktype/src/components.ts' },
})
