import type { Node, Program, Span } from 'oxc-parser'

import { parseModule, walk } from '../syntax/index.js'

/**
 * Identifier handling on generated source goes through the parser, so identifier-shaped
 * text inside strings, regex literals and object keys is never mistaken for a reference.
 */

/**
 * The identifier `node` names rather than refers to: a declared variable or type alias, an
 * object or type-member key, a member name (`a.b`), or the right half of a qualified type
 * name (`z.infer`). A shorthand property (`{ a }`) is a reference to `a` and names nothing.
 */
function named(node: Node): Span | undefined {
  if (node.type === 'MemberExpression') return node.computed ? undefined : node.property
  if (node.type === 'Property') {
    return node.computed || node.shorthand || node.key.type !== 'Identifier' ? undefined : node.key
  }
  if (node.type === 'TSPropertySignature') {
    return node.computed || node.key.type !== 'Identifier' ? undefined : node.key
  }
  if (node.type === 'TSQualifiedName') return node.right
  if (node.type === 'VariableDeclarator') return node.id.type === 'Identifier' ? node.id : undefined
  if (node.type === 'TSTypeAliasDeclaration') return node.id
  return undefined
}

/** Every identifier that refers to something, in source order. */
function collectReferences(program: Program) {
  const naming = new Set<number>()
  const identifiers: { readonly name: string; readonly start: number }[] = []
  walk(program, (node) => {
    const name = named(node)
    if (name) naming.add(name.start)
    if (node.type === 'Identifier') identifiers.push({ name: node.name, start: node.start })
  })
  return identifiers.filter((identifier) => !naming.has(identifier.start))
}

/** Identifiers the code reads but does not declare at the top level. */
export function collectFreeIdentifiers(code: string): ReadonlySet<string> {
  const program = parseModule(code)
  const declared = new Set(
    program.body.flatMap((statement) => {
      const node = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
      if (node?.type === 'TSTypeAliasDeclaration') return [node.id.name]
      if (node?.type !== 'VariableDeclaration') return []
      return node.declarations.flatMap((d) => (d.id.type === 'Identifier' ? [d.id.name] : []))
    }),
  )
  return new Set(
    collectReferences(program)
      .map((identifier) => identifier.name)
      .filter((name) => !declared.has(name)),
  )
}
