import { defineConfig } from 'takibi-hono/config'

// Four packages (seeded package.json files). The app imports the components by the name of
// the package they are written into, not by a relative path across the repository; the typed
// client, in a package of its own, imports the type of the app by the app's package name,
// and rpc in the web app imports the client by the client's.
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
  client: {
    output: '__generated__/monorepo/packages/client/src/index.ts',
    baseUrl: { env: 'API_URL', source: 'process.env' },
    import: '@acme/api',
    package: '@acme/client',
    rpc: { output: '__generated__/monorepo/apps/web/src/rpc.ts' },
  },
})
