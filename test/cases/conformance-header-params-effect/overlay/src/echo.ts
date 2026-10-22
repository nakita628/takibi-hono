// What hono-takibi's conformance host answers: the validated values, described.
type Echo = { valueType: string; valueText: string }

/**
 * Describes one value: the runtime `typeof` it arrived as, and the value as text. Text,
 * because a bigint cannot cross JSON and text keeps its every digit.
 */
function echoValue(value: unknown): Echo {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return { valueType: typeof value, valueText: String(value) }
  }
  return {
    valueType: value === null ? 'null' : typeof value,
    valueText: JSON.stringify(value) ?? 'undefined',
  }
}

/**
 * Describes every validated parameter, by name. An array is described element by element
 * and an object key by key, so a test can tell `[1, 2]` from `['1', '2']` and from `'1,2'`.
 * A key the schema left out stays out: an absent optional parameter is absent here too.
 */
export function echoFields(fields: object) {
  const described: Record<string, Echo | Echo[] | Record<string, Echo>> = {}
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      described[name] = value.map(echoValue)
    } else if (typeof value === 'object' && value !== null) {
      described[name] = Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, echoValue(item)]),
      )
    } else {
      described[name] = echoValue(value)
    }
  }
  return described
}
