import { defineConfig } from 'takibi-hono/config'

// `defineHandler`: src/routes.ts defines every operation (`postUsersHandler`), validating the
// request and the response; with `template`, the handler files that call the definitions and
// the app entry are written too, as hono-takibi's template. `split: true` exports each first
// path segment (`health`, `users`, `posts`) as a group, with a client per group; rpc calls the
// client of each operation's group.
export default defineConfig({
  input: 'openapi.yaml',
  schema: 'zod',
  defineHandler: { output: 'src/routes.ts', template: true },
  basePath: '/api',
  split: true,
  output: 'src/handlers',
  components: { output: 'src/components.ts' },
  client: { output: 'src/client.ts' },
  rpc: { output: 'src/rpc.ts', parseResponse: true },
  // The repository's own formatter settings (vite.config.ts at the root), so that the
  // generated files read as the hand-written ones beside them.
  format: { printWidth: 100, singleQuote: true, semi: false, experimentalSortImports: {} },
})
