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

/** The path-params host answers its one parameter, whatever it is named. */
export function echoFields(fields: object) {
  return echoValue(Object.values(fields)[0])
}
