import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'zod',
  openapi: true,
  output: '__generated__/components-zod/src/handlers',
  components: { output: '__generated__/components-zod/src/components.ts' },
})
