import { defineConfig } from 'takibi-hono/config'

// typebox implements no Standard Schema on `Compile(...)`, so the generated modules declare
// `toStandardSchemaV1`, which gives the compiled validator the `~standard` hono-openapi's
// `validator` and `resolver` take, typed by the schema's encoded and decoded types.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'typebox',
  openapi: true,
  basePath: '/api',
  output: '__generated__/openapi-typebox/src/handlers',
  components: { output: '__generated__/openapi-typebox/src/components/index.ts' },
})
