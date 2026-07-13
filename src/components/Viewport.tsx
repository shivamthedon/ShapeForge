import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Grid,
  OrbitControls,
  TransformControls,
} from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore } from '../store/editorStore'
import { createGeometry } from '../lib/geometry'
import { buildCsgMeshes } from '../lib/csg'
import type { ShapeSolid } from '../types'

function ShapeMesh({
  shape,
  selected,
  onSelect,
  ghost = false,
}: {
  shape: ShapeSolid
  selected: boolean
  onSelect: (e: ThreeEvent<MouseEvent>) => void
  ghost?: boolean
}) {
  const geometry = useMemo(() => createGeometry(shape.kind), [shape.kind])
  const material = useMemo(() => {
    if (shape.isHole) {
      return new THREE.MeshStandardMaterial({
        color: '#f472b6',
        transparent: true,
        opacity: ghost ? 0.22 : 0.45,
        roughness: 0.35,
        metalness: 0.1,
        depthWrite: false,
      })
    }
    return new THREE.MeshStandardMaterial({
      color: shape.color,
      roughness: 0.42,
      metalness: 0.08,
      transparent: ghost,
      opacity: ghost ? 0.2 : 1,
    })
  }, [shape.color, shape.isHole, ghost])

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={shape.position}
      rotation={shape.rotation.map((d) => THREE.MathUtils.degToRad(d)) as [
        number,
        number,
        number,
      ]}
      scale={shape.scale}
      castShadow={!ghost && !shape.isHole}
      receiveShadow={!ghost}
      visible={shape.visible}
      onClick={onSelect}
    >
      {selected && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#f8fafc" />
        </lineSegments>
      )}
    </mesh>
  )
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

function CsgPreview({ shapes }: { shapes: ShapeSolid[] }) {
  const select = useEditorStore((s) => s.select)
  const debouncedShapes = useDebouncedValue(shapes, 120)
  const meshes = useMemo(() => buildCsgMeshes(debouncedShapes), [debouncedShapes])

  useEffect(() => {
    return () => {
      for (const mesh of meshes) {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    }
  }, [meshes])

  return (
    <>
      {meshes.map((mesh) => (
        <primitive
          key={mesh.uuid}
          object={mesh}
          castShadow
          receiveShadow
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation()
            const id = mesh.userData.shapeId as string | undefined
            if (id) select([id], e.nativeEvent.shiftKey)
          }}
        />
      ))}
    </>
  )
}

function SelectedGizmo({ shape }: { shape: ShapeSolid }) {
  const helperRef = useRef<THREE.Mesh>(null)
  const dragging = useRef(false)
  const transformMode = useEditorStore((s) => s.transformMode)
  const snap = useEditorStore((s) => s.snap)
  const updateShape = useEditorStore((s) => s.updateShape)
  const commitHistory = useEditorStore((s) => s.commitHistory)
  const { controls } = useThree()

  useEffect(() => {
    if (dragging.current) return
    const obj = helperRef.current
    if (!obj) return
    obj.position.set(shape.position[0], shape.position[1], shape.position[2])
    obj.rotation.set(
      THREE.MathUtils.degToRad(shape.rotation[0]),
      THREE.MathUtils.degToRad(shape.rotation[1]),
      THREE.MathUtils.degToRad(shape.rotation[2]),
    )
    obj.scale.set(shape.scale[0], shape.scale[1], shape.scale[2])
  }, [shape.position, shape.rotation, shape.scale])

  // Place gizmo on first mount at the shape transform
  useEffect(() => {
    const obj = helperRef.current
    if (!obj) return
    obj.position.set(shape.position[0], shape.position[1], shape.position[2])
    obj.rotation.set(
      THREE.MathUtils.degToRad(shape.rotation[0]),
      THREE.MathUtils.degToRad(shape.rotation[1]),
      THREE.MathUtils.degToRad(shape.rotation[2]),
    )
    obj.scale.set(shape.scale[0], shape.scale[1], shape.scale[2])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount / selection change via key
  }, [])

  return (
    <TransformControls
      mode={transformMode}
      translationSnap={snap ? 0.25 : null}
      rotationSnap={snap ? THREE.MathUtils.degToRad(15) : null}
      scaleSnap={snap ? 0.1 : null}
      onMouseDown={() => {
        dragging.current = true
        if (controls && 'enabled' in controls) {
          ;(controls as { enabled: boolean }).enabled = false
        }
        commitHistory()
      }}
      onMouseUp={() => {
        dragging.current = false
        if (controls && 'enabled' in controls) {
          ;(controls as { enabled: boolean }).enabled = true
        }
      }}
      onObjectChange={() => {
        const obj = helperRef.current
        if (!obj) return
        updateShape(shape.id, {
          position: [
            Math.round(obj.position.x * 1000) / 1000,
            Math.round(obj.position.y * 1000) / 1000,
            Math.round(obj.position.z * 1000) / 1000,
          ],
          rotation: [
            Math.round(THREE.MathUtils.radToDeg(obj.rotation.x) * 10) / 10,
            Math.round(THREE.MathUtils.radToDeg(obj.rotation.y) * 10) / 10,
            Math.round(THREE.MathUtils.radToDeg(obj.rotation.z) * 10) / 10,
          ],
          scale: [
            Math.max(0.05, Math.round(obj.scale.x * 1000) / 1000),
            Math.max(0.05, Math.round(obj.scale.y * 1000) / 1000),
            Math.max(0.05, Math.round(obj.scale.z * 1000) / 1000),
          ],
        })
      }}
    >
      <mesh ref={helperRef}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </TransformControls>
  )
}

