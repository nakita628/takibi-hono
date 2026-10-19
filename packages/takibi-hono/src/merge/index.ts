import type { SourceFile } from 'ts-morph'
import { Node, Project, SyntaxKind } from 'ts-morph'

/** What a route call in the existing file contributes to the regenerated one. */
type RouteInfo = {
  readonly method: string
  readonly routePath: string
  /** The handler, the call's last argument, as written. */
  readonly body: string
  /** The JSDoc right above the call, if any. */
  readonly comment: string | undefined
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

function parseSnippet(code: string) {
  return new Project({ useInMemoryFileSystem: true }).createSourceFile('snippet.ts', code)
}

function getBodyStart(file: SourceFile) {
  const decls = file.getImportDeclarations()
  return decls.at(-1)?.getEnd() ?? 0
}

function extractImportSection(file: SourceFile, code: string) {
  const end = getBodyStart(file)
  return end === 0 ? '' : `${code.slice(0, end)}\n`
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

function* iterateRouteCalls(file: SourceFile) {
  for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const propAccess = call.getExpression()
    if (!Node.isPropertyAccessExpression(propAccess)) continue
    const callName = propAccess.getName()
    const args = call.getArguments()
    if (callName === 'on') {
      if (args.length < 3) continue
      const methodArg = args[0]
      const pathArg = args[1]
      if (!Node.isStringLiteral(methodArg) || !Node.isStringLiteral(pathArg)) continue
      yield {
        propAccess,
        method: methodArg.getLiteralValue().toLowerCase(),
        routePath: pathArg.getLiteralValue(),
        args,
      }
      continue
    }
    if (!CHAIN_METHODS.has(callName)) continue
    if (args.length < 2) continue
    const pathArg = args[0]
    if (!Node.isStringLiteral(pathArg)) continue
    yield { propAccess, method: callName, routePath: pathArg.getLiteralValue(), args }
  }
}

function extractRouteInfo(code: string) {
  const file = parseSnippet(code)
  const result = new Map<string, RouteInfo>()
  for (const { args, propAccess, method, routePath } of iterateRouteCalls(file)) {
    const dotPos = propAccess.getNameNode().getStart() - 1
    const before = code.slice(0, dotPos)
    const commentMatch = before.match(/(\/\*\*(?:[^*]|\*(?!\/))*\*\/)\s*$/u)
    result.set(`${method}:${routePath}`, {
      method,
      routePath,
      body: args.at(-1)?.getText() ?? '',
      comment: commentMatch?.[1],
    })
  }
  return result
}

function replaceRouteParts(generatedCode: string, existingRoutes: ReadonlyMap<string, RouteInfo>) {
  const file = parseSnippet(generatedCode)
  const seenPositions = new Set<number>()
  const ops: [start: number, end: number, text: string][] = []
  for (const { args, propAccess, method, routePath } of iterateRouteCalls(file)) {
    const namePos = propAccess.getNameNode().getStart()
    if (seenPositions.has(namePos)) continue
    seenPositions.add(namePos)
    const existing = existingRoutes.get(`${method}:${routePath}`)
    if (!existing) continue
    if (existing.body.replaceAll(/\s/gu, '') === STUB) continue
    const lastArg = args.at(-1)
    if (lastArg) ops.push([lastArg.getStart(), lastArg.getEnd(), existing.body])
  }
  return applyRangeOps(generatedCode, ops)
}

/**
 * Merges generated handler file with existing user-modified version.
 *
 * - Route handler bodies present in existing are preserved; generated metadata
 *   (path, describeRoute call) is taken from generated.
 * - Non-handler statements in existing (helpers, constants) are preserved.
 * - Imports are reconciled: user imports kept, generator-managed imports overwritten.
 * - Leading JSDoc comments above route calls in existing are restored on output.
 */
export function mergeHandlerFile(existingCode: string, generatedCode: string) {
  const existingRoutes = extractRouteInfo(existingCode)
  const mergedGenerated = replaceRouteParts(generatedCode, existingRoutes)

  const existingFile = parseSnippet(existingCode)
  const existingImportText = extractImportSection(existingFile, existingCode)
  const existingBodyFile = parseSnippet(existingCode.slice(existingImportText.length))
  const handlerRanges = existingBodyFile
    .getVariableStatements()
    .filter((s) => s.getText().includes('Handler'))
    .map((s) => [s.getFullStart(), s.getEnd()] as const)
  const isInsideHandlerRange = (pos: number) =>
    handlerRanges.some(([start, end]) => pos >= start && pos <= end)
  const nonHandlerCode = existingBodyFile
    .getStatements()
    .filter((s) => !isInsideHandlerRange(s.getStart()))
    .map((s) => s.getText())

  const mergedGeneratedFile = parseSnippet(mergedGenerated)
  const generatedImportText = extractImportSection(mergedGeneratedFile, mergedGenerated)
  const mergedImports = mergeImports(existingFile, generatedImportText)
  const mergedGeneratedBody = mergedGenerated.slice(generatedImportText.length).trimStart()
  const nonHandlerSection = nonHandlerCode.length > 0 ? `${nonHandlerCode.join('\n\n')}\n\n` : ''
  const assembled = `${[mergedImports, '', nonHandlerSection + mergedGeneratedBody]
    .join('\n')
    .replaceAll(/\n{3,}/gu, '\n\n')
    .trim()}\n`
  return restoreRouteComments(assembled, existingRoutes)
}

export function mergeAppFile(existingCode: string, generatedCode: string) {
  const existingFile = parseSnippet(existingCode)
  const generatedFile = parseSnippet(generatedCode)
  const existingApiStmt = findApiStatement(existingFile)
  const generatedApiStmt = findApiStatement(generatedFile)
  if (!existingApiStmt || !generatedApiStmt) return generatedCode
  const generatedImportText = extractImportSection(generatedFile, generatedCode)
  const mergedImports = mergeAppImports(existingFile, generatedImportText)
  const generatedApiText = generatedApiStmt.getText()
  const existingImportText = extractImportSection(existingFile, existingCode)
  const betweenImportsAndApi = existingCode.slice(
    existingImportText.length,
    existingApiStmt.getStart(),
  )
  const afterApi = existingCode.slice(existingApiStmt.getEnd())
  return `${[mergedImports.trimEnd(), '\n', betweenImportsAndApi, generatedApiText, afterApi]
    .join('')
    .replaceAll(/\n{3,}/gu, '\n\n')
    .trim()}\n`
}

function findApiStatement(file: SourceFile) {
  return file
    .getVariableStatements()
    .find(
      (stmt) =>
        stmt.isExported() && stmt.getDeclarations().some((decl) => decl.getName() === 'api'),
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

/** Only `hono` and relative imports are generator-managed; everything else from the user is preserved verbatim. */
function mergeAppImports(existingFile: SourceFile, generatedImports: string) {
  const userImports = existingFile
    .getImportDeclarations()
    .filter((decl) => {
      const spec = decl.getModuleSpecifierValue()
      return spec !== 'hono' && !spec.startsWith('.')
    })
    .map((decl) => decl.getText())
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

/** User imports are preserved unless generator-managed (HANDLER_IMPORT_SOURCES), relative, or duplicated by generated names. */
function mergeImports(existingFile: SourceFile, generatedImports: string) {
  const generatedFile = parseSnippet(generatedImports)
  const generatedDecls = generatedFile.getImportDeclarations()
  const generatedSpecifiers = new Set(generatedDecls.map((d) => d.getModuleSpecifierValue()))
  const generatedNamedImports = new Set(
    generatedDecls.flatMap((d) => d.getNamedImports().map((ni) => ni.getName())),
  )
  const userImports = existingFile
    .getImportDeclarations()
    .filter((decl) => {
      // The generator never writes `import type`, so a type-only import is the user's even
      // when it names a module the generator imports from (`import type { Pet } from
      // '../components'` beside the generated `import { PetSchema } from '../components'`).
      if (decl.isTypeOnly()) return true
      const spec = decl.getModuleSpecifierValue()
      if (HANDLER_IMPORT_SOURCES.has(spec) || generatedSpecifiers.has(spec)) return false
      // A value import from a relative path is generator-managed.
      if (spec.startsWith('.')) return false
      const named = decl.getNamedImports()
      return !(named.length > 0 && named.every((ni) => generatedNamedImports.has(ni.getName())))
    })
    .map((decl) => decl.getText())
  return userImports.length > 0
    ? `${generatedImports}${userImports.join('\n')}\n`
    : generatedImports
}
