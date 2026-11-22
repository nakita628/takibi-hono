<!--
The pull request title is the page's top-level heading, so the body starts at `##`. It is also the
commit release-please reads once the pull request is squash-merged: `type(scope): summary`, where
the type decides the release of a change under packages/takibi-hono/ — `feat` a minor, `fix` and
`perf` a patch, a breaking change (`feat!:`) a minor while the version is 0.x, and any other type
(docs, test, refactor, ci, chore) none.
-->

<!-- markdownlint-disable MD041 -->

## Why

<!-- The problem or request behind this change. Link the issue: `Closes #123`. -->

## What

<!-- What changed, as a user of the CLI or the generated code sees it. -->

## Where

<!-- The part it touches: schemas, components, handlers, app, client, config, CLI, Vite plugin. -->

## Who

<!-- Who is affected. Breaking for anyone? -->

## When

<!-- Release impact: none | next release. The version is bumped by the release-please pull request, not here. -->

## How

<!-- The approach, and how you verified it. -->

<!-- textlint-disable no-todo -- the boxes are the checklist to tick, not parked work -->

- [ ] `pnpm check`
- [ ] `pnpm test`
