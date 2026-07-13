import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import type { ShapeSolid } from '../types'
import { applyTransform, createGeometry } from './geometry'

const evaluator = new Evaluator()

function toBrush(shape: ShapeSolid): Brush {
  const geo = createGeometry(shape.kind)
  const brush = new Brush(geo)
  applyTransform(brush, shape)
  brush.updateMatrixWorld(true)
  return brush
}

/**
 * Build a mesh that represents solids with holes subtracted (Tinkercad-style).
 * Non-hole shapes that do not intersect holes stay as separate meshes for clarity.
 */
export function buildCsgMeshes(shapes: ShapeSolid[]): THREE.Mesh[] {
  const solids = shapes.filter((s) => s.visible && !s.isHole)
  const holes = shapes.filter((s) => s.visible && s.isHole)

  if (holes.length === 0) {
    return solids.map((shape) => {
      const mesh = new THREE.Mesh(
        createGeometry(shape.kind),
        new THREE.MeshStandardMaterial({
          color: shape.color,
          roughness: 0.45,
          metalness: 0.05,
        }),
      )
      applyTransform(mesh, shape)
      mesh.userData.shapeId = shape.id
      return mesh
    })
  }

  const holeBrushes = holes.map(toBrush)
  const result: THREE.Mesh[] = []

  for (const solid of solids) {
    let current: Brush = toBrush(solid)
    for (const hole of holeBrushes) {
      try {
        current = evaluator.evaluate(current, hole, SUBTRACTION)
      } catch {
        // Keep previous if CSG fails on a bad pair
      }
    }

    const material = new THREE.MeshStandardMaterial({
      color: solid.color,
      roughness: 0.45,
      metalness: 0.05,
      flatShading: false,
    })
    const mesh = new THREE.Mesh(current.geometry, material)
    mesh.position.copy(current.position)
    mesh.rotation.copy(current.rotation)
    mesh.scale.copy(current.scale)
    mesh.userData.shapeId = solid.id
    result.push(mesh)
  }

  return result
}

export function exportShapesToStl(shapes: ShapeSolid[]): string {
  const meshes = buildCsgMeshes(shapes)
  const exporterPieces: string[] = ['solid ShapeForge']

  for (const mesh of meshes) {
    const geometry = mesh.geometry.clone()
    geometry.applyMatrix4(mesh.matrixWorld)
    const position = geometry.getAttribute('position')
    const index = geometry.getIndex()

    const writeFace = (a: number, b: number, c: number) => {
      const ax = position.getX(a)
      const ay = position.getY(a)
      const az = position.getZ(a)
      const bx = position.getX(b)
      const by = position.getY(b)
      const bz = position.getZ(b)
      const cx = position.getX(c)
      const cy = position.getY(c)
      const cz = position.getZ(c)

      const ux = bx - ax
      const uy = by - ay
      const uz = bz - az
      const vx = cx - ax
      const vy = cy - ay
      const vz = cz - az
      let nx = uy * vz - uz * vy
      let ny = uz * vx - ux * vz
      let nz = ux * vy - uy * vx
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len
      nz /= len

      exporterPieces.push(
        `  facet normal ${nx} ${ny} ${nz}`,
        '    outer loop',
        `      vertex ${ax} ${ay} ${az}`,
        `      vertex ${bx} ${by} ${bz}`,
        `      vertex ${cx} ${cy} ${cz}`,
        '    endloop',
        '  endfacet',
      )
    }

    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        writeFace(index.getX(i), index.getX(i + 1), index.getX(i + 2))
      }
    } else {
      for (let i = 0; i < position.count; i += 3) {
        writeFace(i, i + 1, i + 2)
      }
    }

    geometry.dispose()
  }

  exporterPieces.push('endsolid ShapeForge')
  meshes.forEach((m) => {
    m.geometry.dispose()
    ;(m.material as THREE.Material).dispose()
  })
  return exporterPieces.join('\n')
}
