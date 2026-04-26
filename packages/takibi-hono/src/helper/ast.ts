import ts from 'typescript'

function makeSourceFile(code: string) {
  return ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function getChildren(node: ts.Node): readonly ts.Node[] {
  const syntaxChildren = node.getChildren()
  if (syntaxChildren.length > 0) return syntaxChildren
  const semanticChildren: ts.Node[] = []
  ts.forEachChild(node, (child) => {
    semanticChildren[semanticChildren.length] = child
  })
  return semanticChildren
}

function collectIdentifiers(node: ts.Node) {
  const visit = (n: ts.Node): readonly string[] => {
    const current = ts.isIdentifier(n) ? [n.text] : []
    const children = getChildren(n).flatMap(visit)
    return [...current, ...children] as const
  }
  return visit(node)
}

function createDeclaration(
  name: string,
  fullText: string,
  refs: readonly string[],
  kind: 'variable' | 'type' | 'interface',
) {
  return {
    name,
    fullText,
    refs,
    kind,
  }
}

function getDeclarationName(statement: ts.Statement) {
  if (ts.isVariableStatement(statement)) {
    const declaration = statement.declarationList.declarations[0]
    return declaration && ts.isIdentifier(declaration.name) ? declaration.name.text : undefined
  }
  if (ts.isTypeAliasDeclaration(statement)) {
    return statement.name.text
  }
  if (ts.isInterfaceDeclaration(statement)) {
    return statement.name.text
  }
  return undefined
}

function getDeclarationKind(statement: ts.Statement) {
  if (ts.isVariableStatement(statement)) return 'variable'
  if (ts.isTypeAliasDeclaration(statement)) return 'type'
  if (ts.isInterfaceDeclaration(statement)) return 'interface'
  return undefined
}

const isLazySchema = (statement: ts.Statement): boolean => {
  if (!ts.isVariableStatement(statement)) return false
  const declaration = statement.declarationList.declarations[0]
  if (!declaration?.initializer) return false

  const initText = declaration.initializer.getText()
  return (
    /^z\.lazy\s*\(/.test(initText) ||
    /^v\.lazy\s*\(/.test(initText) ||
    /^Schema\.suspend\s*\(/.test(initText) ||
    /^Type\.Recursive\s*\(/.test(initText)
  )
}

function getStatementReferences(
  statement: ts.Statement,
  declNames: ReadonlySet<string>,
  selfName: string,
  selfKind: 'variable' | 'type' | 'interface',
) {
  if (isLazySchema(statement)) return []
  const identifiers = collectIdentifiers(statement)
  return [
    ...new Set(
      identifiers.filter((id) => {
        if (!declNames.has(id)) return false
        if (id === selfName && (selfKind === 'type' || selfKind === 'interface')) {
          return true
        }
        return id !== selfName
      }),
    ),
  ] as const
}

function parseStatements(sourceFile: ts.SourceFile) {
  const statements = sourceFile.statements.filter(
    (s) =>
      ts.isVariableStatement(s) || ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s),
  )
  const declNames = new Set(
    statements.map(getDeclarationName).filter((n): n is string => n !== undefined),
  )
  return statements
    .map((statement): ReturnType<typeof createDeclaration> | undefined => {
      const name = getDeclarationName(statement)
      const kind = getDeclarationKind(statement)
      if (!(name && kind)) return undefined
      const fullText = statement.getText(sourceFile)
      const refs = getStatementReferences(statement, declNames, name, kind)
      return createDeclaration(name, fullText, refs, kind)
    })
    .filter((d) => d !== undefined)
}

function topoSort(
  decls: readonly {
    name: string
    fullText: string
    refs: readonly string[]
    kind: 'variable' | 'type' | 'interface'
  }[],
) {
  const makeKey = (kind: 'variable' | 'type' | 'interface', name: string): string =>
    `${kind}:${name}`
  const map = new Map(decls.map((d) => [makeKey(d.kind, d.name), d]))
  const findByName = (name: string): ReturnType<typeof createDeclaration> | undefined =>
    map.get(makeKey('variable', name)) ??
    map.get(makeKey('type', name)) ??
    map.get(makeKey('interface', name))
  const visit = (
    key: string,
    state: {
      readonly sorted: readonly ReturnType<typeof createDeclaration>[]
      readonly perm: ReadonlySet<string>
      readonly temp: ReadonlySet<string>
    },
  ): typeof state => {
    if (state.perm.has(key) || state.temp.has(key)) return state
    const decl = map.get(key)
    if (!decl) return state

    const withTemp: typeof state = { ...state, temp: new Set([...state.temp, key]) }
    const afterRefs = decl.refs
      .map((ref) => findByName(ref))
      .filter((d): d is ReturnType<typeof createDeclaration> => d !== undefined)
      .reduce((s, d) => visit(makeKey(d.kind, d.name), s), withTemp)

    return {
      sorted: [...afterRefs.sorted, decl],
      perm: new Set([...afterRefs.perm, key]),
      temp: new Set([...afterRefs.temp].filter((t) => t !== key)),
    } as const
  }
  const initial: Parameters<typeof visit>[1] = { sorted: [], perm: new Set(), temp: new Set() }
  return decls.reduce((state, d) => visit(makeKey(d.kind, d.name), state), initial).sorted
}

export function ast(code: string): string {
  const sourceFile = makeSourceFile(code)
  const decls = parseStatements(sourceFile)
  if (decls.length === 0) return code
  return topoSort(decls)
    .map((d) => d.fullText)
    .join('\n\n')
}
