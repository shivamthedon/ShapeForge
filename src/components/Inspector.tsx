import { SHAPE_COLORS } from '../types'
import { useEditorStore } from '../store/editorStore'

function VecInputs({
  label,
  values,
  step,
  onChange,
}: {
  label: string
  values: [number, number, number]
  step: number
  onChange: (next: [number, number, number]) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="vec-row">
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <input
            key={axis}
            type="number"
            step={step}
            aria-label={`${label} ${axis}`}
            value={values[i]}
            onChange={(e) => {
              const next: [number, number, number] = [...values]
              next[i] = Number(e.target.value)
              onChange(next)
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function Inspector() {
  const shapes = useEditorStore((s) => s.shapes)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const updateShape = useEditorStore((s) => s.updateShape)
  const setSelectedColor = useEditorStore((s) => s.setSelectedColor)
  const toggleHoleSelected = useEditorStore((s) => s.toggleHoleSelected)
  const select = useEditorStore((s) => s.select)
  const commitHistory = useEditorStore((s) => s.commitHistory)

  const selected = shapes.filter((s) => selectedIds.includes(s.id))
  const primary = selected[0]

  return (
    <aside className="panel right">
      <div className="panel-header">Inspector</div>
      <p className="panel-hint">Change size, color, and hole mode for the selected shape.</p>

      <div className="inspector">
        {!primary ? (
          <div className="empty-inspector">
            Select a shape in the 3D view or from the list below to edit it.
          </div>
        ) : (
          <>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={primary.name}
                onChange={(e) => {
                  commitHistory()
                  updateShape(primary.id, { name: e.target.value })
                }}
              />
            </div>

            {primary.isHole && <span className="badge">Hole — cuts through solids</span>}

            <VecInputs
              label="Position"
              values={primary.position}
              step={0.1}
              onChange={(position) => {
                commitHistory()
                updateShape(primary.id, { position })
              }}
            />
            <VecInputs
              label="Rotation (°)"
              values={primary.rotation}
              step={5}
              onChange={(rotation) => {
                commitHistory()
                updateShape(primary.id, { rotation })
              }}
            />
            <VecInputs
              label="Scale"
              values={primary.scale}
              step={0.1}
              onChange={(scale) => {
                commitHistory()
                updateShape(primary.id, {
                  scale: [
                    Math.max(0.05, scale[0]),
                    Math.max(0.05, scale[1]),
                    Math.max(0.05, scale[2]),
                  ],
                })
              }}
            />

            <div className="field">
              <label>Color</label>
              <div className="color-row">
                {SHAPE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch${primary.color === c ? ' active' : ''}`}
                    style={{ background: c }}
                    title={c}
                    onClick={() => setSelectedColor(c)}
                  />
                ))}
              </div>
            </div>

            <button type="button" className="tool-btn" onClick={toggleHoleSelected}>
              {primary.isHole ? 'Make Solid' : 'Make Hole'}
            </button>
          </>
        )}

        <div className="field">
          <label>Objects ({shapes.length})</label>
          <div className="object-list">
            {shapes.length === 0 && (
              <div className="empty-inspector">No shapes yet.</div>
            )}
            {[...shapes].reverse().map((shape) => (
              <button
                key={shape.id}
                type="button"
                className={`object-row${selectedIds.includes(shape.id) ? ' selected' : ''}`}
                onClick={() => select([shape.id])}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="dot" style={{ background: shape.isHole ? '#f472b6' : shape.color }} />
                  {shape.name}
                </span>
                {shape.isHole && <span className="badge">Hole</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
