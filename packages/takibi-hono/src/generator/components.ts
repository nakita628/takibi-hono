import type { ComponentAdapter, ComponentCodeOptions, Components } from 'oas-truth'
import {
  makeCallbacksDeclarations,
  makeExamplesDeclarations,
  makeHeadersDeclarations,
  makeLinksDeclarations,
  makeMediaTypesDeclarations,
  makeParametersDeclarations,
  makePathItemsDeclarations,
  makeRequestBodiesDeclarations,
  makeResponsesDeclarations,
  makeSchemaIdentifiers,
  makeSecuritySchemesDeclarations,
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

type Declaration = { readonly fileName: string; readonly code: string }

const BUILDERS: {
  readonly [K in ComponentKind]: (
    components: Components,
    adapter: ComponentAdapter,
    options: ComponentCodeOptions,
  ) => readonly Declaration[]
} = {
  parameters: makeParametersDeclarations,
  headers: makeHeadersDeclarations,
  // Three kinds hold no schema, so their builders take no adapter.
  securitySchemes: (components, _, options) => makeSecuritySchemesDeclarations(components, options),
  requestBodies: makeRequestBodiesDeclarations,
  responses: makeResponsesDeclarations,
  examples: (components, _, options) => makeExamplesDeclarations(components, options),
  links: (components, _, options) => makeLinksDeclarations(components, options),
  callbacks: makeCallbacksDeclarations,
  pathItems: makePathItemsDeclarations,
  mediaTypes: makeMediaTypesDeclarations,
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
): readonly Declaration[] {
  const entries = BUILDERS[kind](components, adapter, {
    exportTypes: options.exportTypes,
    readonly: options.readonly,
    identifiers: makeSchemaIdentifiers(components.schemas ?? {}),
  })
  if (options.split) return entries.map(({ fileName, code }) => ({ fileName, code }))
  const code = entries.map((entry) => entry.code).join(';')
  return code === '' ? [] : [{ fileName: 'index', code }]
}
