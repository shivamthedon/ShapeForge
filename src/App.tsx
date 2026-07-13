import { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { ShapeLibrary } from './components/ShapeLibrary'
import { Viewport } from './components/Viewport'
import { Inspector } from './components/Inspector'
import { useEditorStore } from './store/editorStore'

export default function App() {
  const message = useEditorStore((s) => s.message)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelected()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      } else if (e.key.toLowerCase() === 'g') {
        setTransformMode('translate')
      } else if (e.key.toLowerCase() === 'r') {
        setTransformMode('rotate')
      } else if (e.key.toLowerCase() === 's' && !mod) {
        setTransformMode('scale')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, deleteSelected, duplicateSelected, setTransformMode])

  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace">
        <ShapeLibrary />
        <Viewport />
        <Inspector />
      </div>
      <footer className="bottom-bar">
        <span>{message ?? 'Ready'}</span>
        <span>
          Shortcuts: <span className="kbd">G</span> Move · <span className="kbd">R</span> Rotate ·{' '}
          <span className="kbd">S</span> Scale · <span className="kbd">Ctrl+Z</span> Undo ·{' '}
          <span className="kbd">Del</span> Delete
        </span>
      </footer>
    </div>
  )
}
