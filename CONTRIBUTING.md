# Contributing to takibi-hono

Generates [Hono](https://hono.dev/) code — validation schemas (zod / valibot / typebox / arktype
/ effect), [hono-openapi](https://hono.dev/examples/hono-openapi) routes with `describeRoute`,
the app entry and handler stubs — from OpenAPI or TypeSpec. Published to npm as `takibi-hono`,
with a CLI and a Vite plugin. Built on Effect v4; formatted by oxfmt, linted by oxlint and tested
with Vitest, all through vite-plus (`vp`) on pnpm.

It owns only the Hono-specific part. Parsing, the OpenAPI types and the Components builders
(including `schemas` and `mediaTypes`) come from [`oas-truth`](https://www.npmjs.com/package/oas-truth).
The client-side keys are hono-takibi's (`client`, `rpc`, the kebab-case query hooks, `type`,
`docs`, at the top level). The typed Hono client (`client`) is generated here
(`src/generator/client.ts`); the rest (RPC, query hooks, the `App` type, docs) is delegated to the
client-generation dependency wired in `src/core/client.ts`, and rpc and the hooks import the
generated client.

This repository is operated **through agent conversation**, and this guide is the rules it is
run by, for people and agents alike: the layout, the commands and the definition of done, the
architecture and the code conventions, the tests, the docs, CI and releasing, and a playbook for
each recurring task. The config files are the source of truth: when an instruction contradicts
one, quote the config and ask before changing it.

Everything committed is written in **English** — code, comments, TSDoc, Markdown, commit
messages, workflow comments. Test data may be in any language.

## Layout

```text
packages/takibi-hono/          the published package (the only npm artifact)
  src/                         implementation; see Architecture for the layering
  vite.config.ts               pack (build), test and lint; the lint section is the standard
fixtures/vite-plugin/          a real Hono app driving the Vite plugin; its src/ is takibi-hono output
test/                          the end-to-end suite over the packaged CLI: cases/<name> (a config and
                               the golden copy of its output in expected/), specs/, runtime tests and
                               the Vite plugin case; see Tests
vite.config.ts                 fmt only: the formatting style every workspace inherits
pnpm-workspace.yaml            workspaces, the @typespec catalog, the Effect override, allowBuilds,
                               minimumReleaseAgeExclude
renovate.json                  dependency updates (Saturdays, Asia/Tokyo); see Dependencies
release-please-config.json     how release-please works out the next version from the commits
.release-please-manifest.json  the version last released, which release-please counts from
.markdownlint-cli2.jsonc       markdownlint: the structure of the Markdown
.textlintrc.yml                textlint: the prose (terminology, balanced pairs, no TODO)
cspell.config.yml              cspell: the spelling of every tracked file, code included
project-words.txt              the words cspell does not know but this project uses on purpose
.secretlintrc.json             secretlint: no credential is ever committed
scripts/typespec.ts            fails when the @typespec/* packages in pnpm-lock.yaml mix releases
scripts/actionlint.ts          downloads a pinned actionlint, verifies its checksum, runs it
scripts/zizmor.ts              downloads a pinned zizmor (workflow security audit), verifies it, runs it
.github/workflows/test.yml     Test: build, unit tests, `vp run check` (every linter)
.github/workflows/release-please.yml  Release PR: opens and merges the version bump, starts release.yml
.github/workflows/release.yml  after Test on main: tag, npm publish, GitHub release
.github/actionlint.yml         actionlint messages excused per file, each with its reason
.github/zizmor.yml             zizmor findings excused, each with its reason
README.md                      user docs; packages/takibi-hono/README.md is an identical copy
CONTRIBUTING.md                this guide: how the repository is run
```

## Commands

Run these from the repository root.

| Goal                                                                                                                                                    | Command                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Install dependencies                                                                                                                                    | `pnpm install --frozen-lockfile`              |
| Everything CI checks except the tests: oxfmt, oxlint (type-aware), the type check, then `pnpm lint`                                                     | `pnpm check`                                  |
| Autofix formatting, oxlint, markdownlint and textlint                                                                                                   | `pnpm fix`                                    |
| The repository linters: markdownlint, textlint, cspell, secretlint, the TypeSpec release check, actionlint, zizmor                                      | `pnpm lint`                                   |
| Unit tests, then the end-to-end suite (which needs `dist`)                                                                                              | `pnpm test`                                   |
| One test file                                                                                                                                           | `pnpm -F takibi-hono test src/<path>.test.ts` |
| The end-to-end suite alone (after a build)                                                                                                              | `pnpm -F @takibi-hono/test test`              |
| Accept changed generator output as the golden copy, after reading the diff                                                                              | `pnpm -F @takibi-hono/test update-expected`   |
| hono-takibi's parameter conformance suites, as a scorecard (red by design; see [the conformance scorecard](#the-conformance-scorecard-testconformance)) | `pnpm -F @takibi-hono/test conformance`       |
| Coverage                                                                                                                                                | `pnpm coverage`                               |
| Build `dist`                                                                                                                                            | `vp run takibi-hono#build`                    |
| Run the fixture app (after a build)                                                                                                                     | `pnpm -F fixture-vite-plugin dev`             |

- `pnpm lint` needs no global tool: the linters are root devDependencies, and actionlint / zizmor
  are downloaded once at a pinned, checksummed release into `node_modules/.cache` (so the first
  run needs the network). The scripts are TypeScript run by `node` directly.
- The fixture, the end-to-end suite and the published entry points run from `dist`: build before
  using them, never judge a change against a stale build.

## Definition of done

Before reporting a task finished, **`pnpm check` and `pnpm test` must both be green** — CI runs
the build, the tests and the check. One failure means not done. If you only ran part of it, say
which part.

- A behavior change ships with a test that fails before it and passes after.
- A change in generated output shows up as a golden diff in `test/`; it is accepted with
  `update-expected` only after the diff has been read and judged right, and the commit carries it.
- A change to the config, the CLI, the Vite plugin or the generated output updates the README in
  the same change (both copies; see [The README](#the-readme)).
- Report results as they are. Never call a task complete while hiding a failing command, and
  never make a check pass by weakening it.

## Invariants

- **Never relax a linter to get a change through.** Do not set a rule to `'off'`, do not lower
  `categories`, do not drop `denyWarnings`, do not add an `ignorePatterns` / `ignorePaths` /
  `ignoreWords` entry to hide a finding, do not add a typo to `project-words.txt`. If a rule
  genuinely does not fit, say so and ask.
- **Suppressions live next to the code, naming the rule and the reason:**
  `// oxlint-disable-next-line rule-name -- reason`. `reportUnusedDisableDirectives: 'deny'` is
  on, so a suppression that stopped firing must go. Do not add a file-level disable; the one that
  exists (`no-console` in `src/vite-plugin/index.ts`) is there because terminal output is the
  plugin's interface.
- **No `TODO` / `FIXME`** — `no-warning-comments` rejects them in source, textlint's `no-todo` in
  docs. Parked work belongs in the report.
- **No credential is ever committed.** secretlint scans every tracked file. When it reports one,
  remove it and tell the owner so the secret can be rotated; never excuse the finding.
- **Failures are typed Effect errors, never throws** — see [Effect](#effect).
- **The handlers directory and the app entry hold the user's code.** They are merged, never
  deleted, emptied or blindly overwritten — not by a cleanup, not on a config change. See the
  architecture rule.
- **Never hand-edit generated files:** `pnpm-lock.yaml` (let `pnpm install` write it), `dist/`,
  `coverage/`, and the generated parts of `fixtures/vite-plugin/src` (regenerate them).
- **`effect` and `@effect/platform-node` are pinned exactly** to the release `hono-takibi` uses
  (its Effects are composed in `src/core/client.ts`). They move together, in one change.
- **The C-layer `x-*` extensions (code injection) stay unsupported.** `unsafeCodeExtensions` is
  never passed to schema-truth. Read [Vendor extensions](#vendor-extensions-x-) before touching them.
- **Never bump `version` in `packages/takibi-hono/package.json` by hand**: release-please's pull
  request bumps it, and a new version on `main` is what publishes it. Never `npm publish`,
  `pnpm publish` or push a `v*` tag by hand, and never rename `release.yml` or its `release`
  environment without the matching npm Trusted Publisher change (see [Releasing](#releasing)).

## Working order

1. Read the rules in force for the files you are about to touch: the `lint` section of
   `packages/takibi-hono/vite.config.ts` and the matching sections of this guide.
2. Implement it the way the surrounding code is written. Do not introduce a second idiom.
3. `pnpm fix`, then `pnpm check` and `pnpm test`.
4. Commit and push (see [Git policy](#git-policy)).
5. In the final report state what changed, which commands verified it, and anything left out.

## Git policy

- The owner has authorized committing **directly to `main`** and pushing once `pnpm check` and
  `pnpm test` are green. Never force-push and never rewrite pushed history.
- One logical change per commit. The subject follows the existing history's conventional form,
  `type(scope): imperative summary` — `fix(vite-plugin): keep hand-written handlers when
  regenerating`, `ci: …`, `chore: …`, `docs: …`, `refactor: …`. The body explains why.
- The type is what releases (see [Releasing](#releasing)): `feat`, `fix` and `perf` that change
  `packages/takibi-hono/` publish a new version once they reach `main`; every other type does not.
- A release is release-please's own commit, `chore: bump version to <version>`, which its workflow
  opens and merges; never write one by hand.
- Do not commit generated output, secrets or local tooling files.

## Architecture

### Layering

Dependencies run **one way**. The order is enforced by the `no-restricted-imports` overrides in
the `lint` section of `packages/takibi-hono/vite.config.ts`, each with a message saying what the
directory may import:

```text
leaves       config  file  format  openapi  syntax    (no project-internal imports)
merge     -> syntax
helper    -> helper, syntax
generator -> helper
emit      -> format, file
core      -> helper, generator, emit, file, format, merge, openapi
cli       -> config, core
vite-plugin -> config, core, file
testing   -> file                                     (test-only; nothing in dist imports it)
```

Wanting to reach an upper layer means the design is wrong — pass the value in, or move the shared
code down. `core` cannot import `config`, which is why `core/layout.ts` declares its own
`TakibiHonoConfig` shape. A new edge, or a new `src/` directory, is a change to the overrides
first and to the code second.

### Responsibilities

| Directory      | Owns                                                                                                                                                                                                                                                                                                            | Never does                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `config/`      | the Effect Schema config, `defineConfig`, `parseConfig`, `readConfig`, `ConfigError`                                                                                                                                                                                                                            | import anything internal                                 |
| `openapi/`     | `parseOpenAPI`: oas-truth's parser wrapped in an Effect, `OpenAPIError`                                                                                                                                                                                                                                         | generate code                                            |
| `file/`        | every file operation, over `FileSystem`, plus `fileSystemLayer`                                                                                                                                                                                                                                                 | decide what to write                                     |
| `format/`      | oxfmt through the `FormatOptions` reference, `FormatError`                                                                                                                                                                                                                                                      | touch the filesystem                                     |
| `emit/`        | format → mkdir → write (`emit`, `emitFiles`)                                                                                                                                                                                                                                                                    | build code                                               |
| `syntax/`      | oxc-parser wrapped for reading TypeScript: `parseSource` / `parseModule`, `textOf`, `walk`, `descendantsWhere`                                                                                                                                                                                                  | generate or rewrite code                                 |
| `merge/`       | pure merges of regenerated code into the existing handler and app files, over `syntax`; an existing file that does not parse is kept as it is                                                                                                                                                                   | know about OpenAPI or the filesystem                     |
| `helper/`      | `library.ts` (the per-lib table: Standard Schema bridge, ref registration, import candidates, `makeInlineAdapter`), `identifiers.ts`, `imports.ts`, `operations.ts` (paths / webhooks → routes)                                                                                                                 | file I/O                                                 |
| `generator/`   | pure code builders: `schemas.ts` (oas-truth's `makeSchemaDeclarations`, plus the arktype prologue), `components.ts` (oas-truth's `make*Declarations`), `handler.ts` (route chains and the app), `client.ts` (the typed Hono client)                                                                             | touch the filesystem, run an Effect                      |
| `core/`        | orchestration: `index.ts` (`hono()`), `layout.ts` (config → paths and import specifiers: relative inside a package, `pathAlias` inside the app directory, a target's `package` from another package), `packages.ts` (the nearest `package.json` above each output), `components.ts`, `handlers.ts`, `client.ts` | assemble code strings (`make*Code` lives in `generator`) |
| `cli/`         | the `takibi-hono` command on `effect/unstable/cli`                                                                                                                                                                                                                                                              | generator logic                                          |
| `vite-plugin/` | `takibiHonoVite()`: reload the config, regenerate on change, clean stale outputs                                                                                                                                                                                                                                | generator logic                                          |
| `testing/`     | `runGenerator` / `runGeneratorError`                                                                                                                                                                                                                                                                            | ship in `dist`                                           |

### One pipeline

The CLI and the Vite plugin both call only `hono()` (`src/core/index.ts`), which runs, stopping at
the first failure: `parseOpenAPI` → `resolveLayout` + `makePackageRoot` → `checkPackages` →
`writeComponents` → `writeHandlers` → `writeApp` → (opt-in) `makeClients`. Each `write*` takes the `Layout` and returns an Effect. Anything
that changes what gets generated belongs in `hono()` or below, so the two entry points cannot
disagree. What only the plugin does (config reload, cleaning split and stale outputs) says why in
its own comment.

With `openapi: false`, schemas are not registered as refs (`registerRef: false`) and each route
uses the library's plain Hono validator middleware (`sValidator`, or `tbValidator` for typebox).

### Output that holds the user's code

The handler files (one per first path segment, plus `webhooks.ts` in hono-openapi mode) and the app
entry are **merged**, not rewritten: `writeHandlers` / `writeApp` read the existing file and
`mergeHandlerFile` / `mergeAppFile` carry across handler bodies, user imports, non-handler code and
route JSDoc. `writeHandlers` itself deletes the handler files no route maps to any more.
`mergeAppFile` owns the route exports of the app entry: `api`, or with `split` one export per
handler file (`export const pets = app.route('/', petsHandler)`, its name from `toGroupName`).
The span from the first to the last is replaced, so turning `split` on or off swaps one form for
the other; the client groups and rpc / hooks' `grouping` use the same names.

- Never delete, empty or blindly overwrite that output — not in a cleanup, not in a split clean,
  not on a config change. (The Vite plugin once emptied the handlers directory before every run and
  lost every handler body; its tests now pin that it does not.)
- A change to what they emit must keep the merge able to carry the user's edits across; add a
  merge test when the emitted structure changes.

Everything else — components, split component directories, clients — is the generator's and is
rewritten wholesale; the Vite plugin empties split component directories before a run (client
outputs are single files).

### The oas-truth boundary

- OpenAPI types (`OpenAPI`, `Schema`, `Components`, …) and `parseOpenAPI` are imported straight
  from `oas-truth`; there is no re-export module.
- **No direct dependency on schema-truth.** Every validator expression comes from oas-truth's
  adapter (`toExpression`), so schema-truth's version is decided by oas-truth and the output
  cannot drift.
  - Named `components.schemas` declarations come from oas-truth's `makeSchemaDeclarations`. This
    package passes `typeAlias: 'key'` (the OpenAPI key as the type name) and, with
    `openapi: true`, `ref: true` for hono-openapi ref registration.
  - `readonly` is `x-readonly: true` on object / array nodes (oas-truth applies it).
  - Cycle handling (lazy / `Type.Cyclic` / `scope`, the TS7022 annotation) lives in oas-truth.
- Inline schemas go through `makeInlineAdapter`: oas-truth's `makeAdapter` plus hono-openapi's
  `resolver(...)` via `wrapSchema`. Handler routes pass `slots: ['response-content']` so only
  response `content` is wrapped; component builders omit `slots` and wrap every `schema:` slot.
- Values are emitted with `valueToCode` / `makeSchemaReplacements`. `resolver(...)` wraps **only
  response `content` schemas** in `describeRoute`: that is all hono-openapi resolves; header
  schemas stay plain JSON Schema. Collision maps come from oas-truth's `makeSchemaIdentifiers`.
- Path, query, header and cookie parameters are coerced by schema-truth's `paramIn`
  (`adapter.toExpression(schema, location)`), one synthesized object schema per location, and a
  form body by `paramIn: 'formData'`. This was once kept here because the five libraries had no
  symmetric coercion; schema-truth covers all of them, so it is delegated: zod `z.coerce`, valibot
  `v.transform(Number)`, typebox `Codec`, arktype `.pipe` and effect `FiniteFromString`.
  A parameter's `style` / `explode` / `allowEmptyValue` are not passed by the handler validators:
  `toExpression` applies them to the expression's root, which is the synthesized object, not the
  parameter. `components.parameters` (oas-truth's `makeParametersCode`) applies them per
  parameter.
  A `#/components/schemas/*` reference inside a coerced schema is expanded into its component
  when the component's expression differs with `paramIn` (the component is declared once,
  without it, so an integer component would never accept its text). One that reads the same
  either way, such as a string enum, stays a reference and keeps its `$ref` in the document.
- **Never patch oas-truth's output with string edits.** Fix the mistake in oas-truth or
  schema-truth.

### Ref registration (hono-openapi `components.schemas`)

With `openapi: true`, every `components.schemas` declaration is registered under its name
(`ref: true` on oas-truth's `makeSchemaDeclarations`):

- zod `.meta({ ref })`, valibot `v.pipe(x, v.metadata({ ref }))`, arktype `.configure({ ref })`,
  effect `.annotate({ identifier })` are **added on the outside only** — inner meta is inherited.
- typebox puts `ref` in the outermost builder's options argument (schema-truth / the
  adapter's `toExpression(..., { ref })`).
- The `description` / `examples` / `deprecated` meta schema-truth emits is never rewritten.

### Vendor extensions (`x-*`)

Three layers, decided 2026-05-24:

- **A — messages**: supported, always on; emitted as validator error messages. `x-error-message`,
  `x-pattern-message`, `x-minimum-message`, `x-required-message` and the rest of the family.
- **B — transforms**: supported, always on; declarative keys schema-truth emits per lib.
  `x-trim`, `x-coerce`, `x-readonly`, `x-stringbool`, `x-brand`, `x-normalize` and the like.
- **C — code injection**: **unsupported, permanently.** The ten keys are `x-refine`,
  `x-superRefine`, `x-preprocess`, `x-codec`, `x-transform`, `x-pipe`, `x-check`, `x-filter`,
  `x-narrow` and `x-morph`.
  schema-truth's `unsafeCodeExtensions` is never passed, by takibi-hono or by oas-truth's
  adapter.

<!-- The bypass examples below split a word on purpose. cspell:ignore tructor -->

Why C stays sealed: it pastes spec strings into generated code verbatim, which is remote code
execution wherever a spec crosses a trust boundary (a SaaS, a playground); schema-truth's
denylist can be bypassed through built-in prototypes, such as
`String.prototype.concat.call('proc','ess')`, `this['cons'+'tructor']` and `(0).constructor`; an
opt-in is one config line away from being enabled by mistake; and one RCE after opening it would
be irreversible. Reopening needs all of: a sandboxed
evaluator in schema-truth instead of the denylist, a fresh threat-model review, and published
operating guidance for SaaS / playground use. Until then a proposal to expose it is declined.

**Transparency contract:** takibi-hono and oas-truth's adapter pass **every** `x-*` key through to
schema-truth unfiltered. C-layer keys disappear only because schema-truth defaults
`unsafeCodeExtensions` to `false` — never because takibi-hono strips them.
`generator/schemas.test.ts` (all five libs: A and B applied, C dropped) and
`helper/library.test.ts` (the inline path drops C) pin that. Per-extension behavior is
schema-truth's to test.

### Public API

What users can import is exactly the `exports` map of `packages/takibi-hono/package.json`:

- `takibi-hono/config` → `src/config/index.ts` (`defineConfig` and the config types)
- `takibi-hono/vite-plugin` → `src/vite-plugin/index.ts` (`takibiHonoVite`)
- the `takibi-hono` bin → `dist/index.js` ← `src/index.ts` → `src/cli`

`pack.entry` in `packages/takibi-hono/vite.config.ts` has one entry per subpath; adding a subpath
means adding it in both places. The config schema, the CLI flag and the Vite plugin's behavior are
public too: changing them updates the README in the same change. Do not introduce a breaking change
on your own initiative — say what it would take and ask.

## TypeScript conventions

The source of truth is the `lint` section of `packages/takibi-hono/vite.config.ts`: type-aware,
with `typeCheck`, `denyWarnings` and `correctness` / `suspicious` / `perf` as errors. What follows
is what cannot be worked around. `*.test.ts` relaxes some of it — see
[What tests may do that `src` may not](#what-tests-may-do-that-src-may-not).
Effect-specific shapes are in [Effect](#effect).

### Declarations and control flow

- A module-level function is a **`function` declaration** (`func-style: declaration`). Arrows
  are for callbacks and closures inside a function.
- **No `let` and no reassignment.** Write one `const` expression — a ternary, `reduce`, `map`, or
  an extracted function. State that must change over time lives in a `const` object whose property
  changes (`pluginState.current` in the Vite plugin). The one module-level `let` is
  `reloadCount` in `src/config`.
- Initialize at the declaration (`init-declarations`). No writing through a parameter
  (`no-param-reassign` with `props: true`), no `++` (`no-plusplus`; use `+= 1`).
- Return early; avoid nested `if` / `else` (`no-else-return`, `no-lonely-if`). One-line guard
  clauses may drop their braces (`curly: multi-line`).
- Prefer pure functions; keep a side effect visibly separate. A file past ~200 lines is a signal to
  split its responsibilities.

### Types

- **`type X = {...}` only — no `interface`** (`consistent-type-definitions: 'type'`).
- **No `any`, no `!` non-null assertion, no type assertions**
  (`consistent-type-assertions` with `assertionStyle: 'never'`). Take `unknown` and narrow it with
  a guard. The one sanctioned cast is in `src/core/client.ts`: the OpenAPI document handed to the
  client generator, whose own document type is structurally equivalent. It is suppressed on its
  line with the reason.
- Every `unsafe-*` rule is an error. `exactOptionalPropertyTypes` is on: an optional property that
  may hold `undefined` is typed `?: T | undefined`.
- Write a simple union (`'a' | 'b'`) inline in the signature. Name a type only when it is complex
  or repeated, next to its users (`Layout` and `TakibiHonoConfig` in `src/core/layout.ts`). Never a
  `types.ts` dumping ground.
- Type imports use `import type`, in their own statement
  (`consistent-type-imports`, `consistent-type-specifier-style`). `@ts-ignore` is banned;
  `@ts-expect-error` needs a reason.

### Imports and exports

- **A relative specifier carries its `.js` extension** (`import/extensions: always`). The package
  resolves NodeNext-style at runtime and `tsc` does not check it.
- **Do not export what nothing else imports.** "Only a test uses it" is not a reason to export —
  test through the public function. A barrel exists only when something imports from it.
- **No default exports** (`import/no-default-export`), except where a tool requires one — a
  `*.config.ts`, suppressed on that line with the reason.
- ESM only: no `require`, no CommonJS. Node built-ins use the `node:` prefix.
- Respect the [layering](#layering); `no-restricted-imports` reports a wrong edge.

### Errors and async

- Do not throw in `src`: fail through the Effect error channel. A throw that cannot be avoided (a
  test fixture, generated code) throws an `Error` with a message.
- A catch binding is named **`error`** (`unicorn/catch-error-name`).
- No floating promises (`no-misused-promises`); a deliberate fire-and-forget is `void promise`.

### Details

- `console` is banned in `src` except in the Vite plugin, whose terminal output is its interface.
  The CLI prints through Effect's `Console`.
- Regular expressions carry the `u` flag (`require-unicode-regexp`).
- Template literals over concatenation (`prefer-template`). A `${...}` inside a single-quoted
  string is rejected (`no-template-curly-in-string`) — a real hazard in a code generator.
- No leading-underscore identifiers, except Effect's `_tag`.
- Prefer `toSorted` / `at(-1)` / `replaceAll` / `startsWith` and the other modern built-ins the
  `unicorn` and `typescript/prefer-*` rules ask for.
- Do not hand-format. oxfmt (`pnpm fix`) owns layout and import order: printWidth 100, single
  quotes, no semicolons.

### Comments and TSDoc

- Comments say **why**, never what — the identifiers and types say what.
- Doc comments are TSDoc prose over a self-describing signature. No `@param` / `@returns`
  boilerplate; the type lives in the signature, never in the comment.

## Effect

The package is written on Effect v4 (`4.1.4`, pinned exactly to the release `hono-takibi` uses:
its client generators return Effects that `src/core/client.ts` composes, so the two must share
one `effect`. `oas-truth` hands over a result, not an Effect, so its schema-truth may pin
another release).

### One shape for an Effect program

```ts
export function readFile(path: string) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    return yield* fs
      .readFileString(path)
      .pipe(Effect.catchIf(isNotFound, () => Effect.succeed(null)))
  })
}
```

- A function that does I/O **returns an Effect** — never `{ ok, value | error }`, never a Promise.
- An Effect program is the return value of a named `function`, written as
  `return Effect.gen(function* () { ... })`, optionally followed by `.pipe(...)` for recovery or a
  provided service. Straight-line `yield*` steps with early-return guards.
- Sequential work is `Effect.forEach(..., { discard: true })`; independent work is
  `Effect.all(..., { concurrency: 'unbounded' })`.
- **Run an Effect only at a boundary**: `src/index.ts` (`NodeRuntime.runMain`), the Vite plugin's
  hooks, and `src/testing`. Everywhere else an Effect is returned, so its requirements stay visible
  to the caller.
- `Effect.promise` is for what cannot reject: a dynamic `import()` of a sibling module (the CLI
  loads `core` lazily), or `oas-truth`'s `parseOpenAPI`, which answers with a result. Anything that
  can reject goes through `Effect.tryPromise` with a `catch` that maps to a typed error.

### Errors

- Failures are tagged errors: `OpenAPIError` (`src/openapi`), `FormatError` (`src/format`),
  `ClientError` (`src/core/client.ts`), `LayoutError` (`src/core/layout.ts`) as `Data.TaggedError`, and `ConfigError` (`src/config`) as
  `Schema.TaggedError` because it comes out of a schema decode. Filesystem failures stay the
  platform's `PlatformError`.
- An external result or an unexported error type (oas-truth's result, the client generator's
  errors) is converted into one of our tagged errors in the module at that boundary.
- Every error carries a `message` written for the person who ran the command: what is wrong and,
  where possible, what to do. The CLI renders it as-is.
- Absorb only the failure you mean: `Effect.catchIf` on the specific reason, as `isNotFound` in
  `src/file` does, not a blanket `orElse`. The exception is a question that is genuinely
  advisory, such as `statOrNull` in the Vite plugin.
- `hono()` stops at the first failure. The Vite plugin reports a generation failure as a log line
  (`Effect.result`) so the dev server keeps running.

### Services

- The filesystem is `FileSystem.FileSystem`, provided once at a boundary: `NodeServices.layer` in
  the CLI entry, `fileSystemLayer` (`src/file`) in the Vite plugin and `src/testing`.
- **All file access goes through `src/file`** (`readFile` → `null`, `readdir` → `[]`, `unlink`
  forced, `mkdir` recursive, `writeFile`). Never `node:fs`. Only "not there" is absorbed.
- `writeFile` skips identical bytes. That skip is contract: the Vite plugin watches the project,
  and a rewrite would feed a change event back into it.
- oxfmt options travel as the `FormatOptions` reference (`src/format`), provided per run from the
  config's `format` block, so two runs in one process cannot leak options into each other.

### The config schema

- Config validation is `effect/Schema` in `src/config`, decoded with
  `onExcessProperty: 'error'` so an unknown key is rejected. A failure is
  `Invalid config: <a.b.c>: <message>`; a missing file is `ConfigError` with `notFound: true`.
- A new option is a schema field whose check message names what is expected.
- Keep `defineConfig`'s input type (`ConfigSchema.Encoded`) accurate: it is what users get
  completion and errors from while they type.
- The CLI is `effect/cli` with one flag, `--config` / `-c`. `--help`, `--version` (the version
  of `package.json`, imported at build time) and `--completions` are the library's; the
  arguments come from the `Stdio` service (`process.argv` under `NodeServices.layer`, a given
  list under `Stdio.layerTest` in the tests). `ShowHelp` is raised only when no config was asked
  for and the default file is missing.

## Tests

Two suites, both on **Vitest through vite-plus**. The unit tests live next to what they cover
(`src/core/index.test.ts`); run them with `pnpm -F takibi-hono test`, one file with
`pnpm -F takibi-hono test src/<path>.test.ts`, coverage with `pnpm coverage`. The end-to-end
suite in `test/` drives the packaged CLI from `dist` (build first); `pnpm test` runs both.

### Shape

- Import from `vite-plus/test`: `import { describe, expect, it, vi } from 'vite-plus/test'`.
- `it`, never `test` (`vitest/consistent-test-it`). A title describes the behavior in a sentence.
- A table is **`it.each` / `describe.each`**, never a loop around `it` (`vitest/prefer-each`).
- **Exact matches only**: `toBe` / `toStrictEqual`. `toContain`, `toMatch` and other partial
  matchers are banned — they miss formatting drift and import-order changes. The one exception is
  array membership (`expect(files).toContain('pets.ts')`). Generated code is compared as the whole
  string.
- An equality matcher over `toBe(true)` on a comparison (`vitest/prefer-equality-matcher`);
  `toThrow` names its message (`vitest/require-to-throw-message`).
- Hooks sit at the top of their `describe`, in order
  (`prefer-hooks-on-top`, `prefer-hooks-in-order`). `xit` / `fit` prefixes and identical titles
  fail lint; never commit `it.only` or `it.skip`.

### What tests may do that `src` may not

`*.test.ts` may use `any`, `as` / `as never` casts, `let`, empty stub callbacks and cross-layer
imports when they spell the fixture out most clearly — coverage wins over strictness at the test
boundary. The `vite.config.ts` override for `**/*.test.ts` lists exactly what is relaxed;
everything else in [TypeScript conventions](#typescript-conventions) still applies.

### Working with the filesystem

- Generators resolve paths against `process.cwd()`. A test that writes files creates its own
  directory (`fs.mkdtempSync(path.join(os.tmpdir(), 'takibi-hono-…'))`), `process.chdir`s into it,
  and restores the previous cwd and removes the directory in `afterEach`. That is why the suite runs
  with `pool: 'forks'`.
- Run a generator Effect with `runGenerator` / `runGeneratorError` from `src/testing`.
- Parsing TypeSpec / OpenAPI and formatting real output is slow under a parallel run;
  `testTimeout` is 30s for that reason. Do not lower it to find a hang.
- The Vite plugin suite mocks `../core/index.js` and drives a mock dev server. Background work is
  awaited with `vi.waitFor` on its observable result, never a fixed sleep, and must finish before
  the test ends or its writes land in the next test's directory.

### The end-to-end suite (`test/`)

Modeled on nakita628/hono-takibi's `test` workspace. Before the suite runs, `scripts/generate.mjs`
(the vitest `globalSetup`) runs `dist/index.js --config cases/<name>/takibi-hono.config.ts` from
the workspace root for every case and writes two trees per case:

- `__generated__/<name>`: exactly what the CLI wrote. `runtime/golden.test.ts` holds it, file by
  file, to the committed `cases/<name>/expected/` — the same files, the same bytes.
- `__app__/<name>`: the same output made runnable — every `(c) => {}` stub filled with a handler
  that answers the validated data by target, plus the case's `overlay/` (what the generated code
  imports but the generator does not write). `runtime/typecheck.test.ts` runs `tsc -p` on every
  case that has a `tsconfig.json`, and the runtime tests import the apps from here.

A case is `cases/<name>/takibi-hono.config.ts` with `input` under `specs/` and every output under
`__generated__/<name>/`; a `seed/` is copied in before the CLI runs (the merge case). A case
without a `tsconfig.json` is golden only, and its config says why (components-effect: an
upstream oas-truth type error). The Vite plugin case is self-contained in `vite-plugin/`
because the plugin reads its config from the working directory. `pnpm-fix/` reads the plan
`vp run --dry-run` resolves for the root `pnpm fix`, which CI never runs, and pins the command it
starts in each workspace.

- A change in generated output fails `golden.test.ts` with a diff of the generated source. Read
  it; if the new output is right, `pnpm -F @takibi-hono/test update-expected` regenerates and
  copies `__generated__` over `expected/`, and the commit carries the change. Never edit
  `expected/` by hand.
- `TAKIBI_HONO_SKIP_GENERATE=1` runs one file against what is already generated; regeneration
  rewrites both trees, so two runs at once would read each other's half-written files.
- Runtime tests assert the shape the spec promises (an integer parameter arrives as a number, a
  value out of bounds is rejected with 400), through `toStrictEqual` on the validated data, never
  a library's error payload. What a library gets wrong upstream is left out with a comment saying
  what and why, not pinned as a contract.
- `scripts/copy.mjs` copies trees file by file: `fs.cpSync` drops the read bits on a devcontainer
  bind mount.

### The conformance scorecard (`test/conformance/`)

hono-takibi's parameter suites — query, path, header and cookie parameters, form and JSON
bodies — copied as they are (`conformance/<name>/{valid,invalid}.test.ts`, their documents as
`specs/conformance-<name>.yaml`) and run against the app takibi-hono generates from the same
document (`cases/conformance-<name>`, zod with hono-openapi). The handler stubs there answer
hono-takibi's description of the validated values (`stub.txt` and the `overlay/src/echo.ts` of
each case), and `conformance/<name>/app.ts` reshapes a validation failure into the 422 and issue
paths the suites expect of their own host.

It runs on request, `pnpm -F @takibi-hono/test conformance`, and it is red: it measures how far
schema-truth's coercion is from hono-takibi's, parameter by parameter, and is the list of
what to report upstream. Nothing in it is adjusted to pass; a suite that cannot load is noted at
the top of its document (the `format: trim` parameters). It is not part of `pnpm test` or CI.
`TAKIBI_HONO_CONFORMANCE_LIB=valibot` (or `arktype`, `effect`) runs the suites against the
`cases/conformance-<name>-<library>` apps instead of zod's; `TAKIBI_HONO_CONFORMANCE_DEBUG=1`
prints what each rejected request was told. The generated output of every library's case is
pinned as golden like any other case.

### Coverage of behavior

- A bugfix ships with a test that fails before it and passes after. Prove it: revert the fix,
  watch the test fail, restore it.
- Assert through the observable result — files on disk and their contents, the generated source,
  log lines — rather than internals. A test is not a reason to export a function.
- The `x-*` transparency tests in `generator/schemas.test.ts` and `helper/library.test.ts` guard
  a security decision (see [Vendor extensions](#vendor-extensions-x-)). Do not weaken them.
- For a change to the Vite plugin or the generated handlers, the end-to-end suite covers the
  running app; `fixtures/vite-plugin` remains the place to watch the dev server by hand, as
  [Check a change in the fixture](#check-a-change-in-the-fixture) describes.

## Documentation

Three linters split the work and never overlap: **markdownlint** owns the document structure,
**textlint** the prose, **cspell** the individual words. All three run in `pnpm lint`; `pnpm fix`
autofixes markdownlint and textlint. oxfmt (`pnpm fix`) wraps Markdown prose and tables.

### The README

`README.md` is the user documentation: install, setup (minimal and full config), the CLI, the
Vite plugin, handler merge and a worked example. It exists **twice, identically**: the root copy
is what GitHub shows, `packages/takibi-hono/README.md` is what npm shows. Edit one and copy it
over the other in the same change (`cmp README.md packages/takibi-hono/README.md` is silent when
they match).

- Links are absolute `https://github.com/...` / `https://...` URLs: a relative link breaks on npm.
- A change to the config, the CLI or the Vite plugin updates the matching section — the
  `Full Config` block, `Usage`, `Handler Merge` — in the same change. Keep the `Full Config`
  block a config that actually passes `parseConfig`.
- Images carry alt text.

### This guide

`CONTRIBUTING.md` is the one place the rules live, read by people and agents alike: there is no
per-tool copy of it. It states what the repository actually does — when the code and this guide
disagree, fix the one that is wrong in the same change rather than leaving them apart. It is
linted like any other Markdown.

### Structure (markdownlint)

- Every default rule is on. A rule that does not fit is turned off in
  `.markdownlint-cli2.jsonc` with the reason beside it — never left silently unset.
- The first line is the top-level heading. Front matter with a `title` counts, which is why the
  issue templates carry `title: ''`; the pull request template, whose heading is the PR title,
  disables `MD041` at its top.
- Ordered lists count `1.` `2.` `3.`.
- Duplicate headings are allowed only under different parents (`MD024` is `siblings_only`).
- **Every fenced block declares a language, from the closed list**: `ts`, `tsp`, `js`, `json`,
  `jsonc`, `yaml`, `yml`, `bash`, `sh`, `text`, `diff`, `md`. Terminal output and directory trees
  are `text`. `typescript` is not in the list on purpose — one spelling per language.
- Line length is unchecked (a table row cannot wrap), but prose is still wrapped by oxfmt.

### Prose (textlint)

- The docs are English. The Japanese presets are deliberately absent, so do not add Japanese
  prose to a Markdown file.
- `terminology` enforces the canonical spelling of ~250 technical terms: **JavaScript**,
  **TypeScript**, **npm**, **GitHub**, **JSON**, **OpenAPI** (one word), "end-to-end", "bugfix",
  "SemVer". Code spans and fenced blocks are skipped, so put a package name that collides with a
  term (`openapi`, `hono`) in a code span.
- `README` and `re-export` are excluded from the term list on purpose.
- Quotes, brackets and parentheses must balance (`no-unmatched-pair`). A parenthetical that wraps
  onto a line starting with a code span, or holds an apostrophe or `…`, can read as unbalanced:
  keep it on one line or rephrase it as a sentence.
- No `TODO` in the docs (`no-todo`); an unchecked task-list box counts as one.
- A deliberate exception is a `<!-- textlint-disable rule-name -- reason -->` comment next to the
  text that needs it (the pull request template's checklist), never a change to `.textlintrc.yml`.

### Spelling (cspell)

- cspell reads **every** tracked file — source, tests, configs, workflows — not just the docs, in
  **US English** (`behavior`, `optimization`, `color`).
- A genuine project term (a package, tool or API name that recurs) is a one-line addition to
  `project-words.txt`, kept sorted. Never add a typo there, and never add `ignoreWords` or
  `ignorePaths` to `cspell.config.yml` to silence a word.
- Deliberate non-words (a word split on purpose, test data in another language) are declared in
  that file only, with the reason: `// cspell:ignore word` in code,
  `<!-- … cspell:ignore word -->` in Markdown.
- Prefer real words over cryptic abbreviations in names (`identifiers`, not a clipped form of it).
- camelCase and snake_case are split automatically, and everything Git ignores is skipped.

## CI and configuration

### The workflows

- `test.yml` (Test): `vp install --frozen-lockfile` → `vp run takibi-hono#build` → the package
  tests → the end-to-end suite in `test/` (which drives `dist`) → `vp run check`, which ends in
  `pnpm lint` and so runs every linter. A new check goes into the root `package.json` scripts, so
  local and CI cannot disagree about what "clean" means. It also runs when started by hand, and
  as the first job of `release.yml` (`workflow_call`).
- `release-please.yml` (Release PR) runs on every push to `main`: when there is something to
  release, it opens the version bump pull request, merges it and starts `release.yml`; see
  [Releasing](#releasing).
- `release.yml` runs after Test succeeds on a push to `main`, or when started on `main` by hand or
  by `release-please.yml`, and then runs Test itself first; see [Releasing](#releasing).
- **Actions are pinned to a commit digest with the tag kept as a comment**:
  `uses: actions/checkout@3d3c42e… # v7.0.1`. A floating tag is a mutable dependency with access to
  the job — never introduce one. Resolve a tag with
  `git ls-remote https://github.com/<owner>/<repo> 'refs/tags/<tag>*'` (for an annotated tag, the
  `^{}` line is the commit).
- `permissions` stays minimal (`{}` or `contents: read`, widened per job); checkout uses
  `persist-credentials: false`. The one exception is the `tag` job, which pushes with the
  checkout's token and is excused in `.github/zizmor.yml`.
- A finding is excused next to what it is about, with the reason: an inline
  `# zizmor: ignore[audit]`, an entry in `.github/zizmor.yml` pinned to `file:line:col` (move the
  line number when the file shifts), or an actionlint message in `.github/actionlint.yml` scoped
  to one file. Never drop the check.
- Verify a workflow or script change with `pnpm lint`, and in a fresh clone
  (`git clone . <tmp> && cd <tmp> && pnpm install --frozen-lockfile`, then the workflow's steps in
  order) when it depends on files a checkout would not have (`dist`, `coverage`).

### The repository linters

`pnpm lint` runs, in order: markdownlint, textlint, cspell, secretlint, `scripts/typespec.ts`,
`scripts/actionlint.ts`, `scripts/zizmor.ts`. [Documentation](#documentation) says how to live with
the three prose linters.

- The npm-based linters are root devDependencies, **pinned exactly**; Renovate moves them. The
  host libraries the end-to-end suite compiles and runs generated code against are
  `test/package.json` devDependencies, pinned exactly for the same reason: `hono`, `hono-openapi`,
  the five schema libraries, the two validators, `typescript` and `vite`. Its `effect` is the
  package's release.
- actionlint and zizmor have no npm distribution. Their scripts download the pinned release for
  the platform, verify its sha256 and cache it under `node_modules/.cache`. Bumping one means
  changing `VERSION` and **every checksum** together: actionlint's from the release's
  `*_checksums.txt`, zizmor's from each asset's `digest` in the GitHub releases API. Renovate
  cannot see them; they are updated by hand.
- `scripts/*.ts` are TypeScript executed by `node` directly (type stripping), so they use only
  erasable syntax — no `enum`, no parameter properties — and import only root devDependencies.
- `scripts/typespec.ts` reads `packages` in `pnpm-lock.yaml`: it fails on two versions of one
  `@typespec/*` package, on 1.x packages of different releases, and on an unsatisfied peer range
  between them, and prints the command that realigns them.
- secretlint scans every tracked file with the recommended preset. There is no allowlist; a
  finding is a real leak to remove.

### Editing the lint configuration

The `lint` section of `packages/takibi-hono/vite.config.ts` is the standard this repository holds
itself to, and its comments explain the choices.

- Adding a rule: place it in the section it belongs to, with the reason above it if its name does
  not say it. Run `pnpm check` and fix what it reports in the code — the rule is not finished until
  the repository passes it.
- A rule that does not fit is **left out of the list**, with a comment saying why. It is never set
  to `'off'` in `rules`; `'off'` appears only in `overrides`, scoped to the files it describes,
  with the reason.
- `categories` (correctness / suspicious / perf) are errors, so rules in those categories are not
  restated in `rules`.
- `plugins` replaces oxlint's defaults, so the defaults are restated there — do not drop one while
  adding another.
- A new `src/` directory gets its `no-restricted-imports` override (see [Layering](#layering)).

### Formatting

- The style lives in the root `vite.config.ts` `fmt` block (printWidth 100, single quotes, no
  semicolons, sorted `package.json` and imports) and every workspace inherits it. Keep its
  `ignorePatterns` specific: a broad root-relative pattern makes a workspace skip its own files.
  `fixtures/**` is ignored because it holds generator output formatted by takibi-hono itself.
- The same style is `defaultConfig` in `src/format/index.ts`, because generated code is formatted
  at runtime. Change both together.

### Dependencies

- `pnpm-lock.yaml` is written by `pnpm install`. Never edit it by hand. CI installs with
  `--frozen-lockfile`.
- `effect` and `@effect/platform-node` are pinned exactly to the release `hono-takibi` uses, whose
  Effects the package composes. They move together, in one change.
- The `@typespec/*` packages move together, to one TypeSpec release: TypeSpec publishes them
  together (`compiler`, `http`, `openapi` and `openapi3` on 1.x, `rest` and `versioning` on 0.x)
  and each declares the others as peers at its own release; `scripts/typespec.ts` fails when
  `pnpm-lock.yaml` mixes releases. Their versions live **only** in the strict
  `catalog` of `pnpm-workspace.yaml`; a `package.json` says `"catalog:"`, and `pnpm pack` /
  `pnpm publish` write the catalog range into the published manifest. `catalogMode: strict` makes
  `pnpm add` refuse a version outside the catalog. `@typespec/openapi` is a devDependency only so
  the peer of `@typespec/openapi3` follows the catalog instead of being auto-installed at an older
  release.
- `oas-truth` and the client-generation dependency (`src/core/client.ts`) are the generator's
  core; a bump changes generated output, so read the diff of the test expectations rather than
  updating them blindly. A version newer than pnpm's minimum release age goes into
  `minimumReleaseAgeExclude`, and comes out once it is old enough.
- The package's runtime `dependencies` are what every user installs. Adding one is a design
  decision — ask first. Tooling goes in `devDependencies`.
- Renovate (`renovate.json`) opens update PRs on Saturdays (Asia/Tokyo), after a release has
  been out 7 days (1 day for a security fix). It merges pins,
  lockfile maintenance and minor / patch updates of packages past 0.x by itself — never an action
  digest. The `typespec` group keeps TypeSpec in one PR; the `effect` group is always merged by
  hand. A security update bypasses its group and bumps only the advisory's package, so a
  `typespec` one fails `scripts/typespec.ts`: finish it by aligning the rest of the release on the
  same branch.
- `pnpm add` with `catalogMode: strict` writes a new package into the `catalog`. Only
  `@typespec/*` belongs there: move anything else back to an exact version in its `package.json`.

### The published package

- `exports`: `./config` and `./vite-plugin`, each `types` + `import` from `dist`; `bin` is
  `dist/index.js`. `pack.entry` in `packages/takibi-hono/vite.config.ts` builds one file per entry
  (`.js` / `.d.ts` via `outExtensions`). Keep them in step.
- There are no lifecycle scripts: the release workflow's `publish` job builds right before it
  publishes.
- The package `README.md` is what npm shows; keep it identical to the root copy (see the docs
  rule).

### Releasing

Releases are CI's job, from the version bump to the GitHub release: merging a `feat`, `fix` or
`perf` change under `packages/takibi-hono/` into `main` is what releases it, with no approval.

`release-please.yml` (Release PR) runs on every push to `main`, again when a `release` run that
followed a push ends, and when started by hand. release-please (`release-please-config.json`) reads the Conventional
Commits merged since the last release tag that change a file under `packages/takibi-hono/`, and
works out the next version from them: `feat` raises the minor, `fix` and `perf` the patch, and a
breaking change (`feat!:`, a `BREAKING CHANGE:` footer) the minor while the version is 0.x. Any
other type releases nothing. When there is a next version, it opens
`chore: bump version to <version>`, which moves `version` in `packages/takibi-hono/package.json`
and `.release-please-manifest.json`; the workflow merges it (squash) and starts `release.yml` on
`main`.

`release.yml` runs after Test passes on a push to `main`, or when started on `main` — where its
`test` job runs Test first — and, from that exact commit:

1. **check** — reads the version and asks npm whether it is published;
2. **tag** — creates `v<version>` on that commit, or verifies it is already there; a published
   version with no tag, or a tag on another commit, stops with an error that says what to do;
3. **publish** — only when npm lacks the version: build, then `pnpm publish` through npm Trusted
   Publishing (OIDC, `id-token: write`, environment `release`), so no npm token is stored;
4. **release** — creates the GitHub release for the tag with generated notes.

Rules that follow:

- **The commit subject is the release.** release-please reads the commits on `main`, and a
  squash merge makes the pull request title the commit, so a title carries the type of what a user
  gets: `fix(cli): …` publishes a patch, `docs: …` or `test: …` nothing.
- **Never bump `version` by hand.** release-please counts from `.release-please-manifest.json`,
  so a bump that `release.yml` asks for to recover from a failed release moves the manifest too,
  in the same commit.
- The bump pull request is opened and merged with the workflow's token, so no workflow runs on it,
  and it carries `autorelease: pending` until its GitHub release exists. release-please opens no
  new one while a merged one is pending; `release-please.yml` relabels it `autorelease: tagged`
  once the release is out. Never merge, edit or relabel it by hand.
- The repository has to let GitHub Actions create pull requests (Settings → Actions → General →
  Workflow permissions), and `main` must not require a review or a status check of the bump pull
  request, which nothing runs on.
- **Never `npm publish` / `pnpm publish` by hand, and never create or move a `v*` tag by hand.**
- Never reuse or roll back a published version; to fix a release, merge a `fix`.
- If a job fails (an npm outage, a Trusted Publisher mismatch), fix the cause and re-run the failed
  jobs; every job is safe to re-run and the tag already points at the right commit.
- npm's Trusted Publisher for `takibi-hono` names this repository, **workflow `release.yml`** and
  **environment `release`**. Renaming either breaks publishing: the OIDC exchange answers 404 and
  `pnpm publish` fails with a misleading `404 Not Found - PUT …/takibi-hono`. Change the npm
  setting in the same breath, or do not rename.

## Playbooks

Every playbook ends the same way: `pnpm fix`, then `pnpm check` and `pnpm test`, all green, then
commit.

### Add a config option

1. Write the failing tests first: validation in `src/config/index.test.ts`, output in the suite of
   the layer that owns it (`src/core/index.test.ts`, `src/generator/*.test.ts`).
2. Add the field to `ConfigSchema` in `src/config/index.ts`, with a check whose message names what
   is expected, and to `TakibiHonoConfig` / `resolveLayout` in `src/core/layout.ts` if it affects
   paths.
3. Implement it in `core/` (the Effect program) and `generator/` / `helper/` (the pure builders),
   respecting the layering. Both entry points reach it through `hono()`; never special-case one.
4. Document it in the README (`Full Config`), both copies.

### Fix a generator bug

1. Reproduce it as a failing test at the smallest document that shows it, asserting the exact
   generated source.
2. Find the layer that owns the mistake — parsing and Components (oas-truth), a schema expression
   (schema-truth), a code builder (`generator/`), composition (`helper/`), the program
   (`core/`), the merge (`merge/`) — and fix it there, not downstream. A mistake in oas-truth or
   schema-truth is fixed upstream, never by string-patching its output here.
3. Check whether the other four schema libraries, and `openapi: false`, have the same mistake.

### A request to support a vendor extension (`x-*`)

1. Classify it with the three layers of [Vendor extensions](#vendor-extensions-x-).
2. A or B: it belongs in schema-truth (and oas-truth's `Schema` type), not here — takibi-hono
   only passes it through. Add a transparency test here only if the pass-through itself changes.
3. C (code injection): decline, citing [Vendor extensions](#vendor-extensions-x-). Do not add a flag, an option or an
   allowlist for it.

### Check a change in the fixture

For a change to the Vite plugin, the handler / app output or the merge:

1. `vp run takibi-hono#build`.
2. Regenerate: `node ../../packages/takibi-hono/dist/index.js` from `fixtures/vite-plugin`, and
   read the diff of `src/`.
3. `pnpm -F fixture-vite-plugin dev`, request a route, edit a handler body, restart, and confirm
   the body survived and the terminal shows no warning. Revert any hand edit before committing.

### Clear a lint failure

1. Run `pnpm check` and read which linter failed and the rule name in the message.
2. Try `pnpm fix` first — formatting, import order, markdownlint and textlint terms are
   autofixable. Read what textlint's `terminology` changed: a package name it "corrected" belongs
   in a code span instead.
3. Otherwise **change the code, not the rule.** The rules encode the design: an assertion ban means
   narrow with a guard; a `no-restricted-imports` message means the dependency direction is wrong;
   `prefer-each` means `it.each`.
4. An unknown word from cspell is one line in `project-words.txt` if it is a real project term, a
   file-local `cspell:ignore` if it is deliberate test data, and a rename or a US spelling if it
   is an abbreviation or a typo.
5. Only if an oxlint rule genuinely cannot hold, add
   `// oxlint-disable-next-line rule-name -- reason` on that line, and say in the report that you
   added a suppression and why. A secretlint finding is never suppressed.

### Bump actionlint or zizmor

1. Pick the release and read its notes for new findings.
2. In `scripts/actionlint.ts` / `scripts/zizmor.ts`, change `VERSION` and every checksum together:
   actionlint's from the release's `*_checksums.txt`, zizmor's from each asset's `digest` in
   `https://api.github.com/repos/zizmorcore/zizmor/releases/tags/v<VERSION>`.
3. `pnpm lint`: the script downloads, verifies and runs the new binary. Fix new findings in the
   workflows, or excuse one with its reason next to it.

### Add a linter rule

1. Check its category; correctness / suspicious / perf are already errors.
2. Add it to the `lint` section of `packages/takibi-hono/vite.config.ts` in its section, with the
   reason.
3. Run `pnpm check` and fix every finding in the code.

### Bump effect

1. Find the `effect` release the client-generation dependency (`hono-takibi`) pins; that is the
   target, because its Effects are composed in `src/core/client.ts`.
2. Change `effect` and `@effect/platform-node` in `packages/takibi-hono/package.json` (both exact)
   and in `test/package.json`, then `pnpm install`. If schema-truth (through oas-truth) pins a
   different `effect`, check that both trees resolve consistently in `pnpm-lock.yaml`.
3. `pnpm check`. A release moves the Schema and CLI APIs, so expect errors in `config/` and
   `cli/`.
4. `pnpm test`, and read every behavior difference rather than adjusting an assertion to match.
5. Say in the commit body which upstream changes forced code changes.

### Bump TypeSpec

1. Change every `@typespec/*` entry in the `catalog` of `pnpm-workspace.yaml` to the new release
   (1.x and 0.x together), never a `package.json`. Renovate's `typespec` group does the same.
2. `pnpm install`, then `node scripts/typespec.ts` (also part of `pnpm lint`): it fails until
   `pnpm-lock.yaml` holds one release, and prints the `pnpm update` that re-resolves the stragglers.
3. `pnpm test`: TypeSpec input is compiled for real, so read any changed expectation.

### Bump oas-truth or the client-generation dependency

1. Change the version; if it is younger than pnpm's minimum release age, add it to
   `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` (and drop entries that no longer need it).
2. `pnpm install`, `pnpm test`. A changed expectation is a changed generated output: read it and
   decide whether it is right before updating the test.
3. If oas-truth moved schema-truth to a new `effect`, do the effect bump in the same change.

### Release

A release has no step of its own: merging a `feat`, `fix` or `perf` change under
`packages/takibi-hono/` releases it (see [Releasing](#releasing)).

1. Give the commit, or the title of the pull request that is squash-merged, the type of what a
   user gets: `feat` for a new capability (a minor bump), `fix` or `perf` for the rest (a patch),
   and `!` after the type for a breaking change to the config, the CLI or the generated output (a
   minor while the version is `0.x`). Anything else (`docs`, `test`, `refactor`, `ci`, `chore`)
   releases nothing.
2. After the merge, watch Release PR, then `release`: Release PR opens
   `chore: bump version to <version>`, merges it and starts `release`, which runs Test, then tags
   `v<version>`, publishes to npm and creates the GitHub release. Never bump, publish or tag by
   hand.
3. If a job fails, fix the cause and re-run the failed jobs. To fix a published release, merge a
   `fix` — never reuse a version.
4. To choose the version yourself (`1.0.0`, say), put a `Release-As: <version>` footer in the body
   of a commit that changes `packages/takibi-hono/`.
