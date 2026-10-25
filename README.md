# Takibi Hono

![Takibi Hono demo](https://github.com/nakita628/takibi-hono/blob/main/assets/takibi-hono.gif)

## OpenAPI to Hono Code Generator

**[Takibi Hono](https://www.npmjs.com/package/takibi-hono)** generates type-safe [Hono](https://hono.dev/) code from [OpenAPI](https://www.openapis.org/) / [TypeSpec](https://typespec.io/) specifications.

- OpenAPI schemas to validation schemas (`zod` | `valibot` | `typebox` | `arktype` | `effect`)
- [hono-openapi](https://hono.dev/examples/hono-openapi) route definitions with `describeRoute`
- App entry point + handler stubs with [handler merge](#handler-merge)
- Component splitting into separate files (schemas, parameters, headers, etc.)
- A typed [Hono client](https://hono.dev/docs/guides/rpc), with RPC functions and query hooks over it
- Vite plugin for automatic regeneration on spec changes

## Install

```bash
npm install -D takibi-hono
```

## Setup

Create `takibi-hono.config.ts`:

### Minimal Config

```ts
// takibi-hono.config.ts
import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'main.tsp',
  schema: 'zod',
})
```

### Full Config

```ts
// takibi-hono.config.ts
import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  // OpenAPI spec file (.yaml, .json, or .tsp)
  input: 'openapi.yaml',

  // Handler stub output directory (any directory you like; default 'src/handlers')
  output: 'src/handlers',

  // Base path prefix for all routes
  basePath: '/api',

  // Schema library for validation
  schema: 'zod', // 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'

  // Enable hono-openapi style output (@see https://hono.dev/examples/hono-openapi)
  openapi: true,

  // oxfmt FormatConfig for generated code output
  // format: {},

  // Add `.readonly()` to generated schemas
  readonly: true,

  // Generated files import one another relatively, under `pathAlias` when the target is in
  // the directory of the app entry (matches the `paths` in your tsconfig, e.g. "@/*":
  // ["src/*"]), and by the target's `package` from another package: the nearest
  // package.json above an output delimits its package.
  pathAlias: '@/',

  // Components (OpenAPI Components Object). `output` (single file) and the per-type
  // fields below are mutually exclusive — pick one mode.
  //
  // Single-file mode (the default, at `src/components/index.ts`): schemas and every
  // other component kind in one `.ts` module, schema types exported.
  // components: { output: 'src/components/index.ts' },
  //
  // Per-type mode: only the configured kinds are generated (schemas always, at
  // `src/components/index.ts` unless configured). `split: true` makes `output` a
  // directory (one file per entry + an index.ts barrel); omit it for a single `.ts`
  // file. `exportTypes: true` adds inferred type aliases on schemas / parameters /
  // headers / mediaTypes. `package` names the package an output is written into, for
  // the files of other packages that import it; leave it out while everything is in
  // one package.
  components: {
    // package: '@packages/components', // with `output`, when it is a package of its own
    schemas: {
      output: 'src/components/schemas',
      split: true,
      exportTypes: true,
      // package: '@packages/schemas',
    },
    responses: {
      output: 'src/components/responses',
      split: true,
      // package: '@packages/responses',
    },
    parameters: {
      output: 'src/components/parameters',
      split: true,
      exportTypes: true,
      // package: '@packages/parameters',
    },
    examples: {
      output: 'src/components/examples',
      split: true,
      // package: '@packages/examples',
    },
    requestBodies: {
      output: 'src/components/requestBodies',
      split: true,
      // package: '@packages/requestBodies',
    },
    headers: {
      output: 'src/components/headers',
      split: true,
      exportTypes: true,
      // package: '@packages/headers',
    },
    securitySchemes: {
      output: 'src/components/securitySchemes',
      split: true,
      // package: '@packages/securitySchemes',
    },
    links: {
      output: 'src/components/links',
      split: true,
      // package: '@packages/links',
    },
    callbacks: {
      output: 'src/components/callbacks',
      split: true,
      // package: '@packages/callbacks',
    },
    pathItems: {
      output: 'src/components/pathItems',
      split: true,
      // package: '@packages/pathItems',
    },
    mediaTypes: {
      output: 'src/components/mediaTypes',
      split: true,
      exportTypes: true,
      // package: '@packages/mediaTypes',
    },
  },

  // The typed Hono client of the generated app (the `hcWithType` of the Hono guide),
  // exported as `client`; rpc and the query hooks import it. With `basePath` it is handed
  // out from below the base path, so `client.pets.$get` addresses `/api/pets`. `baseUrl` is
  // '/' (the default) for the same origin, `{ env }` for an environment variable read when
  // the client is created (`import.meta.env`, or `source: 'process.env'`), or
  // `{ env, import, name }` for a property of the environment object a module of yours
  // exports. A fixed URL is not taken: it differs between environments.
  // The client-code generators (RPC + framework query hooks + types + docs) each write one
  // file: `output` (a directory is normalized to `<dir>/index.ts`). Query-hook keys are
  // camelCase (`tanstackQuery`, ...).
  client: {
    output: 'src/client.ts',
    baseUrl: { env: 'VITE_API_URL' },
    credentials: 'include', // 'include' | 'same-origin' | 'omit'
    // import: '@packages/server', // the app's package, when the client is written into another
    // package: '@packages/client', // the name other packages import the client by
    rpc: {
      output: 'src/rpc.ts',
      parseResponse: true,
      docs: false, // operation summary/description as JSDoc
    },
    swr: { output: 'src/swr.ts' },
    tanstackQuery: { output: 'src/tanstack-query.ts' },
    svelteQuery: { output: 'src/svelte-query.ts' },
    vueQuery: { output: 'src/vue-query.ts' },
    preactQuery: { output: 'src/preact-query.ts' },
    solidQuery: { output: 'src/solid-query.ts' },
    angularQuery: { output: 'src/angular-query.ts' },
    // Self-contained `App` type for RPC client distribution
    type: {
      output: 'src/types.ts',
      readonly: true,
    },
    // API reference docs
    docs: {
      output: 'src/docs',
      entry: 'src/index.ts',
      basePath: '/api',
      curl: true,
      baseUrl: 'http://localhost:3000',
    },
  },
})
```

## Usage

### CLI

```bash
npx takibi-hono                               # runs ./takibi-hono.config.ts
npx takibi-hono --config config/api.config.ts # runs another config file (-c)
```

`--help`, `--version` and `--completions <bash|zsh|fish|sh>` are also available.

### Vite Plugin

```ts
// vite.config.ts
import { takibiHonoVite } from 'takibi-hono/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [takibiHonoVite()],
})
```

The plugin watches your OpenAPI/TypeSpec files and config, automatically regenerating code on changes.

## Handler Merge

When regenerating, takibi-hono **preserves your hand-written code**:

- Handler bodies `(c) => { ... }` — your implementation logic is kept
- User-added imports — only generator-managed imports are updated
- Non-handler code (helpers, constants, middleware) — left untouched
- JSDoc comments on routes — restored after regeneration

Route metadata (describeRoute, validators) is updated from the spec. New routes are added with a stub `(c) => {}`. Deleted routes are removed.

## Example

Given a TypeSpec input:

```tsp
// main.tsp
import "@typespec/http";

using Http;

@service(#{ title: "Takibi Hono API" })
namespace TakibiHonoAPI;

@route("/hono")
interface Hono {
  @summary("Welcome")
  @doc("Returns a welcome message from Takibi Hono.")
  @get welcome(): { message: string };
}
```

With config:

```ts
import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  input: 'main.tsp',
  schema: 'valibot',
  openapi: true,
})
```

takibi-hono generates:

```ts
// src/handlers/hono.ts
import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as v from 'valibot'

export const honoHandler = new Hono().get(
  '/hono',
  describeRoute({
    operationId: 'Hono_welcome',
    summary: 'Welcome',
    description: 'Returns a welcome message from Takibi Hono.',
    responses: {
      '200': {
        description: 'The request has succeeded.',
        content: { 'application/json': { schema: resolver(v.object({ message: v.string() })) } },
      },
    },
  }),
  (c) => {},
)
```

```ts
// src/index.ts
import { Hono } from 'hono'

import { honoHandler } from './handlers'

const app = new Hono()

export const api = app.route('/', honoHandler)

export default app
```

You write your logic in the handler body. On the next regeneration, your code is preserved:

```ts
;(c) => c.json({ message: 'Takibi Hono🔥' })
```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/nakita628/takibi-hono?tab=MIT-1-ov-file) for more information.
