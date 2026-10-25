import type {
  CallExpression,
  IdentifierName,
  ImportDeclaration,
  Node,
  Program,
  StringLiteral,
} from 'oxc-parser'

import { descendantsWhere, parseSource, textOf } from '../syntax/index.js'

/**
 * A parsed file. The tree is read for positions and names only; every piece of text that
 * is kept or moved is sliced from `code`, so comments and formatting survive a merge.
 *
 * `errors` is what stopped the parser, for a file that does not parse. Such a file has an
 * empty tree, in which every handler, route and import looks missing: a merge would write
 * the generated file over the edit that broke it. So the existing file is left exactly as
 * it is until it parses again, and the merge is taken up on the run after.
 */
type Source = {
  readonly code: string
  readonly program: Program
  readonly errors: readonly string[]
}

/** What a route call in the existing file contributes to the regenerated one. */
type RouteInfo = {
  readonly method: string
  readonly routePath: string
  /** The handler, the call's last argument, as written. */
  readonly body: string
  /** The JSDoc right above the call, if any. */
  readonly comment: string | undefined
}

/** A `.get('/path', ...)` or `.on('METHOD', '/path', ...)` call, by the name it is called by. */
type RouteCall = {
  readonly name: IdentifierName
  readonly method: string
  readonly routePath: string
  readonly args: readonly Node[]
}

/**
 * A top-level `const` / `let` / `var` statement, exported or not. `fullStart` is where the
 * trivia before it begins — the end of the statement before, or the start of the file — so
 * that a range covering it takes its comments along.
 */
type VariableStatement = {
  readonly start: number
  readonly end: number
  readonly fullStart: number
  readonly exported: boolean
  readonly names: readonly string[]
  readonly text: string
}

/** Hono's chain methods; `head` / `trace` go through `.on('METHOD', path, ...)`. */
const CHAIN_METHODS: ReadonlySet<string> = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
])

/** The handler the generator emits; a body that is still this stub has nothing to preserve. */
const STUB = '(c)=>{}'

function parseSnippet(code: string): Source {
  return { code, ...parseSource(code) }
}

function isStringLiteral(node: Node | undefined): node is StringLiteral {
  return node?.type === 'Literal' && typeof node.value === 'string'
}

function importDeclarations(source: Source) {
  return source.program.body.filter(
    (statement): statement is ImportDeclaration => statement.type === 'ImportDeclaration',
  )
}

/** The import declarations as written, through the end of the last one, or ''. */
function extractImportSection(source: Source) {
  const end = importDeclarations(source).at(-1)?.end ?? 0
  return end === 0 ? '' : `${source.code.slice(0, end)}\n`
}

/**
 * Whether `code` refers to a name a declaration binds. Every identifier counts, a member name
 * (`x.store`) included: keeping an import that is not needed is a lint warning, dropping one
 * that is is a broken file.
 */
function isReferenced(decl: ImportDeclaration, code: string) {
  const locals = new Set(decl.specifiers.map((specifier) => specifier.local.name))
  const { program } = parseSource(code)
  return descendantsWhere(
    program,
    (node): node is Node & { readonly name: string } =>
      (node.type === 'Identifier' || node.type === 'JSXIdentifier') && 'name' in node,
  ).some((node) => locals.has(node.name))
}

/** The name an import specifier imports (`a` in `{ a as b }`). */
function importedName(specifier: ImportDeclaration['specifiers'][number]) {
  if (specifier.type !== 'ImportSpecifier') return undefined
  return specifier.imported.type === 'Identifier'
    ? specifier.imported.name
    : specifier.imported.value
}

function variableStatements(source: Source): readonly VariableStatement[] {
  const { body } = source.program
  return body.flatMap((statement, index) => {
    const node = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (node?.type !== 'VariableDeclaration') return []
    return [
      {
        start: statement.start,
        end: statement.end,
        fullStart: index === 0 ? 0 : (body[index - 1]?.end ?? 0),
        exported: statement.type === 'ExportNamedDeclaration',
        names: node.declarations.flatMap((d) => (d.id.type === 'Identifier' ? [d.id.name] : [])),
        text: textOf(source.code, statement),
      },
    ]
  })
}

