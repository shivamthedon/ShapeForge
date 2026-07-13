import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  EditorSnapshot,
  ProjectFile,
  ShapeKind,
  ShapeSolid,
  TransformMode,
  Vec3,
} from '../types'
import { DEFAULT_COLOR, SHAPE_LIBRARY } from '../types'
import { cloneVec3 } from '../lib/geometry'

const MAX_HISTORY = 60

function labelFor(kind: ShapeKind, count: number) {
  const base = SHAPE_LIBRARY.find((s) => s.kind === kind)?.label ?? 'Shape'
  return `${base} ${count}`
}

function defaultScale(kind: ShapeKind): Vec3 {
  switch (kind) {
    case 'torus':
      return [1.2, 1.2, 1.2]
    case 'tube':
      return [1, 1.2, 1]
    default:
      return [1, 1, 1]
  }
}

function snapshotOf(shapes: ShapeSolid[], selectedIds: string[]): EditorSnapshot {
  return {
    shapes: shapes.map((s) => ({
      ...s,
      position: cloneVec3(s.position),
      rotation: cloneVec3(s.rotation),
      scale: cloneVec3(s.scale),
    })),
    selectedIds: [...selectedIds],
  }
}

type EditorState = {
  projectName: string
  shapes: ShapeSolid[]
  selectedIds: string[]
  transformMode: TransformMode
  showGrid: boolean
  snap: boolean
  message: string | null
  past: EditorSnapshot[]
  future: EditorSnapshot[]

  setProjectName: (name: string) => void
  setMessage: (msg: string | null) => void
  setTransformMode: (mode: TransformMode) => void
  toggleGrid: () => void
  toggleSnap: () => void
  select: (ids: string[], additive?: boolean) => void
  clearSelection: () => void
  addShape: (kind: ShapeKind) => void
  duplicateSelected: () => void
  deleteSelected: () => void
  toggleHoleSelected: () => void
  setSelectedColor: (color: string) => void
  updateShape: (id: string, patch: Partial<ShapeSolid>, recordHistory?: boolean) => void
  bringSelectedForward: () => void
  sendSelectedBack: () => void
  undo: () => void
  redo: () => void
  loadProject: (project: ProjectFile) => void
  toProject: () => ProjectFile
  resetScene: () => void
  commitHistory: () => void
}

