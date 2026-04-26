import type { Schema } from '../openapi/index.js'

export function detectCircularRefs(schemas: { readonly [k: string]: Schema }) {
  const graph = new Map<string, readonly string[]>()
  for (const [name, schema] of Object.entries(schemas)) {
    const refs = collectRefs(schema)
    graph.set(name, refs)
  }
  const circularNames = new Set<string>()
  let index = 0
  const nodeIndex = new Map<string, number>()
  const nodeLowlink = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: string[] = []

  function strongconnect(name: string) {
    nodeIndex.set(name, index)
    nodeLowlink.set(name, index)
    index++
    stack.push(name)
    onStack.add(name)
    const neighbors = graph.get(name) ?? []
    for (const neighbor of neighbors) {
      if (!graph.has(neighbor)) continue // skip refs to non-existent schemas
      if (!nodeIndex.has(neighbor)) {
        strongconnect(neighbor)
        nodeLowlink.set(name, Math.min(nodeLowlink.get(name)!, nodeLowlink.get(neighbor)!))
      } else if (onStack.has(neighbor)) {
        nodeLowlink.set(name, Math.min(nodeLowlink.get(name)!, nodeIndex.get(neighbor)!))
      }
    }

    if (nodeLowlink.get(name) === nodeIndex.get(name)) {
      const scc: string[] = []
      let w: string
      do {
        w = stack.pop()!
        onStack.delete(w)
        scc.push(w)
      } while (w !== name)
      if (scc.length > 1) {
        for (const n of scc) circularNames.add(n)
      } else if (scc.length === 1) {
        const selfRefs = graph.get(scc[0]) ?? []
        if (selfRefs.includes(scc[0])) {
          circularNames.add(scc[0])
        }
      }
    }
  }

  for (const name of graph.keys()) {
    if (!nodeIndex.has(name)) {
      strongconnect(name)
    }
  }

  return circularNames
}

function collectRefs(schema: Schema): readonly string[] {
  const refFromSchema = (s: Schema): readonly string[] => {
    const selfRef =
      s.$ref && s.$ref.startsWith('#/components/schemas/') ? [s.$ref.split('/').at(-1)!] : []
    const itemRefs = s.items
      ? Array.isArray(s.items)
        ? (s.items as readonly Schema[]).flatMap(refFromSchema)
        : refFromSchema(s.items as Schema)
      : []
    const propRefs = s.properties ? Object.values(s.properties).flatMap(refFromSchema) : []
    const additionalRefs =
      s.additionalProperties && typeof s.additionalProperties === 'object'
        ? refFromSchema(s.additionalProperties)
        : []
    const compositionRefs = [...(s.allOf ?? []), ...(s.oneOf ?? []), ...(s.anyOf ?? [])].flatMap(
      refFromSchema,
    )
    const notRefs = s.not ? refFromSchema(s.not) : []

    return [...selfRef, ...itemRefs, ...propRefs, ...additionalRefs, ...compositionRefs, ...notRefs]
  }
  return refFromSchema(schema)
}

export function getLazyWrapper(schemaLib: string): {
  readonly open: string
  readonly close: string
} {
  switch (schemaLib) {
    case 'zod':
      return { open: 'z.lazy(() => ', close: ')' }
    case 'valibot':
      return { open: 'v.lazy(() => ', close: ')' }
    case 'typebox':
      return { open: 'Type.Recursive(This => ', close: ')' }
    case 'arktype':
      // arktype has native support for recursive types
      return { open: '', close: '' }
    case 'effect':
      return { open: 'Schema.suspend(() => ', close: ')' }
    default:
      return { open: '', close: '' }
  }
}
