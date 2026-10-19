import { parseSync, visitorKeys } from 'oxc-parser'
import type { Node, Program, Span } from 'oxc-parser'

/**
 * Parses a TypeScript module for reading. What a caller takes from the tree is a position,
 * a name or a kind; the text of a node is sliced from `code` by its position, so that what
 * is written back is the source as it was, comments included.
 *
 * A module that does not parse comes back with an empty tree and the errors that stopped
 * it: the parser recovers nothing past a syntax error. A caller that reads a file a hand
 * edit may have broken asks for the errors, and leaves such a file alone.
 */
export function parseSource(code: string): {
  readonly program: Program
  readonly errors: readonly string[]
} {
  const { program, errors } = parseSync('module.ts', code, { lang: 'ts', sourceType: 'module' })
  return { program, errors: errors.map((error) => error.message) }
}

/** The tree of a module known to parse, such as one the generator just wrote. */
export function parseModule(code: string): Program {
  return parseSource(code).program
}

/** The source of a node, as written. */
export function textOf(code: string, node: Span) {
  return code.slice(node.start, node.end)
}

function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    'start' in value
  )
}

/**
 * Calls `visit` on `node` and on every node under it, each child in the order the grammar
 * lists them, which is source order. A node whose children the parser does not list is
 * walked over its fields.
 */
export function walk(node: Node, visit: (node: Node) => void): void {
  visit(node)
  const keys =
    visitorKeys[node.type] ?? Object.keys(node).filter((key) => key !== 'type' && key !== 'parent')
  for (const key of keys) {
    // Read by name rather than through `Object.entries`: a node has many more fields than
    // children.
    const child: unknown = Reflect.get(node, key)
    if (Array.isArray(child)) {
      for (const item of child) {
        if (isNode(item)) walk(item, visit)
      }
    } else if (isNode(child)) {
      walk(child, visit)
    }
  }
}

/** The nodes under `node` that `is` picks out, in source order, the node itself included. */
export function descendantsWhere<T extends Node>(
  node: Node,
  is: (candidate: Node) => candidate is T,
): readonly T[] {
  const found: T[] = []
  walk(node, (candidate) => {
    if (is(candidate)) found.push(candidate)
  })
  return found
}
