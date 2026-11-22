import { collectFreeIdentifiers } from './identifiers.js'

export type ImportEntry = {
  readonly name: string
  readonly from: string
  readonly style?: 'namespace' | 'type'
}

/**
 * A helper the generated module declares for itself rather than imports: `declaration` is
 * written below the imports when the body refers to `name`, and what it refers to is imported
 * like the body's own references.
 */
export type LocalEntry = {
  readonly name: string
  readonly declaration: string
}

const isLocal = (entry: ImportEntry | LocalEntry): entry is LocalEntry => 'declaration' in entry
const isImport = (entry: ImportEntry | LocalEntry): entry is ImportEntry => !isLocal(entry)

function renderImport(from: string, entries: readonly ImportEntry[]) {
  const namespace = entries.find((entry) => entry.style === 'namespace')
  if (namespace) return `import*as ${namespace.name} from'${from}'`
  if (entries.every((entry) => entry.style === 'type')) {
    return `import type{${entries.map((entry) => entry.name).join(',')}}from'${from}'`
  }
  const names = entries.map((entry) => (entry.style === 'type' ? `type ${entry.name}` : entry.name))
  return `import{${names.join(',')}}from'${from}'`
}

/**
 * Import lines for the candidates the code actually references, grouped per
 * module in candidate order. The first candidate for a name wins.
 */
export function makeImports(code: string, candidates: readonly ImportEntry[]) {
  const used = collectFreeIdentifiers(code)
  const referenced = candidates.filter((entry) => used.has(entry.name))
  const modules = referenced
    .filter((entry, index) => referenced.findIndex((e) => e.name === entry.name) === index)
    .reduce(
      (acc, entry) => acc.set(entry.from, [...(acc.get(entry.from) ?? []), entry]),
      new Map<string, readonly ImportEntry[]>(),
    )
  return [...modules].map(([from, entries]) => renderImport(from, entries))
}

/** The `index.ts` of a split directory: one `export * from` per file, sorted by file name. */
export function makeBarrel(fileNames: readonly string[]) {
  return fileNames
    .toSorted()
    .map((name) => `export*from'./${name}'`)
    .join('\n')
}

/**
 * Prepends the import block (if any) to a generated module body, and between them the
 * declarations of the local helpers the body refers to.
 */
export function withImports(body: string, candidates: readonly (ImportEntry | LocalEntry)[]) {
  const used = collectFreeIdentifiers(body)
  const locals = candidates
    .filter(isLocal)
    .filter((entry) => used.has(entry.name))
    .map((entry) => entry.declaration)
  const code = [...locals, body].join('\n\n')
  const imports = makeImports(code, candidates.filter(isImport))
  return imports.length > 0 ? `${imports.join('\n')}\n\n${code}` : code
}
