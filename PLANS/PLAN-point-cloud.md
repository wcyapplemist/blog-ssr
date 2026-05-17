# Point Cloud Feature — Implementation Plan

## Overview

Add a Point Cloud visualization page to the blog-ssr project that allows loading PLY format point cloud files and rendering them in interactive 3D. The page will be accessible at `/point-cloud` with a new navbar link.

**Branch**: `feat/point-cloud` (already exists and checked out)

---

## Implementation Phases

### Phase 1: Dependencies & Configuration
- [ ] Install 3D rendering dependencies (`three`, `@react-three/fiber`, `@react-three/drei`)
- [ ] Install TypeScript types for Three.js (`@types/three`)
- [ ] Verify `next.config.ts` doesn't need transpilePackages for three.js (usually not needed)
- [ ] Run `npm run dev` to verify no startup errors after install
- [ ] Run `npm run build` to verify SSR compatibility (Three.js must be client-only)

**Verification**: `npm install` succeeds, `npm run dev` starts without errors

### Phase 2: PLY Parser Utility
- [ ] Create `src/lib/ply-parser.ts` — a PLY file parser module
- [ ] Support ASCII PLY format parsing (matching `test.ply` format)
- [ ] Parse header: detect `element vertex N`, `property float x/y/z`, `property uchar red/green/blue`
- [ ] Parse vertex data: extract positions (x, y, z) and colors (r, g, b) as normalized floats (0–1)
- [ ] Export a `PointData` type: `{ positions: Float32Array; colors: Float32Array; vertexCount: number }`
- [ ] Export a `parsePly(content: string): PointData` function
- [ ] Export a `parsePlyFile(file: File): Promise<PointData>` function using FileReader
- [ ] Add basic error handling for malformed files (missing header, wrong format, etc.)

**Verification**: Parser correctly parses `public/point-cloud/test.ply` (8 vertices, returns Float32Arrays of length 24 for positions and 24 for colors)

### Phase 3: 3D Viewer Component (Client Component)
- [ ] Create `src/components/PointCloudViewer.tsx` — `"use client"` component
- [ ] Use `@react-three/fiber` Canvas as the rendering container
- [ ] Use `@react-three/drei` OrbitControls for camera interaction (rotate, pan, zoom)
- [ ] Render points using Three.js `BufferGeometry` with `Float32BufferAttribute` for positions and colors
- [ ] Use `THREE.Points` material with `vertexColors: true` for per-vertex coloring
- [ ] Set sensible defaults: dark background, auto-fit camera to bounding box, reasonable point size
- [ ] Add a loading state while point data is being parsed
- [ ] Add an error state for invalid/unsupported files
- [ ] Support dynamic window resizing (Canvas handles this natively)

**Verification**: Component renders the 8-vertex test cube with correct colors when given parsed PLY data

### Phase 4: File Upload Component (Client Component)
- [ ] Create `src/components/PointCloudUpload.tsx` — `"use client"` component
- [ ] Add a file input that accepts `.ply` files only (`accept=".ply"`)
- [ ] Implement drag-and-drop zone for PLY file upload
- [ ] Read file using `parsePlyFile()` from the parser utility
- [ ] Display file name and vertex count after successful upload
- [ ] Show loading spinner during file reading/parsing
- [ ] Show error message for invalid files
- [ ] Call `onPointCloudLoaded(data: PointData)` callback on success
- [ ] Style consistently with existing shadcn components (use `Card`, `Button` from `@/components/ui/`)

**Verification**: User can drag-drop or click to upload `test.ply`; vertex count (8) is displayed; callback fires with correct data

### Phase 5: Point Cloud Page
- [ ] Create `src/app/point-cloud/page.tsx` — page component
- [ ] Follow existing page pattern: `<div className="flex flex-col flex-1"><main>...`
- [ ] Use a server component wrapper that lazy-loads the client 3D viewer via dynamic import
- [ ] Dynamic import `PointCloudViewer` with `ssr: false` to prevent Three.js SSR issues
- [ ] Default state: show the upload component and prompt user to load a PLY file
- [ ] After upload: show the 3D viewer alongside upload controls (allow re-uploading)
- [ ] Add page heading: "Point Cloud" with subtitle description
- [ ] Layout: full-width viewer with sidebar/toolbar for controls, or stacked layout (upload on top, viewer below)
- [ ] Optionally load the default `test.ply` from `public/point-cloud/test.ply` as a demo/example

**Verification**: Navigate to `/point-cloud`, see upload area, upload `test.ply`, see 3D rendered cube with correct colors, can rotate/zoom

### Phase 6: Navbar Update
- [ ] Open `src/components/Navbar.tsx`
- [ ] Add `{ label: "Point Cloud", href: "/point-cloud" }` to the `navItems` array
- [ ] Place it in a logical position (e.g., after "Guestbook")
- [ ] Verify active state highlighting works when on `/point-cloud`

**Verification**: "Point Cloud" appears in navbar, clicking navigates to `/point-cloud`, active state shows correctly

### Phase 7: Testing & Polish
- [ ] Run `npm run build` — verify no SSR errors (Three.js must be client-only)
- [ ] Run `npm run lint` — fix any linting issues
- [ ] Test with `test.ply` — verify 8 colored vertices render correctly
- [ ] Test with larger PLY files (if available) — verify performance
- [ ] Test drag-and-drop file upload
- [ ] Test click file upload
- [ ] Test error handling with invalid files (e.g., .txt file renamed to .ply)
- [ ] Test responsive layout on different viewport sizes
- [ ] Test navbar navigation to/from Point Cloud page

**Verification**: All tests pass, no console errors, smooth UX

---

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/ply-parser.ts` | Utility | PLY ASCII file parser |
| `src/components/PointCloudViewer.tsx` | Client Component | 3D rendering with Three.js/R3F |
| `src/components/PointCloudUpload.tsx` | Client Component | File upload with drag-and-drop |
| `src/app/point-cloud/page.tsx` | Page | Point Cloud page route |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` | Add `{ label: "Point Cloud", href: "/point-cloud" }` to `navItems` |
| `package.json` | Add `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` |

## Dependencies to Install

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

## Technical Notes

- **SSR Safety**: Three.js does NOT work with SSR. The `PointCloudViewer` must be loaded with `next/dynamic` and `ssr: false`
- **PLY Format**: Only ASCII PLY format is required. The `test.ply` uses `property float x/y/z` and `property uchar red/green/blue`
- **Canvas Sizing**: The R3F Canvas should fill its container. Use Tailwind classes for responsive sizing
- **Performance**: For large point clouds, consider using `THREE.Points` with `BufferGeometry` (already planned) which is GPU-efficient
- **Existing PLY file**: `public/point-cloud/test.ply` has 8 vertices forming a cube with 8 different colors — this serves as the test case

## Acceptance Criteria

- [ ] `/point-cloud` route renders correctly
- [ ] "Point Cloud" link appears in Navbar and navigates correctly
- [ ] User can upload `.ply` files via click or drag-and-drop
- [ ] Uploaded PLY files are parsed and rendered as 3D point clouds
- [ ] Point colors from PLY data are displayed correctly
- [ ] User can rotate, pan, and zoom the 3D view
- [ ] Error handling shows meaningful messages for invalid files
- [ ] `npm run build` succeeds with no SSR errors
- [ ] `npm run lint` passes
