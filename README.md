# Takibi Hono

![](https://github.com/nakita628/takibi-hono/blob/main/assets/takibi-hono.gif)

## OpenAPI to Hono Code Generator

**[Takibi Hono](https://www.npmjs.com/package/takibi-hono)** generates type-safe [Hono](https://hono.dev/) code from [OpenAPI](https://www.openapis.org/) / [TypeSpec](https://typespec.io/) specifications.

- OpenAPI schemas to validation schemas (`zod` | `valibot` | `typebox` | `arktype` | `effect`)
- [hono-openapi](https://hono.dev/examples/hono-openapi) route definitions with `describeRoute`
- App entry point + handler stubs with [handler merge](#handler-merge)
- Component splitting into separate files (schemas, parameters, headers, etc.)
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

  // Resolve generated imports through a path alias instead of relative paths
  // (matches the `paths` in your tsconfig, e.g. "@/*": ["src/*"])
  pathAlias: '@/',

  // Components (OpenAPI Components Object). `output` (single-file aggregate) and
  // the per-type fields below are mutually exclusive — pick one mode. `split: true`
  // makes a per-type `output` a directory (one file per entry + an index.ts
  // barrel); omit it (default `false`) for a single bundled `.ts` file. `import`
  // overrides the auto-derived specifier. `exportTypes: true` adds
  // `export type X = z.infer<typeof XSchema>` aliases on schemas / parameters /
  // headers / mediaTypes.
  //
  // Single-file mode:
  // components: { output: 'src/components.ts' },
  components: {
    schemas: {
      output: 'src/components/schemas',
      split: true,
      import: '../schemas',
      exportTypes: true,
    },
    responses: {
      output: 'src/components/responses',
      split: true,
      import: '../responses',
    },
    parameters: {
      output: 'src/components/parameters',
      split: true,
      import: '../parameters',
      exportTypes: true,
    },
    examples: {
      output: 'src/components/examples',
      split: true,
      import: '../examples',
    },
    requestBodies: {
      output: 'src/components/requestBodies',
      split: true,
      import: '../requestBodies',
    },
    headers: {
      output: 'src/components/headers',
      split: true,
      import: '../headers',
      exportTypes: true,
    },
    securitySchemes: {
      output: 'src/components/securitySchemes',
      split: true,
      import: '../securitySchemes',
    },
    links: {
      output: 'src/components/links',
      split: true,
      import: '../links',
    },
    callbacks: {
      output: 'src/components/callbacks',
      split: true,
      import: '../callbacks',
    },
    pathItems: {
      output: 'src/components/pathItems',
      split: true,
      import: '../pathItems',
    },
    mediaTypes: {
      output: 'src/components/mediaTypes',
      split: true,
      import: '../mediaTypes',
      exportTypes: true,
    },
  },

  // Client-code generators (RPC + framework query hooks + types + docs). Each
  // generator takes `output` + `import`; `client` is the exported client variable
  // (default 'client'). Query-hook keys are camelCase (`tanstackQuery`, ...).
  client: {
    rpc: {
      output: 'src/rpc',
      import: '../lib',
      split: true,
      client: 'client',
      parseResponse: true,
      docs: false, // operation summary/description as JSDoc
    },
    swr: {
      output: 'src/swr',
      import: '../lib',
      split: true,
      client: 'client',
    },
    tanstackQuery: {
      output: 'src/tanstack-query',
      import: '../lib',
      split: true,
      client: 'client',
    },
    svelteQuery: {
      output: 'src/svelte-query',
      import: '../lib',
      split: true,
      client: 'client',
    },
    vueQuery: {
      output: 'src/vue-query',
      import: '../lib',
      split: true,
      client: 'client',
    },
    preactQuery: {
      output: 'src/preact-query',
      import: '../lib',
      split: true,
      client: 'client',
    },
    solidQuery: {
      output: 'src/solid-query',
      import: '../lib',
      split: true,
      client: 'client',
    },
    angularQuery: {
      output: 'src/angular-query',
      import: '../lib',
      split: true,
      client: 'client',
    },
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
npx takibi-hono
```

### Vite Plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { takibiHonoVite } from 'takibi-hono/vite-plugin'

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
    description: 'Returns a welcome message from Takibi Hono.',
    summary: 'Welcome',
    operationId: 'Hono_welcome',
    responses: {
      200: {
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
(c) => c.json({ message: 'Takibi Hono🔥' })
```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/nakita628/takibi-hono?tab=MIT-1-ov-file) for more information.