/** Applied right-to-left so earlier indices are not invalidated. */
function applyRangeOps(code: string, ops: readonly [start: number, end: number, text: string][]) {
  return [...ops]
    .toSorted(([a], [b]) => b - a)
    .reduce((acc, [start, end, text]) => acc.slice(0, start) + text + acc.slice(end), code)
}

/** `.on('METHOD', '/path'` or `.get('/path'`: the start of a route call, as the generator writes it. */
function routeCallPrefix(method: string, routePath: string) {
  return CHAIN_METHODS.has(method)
    ? `.${method}('${routePath}'`
    : `.on('${method.toUpperCase()}','${routePath}'`
}

/** Every route call in the file, outermost first — the order the tree is walked in. */
function routeCalls(source: Source): readonly RouteCall[] {
  return descendantsWhere(
    source.program,
    (node): node is CallExpression => node.type === 'CallExpression',
  ).flatMap((call) => {
    const { callee } = call
    if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') return []
    const name = callee.property
    const args = call.arguments
    if (name.name === 'on') {
      const [methodArg, pathArg] = args
      if (args.length < 3 || !isStringLiteral(methodArg) || !isStringLiteral(pathArg)) return []
      return [{ name, method: methodArg.value.toLowerCase(), routePath: pathArg.value, args }]
    }
    const [pathArg] = args
    if (!CHAIN_METHODS.has(name.name) || args.length < 2 || !isStringLiteral(pathArg)) return []
    return [{ name, method: name.name, routePath: pathArg.value, args }]
  })
}

function extractRouteInfo(source: Source) {
  const result = new Map<string, RouteInfo>()
  for (const { args, name, method, routePath } of routeCalls(source)) {
    const before = source.code.slice(0, name.start - 1)
    const commentMatch = before.match(/(\/\*\*(?:[^*]|\*(?!\/))*\*\/)\s*$/u)
    const last = args.at(-1)
    result.set(`${method}:${routePath}`, {
      method,
      routePath,
      body: last ? textOf(source.code, last) : '',
      comment: commentMatch?.[1],
    })
  }
  return result
}

function replaceRouteParts(generated: Source, existingRoutes: ReadonlyMap<string, RouteInfo>) {
  const seenPositions = new Set<number>()
  const ops: [start: number, end: number, text: string][] = []
  for (const { args, name, method, routePath } of routeCalls(generated)) {
    if (seenPositions.has(name.start)) continue
    seenPositions.add(name.start)
    const existing = existingRoutes.get(`${method}:${routePath}`)
    if (!existing) continue
    if (existing.body.replaceAll(/\s/gu, '') === STUB) continue
    const last = args.at(-1)
    if (last) ops.push([last.start, last.end, existing.body])
  }
  return applyRangeOps(generated.code, ops)
}

/**
 * Merges generated handler file with existing user-modified version.
 *
 * - Route handler bodies present in existing are preserved; generated metadata
 *   (path, describeRoute call) is taken from generated.
 * - Non-handler statements in existing (helpers, constants) are preserved.
 * - Imports are reconciled: user imports kept, generator-managed imports overwritten.
 * - Leading JSDoc comments above route calls in existing are restored on output.
 * - An existing file that does not parse is kept as it is: its edit is still in progress.
 */
