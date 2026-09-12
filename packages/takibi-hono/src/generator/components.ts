import type { ComponentAdapter, Components } from 'oas-truth'
import {
  makeCallbacksCode,
  makeExamplesCode,
  makeHeadersCode,
  makeLinksCode,
  makeParametersCode,
  makePathItemsCode,
  makeRequestBodiesCode,
  makeResponsesCode,
  makeSecuritySchemesCode,
  toIdentifierPascalCase,
} from 'oas-truth'

export const COMPONENT_KINDS = [
  'parameters',
  'headers',
  'securitySchemes',
  'requestBodies',
  'responses',
  'examples',
  'links',
  'callbacks',
  'pathItems',
  'mediaTypes',
] as const

export type ComponentKind = (typeof COMPONENT_KINDS)[number]

type BuildOptions = { readonly exportTypes: boolean; readonly readonly: boolean }

/** `components.mediaTypes` (OAS 3.2) — the one Components key oas-truth has no builder for. */
function makeMediaTypesCode(
  components: Components,
  adapter: ComponentAdapter,
  exportTypes: boolean,
) {
  return Object.entries(components.mediaTypes ?? {})
    .flatMap(([name, media]) => {
      if (!('schema' in media) || !media.schema) return []
      const constName = `${toIdentifierPascalCase(name)}MediaTypeSchema`
      const typeInfer = exportTypes ? `\n\n${adapter.renderTypeInfer(constName)}` : ''
      return [`export const ${constName}=${adapter.toExpression(media.schema)}${typeInfer}`]
    })
    .join('\n\n')
}

const BUILDERS: {
  readonly [K in ComponentKind]: (
    components: Components,
    adapter: ComponentAdapter,
    options: BuildOptions,
  ) => string
} = {
  parameters: (c, a, o) => makeParametersCode(c, a, o.exportTypes),
  headers: (c, a, o) => makeHeadersCode(c, a, o.exportTypes),
  securitySchemes: (c, _, o) => makeSecuritySchemesCode(c, o.readonly),
  requestBodies: (c, a, o) => makeRequestBodiesCode(c, a, o.readonly),
  responses: (c, a, o) => makeResponsesCode(c, a, o.readonly),
  examples: (c, _, o) => makeExamplesCode(c, o.readonly),
  links: (c, _, o) => makeLinksCode(c, o.readonly),
  callbacks: (c, a, o) => makeCallbacksCode(c, a, o.readonly),
  pathItems: (c, a, o) => makePathItemsCode(c, a, o.readonly),
  mediaTypes: (c, a, o) => makeMediaTypesCode(c, a, o.exportTypes),
}

/**
 * The declarations of one Components kind, without imports (the caller derives
 * them from what the code references). `split` yields one entry per component.
 */
export function makeComponentCode(
  kind: ComponentKind,
  components: Components,
  adapter: ComponentAdapter,
  options: BuildOptions & { readonly split: boolean },
): readonly { readonly fileName: string; readonly code: string }[] {
  const build = (subset: Components) =>
    BUILDERS[kind](subset, adapter, options)
      .split('\n')
      .filter((line) => !line.startsWith('import '))
      .join('\n')
      .trim()
  if (!options.split) {
    const code = build(components)
    return code === '' ? [] : [{ fileName: 'index', code }]
  }
  const entries: { readonly [name: string]: unknown } = components[kind] ?? {}
  return Object.entries(entries).flatMap(([name, value]) => {
    const code = build({ [kind]: { [name]: value } })
    const ident = toIdentifierPascalCase(name)
    return code === ''
      ? []
      : [{ fileName: `${ident.charAt(0).toLowerCase()}${ident.slice(1)}`, code }]
  })
}
