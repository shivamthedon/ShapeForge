import * as THREE from 'three'
import type { ShapeKind, ShapeSolid, Vec3 } from '../types'

export function createGeometry(kind: ShapeKind): THREE.BufferGeometry {
  switch (kind) {
    case 'box':
      return new THREE.BoxGeometry(1, 1, 1)
    case 'sphere':
      return new THREE.SphereGeometry(0.5, 32, 24)
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 32)
    case 'cone':
      return new THREE.ConeGeometry(0.5, 1, 32)
    case 'torus':
      return new THREE.TorusGeometry(0.4, 0.16, 16, 48)
    case 'pyramid':
      return new THREE.ConeGeometry(0.5, 1, 4)
    case 'wedge': {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i)
        const z = pos.getZ(i)
        if (y > 0 && z > 0) pos.setY(i, -0.5)
      }
      geo.computeVertexNormals()
      return geo
    }
    case 'halfsphere': {
      const geo = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      return geo
    }
    case 'tube':
      return new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 1, true)
    case 'roof': {
      const shape = new THREE.Shape()
      shape.moveTo(-0.5, -0.5)
      shape.lineTo(0.5, -0.5)
      shape.lineTo(0.5, 0)
      shape.lineTo(0, 0.5)
      shape.lineTo(-0.5, 0)
      shape.closePath()
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 1,
        bevelEnabled: false,
      })
      geo.center()
      geo.rotateX(-Math.PI / 2)
      return geo
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1)
  }
}

export function applyTransform(mesh: THREE.Object3D, shape: ShapeSolid) {
  mesh.position.set(shape.position[0], shape.position[1], shape.position[2])
  mesh.rotation.set(
    THREE.MathUtils.degToRad(shape.rotation[0]),
    THREE.MathUtils.degToRad(shape.rotation[1]),
    THREE.MathUtils.degToRad(shape.rotation[2]),
  )
  mesh.scale.set(shape.scale[0], shape.scale[1], shape.scale[2])
  mesh.updateMatrixWorld(true)
}

export function cloneVec3(v: Vec3): Vec3 {
  return [v[0], v[1], v[2]]
}

export function round3(n: number) {
  return Math.round(n * 1000) / 1000
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