function SceneContent({ previewCuts }: { previewCuts: boolean }) {
  const shapes = useEditorStore((s) => s.shapes)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const showGrid = useEditorStore((s) => s.showGrid)
  const select = useEditorStore((s) => s.select)
  const clearSelection = useEditorStore((s) => s.clearSelection)

  const selected = shapes.find((s) => s.id === selectedIds[0] && !s.locked)
  const hasHoles = shapes.some((s) => s.isHole && s.visible)
  const showCsg = previewCuts && hasHoles

  return (
    <>
      <color attach="background" args={['#0f1a29']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[6, 10, 4]}
        intensity={1.15}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={['#c7e7ff', '#1a2332', 0.35]} />

      {showGrid && (
        <Grid
          args={[40, 40]}
          cellSize={0.5}
          sectionSize={2}
          cellColor="#2a3f5c"
          sectionColor="#3d5a80"
          fadeDistance={28}
          infiniteGrid
        />
      )}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
        onClick={() => clearSelection()}
      >
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.18} />
      </mesh>

      {showCsg ? (
        <>
          <CsgPreview shapes={shapes} />
          {shapes
            .filter((s) => s.isHole)
            .map((shape) => (
              <ShapeMesh
                key={shape.id}
                shape={shape}
                selected={selectedIds.includes(shape.id)}
                onSelect={(e) => {
                  e.stopPropagation()
                  select([shape.id], e.nativeEvent.shiftKey)
                }}
              />
            ))}
          {shapes
            .filter((s) => !s.isHole && selectedIds.includes(s.id))
            .map((shape) => (
              <ShapeMesh
                key={`ghost-${shape.id}`}
                shape={shape}
                selected
                ghost
                onSelect={(e) => {
                  e.stopPropagation()
                  select([shape.id], e.nativeEvent.shiftKey)
                }}
              />
            ))}
        </>
      ) : (
        shapes.map((shape) => (
          <ShapeMesh
            key={shape.id}
            shape={shape}
            selected={selectedIds.includes(shape.id)}
            onSelect={(e) => {
              e.stopPropagation()
              select([shape.id], e.nativeEvent.shiftKey)
            }}
          />
        ))
      )}

      {selected && <SelectedGizmo key={selected.id} shape={selected} />}

      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2.5} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={Math.PI * 0.49}
      />
    </>
  )
}

export function Viewport() {
  const shapes = useEditorStore((s) => s.shapes)
  const clearSelection = useEditorStore((s) => s.clearSelection)
  const [previewCuts, setPreviewCuts] = useState(true)

  return (
    <div className="viewport-wrap">
      {shapes.length === 0 && (
        <div className="welcome-overlay">
          <div className="welcome-card">
            <h2>Build something cool</h2>
            <p>Pick a shape on the left. Then use Move, Rotate, or Scale up top.</p>
          </div>
        </div>
      )}
      <button
        type="button"
        className={`tool-btn preview-toggle${previewCuts ? ' active' : ''}`}
        onClick={() => setPreviewCuts((v) => !v)}
        title="Show how holes cut through solids"
      >
        {previewCuts ? 'Cuts: On' : 'Cuts: Off'}
      </button>
      <Canvas
        shadows
        camera={{ position: [5, 4, 6], fov: 45, near: 0.1, far: 200 }}
        onPointerMissed={() => clearSelection()}
      >
        <SceneContent previewCuts={previewCuts} />
      </Canvas>
      <div className="viewport-hint">
        Drag with right mouse to look around · Scroll to zoom · Left-click a shape to select
      </div>
    </div>
  )
}
