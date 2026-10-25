import { defineConfig } from 'takibi-hono/config'

// Two packages (seeded package.json files): the app imports the components by the name of
// the package they are written into, not by a relative path across the repository.
export default defineConfig({
  input: 'specs/petstore.yaml',
  schema: 'zod',
  openapi: true,
  pathAlias: '@/',
  output: '__generated__/monorepo/apps/api/src/handlers',
  components: {
    output: '__generated__/monorepo/packages/components/src/index.ts',
    package: '@acme/components',
  },
})
