import { Project, SyntaxKind } from 'ts-morph'

function createProject() {
  return new Project({ useInMemoryFileSystem: true })
}

function extractRouteInfo(code: string): ReadonlyMap<
  string,
  {
    readonly body: string
    readonly comment: string | undefined
  }
> {
  const project = createProject()
  const file = project.createSourceFile('temp.ts', code)
  const result = new Map<
    string,
    {
      readonly body: string
      readonly comment: string | undefined
    }
  >()

  file.forEachDescendant((node) => {
    if (!node.isKind(SyntaxKind.CallExpression)) return
    const callExpr = node.asKind(SyntaxKind.CallExpression)
    if (!callExpr) return
    const expr = callExpr.getExpression()
    if (!expr.isKind(SyntaxKind.PropertyAccessExpression)) return
    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression)
    if (!propAccess) return
    const method = propAccess.getName()
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) return
    const args = callExpr.getArguments()
    if (args.length < 2) return
    const pathArg = args[0]
    if (!pathArg.isKind(SyntaxKind.StringLiteral)) return
    const routePath = pathArg.asKind(SyntaxKind.StringLiteral)?.getLiteralValue()
    if (!routePath) return
    const lastArg = args[args.length - 1]
    const nameNode = propAccess.getNameNode()
    const dotPos = nameNode.getStart() - 1
    const before = code.slice(0, dotPos)
    const commentMatch = before.match(/(\/\*\*(?:[^*]|\*(?!\/))*\*\/)\s*$/)

    result.set(`${method}:${routePath}`, {
      body: lastArg.getText(),
      comment: commentMatch ? commentMatch[1] : undefined,
    })
  })

  return result
}

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
  const project = createProject()
  const file = project.createSourceFile('gen.ts', generatedCode)

  type Replacement = { readonly start: number; readonly end: number; readonly text: string }
  const replacements: Replacement[] = []
  const processedPositions = new Set<number>()

  file.forEachDescendant((node) => {
    if (!node.isKind(SyntaxKind.CallExpression)) return
    const callExpr = node.asKind(SyntaxKind.CallExpression)
    if (!callExpr) return
    const expr = callExpr.getExpression()
    if (!expr.isKind(SyntaxKind.PropertyAccessExpression)) return
    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression)
    if (!propAccess) return

    const method = propAccess.getName()
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) return

    const nameNode = propAccess.getNameNode()
    if (processedPositions.has(nameNode.getStart())) return
    processedPositions.add(nameNode.getStart())

    const args = callExpr.getArguments()
    if (args.length < 2) return

    const pathArg = args[0]
    if (!pathArg.isKind(SyntaxKind.StringLiteral)) return
    const routePath = pathArg.asKind(SyntaxKind.StringLiteral)?.getLiteralValue()
    if (!routePath) return

    const key = `${method}:${routePath}`
    const existing = existingRoutes.get(key)
    if (!existing) return

    // Restore handler body (skip if stub)
    const trimmedBody = existing.body.replace(/\s/g, '')
    if (trimmedBody !== '(c)=>{}' && trimmedBody !== '(c)=>{return}') {
      const lastArg = args[args.length - 1]
      replacements.push({ start: lastArg.getStart(), end: lastArg.getEnd(), text: existing.body })
    }
  })

  return replacements
    .toSorted((a, b) => b.start - a.start)
    .reduce((code, r) => code.slice(0, r.start) + r.text + code.slice(r.end), generatedCode)
}

export function mergeHandlerFile(existingCode: string, generatedCode: string) {
  const existingRoutes = extractRouteInfo(existingCode)
  const mergedGenerated = replaceRouteParts(generatedCode, existingRoutes)
  const existingImports = extractImportSection(existingCode)
  const existingBodyCode = existingCode.slice(existingImports.length)
  const project = createProject()
  const file = project.createSourceFile('temp.ts', existingBodyCode)
  const handlerRanges = file
    .getVariableStatements()
    .filter((s) => s.getText().includes('Handler'))
    .map((s) => ({ start: s.getFullStart(), end: s.getEnd() }))
  const isInsideHandlerRange = (pos: number): boolean =>
    handlerRanges.some((r) => pos >= r.start && pos <= r.end)
  const nonHandlerCode = file
    .getStatements()
    .filter((s) => !isInsideHandlerRange(s.getStart()))
    .map((s) => s.getText())
  const generatedImports = extractImportSection(mergedGenerated)
  const mergedImports = mergeImports(existingCode, generatedImports)
  const mergedGeneratedBody = mergedGenerated
    .slice(extractImportSection(mergedGenerated).length)
    .trimStart()
  const nonHandlerSection = nonHandlerCode.length > 0 ? nonHandlerCode.join('\n\n') + '\n\n' : ''
  const assembled =
    [mergedImports, '', nonHandlerSection + mergedGeneratedBody]
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  return restoreRouteComments(assembled, existingRoutes)
}

