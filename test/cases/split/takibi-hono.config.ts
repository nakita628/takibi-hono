import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'specs/components.yaml',
  schema: 'zod',
  openapi: true,
  readonly: true,
  pathAlias: '@/',
  output: '__generated__/split/src/routes',
  components: {
    schemas: {
      output: '__generated__/split/src/components/schemas',
      split: true,
      exportTypes: true,
    },
    responses: { output: '__generated__/split/src/components/responses', split: true },
    parameters: {
      output: '__generated__/split/src/components/parameters',
      split: true,
      exportTypes: true,
    },
    headers: { output: '__generated__/split/src/components/headers.ts', exportTypes: true },
    requestBodies: { output: '__generated__/split/src/components/requestBodies', split: true },
    examples: { output: '__generated__/split/src/components/examples', split: true },
    links: { output: '__generated__/split/src/components/links.ts' },
    callbacks: { output: '__generated__/split/src/components/callbacks', split: true },
    securitySchemes: { output: '__generated__/split/src/components/securitySchemes.ts' },
    pathItems: { output: '__generated__/split/src/components/pathItems', split: true },
  },
})
