/**
 * What the typed client is created with, `hc(baseUrl)`: `/` for the same origin, an
 * environment variable read when the client is created, or a property of an environment
 * object a module of the user's exports.
 */
export type BaseUrl =
  | '/'
  | { readonly env: string; readonly source: 'import.meta.env' | 'process.env' }
  | { readonly env: string; readonly import: string; readonly name: string }

/** The `credentials` of every request the client sends: the `RequestCredentials` of `fetch`. */
export type Credentials = 'include' | 'same-origin' | 'omit'

type ClientCodeOptions = {
  /** The module the type of the app is imported from: the app entry, relatively or by package. */
  readonly appImport: string
  readonly baseUrl: BaseUrl
  /** The app's `basePath`; the client is handed out from below it. */
  readonly basePath: string | undefined
  readonly credentials: Credentials | undefined
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/u

/**
 * A client is typed by the routes of its app, base path included, and is handed out from
 * below the base path: `hcWithType('/').api` for `/api`, so that `client.pets.$get` addresses
 * a path of the document as it is written there.
 */
function makeBasePathAccess(basePath: string | undefined) {
  return (basePath ?? '')
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) =>
      IDENTIFIER.test(segment)
        ? `.${segment}`
        : `['${segment.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}']`,
    )
    .join('')
}

/**
 * A URL written into the file is the literal `/`. One read from the environment is read once,
 * into `baseUrl`, and asserted present: the variable is the deployment's to set, and a fallback
 * would only hide its absence. One read from an environment a module exports is that property,
 * which the module answers for.
 */
function makeBaseUrl(baseUrl: BaseUrl) {
  if (baseUrl === '/') return { imports: [], declarations: [], url: "'/'", names: [] }
  if ('import' in baseUrl) {
    return {
      imports: [`import{${baseUrl.name}}from'${baseUrl.import}'`],
      declarations: [],
      url: `${baseUrl.name}.${baseUrl.env}`,
      names: [baseUrl.name],
    }
  }
  return {
    imports: [],
    declarations: [`const baseUrl=${baseUrl.source}.${baseUrl.env}!`],
    url: 'baseUrl',
    names: ['baseUrl'],
  }
}

/**
 * The typed client of the generated app, as the `hcWithType` of the Hono guide: the type of
 * the client is declared once, so that it is worked out when this file is compiled and not
 * again by every file that calls `hc`. rpc and the query hooks import it as `client`.
 */
export function makeClientCode(options: ClientCodeOptions) {
  const { imports, declarations, url, names } = makeBaseUrl(options.baseUrl)
  // The app is imported as `api` unless the file binds that name itself (an environment
  // object exported as `api`).
  const app = names.includes('api') ? 'apiApp' : 'api'
  const specifier = app === 'api' ? 'api' : `api as ${app}`
  const init =
    options.credentials === undefined
      ? ''
      : `,{init:{credentials:${JSON.stringify(options.credentials)}}}`
  return [
    [
      "import{hc}from'hono/client'",
      `import type{${specifier}}from'${options.appImport}'`,
      ...imports,
    ].join('\n'),
    ...declarations,
    `type Client=ReturnType<typeof hc<typeof ${app}>>`,
    `const hcWithType=(...args:Parameters<typeof hc>):Client=>hc<typeof ${app}>(...args)`,
    `export const client=hcWithType(${url}${init})${makeBasePathAccess(options.basePath)}`,
  ].join('\n\n')
}
