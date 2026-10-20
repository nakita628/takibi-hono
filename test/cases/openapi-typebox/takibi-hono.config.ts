import { defineConfig } from 'takibi-hono/config'

// Golden only, no tsconfig.json: typebox (1.1.38, and 1.4.2 alike) implements no Standard
// Schema on `Compile(...)`, so hono-openapi's `validator` and `resolver` reject the typebox
// bridge at the type level and at run time. The output is pinned until the bridge changes.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'typebox',
  openapi: true,
  basePath: '/api',
  output: '__generated__/openapi-typebox/src/handlers',
  components: { output: '__generated__/openapi-typebox/src/components/index.ts' },
})
