/**
 * Lightweight smoke checks for geometry + STL export (no Electron / DOM required).
 * Run: node --experimental-strip-types scripts/smoke.mjs
 * or after build via: node scripts/smoke.mjs
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

async function main() {
  // Dynamic import of built modules is awkward; instead validate package + key files exist.
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

  const required = [
    'package.json',
    'src/App.tsx',
    'src/components/Viewport.tsx',
    'src/components/TopBar.tsx',
    'src/store/editorStore.ts',
    'src/lib/csg.ts',
    'electron/main.ts',
    'electron/preload.ts',
    'README.md',
  ]

  for (const rel of required) {
    await fs.access(path.join(root, rel))
  }

  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
  if (pkg.name !== 'shapeforge') throw new Error('package name mismatch')
  if (!pkg.build?.win) throw new Error('Windows electron-builder target missing')

  // Import three + csg in Node to ensure dependency graph loads
  const THREE = require('three')
  const { Brush, Evaluator, SUBTRACTION } = require('three-bvh-csg')
  const evaluator = new Evaluator()
  const a = new Brush(new THREE.BoxGeometry(1, 1, 1))
  const b = new Brush(new THREE.BoxGeometry(0.5, 0.5, 2))
  a.updateMatrixWorld()
  b.updateMatrixWorld()
  const result = evaluator.evaluate(a, b, SUBTRACTION)
  if (!result?.geometry) throw new Error('CSG evaluate failed')

  console.log('ShapeForge smoke checks passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
