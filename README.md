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
  readonly: true, // Add 'as const' to generated schemas

  // Handler stub output directory (any directory you like)
  output: 'src/handlers',

  // Resolve generated imports through a path alias instead of relative paths
  // (matches the `paths` in your tsconfig, e.g. "@/*": ["src/*"])
  pathAlias: '@',

  // Components (OpenAPI Components Object). `output` and the per-type fields
  // are mutually exclusive — pick one mode:
  //
  // (a) Single-file: aggregate every component into one `.ts` file
  components: {
    output: 'src/components.ts',
  },
  //
  // (b) Per-type: configure each component kind independently
  // components: {
  //   schemas: { output: 'src/schemas', split: true, exportTypes: true },
  //   responses: { output: 'src/responses.ts' },
  // },
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
(c) => return c.json({ message: 'Takibi Hono🔥' }),
```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/nakita628/takibi-hono?tab=MIT-1-ov-file) for more information.
