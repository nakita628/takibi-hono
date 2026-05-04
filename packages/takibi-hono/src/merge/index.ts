import { Node, Project, type SourceFile, SyntaxKind } from 'ts-morph'

/**
 * Parses a code snippet into a temporary in-memory SourceFile for AST analysis.
 */
function parseSnippet(code: string) {
  return new Project({ useInMemoryFileSystem: true }).createSourceFile('snippet.ts', code)
}

/**
 * Creates a pair of in-memory source files sharing one Project instance.
 */
function makeSourcePair(existingCode: string, generatedCode: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  return {
    existingFile: project.createSourceFile('existing.ts', existingCode),
    generatedFile: project.createSourceFile('generated.ts', generatedCode),
  }
}

/**
 * Returns the source position just after the last import declaration.
 * Returns 0 if there are no import declarations.
 */
function getBodyStart(file: SourceFile) {
  const decls = file.getImportDeclarations()
  return decls.length > 0 ? decls[decls.length - 1].getEnd() : 0
}

/**
 * Returns the source slice that includes everything up to (and including) the
 * trailing newline after the last import. Empty string when there are no imports.
 */
function extractImportSection(file: SourceFile, code: string) {
  const end = getBodyStart(file)
  return end === 0 ? '' : `${code.slice(0, end)}\n`
}

/**
 * Applies range operations (replacements/deletions) to source code.
 * Each op is `[start, end, replacement]`. Ops are applied right-to-left so
 * earlier indices are not invalidated.
 */
function applyRangeOps(code: string, ops: readonly [start: number, end: number, text: string][]) {
  return [...ops]
    .toSorted(([a], [b]) => b - a)
    .reduce((acc, [start, end, text]) => acc.slice(0, start) + text + acc.slice(end), code)
}

/**
 * Walks `file` for `app.get(path, ..., handler)` style chains and yields each
 * matched call expression along with its method name, route path, and the
 * containing property-access node (for source-position queries).
 */
function* iterateRouteCalls(file: SourceFile) {
  for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression()
    if (!Node.isPropertyAccessExpression(expr)) continue
    const method = expr.getName()
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) continue
    const args = call.getArguments()
    if (args.length < 2) continue
    const pathArg = args[0]
    if (!Node.isStringLiteral(pathArg)) continue
    yield { call, propAccess: expr, method, routePath: pathArg.getLiteralValue(), args }
  }
}

/**
 * Extracts existing route handlers (final argument of each `.method()` call)
 * along with any leading JSDoc comment. Keyed by `${method}:${path}`.
 */
function extractRouteInfo(code: string) {
  const file = parseSnippet(code)
  const result = new Map<
    string,
    {
      readonly body: string
      readonly comment: string | undefined
    }
  >()
  for (const { args, propAccess, method, routePath } of iterateRouteCalls(file)) {
    const dotPos = propAccess.getNameNode().getStart() - 1
    const before = code.slice(0, dotPos)
    const commentMatch = before.match(/(\/\*\*(?:[^*]|\*(?!\/))*\*\/)\s*$/)
    result.set(`${method}:${routePath}`, {
      body: args[args.length - 1].getText(),
      comment: commentMatch?.[1],
    })
  }
  return result
}

/**
 * For each generated route call that has a matching existing handler body
 * (and isn't a stub), substitute the generated last-argument with the existing
 * one. Returns the rewritten generated code.
 */
function replaceRouteParts(
  generatedCode: string,
  existingRoutes: ReadonlyMap<
    string,
    {
      readonly body: string
      readonly comment: string | undefined
    }
  >,
) {
  const file = parseSnippet(generatedCode)
  const seenPositions = new Set<number>()
  const STUBS = new Set(['(c)=>{}', '(c)=>{return}'])
  const ops: Replacement[] = []
  for (const { args, propAccess, method, routePath } of iterateRouteCalls(file)) {
    const namePos = propAccess.getNameNode().getStart()
    if (seenPositions.has(namePos)) continue
    seenPositions.add(namePos)
    const existing = existingRoutes.get(`${method}:${routePath}`)
    if (!existing) continue
    if (STUBS.has(existing.body.replace(/\s/g, ''))) continue
    const lastArg = args[args.length - 1]
    ops.push([lastArg.getStart(), lastArg.getEnd(), existing.body])
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
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`
  return restoreRouteComments(assembled, existingRoutes)
}

/**
 * Merges generated app file (index.ts) with existing user-modified version.
 *
 * - The `export const api = ...` statement is replaced with generated version.
 * - User code between imports and api (middleware, helpers) is preserved.
 * - Code after api is preserved.
 * - Imports are reconciled (user imports kept, hono/relative imports overwritten).
 */
export function mergeAppFile(existingCode: string, generatedCode: string) {
  const { existingFile, generatedFile } = makeSourcePair(existingCode, generatedCode)
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
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`
}

export function mergeBarrelFile(_existingCode: string, generatedCode: string) {
  return generatedCode
}

function findApiStatement(file: SourceFile) {
  return file
    .getVariableStatements()
    .find(
      (stmt) =>
        stmt.isExported() && stmt.getDeclarations().some((decl) => decl.getName() === 'api'),
    )
}

function restoreRouteComments(
  code: string,
  existingRoutes: ReadonlyMap<
    string,
    {
      readonly body: string
      readonly comment: string | undefined
    }
  >,
) {
  return [...existingRoutes.entries()]
    .filter(([, info]) => info.comment !== undefined)
    .reduce((result, [key, info]) => {
      const colonIdx = key.indexOf(':')
      const method = key.slice(0, colonIdx)
      const routePath = key.slice(colonIdx + 1)
      const escapedPath = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\.${method}\\('${escapedPath}'`)
      return result.replace(pattern, `\n  ${info.comment}\n  .${method}('${escapedPath}'`)
    }, code)
}

/**
 * Merges imports for an app file. Only `hono` and relative imports are
 * generator-managed; everything else from the user is preserved verbatim.
 */
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

/**
 * Merges imports for a handler file. User imports are preserved unless they
 * are managed by the generator (handler import sources), are relative, or are
 * already declared by the generated file with the same names.
 */
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
      const spec = decl.getModuleSpecifierValue()
      if (HANDLER_IMPORT_SOURCES.has(spec) || spec.startsWith('.') || generatedSpecifiers.has(spec))
        return false
      const named = decl.getNamedImports()
      return !(named.length > 0 && named.every((ni) => generatedNamedImports.has(ni.getName())))
    })
    .map((decl) => decl.getText())
  return userImports.length > 0
    ? `${generatedImports}${userImports.join('\n')}\n`
    : generatedImports
}