export function mergeHandlerFile(existingCode: string, generatedCode: string) {
  const existingFile = parseSnippet(existingCode)
  if (existingFile.errors.length > 0) return existingCode
  const existingRoutes = extractRouteInfo(existingFile)
  const mergedGenerated = replaceRouteParts(parseSnippet(generatedCode), existingRoutes)

  const existingImportText = extractImportSection(existingFile)
  const existingBodyFile = parseSnippet(existingCode.slice(existingImportText.length))
  const handlerRanges = variableStatements(existingBodyFile)
    .filter((s) => s.text.includes('Handler'))
    .map((s) => [s.fullStart, s.end] as const)
  const isInsideHandlerRange = (pos: number) =>
    handlerRanges.some(([start, end]) => pos >= start && pos <= end)
  const nonHandlerCode = existingBodyFile.program.body
    .filter((s) => !isInsideHandlerRange(s.start))
    .map((s) => textOf(existingBodyFile.code, s))

  const mergedGeneratedFile = parseSnippet(mergedGenerated)
  const generatedImportText = extractImportSection(mergedGeneratedFile)
  const mergedGeneratedBody = mergedGenerated.slice(generatedImportText.length).trimStart()
  const nonHandlerSection = nonHandlerCode.length > 0 ? `${nonHandlerCode.join('\n\n')}\n\n` : ''
  const mergedImports = mergeImports(
    existingFile,
    generatedImportText,
    nonHandlerSection + mergedGeneratedBody,
  )
  const assembled = `${[mergedImports, '', nonHandlerSection + mergedGeneratedBody]
    .join('\n')
    .replaceAll(/\n{3,}/gu, '\n\n')
    .trim()}\n`
  return restoreRouteComments(assembled, existingRoutes)
}

export function mergeAppFile(existingCode: string, generatedCode: string) {
  const existingFile = parseSnippet(existingCode)
  if (existingFile.errors.length > 0) return existingCode
  const generatedFile = parseSnippet(generatedCode)
  const existingRoutes = routeExports(existingFile)
  const generatedRoutes = routeExports(generatedFile)
  const [existingFirst, generatedFirst] = [existingRoutes[0], generatedRoutes[0]]
  const [existingLast, generatedLast] = [existingRoutes.at(-1), generatedRoutes.at(-1)]
  if (!existingFirst || !existingLast || !generatedFirst || !generatedLast) return generatedCode
  const generatedImportText = extractImportSection(generatedFile)
  const existingImportText = extractImportSection(existingFile)
  const betweenImportsAndRoutes = existingCode.slice(existingImportText.length, existingFirst.start)
  const routes = generatedCode.slice(generatedFirst.start, generatedLast.end)
  const afterRoutes = existingCode.slice(existingLast.end)
  const mergedImports = mergeAppImports(
    existingFile,
    generatedImportText,
    betweenImportsAndRoutes + routes + afterRoutes,
  )
  return `${[mergedImports.trimEnd(), '\n', betweenImportsAndRoutes, routes, afterRoutes]
    .join('')
    .replaceAll(/\n{3,}/gu, '\n\n')
    .trim()}\n`
}

