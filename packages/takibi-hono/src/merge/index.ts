import type {
  CallExpression,
  IdentifierName,
  ImportDeclaration,
  Node,
  Program,
  Statement,
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
  /** When the handler is an inline `defineHandler(...)`: the arguments of the call that takes the handler. */
  readonly handler: DefineHandlerInfo | undefined
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

/**
 * What a `defineHandler` declaration in the existing file contributes to the regenerated one:
 * the arguments of the call that takes the handler — middleware the user put before it
 * included — and the JSDoc above the declaration.
 */
type DefineHandlerInfo = {
  /** `defineHandler({...})(<args>)` or `defineHandler(<args>)`, as written. */
  readonly args: string
  /** The only argument is still the empty stub the generator wrote. */
  readonly stub: boolean
  readonly comment: string | undefined
}

/** A `const <name>=defineHandler(...)(...)` or `defineHandler(...)` statement. */
type DefineHandlerCall = {
  readonly name: string
  readonly statement: VariableStatement
  readonly args: readonly Node[]
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
function applyRangeOps(
  code: string,
  ops: readonly (readonly [start: number, end: number, text: string])[],
) {
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

/** The JSDoc that ends right before `end`, if one does. */
function commentBefore(code: string, end: number) {
  return code.slice(0, end).match(/(\/\*\*(?:[^*]|\*(?!\/))*\*\/)\s*$/u)?.[1]
}

/**
 * The arguments of the call that takes the handler, when `node` is a `defineHandler`:
 * `defineHandler({...})(<args>)` (validated) or `defineHandler(<args>)` (plain). Middleware
 * the user put before the handler is among them.
 */
function handlerArguments(node: Node | undefined): readonly Node[] | undefined {
  if (node?.type !== 'CallExpression') return undefined
  const callee = node.callee.type === 'CallExpression' ? node.callee.callee : node.callee
  if (callee.type !== 'Identifier' || callee.name !== 'defineHandler') return undefined
  return node.arguments.length > 0 ? node.arguments : undefined
}

/** `async (c, { json }) => {}` or `(c) => {}`: a handler with nothing in it yet. */
function isEmptyHandler(node: Node) {
  return (
    node.type === 'ArrowFunctionExpression' &&
    node.body.type === 'BlockStatement' &&
    node.body.body.length === 0
  )
}

/** What a `defineHandler` contributes: its handler arguments as written, and whether they are the stub. */
function defineHandlerInfo(
  source: Source,
  args: readonly Node[],
  commentEnd: number,
): DefineHandlerInfo {
  const first = args[0]
  const last = args.at(-1)
  return {
    args: first && last ? source.code.slice(first.start, last.end) : '',
    stub: args.length === 1 && first !== undefined && isEmptyHandler(first),
    comment: commentBefore(source.code, commentEnd),
  }
}

/** The span of the handler arguments, for the regenerated ones to take the user's. */
function handlerArgumentsOp(
  args: readonly Node[],
  existing: DefineHandlerInfo | undefined,
): readonly [start: number, end: number, text: string] | undefined {
  const first = args[0]
  const last = args.at(-1)
  if (!existing || existing.stub || !first || !last) return undefined
  return [first.start, last.end, existing.args]
}

/**
 * Every top-level `defineHandler` declaration, `const x=defineHandler(...)`, with the
 * arguments of the call that takes the handler. A declaration whose handler is still the
 * stub has nothing of the user's.
 */
function defineHandlerCalls(source: Source): readonly DefineHandlerCall[] {
  const { body } = source.program
  return variableStatements(source).flatMap((statement) => {
    const node = body.find((s) => s.start === statement.start)
    const declaration = node?.type === 'ExportNamedDeclaration' ? node.declaration : node
    if (declaration?.type !== 'VariableDeclaration') return []
    const [declarator] = declaration.declarations
    const name = declarator?.id.type === 'Identifier' ? declarator.id.name : undefined
    const args = handlerArguments(declarator?.init ?? undefined)
    return name !== undefined && args ? [{ name, statement, args }] : []
  })
}

function extractDefineHandlers(source: Source) {
  return new Map(
    defineHandlerCalls(source).map(({ name, statement, args }) => [
      name,
      defineHandlerInfo(source, args, statement.start),
    ]),
  )
}

/**
 * The regenerated `defineHandler` declarations with the user's handler (and the middleware
 * before it) in place of the stub, by name. The options object stays the generator's.
 */
function replaceDefineHandlers(
  generated: Source,
  existingHandlers: ReadonlyMap<string, DefineHandlerInfo>,
) {
  const ops = defineHandlerCalls(generated).flatMap(({ name, args }) => {
    const op = handlerArgumentsOp(args, existingHandlers.get(name))
    return op ? [op] : []
  })
  return applyRangeOps(generated.code, ops)
}

/** Puts each declaration's JSDoc back above its regenerated `export const`. */
function restoreHandlerComments(
  code: string,
  existingHandlers: ReadonlyMap<string, DefineHandlerInfo>,
) {
  return [...existingHandlers]
    .flatMap(([name, info]) => (info.comment === undefined ? [] : [[name, info.comment] as const]))
    .reduce(
      (result, [name, comment]) =>
        result.replace(
          new RegExp(`(?<![\\w$])export const ${name}\\s*=`, 'u'),
          (match) => `${comment}\n${match}`,
        ),
      code,
    )
}

/**
 * The names the top-level declarations of a module bind: variables and type aliases,
 * exported or not.
 */
function declaredNames(source: Source) {
  return new Set(
    source.program.body.flatMap((statement) => {
      const node = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
      if (node?.type === 'TSTypeAliasDeclaration') return [node.id.name]
      if (node?.type !== 'VariableDeclaration') return []
      return node.declarations.flatMap((d) => (d.id.type === 'Identifier' ? [d.id.name] : []))
    }),
  )
}

/**
 * Whether a statement of the existing file declares something the generated file declares
 * too (a schema, its type alias, the app): the generated declaration stands in for it, where
 * keeping both would declare the name twice.
 */
function isRedeclared(statement: Statement, generatedNames: ReadonlySet<string>) {
  const node = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
  if (node?.type === 'TSTypeAliasDeclaration') return generatedNames.has(node.id.name)
  if (node?.type !== 'VariableDeclaration') return false
  return node.declarations.some((d) => d.id.type === 'Identifier' && generatedNames.has(d.id.name))
}

function extractRouteInfo(source: Source) {
  const result = new Map<string, RouteInfo>()
  for (const { args, name, method, routePath } of routeCalls(source)) {
    const last = args.at(-1)
    const handlerArgs = handlerArguments(last)
    result.set(`${method}:${routePath}`, {
      method,
      routePath,
      body: last ? textOf(source.code, last) : '',
      comment: commentBefore(source.code, name.start - 1),
      handler: handlerArgs && last ? defineHandlerInfo(source, handlerArgs, last.start) : undefined,
    })
  }
  return result
}

function replaceRouteParts(generated: Source, existingRoutes: ReadonlyMap<string, RouteInfo>) {
  const seenPositions = new Set<number>()
  const ops: (readonly [start: number, end: number, text: string])[] = []
  for (const { args, name, method, routePath } of routeCalls(generated)) {
    if (seenPositions.has(name.start)) continue
    seenPositions.add(name.start)
    const existing = existingRoutes.get(`${method}:${routePath}`)
    if (!existing) continue
    const last = args.at(-1)
    // An inline `defineHandler` keeps its handler and takes the regenerated options; a handler
    // that is still the stub is regenerated whole.
    const generatedHandlerArgs = handlerArguments(last)
    if (generatedHandlerArgs && existing.handler) {
      const op = handlerArgumentsOp(generatedHandlerArgs, existing.handler)
      if (op) ops.push(op)
      continue
    }
    if (existing.body.replaceAll(/\s/gu, '') === STUB) continue
    if (last) ops.push([last.start, last.end, existing.body])
  }
  return applyRangeOps(generated.code, ops)
}

/**
 * Merges generated handler file with existing user-modified version.
 *
 * - Route handler bodies present in existing are preserved; generated metadata
 *   (path, describeRoute call) is taken from generated.
 * - The handler of a `defineHandler` declaration (`getPetsHandler`), and the middleware
 *   before it, are preserved by name; its options object is taken from generated.
 * - Non-handler statements in existing (helpers, constants) are preserved, except one that
 *   declares a name the generated file declares (a schema in a one-file output).
 * - Imports are reconciled: user imports kept, generator-managed imports overwritten.
 * - Leading JSDoc comments above route calls in existing are restored on output.
 * - An existing file that does not parse is kept as it is: its edit is still in progress.
 */
export function mergeHandlerFile(existingCode: string, generatedCode: string) {
  const existingFile = parseSnippet(existingCode)
  if (existingFile.errors.length > 0) return existingCode
  const existingRoutes = extractRouteInfo(existingFile)
  const existingHandlers = extractDefineHandlers(existingFile)
  const generatedFile = parseSnippet(generatedCode)
  const mergedGenerated = replaceDefineHandlers(
    parseSnippet(replaceRouteParts(generatedFile, existingRoutes)),
    existingHandlers,
  )

  const existingImportText = extractImportSection(existingFile)
  const existingBodyFile = parseSnippet(existingCode.slice(existingImportText.length))
  const generatedNames = declaredNames(generatedFile)
  const handlerRanges = variableStatements(existingBodyFile)
    .filter((s) => s.text.includes('Handler') || s.names.some((name) => generatedNames.has(name)))
    .map((s) => [s.fullStart, s.end] as const)
  const isInsideHandlerRange = (pos: number) =>
    handlerRanges.some(([start, end]) => pos >= start && pos <= end)
  const nonHandlerCode = existingBodyFile.program.body
    .filter((s) => !isInsideHandlerRange(s.start) && !isRedeclared(s, generatedNames))
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
  return restoreHandlerComments(restoreRouteComments(assembled, existingRoutes), existingHandlers)
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
  'hono/factory',
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
 * The named specifiers of a generator-managed import that are the user's own — `Context`
 * in `import { Hono, type Context } from 'hono'`, `createMiddleware` beside `defineHandler`
 * from 'hono/factory' — as an import of their own, when `body` refers to one of them. The
 * generator's names are left to the generated import.
 */
function userSpecifiers(
  existingFile: Source,
  decl: ImportDeclaration,
  generatedNamedImports: ReadonlySet<string>,
  body: string,
) {
  const own = decl.specifiers.filter((specifier) => {
    const name = importedName(specifier)
    return name !== undefined && !generatedNamedImports.has(name)
  })
  if (own.length === 0) return undefined
  const kept = { ...decl, specifiers: own }
  if (!isReferenced(kept, body)) return undefined
  const names = own.map((specifier) => textOf(existingFile.code, specifier)).join(', ')
  return `import { ${names} } from ${textOf(existingFile.code, decl.source)}`
}

/**
 * User imports are preserved unless generator-managed (HANDLER_IMPORT_SOURCES), duplicated by
 * generated names, or a relative import `body` no longer refers to. Of a generator-managed
 * import, the names the generator does not import are kept as an import of their own.
 */
function mergeImports(existingFile: Source, generatedImports: string, body: string) {
  const generatedDecls = importDeclarations(parseSnippet(generatedImports))
  const generatedSpecifiers = new Set(generatedDecls.map((d) => d.source.value))
  const generatedNamedImports = new Set(
    generatedDecls.flatMap((d) =>
      d.specifiers.map(importedName).filter((name) => name !== undefined),
    ),
  )
  const userImports = importDeclarations(existingFile).flatMap((decl) => {
    // The generator never writes `import type`, so a type-only import is the user's even
    // when it names a module the generator imports from (`import type { Pet } from
    // '../components'` beside the generated `import { PetSchema } from '../components'`).
    if (decl.importKind === 'type') return [textOf(existingFile.code, decl)]
    const spec = decl.source.value
    const named = decl.specifiers.map(importedName).filter((name) => name !== undefined)
    if (
      HANDLER_IMPORT_SOURCES.has(spec) ||
      generatedSpecifiers.has(spec) ||
      (named.length > 0 && named.every((name) => generatedNamedImports.has(name)))
    ) {
      const own = userSpecifiers(existingFile, decl, generatedNamedImports, body)
      return own === undefined ? [] : [own]
    }
    // A relative value import is the generator's when nothing refers to it any more: one
    // of a component module that moved, or of a component the document dropped. One the
    // user's code still uses (`import { db } from '../db'`) is the user's.
    return !spec.startsWith('.') || isReferenced(decl, body)
      ? [textOf(existingFile.code, decl)]
      : []
  })
  return userImports.length > 0
    ? `${generatedImports}${userImports.join('\n')}\n`
    : generatedImports
}
