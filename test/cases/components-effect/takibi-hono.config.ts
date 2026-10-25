import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'effect',
  openapi: true,
  output: '__generated__/components-effect/src/handlers',
  components: { output: '__generated__/components-effect/src/components.ts' },
})
