export function makeBarrelCode(fileNames: string[]) {
  return fileNames
    .toSorted()
    .map((name) => `export*from'./${name}'`)
    .join('\n')
}
