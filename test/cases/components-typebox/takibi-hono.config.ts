import { defineConfig } from 'takibi-hono/config'

// Golden only, no tsconfig.json: see cases/openapi-typebox — the typebox + hono-openapi bridge
// does not satisfy Standard Schema.
export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'typebox',
  openapi: true,
  output: '__generated__/components-typebox/src/handlers',
  components: { output: '__generated__/components-typebox/src/components.ts' },
})
