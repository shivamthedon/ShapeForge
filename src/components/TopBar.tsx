import { useEditorStore } from '../store/editorStore'
import type { ProjectFile } from '../types'
import { downloadText } from '../lib/geometry'
import { exportShapesToStl } from '../lib/csg'

async function saveProject() {
  const store = useEditorStore.getState()
  const project = store.toProject()
  const data = JSON.stringify(project, null, 2)

  if (window.shapeforge?.saveProject) {
    const result = await window.shapeforge.saveProject(data)
    if (result.ok) store.setMessage(`Saved to ${result.path}`)
    return
  }

  downloadText(`${project.name || 'design'}.shapeforge.json`, data)
  store.setMessage('Project downloaded.')
}

async function openProject() {
  const store = useEditorStore.getState()

  if (window.shapeforge?.openProject) {
    const result = await window.shapeforge.openProject()
    if (!result.ok || !result.content) return
    try {
      const project = JSON.parse(result.content) as ProjectFile
      if (!project.shapes) throw new Error('Invalid project')
      store.loadProject(project)
    } catch {
      store.setMessage('Could not open that project file.')
    }
    return
  }

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.shapeforge.json,application/json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const project = JSON.parse(text) as ProjectFile
      if (!project.shapes) throw new Error('Invalid project')
      store.loadProject(project)
    } catch {
      store.setMessage('Could not open that project file.')
    }
  }
  input.click()
}

async function exportStl() {
  const store = useEditorStore.getState()
  if (store.shapes.length === 0) {
    store.setMessage('Add some shapes before exporting.')
    return
  }
  const stl = exportShapesToStl(store.shapes)
  const name = `${store.projectName || 'model'}.stl`

  if (window.shapeforge?.exportStl) {
    const result = await window.shapeforge.exportStl(stl, name)
    if (result.ok) store.setMessage(`Exported STL to ${result.path}`)
    return
  }

  downloadText(name, stl)
  store.setMessage('STL downloaded — ready for a 3D printer slicer.')
}

export function TopBar() {
  const projectName = useEditorStore((s) => s.projectName)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const toggleHoleSelected = useEditorStore((s) => s.toggleHoleSelected)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const past = useEditorStore((s) => s.past)
  const future = useEditorStore((s) => s.future)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const snap = useEditorStore((s) => s.snap)
  const toggleSnap = useEditorStore((s) => s.toggleSnap)
  const showGrid = useEditorStore((s) => s.showGrid)
  const toggleGrid = useEditorStore((s) => s.toggleGrid)
  const resetScene = useEditorStore((s) => s.resetScene)
  const hasSelection = selectedIds.length > 0

  return (
    <header className="top-bar">
      <div className="brand">
        <div className="brand-mark">SF</div>
        <div>
          <div className="brand-text">ShapeForge</div>
          <span className="brand-sub">Easy 3D for students</span>
        </div>
      </div>

      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        aria-label="Project name"
        style={{
          width: 160,
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#22354f',
          color: '#f4f7fb',
          fontWeight: 700,
        }}
      />

      <div className="tool-group" role="group" aria-label="Transform tools">
        <button
          type="button"
          className={`tool-btn${transformMode === 'translate' ? ' active' : ''}`}
          onClick={() => setTransformMode('translate')}
        >
          Move
        </button>
        <button
          type="button"
          className={`tool-btn${transformMode === 'rotate' ? ' active' : ''}`}
          onClick={() => setTransformMode('rotate')}
        >
          Rotate
        </button>
        <button
          type="button"
          className={`tool-btn${transformMode === 'scale' ? ' active' : ''}`}
          onClick={() => setTransformMode('scale')}
        >
          Scale
        </button>
      </div>

      <div className="tool-group">
        <button type="button" className="tool-btn" disabled={!hasSelection} onClick={duplicateSelected}>
          Duplicate
        </button>
        <button type="button" className="tool-btn" disabled={!hasSelection} onClick={toggleHoleSelected}>
          Hole
        </button>
        <button
          type="button"
          className="tool-btn danger"
          disabled={!hasSelection}
          onClick={deleteSelected}
        >
          Delete
        </button>
      </div>

      <div className="tool-group">
        <button type="button" className="tool-btn" disabled={past.length === 0} onClick={undo}>
          Undo
        </button>
        <button type="button" className="tool-btn" disabled={future.length === 0} onClick={redo}>
          Redo
        </button>
        <button type="button" className={`tool-btn${snap ? ' active' : ''}`} onClick={toggleSnap}>
          Snap
        </button>
        <button type="button" className={`tool-btn${showGrid ? ' active' : ''}`} onClick={toggleGrid}>
          Grid
        </button>
      </div>

      <div className="tool-group" style={{ marginLeft: 'auto' }}>
        <button type="button" className="tool-btn" onClick={resetScene}>
          New
        </button>
        <button type="button" className="tool-btn" onClick={() => void openProject()}>
          Open
        </button>
        <button type="button" className="tool-btn" onClick={() => void saveProject()}>
          Save
        </button>
        <button type="button" className="tool-btn active" onClick={() => void exportStl()}>
          Export STL
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() =>
            useEditorStore
              .getState()
              .setMessage(
                'Tip: Add a Box, add a Cylinder on top, click Hole, then Export STL for printing.',
              )
          }
        >
          Help
        </button>
      </div>
    </header>
  )
}
