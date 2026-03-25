# Takibi Hono

OpenAPI / TypeSpec to [Hono](https://hono.dev/) application code generator.

Supports schema libraries: `zod` | `valibot` | `typebox` | `arktype` | `effect`

## Install

```bash
pnpm add -D takibi-hono
```

## Setup

Create `takibi-hono.config.ts`:

```ts
// takibi-hono.config.ts
import { defineConfig } from 'takibi-hono/config'

export default defineConfig({
  // OpenAPI spec file (.yaml, .json, or .tsp)
  input: 'openapi.yaml',

  // Schema library for validation
  schema: 'zod', // "zod" | "valibot" | "typebox" | "arktype" | "effect"

  // Base path prefix for all routes
  basePath: '/api',

  // Enable hono-openapi style output
  // @see https://hono.dev/examples/hono-openapi
  openapi: true,

  // oxfmt FormatOptions for generated code output
  // @see https://www.npmjs.com/package/oxfmt
  // format: {},

  // Code generation options
  'takibi-hono': {
    readonly: true, // Add 'as const' to generated schemas

    // Export type inference from schemas
    exportSchemasTypes: true,
    exportParametersTypes: true,
    exportHeadersTypes: true,

    // Handler stub generation
    handlers: {
      output: './src/handlers', // Output directory for handler files
    },

    // Split components into separate files (OpenAPI Components Object)
    components: {
      output: './src/components', // Single file output for all components

      schemas: {
        output: './src/schemas',
        exportTypes: true,
        split: true,
        import: '../schemas',
      },
      parameters: {
        output: './src/parameters',
        exportTypes: true,
        split: true,
        import: '../parameters',
      },
      headers: {
        output: './src/headers',
        exportTypes: true,
        split: true,
        import: '../headers',
      },
      securitySchemes: {
        output: './src/securitySchemes',
        split: true,
        import: '../securitySchemes',
      },
      requestBodies: {
        output: './src/requestBodies',
        split: true,
        import: '../requestBodies',
      },
      responses: {
        output: './src/responses',
        split: true,
        import: '../responses',
      },
      examples: {
        output: './src/examples',
        split: true,
        import: '../examples',
      },
      links: {
        output: './src/links',
        split: true,
        import: '../links',
      },
      callbacks: {
        output: './src/callbacks',
        split: true,
        import: '../callbacks',
      },
      pathItems: {
        output: './src/pathItems',
        split: true,
        import: '../pathItems',
      },
      webhooks: {
        output: './src/webhooks',
        split: true,
        import: '../webhooks',
      },
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
        content: {
          'application/json': {
            schema: resolver(v.object({ message: v.string() })),
          },
        },
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
  (c) => c.json({ message: 'Takibi Hono🔥' }),
```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/nakita628/takibi-hono?tab=MIT-1-ov-file) for more information.