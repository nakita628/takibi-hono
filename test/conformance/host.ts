// hono-takibi's suites expect their own host: a validation failure answers 422 with the path
// of every issue. hono-openapi's validator answers 400 with the issues, so the app takibi-hono
// generated is wrapped to answer the way the suites read.
import { Hono } from 'hono'

/** The schema library whose generated app the scorecard runs against (`zod` by default). */
const LIBRARY = process.env['TAKIBI_HONO_CONFORMANCE_LIB'] ?? 'zod'

/** The app takibi-hono generated for a conformance document, in the library under test. */
export async function generatedApp(name: string): Promise<Hono> {
  const suffix = LIBRARY === 'zod' ? '' : `-${LIBRARY}`
  const mod: unknown = await import(`../__app__/conformance-${name}${suffix}/src/index.ts`)
  if (typeof mod === 'object' && mod !== null && 'default' in mod && mod.default instanceof Hono) {
    return mod.default
  }
  throw new Error(`conformance-${name}${suffix} does not export a Hono app`)
}

/** One segment of an issue path: zod, arktype and effect give the key, valibot an object holding it. */
function segment(part: unknown): string {
  if (typeof part === 'object' && part !== null && 'key' in part) return String(part.key)
  return String(part)
}

/** The issue paths of a hono-openapi validation failure, `a.0.b` for a nested one. */
function issuePaths(body: unknown): readonly string[] {
  if (typeof body !== 'object' || body === null || !('error' in body)) return []
  if (!Array.isArray(body.error)) return []
  return body.error.flatMap((issue: unknown) =>
    typeof issue === 'object' && issue !== null && 'path' in issue && Array.isArray(issue.path)
      ? [issue.path.map(segment).join('.')]
      : [],
  )
}

export function hostOf(generated: Hono) {
  return new Hono().all('*', async (c) => {
    const res = await generated.fetch(c.req.raw)
    if (res.status !== 400) return res
    // A HEAD answer carries no body; its issues are those of the GET it mirrors, unseen here.
    const text = await res.text()
    const body: unknown = text === '' ? undefined : JSON.parse(text)
    if (process.env['TAKIBI_HONO_CONFORMANCE_DEBUG'] === '1') {
      // oxlint-disable-next-line no-console -- the scorecard's debug output: what each rejection said
      console.error(`[conformance] ${c.req.method} ${c.req.path} -> ${text}`)
    }
    return c.json({ issues: issuePaths(body) }, 422)
  })
}
