// hono-takibi's suites expect their own host: a validation failure answers 422 with the path
// of every issue. hono-openapi's validator answers 400 with the issues, so the app takibi-hono
// generated is wrapped to answer the way the suites read.
import { Hono } from 'hono'

/** The issue paths of a hono-openapi validation failure, `a.0.b` for a nested one. */
function issuePaths(body: unknown): readonly string[] {
  if (typeof body !== 'object' || body === null || !('error' in body)) return []
  if (!Array.isArray(body.error)) return []
  return body.error.flatMap((issue: unknown) =>
    typeof issue === 'object' && issue !== null && 'path' in issue && Array.isArray(issue.path)
      ? [issue.path.map(String).join('.')]
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
    return c.json({ issues: issuePaths(body) }, 422)
  })
}
