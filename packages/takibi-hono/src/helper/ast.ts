import ts from 'typescript'

import type { Schema } from '../openapi/index.js'

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

function collectIdentifiers(node: ts.Node): readonly string[] {
  const visit = (n: ts.Node): readonly string[] => {
    const current: readonly string[] = ts.isIdentifier(n) ? [n.text] : []
    const children: readonly string[] = getChildren(n).flatMap(visit)
    return [...current, ...children]
  }
  return visit(node)
}

function createDeclaration(
  name: string,
  fullText: string,
  refs: readonly string[],
  kind: 'variable' | 'type' | 'interface',
) {
  return { name, fullText, refs, kind }
}

function getDeclarationName(statement: ts.Statement) {
  if (ts.isVariableStatement(statement)) {
    const declaration = statement.declarationList.declarations[0]
    return declaration && ts.isIdentifier(declaration.name) ? declaration.name.text : undefined
  }
  if (ts.isTypeAliasDeclaration(statement)) return statement.name.text
  if (ts.isInterfaceDeclaration(statement)) return statement.name.text
  return undefined
}

function getDeclarationKind(statement: ts.Statement) {
  if (ts.isVariableStatement(statement)) return 'variable'
  if (ts.isTypeAliasDeclaration(statement)) return 'type'
  if (ts.isInterfaceDeclaration(statement)) return 'interface'
  return undefined
}

function isLazySchema(statement: ts.Statement): boolean {
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
  if (isLazySchema(statement)) return [] as const
  const identifiers = collectIdentifiers(statement)
  return [
    ...new Set(
      identifiers.filter((id) => {
        if (!declNames.has(id)) return false
        if (id === selfName && (selfKind === 'type' || selfKind === 'interface')) return true
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

type TarjanState = {
  readonly indices: Map<string, number>
  readonly lowLinks: Map<string, number>
  readonly onStack: Set<string>
  readonly stack: readonly string[]
  readonly sccs: readonly (readonly string[])[]
  readonly index: number
}

function createInitialState(): TarjanState {
  return {
    indices: new Map(),
    lowLinks: new Map(),
    onStack: new Set(),
    stack: [],
    sccs: [],
    index: 0,
  }
}

function popStackUntil(
  stack: readonly string[],
  onStack: Set<string>,
  name: string,
): {
  readonly scc: readonly string[]
  readonly newStack: readonly string[]
  readonly newOnStack: Set<string>
} {
  const idx = stack.lastIndexOf(name)
  if (idx === -1) return { scc: [], newStack: stack, newOnStack: onStack }
  const scc = stack.slice(idx)
  const newStack = stack.slice(0, idx)
  const newOnStack = new Set([...onStack].filter((n) => !scc.includes(n)))
  return { scc, newStack, newOnStack }
}

function tarjanConnect(
  name: string,
  graph: ReadonlyMap<string, readonly string[]>,
  state: TarjanState,
): TarjanState {
  const currentIndex = state.index
  const indices = new Map(state.indices).set(name, currentIndex)
  const lowLinks = new Map(state.lowLinks).set(name, currentIndex)
  const stack: readonly string[] = [...state.stack, name]
  const onStack = new Set([...state.onStack, name])

  const initial: TarjanState = {
    ...state,
    indices,
    lowLinks,
    stack,
    onStack,
    index: currentIndex + 1,
  }

  const afterDeps = (graph.get(name) ?? []).reduce<TarjanState>((s, neighbor) => {
    if (!graph.has(neighbor)) return s
    if (!s.indices.has(neighbor)) {
      const afterConnect = tarjanConnect(neighbor, graph, s)
      const newLowLink = Math.min(
        afterConnect.lowLinks.get(name) ?? 0,
        afterConnect.lowLinks.get(neighbor) ?? 0,
      )
      const updatedLowLinks = new Map(afterConnect.lowLinks).set(name, newLowLink)
      return { ...afterConnect, lowLinks: updatedLowLinks }
    }
    if (s.onStack.has(neighbor)) {
      const newLowLink = Math.min(s.lowLinks.get(name) ?? 0, s.indices.get(neighbor) ?? 0)
      const updatedLowLinks = new Map(s.lowLinks).set(name, newLowLink)
      return { ...s, lowLinks: updatedLowLinks }
    }
    return s
  }, initial)

  if (afterDeps.lowLinks.get(name) === afterDeps.indices.get(name)) {
    const { scc, newStack, newOnStack } = popStackUntil(afterDeps.stack, afterDeps.onStack, name)
    return {
      ...afterDeps,
      stack: newStack,
      onStack: newOnStack,
      sccs: [...afterDeps.sccs, scc],
    }
  }
  return afterDeps
}

function collectRefs(schema: Schema): readonly string[] {
  const selfRef =
    schema.$ref && schema.$ref.startsWith('#/components/schemas/')
      ? [schema.$ref.split('/').at(-1) ?? '']
      : []
  const itemRefs = schema.items
    ? Array.isArray(schema.items)
      ? (schema.items as readonly Schema[]).flatMap(collectRefs)
      : collectRefs(schema.items as Schema)
    : []
  const propRefs = schema.properties ? Object.values(schema.properties).flatMap(collectRefs) : []
  const additionalRefs =
    schema.additionalProperties && typeof schema.additionalProperties === 'object'
      ? collectRefs(schema.additionalProperties)
      : []
  const compositionRefs = [
    ...(schema.allOf ?? []),
    ...(schema.oneOf ?? []),
    ...(schema.anyOf ?? []),
  ].flatMap(collectRefs)
  const notRefs = schema.not ? collectRefs(schema.not) : []
  return [
    ...selfRef.filter((r) => r !== ''),
    ...itemRefs,
    ...propRefs,
    ...additionalRefs,
    ...compositionRefs,
    ...notRefs,
  ]
}

export function detectCircularRefs(schemas: { readonly [k: string]: Schema }): ReadonlySet<string> {
  const graph = new Map<string, readonly string[]>(
    Object.entries(schemas).map(([name, schema]) => [name, collectRefs(schema)]),
  )
  const names = [...graph.keys()]
  const finalState = names.reduce(
    (state, n) => (state.indices.has(n) ? state : tarjanConnect(n, graph, state)),
    createInitialState(),
  )
  return new Set(
    finalState.sccs.flatMap((scc) => {
      if (scc.length > 1) return [...scc]
      const single = scc[0]
      if (!single) return []
      return (graph.get(single) ?? []).includes(single) ? [single] : []
    }),
  )
}

const LAZY_WRAPPERS: Record<string, { readonly open: string; readonly close: string }> = {
  zod: { open: 'z.lazy(() => ', close: ')' },
  valibot: { open: 'v.lazy(() => ', close: ')' },
  typebox: { open: 'Type.Recursive(This => ', close: ')' },
  arktype: { open: '', close: '' },
  effect: { open: 'Schema.suspend(() => ', close: ')' },
}

export function getLazyWrapper(schemaLib: string): {
  readonly open: string
  readonly close: string
} {
  return LAZY_WRAPPERS[schemaLib] ?? { open: '', close: '' }
}
