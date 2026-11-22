import { defineConfig } from 'takibi-hono/config'

// Golden only, no tsconfig.json: oas-truth 0.7 annotates the recursive `NodeSchema` as
// `Schema.Schema<NodeType>`, whose decoding services are `unknown`, so
// `Schema.toStandardSchemaV1` rejects it in `resolver(...)`. Upstream:
// https://github.com/nakita628/truth/issues/28

export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'effect',
  openapi: true,
  output: '__generated__/components-effect/src/handlers',
  components: { output: '__generated__/components-effect/src/components.ts' },
})
