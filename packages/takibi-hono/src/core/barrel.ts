/**
 * Generates a barrel (index.ts) file for handler exports.
 *
 * @param fileNames - Array of handler file names (e.g., ['__root', 'users', 'todos'])
 * @returns Barrel file code string
 */
export function makeBarrelCode(fileNames: string[]): string {
  return fileNames
    .toSorted()
    .map((name) => `export*from'./${name}'`)
    .join('\n')
}
