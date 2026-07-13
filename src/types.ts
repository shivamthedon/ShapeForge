export type ShapeKind =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'pyramid'
  | 'wedge'
  | 'halfsphere'
  | 'tube'
  | 'roof'

export type Vec3 = [number, number, number]

export type TransformMode = 'translate' | 'rotate' | 'scale'

export type ShapeSolid = {
  id: string
  kind: ShapeKind
  name: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
  color: string
  /** When true, this shape cuts holes out of solid shapes (CSG subtract). */
  isHole: boolean
  visible: boolean
  locked: boolean
}

export type EditorSnapshot = {
  shapes: ShapeSolid[]
  selectedIds: string[]
}

export type ProjectFile = {
  version: 1
  name: string
  shapes: ShapeSolid[]
  createdAt: string
  updatedAt: string
}

export const SHAPE_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#ffffff',
] as const

export const DEFAULT_COLOR = '#3b82f6'

export const SHAPE_LIBRARY: {
  kind: ShapeKind
  label: string
  tip: string
}[] = [
  { kind: 'box', label: 'Box', tip: 'A rectangular block' },
  { kind: 'sphere', label: 'Sphere', tip: 'A round ball' },
  { kind: 'cylinder', label: 'Cylinder', tip: 'A tube-shaped solid' },
  { kind: 'cone', label: 'Cone', tip: 'Pointy party-hat shape' },
  { kind: 'pyramid', label: 'Pyramid', tip: 'Square base, pointy top' },
  { kind: 'wedge', label: 'Wedge', tip: 'A ramp / triangular prism' },
  { kind: 'roof', label: 'Roof', tip: 'House-roof style prism' },
  { kind: 'halfsphere', label: 'Dome', tip: 'Half of a sphere' },
  { kind: 'torus', label: 'Torus', tip: 'A donut shape' },
  { kind: 'tube', label: 'Tube', tip: 'Hollow cylinder' },
]
