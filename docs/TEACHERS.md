# Teacher notes — ShapeForge

## Installing on classroom PCs (Windows)

1. Build on a Windows machine: `npm install` then `npm run pack:win`.
2. Copy `release/ShapeForge-*-Setup.exe` (NSIS) to student machines, **or** use the portable `.exe`.
3. No account or internet is required to design and export.

## Suggested first lesson

1. Introduce the workplane and orbit camera (right-drag / scroll).
2. Build a name-plate: Box + text-like stacked boxes (or a roof house).
3. Practice one hole cut (window / tunnel).
4. Export STL and open in the school slicer.

## Files students create

- `.shapeforge.json` — editable project (Save / Open)
- `.stl` — for printing (Export STL)

## Limits to mention

- This is a learning tool, not professional CAD.
- Very complex CSG (many overlapping holes) can slow older PCs — turn **Cuts** off while moving, then on to check.
- Tube shapes are open-sided; prefer Box/Cylinder/Sphere for clean Boolean cuts.
