# ShapeForge

Student-friendly Windows 3D modeling app inspired by Tinkercad-style constructive solid geometry (CSG).

**Not affiliated with Autodesk or Tinkercad.**

## What students can do

- Add boxes, spheres, cylinders, cones, pyramids, wedges, roofs, domes, toruses, and tubes
- **Move**, **Rotate**, and **Scale** shapes with on-screen handles (or `G` / `R` / `S`)
- Paint shapes with a simple color palette
- Turn a shape into a **Hole** to cut through solids
- Undo / redo, duplicate, delete, snap-to-grid
- **Save / Open** projects (`.shapeforge.json`)
- **Export STL** for classroom 3D printers

## Docs for class

- [Student quick start](docs/STUDENTS.md)
- [Teacher notes](docs/TEACHERS.md)

## Requirements

- Node.js 20+ (for building)
- Windows 10/11 (for the packaged app)

## Develop

```bash
npm install
npm run dev
```

This starts Vite + Electron. The editor also runs in the browser at the Vite URL if you only need the UI.

## Build a Windows installer

On a Windows machine (or CI with Windows runners):

```bash
npm install
npm run pack:win
```

Output lands in `release/`:

- `ShapeForge-1.0.0-x64.exe` — NSIS installer
- portable build as well (electron-builder portable target)

> Note: packaging with `electron-builder --win` must run on Windows (or with the appropriate Wine setup). Day-to-day coding works on any OS via `npm run dev`.

## Classroom tips

1. Start with a **Box**, then add a smaller shape and click **Hole** to cut a window or tunnel.
2. Keep **Snap** on so sizes stay tidy.
3. Export **STL** and open it in your usual slicer (Cura, PrusaSlicer, etc.).

## Tech stack

Electron · React · TypeScript · Vite · Three.js · React Three Fiber · three-bvh-csg · Zustand
