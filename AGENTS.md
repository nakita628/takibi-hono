# AGENTS.md

Instructions for coding agents working on this repository, which is operated through agent
conversation. The full rules live in [`.cursor/rules/`](.cursor/rules) and are also read
automatically by Cursor:

| Rule               | Applies to                             | Covers                                                                    |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------- |
| `project.mdc`      | always                                 | repository map, commands, invariants, definition of done, Git             |
| `typescript.mdc`   | `**/*.ts`                              | the code conventions the oxlint configuration enforces                    |
| `effect.mdc`       | `packages/takibi-hono/src/**`          | the Effect program shape, errors, services and the config schema          |
| `architecture.mdc` | `packages/takibi-hono/src/**`          | layering, the oas-truth boundary, user code in the output, `x-*`, the API |
| `testing.mdc`      | `**/*.test.ts`                         | Vitest conventions, exact-match assertions, the filesystem in tests       |
| `docs.mdc`         | `**/*.md`, `**/*.mdc`                  | the two README copies and these rules                                     |
| `ci-config.mdc`    | workflows, manifests, `vite.config.ts` | action pinning, the lint config, dependencies, releasing                  |
| `playbooks.mdc`    | on request                             | step-by-step recipes for the recurring tasks                              |

## The short version

```bash
pnpm install --frozen-lockfile
pnpm fix     # formatting and lint autofixes
pnpm check   # format check, oxlint (type-aware) and type check, workflow lint
pnpm test    # unit tests
```

`pnpm check` and `pnpm test` must pass before a change is finished — CI runs both. Never relax a
linter to get a change through, never delete or overwrite the handler files and app entry users
keep their code in, and write everything committed in English.
