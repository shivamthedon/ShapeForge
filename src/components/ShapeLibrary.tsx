import { SHAPE_LIBRARY } from '../types'
import { useEditorStore } from '../store/editorStore'

const ICONS: Record<string, string> = {
  box: '▣',
  sphere: '●',
  cylinder: '⎔',
  cone: '▲',
  pyramid: '△',
  wedge: '◢',
  roof: '⌂',
  halfsphere: '◒',
  torus: '◎',
  tube: '⬭',
}

export function ShapeLibrary() {
  const addShape = useEditorStore((s) => s.addShape)

  return (
    <aside className="panel">
      <div className="panel-header">Shapes</div>
      <p className="panel-hint">Click any shape to drop it on the workplane.</p>
      <div className="shape-grid">
        {SHAPE_LIBRARY.map((item) => (
          <button
            key={item.kind}
            className="shape-card"
            title={item.tip}
            type="button"
            onClick={() => addShape(item.kind)}
          >
            <span className="shape-icon" aria-hidden>
              {ICONS[item.kind] ?? '◆'}
            </span>
            <span className="shape-label">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
