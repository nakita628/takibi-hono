import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Copies a directory tree file by file. `fs.cpSync` is not used: on some mounted filesystems
 * (a devcontainer's host bind mount) it leaves the copies without their read bits, and
 * everything that reads them afterwards fails with EACCES.
 */
export function copyTree(from, to) {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    const target = path.join(to, entry.name)
    if (entry.isDirectory()) copyTree(source, target)
    else copyFileSync(source, target)
  }
}