// `export const <name>=<app>.route('/',<file>Handler)…`: a group of a split app, as the
// generator writes it.
const GROUP_EXPORT =
  /^export\s+const\s+[A-Za-z_$][\w$]*\s*=\s*[A-Za-z_$][\w$]*(?:\s*\.route\(\s*['"]\/['"]\s*,\s*[A-Za-z_$][\w$]*Handler\s*,?\s*\))+\s*;?$/u

/**
 * The exports the generator owns: `api`, the whole app, or the groups of a split one. The
 * span from the first to the last is what a regeneration replaces, so switching `split` on or
 * off swaps one form for the other; any other export of the user's is kept.
 */
function routeExports(source: Source) {
  return variableStatements(source).filter(
    (stmt) => stmt.exported && (stmt.names.includes('api') || GROUP_EXPORT.test(stmt.text)),
  )
}

/** Puts each route's JSDoc back above the first occurrence of its regenerated call. */
function restoreRouteComments(code: string, existingRoutes: ReadonlyMap<string, RouteInfo>) {
  return [...existingRoutes.values()]
    .flatMap((info) => (info.comment === undefined ? [] : [[info, info.comment] as const]))
    .reduce((result, [info, comment]) => {
      const call = routeCallPrefix(info.method, info.routePath)
      // A replacer function, so a `$` in the comment is not read as a replacement pattern.
      return result.replace(call, () => `\n  ${comment}\n  ${call}`)
    }, code)
}

/**
 * `hono` and the modules the generated entry imports (the handlers) are generator-managed, and
 * so is a relative import `body` no longer refers to; everything else from the user, a
 * relative one their code still uses (`import { auth } from './auth'`) included, is preserved
 * verbatim.
 */
function mergeAppImports(existingFile: Source, generatedImports: string, body: string) {
  const generatedDecls = importDeclarations(parseSnippet(generatedImports))
  const generatedSpecifiers = new Set(generatedDecls.map((decl) => decl.source.value))
  const generatedNamedImports = new Set(
    generatedDecls.flatMap((decl) =>
      decl.specifiers.map(importedName).filter((name) => name !== undefined),
    ),
  )
  const userImports = importDeclarations(existingFile)
    .filter((decl) => {
      const spec = decl.source.value
      if (spec === 'hono' || generatedSpecifiers.has(spec)) return false
      // The handlers imported from where they were before `output` moved.
      const named = decl.specifiers.map(importedName).filter((name) => name !== undefined)
      if (named.length > 0 && named.every((name) => generatedNamedImports.has(name))) return false
      return !spec.startsWith('.') || isReferenced(decl, body)
    })
    .map((decl) => textOf(existingFile.code, decl))
  return userImports.length > 0
    ? `${generatedImports}${userImports.join('\n')}\n`
    : generatedImports
}

const HANDLER_IMPORT_SOURCES = new Set<string>([
  'hono',
  'hono-openapi',
  'hono-openapi/zod',
  'hono-openapi/valibot',
  'hono-openapi/typebox',
  'hono-openapi/arktype',
  'hono-openapi/effect',
  '@hono/standard-validator',
  '@hono/zod-validator',
  '@hono/valibot-validator',
  '@hono/typebox-validator',
  '@hono/effect-validator',
  'zod',
  'valibot',
  'typebox',
  '@sinclair/typebox',
  'typebox/compile',
  'arktype',
  'effect',
  'effect/Schema',
])

/**
 * User imports are preserved unless generator-managed (HANDLER_IMPORT_SOURCES), duplicated by
 * generated names, or a relative import `body` no longer refers to.
 */
function mergeImports(existingFile: Source, generatedImports: string, body: string) {
  const generatedDecls = importDeclarations(parseSnippet(generatedImports))
  const generatedSpecifiers = new Set(generatedDecls.map((d) => d.source.value))
  const generatedNamedImports = new Set(
    generatedDecls.flatMap((d) =>
      d.specifiers.map(importedName).filter((name) => name !== undefined),
    ),
  )
  const userImports = importDeclarations(existingFile)
    .filter((decl) => {
      // The generator never writes `import type`, so a type-only import is the user's even
      // when it names a module the generator imports from (`import type { Pet } from
      // '../components'` beside the generated `import { PetSchema } from '../components'`).
      if (decl.importKind === 'type') return true
      const spec = decl.source.value
      if (HANDLER_IMPORT_SOURCES.has(spec) || generatedSpecifiers.has(spec)) return false
      const named = decl.specifiers.map(importedName).filter((name) => name !== undefined)
      if (named.length > 0 && named.every((name) => generatedNamedImports.has(name))) return false
      // A relative value import is the generator's when nothing refers to it any more: one
      // of a component module that moved, or of a component the document dropped. One the
      // user's code still uses (`import { db } from '../db'`) is the user's.
      return !spec.startsWith('.') || isReferenced(decl, body)
    })
    .map((decl) => textOf(existingFile.code, decl))
  return userImports.length > 0
    ? `${generatedImports}${userImports.join('\n')}\n`
    : generatedImports
}
