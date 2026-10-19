import { defineConfig } from 'takibi-hono/config'

// Golden only, no tsconfig.json: for the `Page` parameter (an integer coerced from a string with
// `default: 1`) schema-to-library emits `Schema.withDecodingDefault(Effect.succeed(1))` on
// `NumberFromString`, whose encoded side is a string, so the output does not compile until that
// is fixed upstream.
export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'effect',
  openapi: true,
  output: '__generated__/components-effect/src/handlers',
  components: { output: '__generated__/components-effect/src/components.ts' },
})
