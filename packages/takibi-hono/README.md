# Takibi Hono

![Takibi Hono demo](https://github.com/nakita628/takibi-hono/blob/main/assets/takibi-hono.gif)

## OpenAPI to Hono Code Generator

**[Takibi Hono](https://www.npmjs.com/package/takibi-hono)** generates type-safe [Hono](https://hono.dev/) code from [OpenAPI](https://www.openapis.org/) / [TypeSpec](https://typespec.io/) specifications.

- OpenAPI schemas to validation schemas (`zod` | `valibot` | `typebox` | `arktype` | `effect`)
- [hono-openapi](https://hono.dev/examples/hono-openapi) route definitions with `describeRoute`
- Hono's [`defineHandler`](https://hono.dev/docs/helpers/factory#definehandler) (Hono 5): one handler per operation, validating the request and the response
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

  // Hono's `defineHandler` (hono/factory, Hono 5) in place of the validator middleware: one
  // `<method><Path>Handler` per operation (`postPetsHandler`), validating the request targets and
  // the response inside the handler, registered on the group's Hono. Not combined with `openapi`
  // (hono-openapi reads validators in front of a handler) nor with `schema: 'typebox'` (no
  // Standard Schema interface). See [defineHandler](#definehandler).
  // defineHandler: true,

  // oxfmt FormatConfig for generated code output
  // format: {},

  // Add `.readonly()` to generated schemas
  readonly: true,

  // `true` divides the app into groups, one per handler file (the first segment of the
  // path). The app entry exports each group under its name (`pets`, `__root`) instead of
  // `api`, and `client` writes one client per group (`petsClient`), typed by that group's
  // routes alone, so the type a caller works out stays small. Every group is still
  // registered on the one app.
  split: false,

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

  // The typed Hono client of the generated app, exported as `client`. Its type is declared
  // once (the `hcWithType` of the Hono guide), so it is worked out when this file is compiled
  // and not again by every file that calls the client. With `basePath` it is handed out from
  // below the base path, so `client.pets.$get` addresses `/api/pets`. `baseUrl` is '/' (the
  // default) for the same origin, `{ env }` for an environment variable read when the client
  // is created (`import.meta.env`, or `source: 'process.env'`), or `{ env, import, name }`
  // for a property of the environment object a module of yours exports. A fixed URL is not
  // taken: it differs between environments.
  client: {
    output: 'src/client.ts',
    baseUrl: { env: 'VITE_API_URL' },
    credentials: 'include', // 'include' | 'same-origin' | 'omit'
    // import: '@packages/server', // the app's package, when the client is written into another
    // package: '@packages/client', // the name other packages import the client by
  },

  // RPC functions and framework query hooks over the client. Each writes one file: `output`
  // (a directory is normalized to `<dir>/index.ts`). They need `client`.
  rpc: {
    output: 'src/rpc.ts',
    parseResponse: true,
    docs: false, // operation summary/description as JSDoc
  },
  swr: { output: 'src/swr.ts' },
  'tanstack-query': { output: 'src/tanstack-query.ts' },
  'svelte-query': { output: 'src/svelte-query.ts' },
  'vue-query': { output: 'src/vue-query.ts' },
  'preact-query': { output: 'src/preact-query.ts' },
  'solid-query': { output: 'src/solid-query.ts' },
  'angular-query': { output: 'src/angular-query.ts' },

  // Self-contained `App` type for RPC client distribution
  type: {
    output: 'src/types.ts',
    readonly: true,
  },

  // API reference docs (Markdown). `curl: true` writes curl commands against `baseUrl`;
  // otherwise Hono request examples importing `entry`.
  docs: {
    output: 'docs/api.md',
    curl: true,
    baseUrl: 'http://localhost:3000',
  },
})
```

## Usage

### CLI

```bash
npx takibi-hono                               # runs ./takibi-hono.config.ts
npx takibi-hono --config config/api.config.ts # runs another config file (-c)
npx takibi-hono openapi.yaml -o src/api.ts    # one-shot: one file, no config
npx takibi-hono -o src/api.ts --schema valibot
```

`--help`, `--version` and `--completions <bash|zsh|fish|sh>` are also available.

The one-shot mode writes a single file: the document's `components.schemas`, one
[`defineHandler`](#definehandler) per operation (`getPetsHandler`), and `api`, a Hono that
registers every operation. The input defaults to the one of `openapi.yaml`, `openapi.json` or
`main.tsp` in the current directory, and the library (`-s`) to `zod`. Mount `api` on your app
(`new Hono().route('/', api)`), and run it again after a spec change: the handlers you wrote
survive, as in [handler merge](#handler-merge).

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

## defineHandler

`defineHandler: true` (or the one-shot `-o`) generates Hono 5's
[`defineHandler`](https://hono.dev/docs/helpers/factory#definehandler) from `hono/factory`: one
export per operation, named by its method and path as hono-takibi names a route (`postPetsHandler`
where hono-takibi has `postPetsRoute`), and the group's Hono registering them.

```ts
// src/handlers/pets.ts
import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'

import { NewPetSchema, PetSchema } from '../components'

export const postPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  json: NewPetSchema,
  response: PetSchema,
})(async (c, { header, json }) => {})

export const getPetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int().min(1) }),
  response: PetSchema,
})(async (c, { param }) => {})

export const petsHandler = new Hono()
  .post('/pets', postPetsHandler)
  .get('/pets/:petId', getPetsPetIdHandler)
```

Each request target the operation declares (`param`, `query`, `header`, `cookie`, `form`,
`json`) is a Standard Schema option, and `response` is the JSON schema of its success
responses (`anyOf` them when they differ), so the value the handler returns is validated too.
The stub takes the validated targets apart; fill it in, set the status with `c.status()`, and
return the value. On regeneration the handler you wrote is kept, middleware you put before it
(`defineHandler({...})(auth, async (c, { json }) => ...)`) included, and the options are the
spec's again.

`defineHandler` validates with Standard Schema, so `schema` is `zod`, `valibot`, `arktype`
or `effect`; an arktype `Type` is handed over as its `~standard` object, which keeps Hono's
types from overflowing on it. hono-openapi's `describeRoute` reads validators in front of a
handler, so `openapi` and `defineHandler` do not combine. Hono 5 is a release candidate while
this is written, and `defineHandler` is marked experimental there.

## Handler Merge

When regenerating, takibi-hono **preserves your hand-written code**:

- Handler bodies `(c) => { ... }` — your implementation logic is kept
- `defineHandler` handlers, by name, with the middleware before them — their options are regenerated
- User-added imports — only generator-managed imports are updated; of one the generator also writes (`hono`, `hono/factory`), the names it does not import are kept
- Non-handler code (helpers, constants, middleware) — left untouched
- JSDoc comments on routes and `defineHandler` declarations — restored after regeneration

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