export function mergeAppFile(existingCode: string, generatedCode: string) {
  const { existingFile, generatedFile } = (() => {
    const project = createProject()
    return {
      existingFile: project.createSourceFile('existing.ts', existingCode),
      generatedFile: project.createSourceFile('generated.ts', generatedCode),
    }
  })()
  const findApiStatement = (
    file: ReturnType<typeof createProject>['createSourceFile'] extends (...args: any[]) => infer R
      ? R
      : never,
  ) => {
    for (const stmt of file.getVariableStatements()) {
      if (!stmt.isExported()) continue
      for (const decl of stmt.getDeclarations()) {
        if (decl.getName() === 'api') return stmt
      }
    }
    return undefined
  }
  const existingApiStmt = findApiStatement(existingFile)
  const generatedApiStmt = findApiStatement(generatedFile)
  if (!existingApiStmt || !generatedApiStmt) return generatedCode
  const generatedImports = extractImportSection(generatedCode)
  const mergedImports = mergeAppImports(existingCode, generatedImports)
  const generatedApiText = generatedApiStmt.getText()
  const existingApiStart = existingApiStmt.getStart()
  const existingApiEnd = existingApiStmt.getEnd()
  const afterApi = existingCode.slice(existingApiEnd)
  const existingImportSection = extractImportSection(existingCode)
  const betweenImportsAndApi = existingCode.slice(existingImportSection.length, existingApiStart)

  return (
    [mergedImports.trimEnd(), '\n', betweenImportsAndApi, generatedApiText, afterApi]
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}

export function mergeBarrelFile(_existingCode: string, generatedCode: string) {
  return generatedCode
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
      const [method] = key.split(':')
      const routePath = key.slice(method.length + 1)
      const escapedPath = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\.${method}\\('${escapedPath}'`)
      return result.replace(pattern, `\n  ${info.comment}\n  .${method}('${escapedPath}'`)
    }, code)
}

function extractImportSection(code: string) {
  const project = createProject()
  const file = project.createSourceFile('temp.ts', code)
  const imports = file.getImportDeclarations()
  if (imports.length === 0) return ''
  const lastImport = imports[imports.length - 1]
  return code.slice(0, lastImport.getEnd()) + '\n'
}

function mergeAppImports(existingCode: string, generatedImports: string) {
  const project = createProject()
  const existingFile = project.createSourceFile('existing.ts', existingCode)

  const userImports = existingFile
    .getImportDeclarations()
    .filter((decl) => {
      const spec = decl.getModuleSpecifierValue()
      // Only 'hono' and relative imports (./handlers) are managed by generator
      return spec !== 'hono' && !spec.startsWith('.')
    })
    .map((decl) => decl.getText())

  return userImports.length > 0
    ? generatedImports + userImports.join('\n') + '\n'
    : generatedImports
}

function mergeImports(existingCode: string, generatedImports: string) {
  const project = createProject()
  const existingFile = project.createSourceFile('existing.ts', existingCode)

  const handlerImportSources = new Set([
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
  const generatedFile = project.createSourceFile('generated.ts', generatedImports)
  const generatedDecls = generatedFile.getImportDeclarations()
  const generatedSpecifiers = new Set(generatedDecls.map((decl) => decl.getModuleSpecifierValue()))
  const generatedNamedImports = new Set(
    generatedDecls.flatMap((decl) => decl.getNamedImports().map((ni) => ni.getName())),
  )
  const userImports = existingFile
    .getImportDeclarations()
    .filter((decl) => {
      const spec = decl.getModuleSpecifierValue()
      if (handlerImportSources.has(spec) || spec.startsWith('.') || generatedSpecifiers.has(spec))
        return false
      const namedImports = decl.getNamedImports()
      if (
        namedImports.length > 0 &&
        namedImports.every((ni) => generatedNamedImports.has(ni.getName()))
      )
        return false
      return true
    })
    .map((decl) => decl.getText())

  return userImports.length > 0
    ? generatedImports + userImports.join('\n') + '\n'
    : generatedImports
}
