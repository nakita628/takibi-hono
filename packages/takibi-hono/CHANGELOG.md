# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-29

### Fixed

- Quote non-identifier object keys so generated code parses: hyphenated request
  header/parameter names (`X-Request-ID`) in validators, and dotted/special
  property names (`Parameter1.Name`) in inline schemas (zod/valibot/typebox/effect).
- Prefix handler variable names that start with a digit (e.g. a `/2010-04-01/...`
  path segment → `_20100401Handler`) so they are valid identifiers.
- Resolve percent-encoded / non-ASCII `$ref` names injectively so references
  match component declarations; fixes Unicode-named schemas being silently
  dropped and self-referential Unicode schemas missing their `z.lazy(...)` wrap.
- Bound formatting with a timeout: deeply-nested schemas that made `oxfmt` hang
  now emit valid, unformatted output instead (`OXFMT_TIMEOUT_MS` overridable).
- Import a component schema from the schemas module even when its name's suffix
  makes it look like another component kind (e.g. a schema `searchParams` →
  `SearchParamsSchema`), fixing a missing import (TS2304).
- Emit non-standard HTTP methods (`HEAD`/`TRACE`) via `.on('METHOD', path, ...)`
  since Hono's chained router only exposes `get/post/put/delete/options/patch`
  (fixes TS2339); standard methods are unchanged.
- Collapse multiple request-body content types that map to the same validator
  target to a single validator (`application/json` preferred), fixing the
  Hono overload conflict (TS2769) on multi-content-type bodies.

### Changed

- Bump `schema-to-library` to `^0.3.2` (injective non-ASCII component naming).