function pushHistory(state: EditorState): Pick<EditorState, 'past' | 'future'> {
  const nextPast = [...state.past, snapshotOf(state.shapes, state.selectedIds)].slice(
    -MAX_HISTORY,
  )
  return { past: nextPast, future: [] }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectName: 'My Design',
  shapes: [],
  selectedIds: [],
  transformMode: 'translate',
  showGrid: true,
  snap: true,
  message: 'Welcome! Click a shape on the left to start building.',
  past: [],
  future: [],

  setProjectName: (name) => set({ projectName: name }),
  setMessage: (message) => set({ message }),
  setTransformMode: (transformMode) => set({ transformMode }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),

  select: (ids, additive = false) =>
    set((state) => {
      if (!additive) return { selectedIds: ids }
      const setIds = new Set(state.selectedIds)
      ids.forEach((id) => {
        if (setIds.has(id)) setIds.delete(id)
        else setIds.add(id)
      })
      return { selectedIds: [...setIds] }
    }),

  clearSelection: () => set({ selectedIds: [] }),

  addShape: (kind) =>
    set((state) => {
      const count = state.shapes.filter((s) => s.kind === kind).length + 1
      const shape: ShapeSolid = {
        id: uuid(),
        kind,
        name: labelFor(kind, count),
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: defaultScale(kind),
        color: DEFAULT_COLOR,
        isHole: false,
        visible: true,
        locked: false,
      }
      return {
        ...pushHistory(state),
        shapes: [...state.shapes, shape],
        selectedIds: [shape.id],
        message: `Added ${shape.name}. Drag the arrows to move it.`,
      }
    }),

  duplicateSelected: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state
      const copies: ShapeSolid[] = []
      const newIds: string[] = []
      for (const id of state.selectedIds) {
        const src = state.shapes.find((s) => s.id === id)
        if (!src) continue
        const copy: ShapeSolid = {
          ...src,
          id: uuid(),
          name: `${src.name} copy`,
          position: [src.position[0] + 0.4, src.position[1], src.position[2] + 0.4],
          rotation: cloneVec3(src.rotation),
          scale: cloneVec3(src.scale),
        }
        copies.push(copy)
        newIds.push(copy.id)
      }
      if (copies.length === 0) return state
      return {
        ...pushHistory(state),
        shapes: [...state.shapes, ...copies],
        selectedIds: newIds,
        message: `Duplicated ${copies.length} shape(s).`,
      }
    }),

  deleteSelected: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state
      const remove = new Set(state.selectedIds)
      return {
        ...pushHistory(state),
        shapes: state.shapes.filter((s) => !remove.has(s.id)),
        selectedIds: [],
        message: 'Deleted selected shape(s).',
      }
    }),

  toggleHoleSelected: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state
      const selected = new Set(state.selectedIds)
      return {
        ...pushHistory(state),
        shapes: state.shapes.map((s) =>
          selected.has(s.id) ? { ...s, isHole: !s.isHole } : s,
        ),
        message: 'Toggled hole mode. Holes cut through solid shapes.',
      }
    }),

  setSelectedColor: (color) =>
    set((state) => {
      if (state.selectedIds.length === 0) return state
      const selected = new Set(state.selectedIds)
      return {
        ...pushHistory(state),
        shapes: state.shapes.map((s) =>
          selected.has(s.id) ? { ...s, color } : s,
        ),
      }
    }),

  updateShape: (id, patch, recordHistory = false) =>
    set((state) => {
      const shapes = state.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s))
      if (recordHistory) {
        return { ...pushHistory(state), shapes }
      }
      return { shapes }
    }),

  bringSelectedForward: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state
      const selected = new Set(state.selectedIds)
      const keep = state.shapes.filter((s) => !selected.has(s.id))
      const moving = state.shapes.filter((s) => selected.has(s.id))
      return {
        ...pushHistory(state),
        shapes: [...keep, ...moving],
      }
    }),

  sendSelectedBack: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state
      const selected = new Set(state.selectedIds)
      const keep = state.shapes.filter((s) => !selected.has(s.id))
      const moving = state.shapes.filter((s) => selected.has(s.id))
      return {
        ...pushHistory(state),
        shapes: [...moving, ...keep],
      }
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      const past = state.past.slice(0, -1)
      const future = [snapshotOf(state.shapes, state.selectedIds), ...state.future]
      return {
        past,
        future,
        shapes: previous.shapes,
        selectedIds: previous.selectedIds,
        message: 'Undo',
      }
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      const future = state.future.slice(1)
      const past = [...state.past, snapshotOf(state.shapes, state.selectedIds)]
      return {
        past,
        future,
        shapes: next.shapes,
        selectedIds: next.selectedIds,
        message: 'Redo',
      }
    }),

  loadProject: (project) =>
    set({
      projectName: project.name || 'My Design',
      shapes: project.shapes,
      selectedIds: [],
      past: [],
      future: [],
      message: `Opened “${project.name}”.`,
    }),

  toProject: () => {
    const state = get()
    const now = new Date().toISOString()
    return {
      version: 1 as const,
      name: state.projectName,
      shapes: state.shapes,
      createdAt: now,
      updatedAt: now,
    }
  },

  resetScene: () =>
    set((state) => ({
      ...pushHistory(state),
      shapes: [],
      selectedIds: [],
      projectName: 'My Design',
      message: 'New blank design. Add a shape to begin!',
    })),

  commitHistory: () => set((state) => pushHistory(state)),
}))
