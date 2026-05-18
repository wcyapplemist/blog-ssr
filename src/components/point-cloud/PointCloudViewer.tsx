"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { PointData } from "@/lib/ply-parser";
import type { ViewerSettings } from "@/lib/viewer-settings";

/**
 * CameraAutoFit component that automatically positions the camera to fit all points in view.
 *
 * ## Component Purpose
 *
 * When a new point cloud is loaded, the camera needs to be positioned optimally to view
 * the entire cloud. This component calculates the bounding box of all points and positions
 * the camera at a diagonal offset that ensures:
 * - All points are visible in the viewport
 * - Camera is at a reasonable distance (not too close, not too far)
 * - Viewing angle provides good depth perception
 *
 * ## Component Hierarchy
 *
 * ```
 * PointCloudViewer (main container)
 * └── Canvas (Three.js rendering context)
 *     └── Scene (scene graph root)
 *         └── Points (point cloud mesh)
 *             └── CameraAutoFit (camera positioning logic)
 * ```
 *
 * Note: CameraAutoFit is nested inside Points but affects the scene-level camera.
 * It's a "side effect" component that runs when data changes.
 *
 * ## Implementation Algorithm
 *
 * 1. **Bounding Box Calculation**
 *    - Iterates through all point positions (x, y, z)
 *    - Creates THREE.Box3 that encompasses all points
 *    - Box3.expandByPoint() efficiently grows the box
 *
 * 2. **Center and Size Extraction**
 *    - Box3.getCenter() returns the center of the cloud
 *    - Box3.getSize() returns dimensions (width, height, depth)
 *    - Math.max() finds the largest dimension (maxDim)
 *
 * 3. **Camera Positioning**
 *    - Distance = maxDim * 2 (2x ensures everything fits with margin)
 *    - Position = center + (0.6 * distance) on each axis
 *    - 0.6 factor provides diagonal offset (not directly above)
 *    - camera.lookAt(center) points camera at cloud center
 *
 * ## Why 0.6 Offset Factor?
 *
 * - 0.5 would position directly above at 45° angle
 * - 0.6 provides slightly more overhead view for better perspective
 * - Less than 1.0 ensures camera isn't too far away
 * - Empirically chosen for good viewing angle for most clouds
 *
 * ## Why camera.updateProjectionMatrix()?
 *
 * - After changing camera position, projection matrix must be updated
 * - Required for correct rendering with new camera configuration
 * - Three.js doesn't automatically update on position change
 *
 * ## Performance Considerations
 *
 * - O(n) iteration over all points (n = vertex count)
 * - For large clouds (>1M points), this can be slow on initial render
 * - Only runs when positions change (useEffect dependency)
 * - Could optimize by using pre-calculated bounds from parser
 *
 * @param {Object} props - Component props
 * @param {Float32Array} props.positions - Array of point positions in format [x1, y1, z1, x2, y2, z2, ...]
 * @returns {null} - This component renders no visible content; it's purely for camera positioning side effects
 *
 * @see useThree from @react-three/fiber for accessing Three.js camera
 * @see THREE.Box3 for bounding box implementation
 * @see Points component where CameraAutoFit is used
 */
function CameraAutoFit({ positions }: { positions: Float32Array }) {
  const { camera } = useThree();

  useEffect(() => {
    // === Step 1: Calculate bounding box for all points ===
    // Box3 is an axis-aligned bounding box (AABB) that efficiently encloses all points
    const box = new THREE.Box3();
    const posArray = new Float32Array(positions);

    // Iterate through positions in steps of 3 (x, y, z per point)
    // expandByPoint is more efficient than storing all points then calculating
    for (let i = 0; i < posArray.length; i += 3) {
      box.expandByPoint(
        new THREE.Vector3(posArray[i], posArray[i + 1], posArray[i + 2])
      );
    }

    // === Step 2: Get center and size of the bounding box ===
    const center = new THREE.Vector3();
    box.getCenter(center); // Populates center with box center coordinates

    const size = new THREE.Vector3();
    box.getSize(size); // Populates size with box dimensions (x, y, z)

    // Find the largest dimension to ensure camera is far enough away
    const maxDim = Math.max(size.x, size.y, size.z);

    // Set camera distance to 2x the maximum dimension
    // This provides comfortable margin around the cloud
    const distance = maxDim * 2;

    // === Step 3: Position camera at diagonal offset for optimal viewing ===
    // Offset by 0.6 * distance on each axis creates diagonal viewing angle
    // Not directly above (0.5, 0.5, 0.5) but slightly more overhead
    // This provides good depth perception while keeping cloud in view
    camera.position.set(
      center.x + distance * 0.6,
      center.y + distance * 0.6,
      center.z + distance * 0.6
    );

    // Point camera at the center of the point cloud
    camera.lookAt(center);

    // Update projection matrix to reflect new camera position
    // Required for Three.js to render correctly with new configuration
    camera.updateProjectionMatrix();
  }, [positions, camera]);

    // This component renders no visible content
  // It exists only to run the camera positioning effect
  return null;
}

/**
 * Circle texture created from a canvas with radial gradient.
 *
 * ## Purpose
 *
 * This texture is used as a map for rendering circular points with soft, anti-aliased edges.
 * When applied to PointsMaterial with map and alphaMap properties, it transforms square
 * points into circular points that fade smoothly at the edges.
 *
 * ## Why Create Texture in Canvas?
 *
 * 1. **Performance**: Texture is created once and reused for all circular points
 * 2. **No External Files**: No need to load an image file (no network request)
 * 3. **Dynamic Size**: Can easily change resolution by modifying canvas dimensions
 * 4. **Smooth Edges**: Radial gradient creates smooth anti-aliased edges
 *
 * ## IIFE Pattern
 *
 * The texture is created as an Immediately Invoked Function Expression (IIFE):
 * ```js
 * const circleTexture = (() => {
 *   // Create canvas and texture
 *   return tex;
 * })();
 * ```
 *
 * This ensures:
 * - Texture is created only once at module load time
 * - Not recreated on every component render
 * - Efficient memory usage (single texture instance)
 *
 * ## Gradient Configuration
 *
 * The radial gradient has three stops:
 * - 0.0 (center): rgba(255,255,255,1) - fully opaque white
 * - 0.5 (mid): rgba(255,255,255,0.8) - mostly opaque white
 * - 1.0 (edge): rgba(255,255,255,0) - fully transparent
 *
 * This creates:
 * - Solid white center (preserves point color when multiplied)
 * - Soft falloff in middle region
 * - Transparent edges (creates circular shape)
 *
 * ## Why 64x64 Resolution?
 *
 * - 64x64 = 4096 pixels, sufficient for smooth gradients
 * - Power-of-2 dimensions are optimal for GPU memory
 * - Small enough for fast generation and low memory overhead
 * - Large enough to avoid pixelation at typical point sizes
 *
 * ## Usage in PointsMaterial
 *
 * ```js
 * material.map = circleTexture;       // Provides color information
 * material.alphaMap = circleTexture;   // Provides alpha for transparency
 * ```
 *
 * Both map and alphaMap are set to the same texture because:
 * - Multiplies point color by white gradient (preserves point color)
 * - Uses alpha channel from gradient for transparency
 * - Results in circular point with point's color
 *
 * @see Points material in the Points component where this texture is used
 * @see THREE.CanvasTexture for Three.js texture from HTML canvas
 * @see createRadialGradient for Canvas 2D API documentation
 */
const circleTexture = (() => {
  // Create off-screen canvas for texture generation
  // Canvas size: 64x64 pixels (power-of-2, sufficient for smooth gradients)
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  // Get 2D rendering context for drawing operations
  const ctx = canvas.getContext("2d")!; // ! indicates context is never null

  // Create radial gradient from center (32, 32) to edge (radius 32)
  // Gradient defines the opacity falloff from center to edge
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

  // === Color Stops for Gradient ===
  // Stop at 0% (center): Fully opaque white
  // This ensures the center of each point is fully visible
  gradient.addColorStop(0, "rgba(255,255,255,1)");

  // Stop at 50% (mid-radius): Mostly opaque white
  // Creates smooth transition region from center
  gradient.addColorStop(0.5, "rgba(255,255,255,0.8)");

  // Stop at 100% (edge): Fully transparent
  // Creates the circular shape and smooth anti-aliased edge
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  // Fill canvas with gradient (gradient covers entire canvas)
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  // Create Three.js texture from canvas
  // This texture will be used by PointsMaterial for rendering
  const tex = new THREE.CanvasTexture(canvas);

  return tex;
})();

/**
 * Points component that renders the 3D point cloud with configurable appearance.
 *
 * ## Component Purpose
 *
 * This is the core rendering component that transforms raw point data into a
 * visible 3D point cloud. It creates a Three.js Points mesh with optimized
 * geometry and material based on the current viewer settings.
 *
 * ## Component Hierarchy
 *
 * ```
 * PointCloudViewer (container)
 * └── Canvas (Three.js context)
 *     └── Scene
 *         └── Points (this component)
 *             ├── BufferGeometry (position/color attributes)
 *             ├── PointsMaterial (visual properties)
 *             └── CameraAutoFit (camera positioning)
 * ```
 *
 * ## Three.js Rendering Pipeline
 *
 * ### 1. Geometry Creation
 * - BufferGeometry stores vertex data in GPU memory
 * - Float32BufferAttribute for efficient storage (32-bit floats)
 * - Position attribute: [x, y, z] triplets for each point
 * - Color attribute: [r, g, b] triplets (only when colorMode="vertex")
 *
 * ### 2. Material Configuration
 * - PointsMaterial determines how points are rendered
 * - size: Pixel size of each point (affected by distance if sizeAttenuation=true)
 * - map/alphaMap: Texture for circular point shape
 * - vertexColors: true = use color attribute, false = use uniform color
 * - transparent/opacity: For transparency effects
 * - depthWrite: Disabled for transparent rendering to avoid artifacts
 *
 * ### 3. Mesh Composition
 * - `<points>` JSX element creates THREE.Points mesh
 * - Geometry and material passed as props
 * - Points rendered as individual quads with shader
 *
 * ## Performance Optimizations
 *
 * ### useMemo for Geometry
 * - Geometry recreated ONLY when positions, colors, or colorMode change
 * - Prevents unnecessary BufferAttribute recreation
 * - Avoids expensive GPU memory allocation
 * - Typical update: only when new file loaded or color mode toggled
 *
 * ### useMemo for Material
 * - Material recreated ONLY when visual settings change
 * - Prevents material recompilation
 * - Avoids shader regeneration
 * - Typical update: when user adjusts control panel
 *
 * ### Why These Dependencies?
 *
 * Geometry dependencies: `data.positions, data.colors, settings.colorMode`
 * - positions: Core data, must recreate if points change
 * - colors: Only needed if colorMode="vertex", but simpler to include
 * - colorMode: Determines if color attribute exists
 *
 * Material dependencies: `settings.pointSize, settings.opacity, settings.pointShape, settings.colorMode, settings.uniformColor`
 * - pointSize: Direct material property
 * - opacity: Affects transparent flag and opacity value
 * - pointShape: Determines if map/alphaMap are used
 * - colorMode: Affects vertexColors flag
 * - uniformColor: Used when colorMode="uniform"
 *
 * ## Material Transparency Handling
 *
 * When opacity < 1:
 * - transparent flag set to true
 * - depthWrite set to false to prevent sorting artifacts
 * - Points are rendered back-to-front for correct blending
 * - Trade-off: no depth testing for transparency artifacts
 *
 * When opacity === 1:
 * - transparent flag set to false
 * - depthWrite set to true for correct depth testing
 * - Points can be depth-sorted by GPU for efficiency
 *
 * @param {Object} props - Component props
 * @param {PointData} props.data - Point data containing positions, colors, and metadata
 * @param {ViewerSettings} props.settings - Viewer configuration settings (size, color, opacity, etc.)
 * @returns {JSX.Element} - Three.js points element with configured geometry and material
 *
 * @see BufferGeometry for GPU-optimized geometry storage
 * @see PointsMaterial for point rendering material properties
 * @see circleTexture for circular point shape texture
 * @see CameraAutoFit for automatic camera positioning
 * @see PointData type for data structure
 * @see ViewerSettings type for configuration options
 */
function Points({
  data,
  settings,
}: {
  data: PointData;
  settings: ViewerSettings;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  /**
   * Memoized buffer geometry for point positions and colors.
   *
   * ## What is BufferGeometry?
   *
   * BufferGeometry stores vertex data directly in GPU memory as typed arrays,
   * rather than JavaScript arrays. This provides:
   * - Higher performance (data doesn't need to be copied to GPU each frame)
   * - Lower memory overhead (typed arrays are more compact)
   * - Faster access during rendering (GPU reads directly from GPU memory)
   *
   * ## Position Attribute
   *
   * - Data format: Float32Array with [x, y, z, x, y, z, ...]
   * - 3 components per vertex (x, y, z coordinates)
   - - Passed directly from parsed data
   * - Named "position" (standard Three.js attribute name)
   *
   * ## Color Attribute (Conditional)
   *
   * - When colorMode="uniform": Color attribute is DELETED
   *   - Points will all use the same uniform color
   *   - Saves GPU memory by not storing color per point
   *   - Faster rendering (less data to transfer)
   *
   * - When colorMode="vertex": Color attribute is SET
   *   - Data format: Float32Array with [r, g, b, r, g, b, ...]
   *   - 3 components per vertex (r, g, b values in 0-1 range)
   *   - Each point has its own color from the PLY file
   *   - Named "color" (standard Three.js attribute name)
   *
   * ## Why Delete Instead of Just Not Setting?
   *
   * Deleting the attribute explicitly tells Three.js:
   * - "There is no color attribute on this geometry"
   * - Prevents shader from looking up non-existent data
   * - Ensures material falls back to uniform color
   *
   * Without deletion, geometry might retain stale color attribute
   * from previous render, causing visual bugs.
   *
   * ## Why These Dependencies?
   *
   - data.positions: Core data - must recreate if points change
   - data.colors: Needed for vertex colors - must recreate if colors change
   - settings.colorMode: Determines if color attribute exists - must recreate if mode changes
   *
   Without all three dependencies, geometry could become stale:
   - Missing data.positions → points wouldn't update on file change
   - Missing data.colors → vertex colors wouldn't update on file change
   - Missing settings.colorMode → color attribute could exist when it shouldn't
   *
   * ## Performance Impact
   *
   - BufferAttribute creation is O(n) where n = vertex count
   - For large clouds (>1M points), this can take 10-100ms
   - Memoization prevents recreation on unrelated setting changes
   - Example: changing point size doesn't require recreating geometry
   *
   * @returns {THREE.BufferGeometry} Geometry with position attribute and optional color attribute
   *
   * @see THREE.BufferGeometry for geometry documentation
   * @see THREE.Float32BufferAttribute for typed array attribute storage
   * @see geometry.deleteAttribute for attribute removal
   */
  const prevGeometryRef = useRef<THREE.BufferGeometry | null>(null);

  const geometry = useMemo(() => {
    if (prevGeometryRef.current) {
      prevGeometryRef.current.dispose();
    }

    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(data.positions, 3)
    );

    if (settings.colorMode === "uniform") {
      geo.deleteAttribute("color");
    } else {
      geo.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(data.colors, 3)
      );
    }

    prevGeometryRef.current = geo;
    return geo;
  }, [data.positions, data.colors, settings.colorMode]);

  /**
   * Memoized points material with configurable size, color, transparency, and shape.
   *
   * ## What is PointsMaterial?
   *
   * PointsMaterial is Three.js's built-in shader for rendering point clouds.
   * It handles:
   * - Point size (in pixels or world units)
   * - Color (uniform or per-vertex)
   * - Texture mapping (for non-square points)
   * - Transparency and opacity
   * - Size attenuation (perspective-based scaling)
   * - Depth testing and writing
   *
   * ## Material Properties Explained
   *
   ### size
   * - Size of each point in pixels (before attenuation)
   * - Range: typically 0.01 to 1.0 for good visualization
   * - Larger values create bigger, more visible points
   * - Can be adjusted by user via control panel
   *
   * ### sizeAttenuation
   * - When true: Points appear smaller when farther away (perspective)
   * - When false: Points are constant size regardless of distance
   * - Set to true for realistic 3D depth perception
   * - Critical for proper spatial visualization
   *
   * ### vertexColors
   * - When true: Uses color attribute from geometry (each point has unique color)
   * - When false: Uses uniform color (all points same color)
   * - Determined by colorMode setting (vertex vs uniform)
   *
   * ### color
   * - When colorMode="uniform": The uniform color for all points
   * - When colorMode="vertex": Undefined (ignored when vertexColors=true)
   * - Converted from hex string (e.g., "#ff0000") to THREE.Color object
   *
   * ### transparent
   * - When true: Enables transparency blending
   * - When false: Points are fully opaque
   * - Set to true when opacity < 1.0
   * - Required for semi-transparent rendering
   *
   * ### opacity
   * - Opacity value from 0.05 to 1.0
   * - 1.0 = fully opaque, 0.05 = nearly transparent
   * - Controls the alpha channel for transparency
   * - User-adjustable via control panel slider
   *
   * ### map and alphaMap
   * - Both set to circleTexture when pointShape="circle"
   * - map: Provides color information (white gradient)
   * - alphaMap: Provides alpha/transparency information
   * - Undefined when pointShape="square" (default square points)
   *
   * ### depthWrite
   * - When true: Points write to depth buffer (opaque rendering)
   * - When false: Points don't write to depth buffer (transparent rendering)
   * - Set to !isTransparent (inverted logic)
   * - Critical for correct transparency rendering
   *
   * ## Why Inverted depthWrite?
   *
   * Transparent objects should NOT write to depth buffer because:
   * 1. Early depth testing would prevent later transparent objects from rendering
   * 2. Transparency requires back-to-front rendering order
   * 3. Depth buffer assumes first-writer is closest (incorrect for transparency)
   *
   * Opaque objects SHOULD write to depth buffer because:
   * 1. Enables early depth testing (better performance)
   * 2. Correctly handles occlusion (closer objects hide farther ones)
   * 3. Standard rendering order works correctly
   *
   * ## Why These Dependencies?
   *
   - settings.pointSize: Directly affects material.size property
   - settings.opacity: Affects transparent, opacity, and depthWrite
   - settings.pointShape: Affects map and alphaMap properties
   - settings.colorMode: Affects vertexColors and color properties
   - settings.uniformColor: Affects color property (when uniform mode)
   *
   * Missing any dependency would cause material to be stale:
   * - Example: Changing pointSize would show no effect
   * - Example: Changing opacity wouldn't update transparency
   * - Example: Toggling colorMode wouldn't change coloring
   *
   * ## Performance Impact
   *
   - Material recreation involves shader compilation
   - Shader compilation can take 5-50ms depending on complexity
   - Memoization prevents unnecessary recompilation
   - Example: Changing background color doesn't require material update
   *
   * @returns {THREE.PointsMaterial} Material configured with visual properties from settings
   *
   * @see THREE.PointsMaterial for material documentation
   * @see circleTexture for circular point shape texture
   * @see settings object for configuration values
   */
  const prevMaterialRef = useRef<THREE.PointsMaterial | null>(null);

  const material = useMemo(() => {
    if (prevMaterialRef.current) {
      prevMaterialRef.current.dispose();
    }

    const isTransparent = settings.opacity < 1;

    const mat = new THREE.PointsMaterial({
      size: settings.pointSize,
      sizeAttenuation: true,
      vertexColors: settings.colorMode === "vertex",
      color:
        settings.colorMode === "uniform"
          ? new THREE.Color(settings.uniformColor)
          : undefined,
      transparent: isTransparent,
      opacity: settings.opacity,
      map: settings.pointShape === "circle" ? circleTexture : undefined,
      alphaMap: settings.pointShape === "circle" ? circleTexture : undefined,
      depthWrite: !isTransparent,
    });

    prevMaterialRef.current = mat;
    return mat;
  }, [
    settings.pointSize,
    settings.opacity,
    settings.pointShape,
    settings.colorMode,
    settings.uniformColor,
  ]);

  useEffect(() => {
    return () => {
      if (prevGeometryRef.current) {
        prevGeometryRef.current.dispose();
        prevGeometryRef.current = null;
      }
      if (prevMaterialRef.current) {
        prevMaterialRef.current.dispose();
        prevMaterialRef.current = null;
      }
    };
  }, []);

  return (
    <points ref={pointsRef} geometry={geometry} material={material}>
      <CameraAutoFit positions={data.positions} />
    </points>
  );
}

/**
 * AxesHelper component that renders 3D coordinate axes (X, Y, Z) with color coding.
 *
 * ## Component Purpose
 *
 * Provides visual reference for 3D coordinate system orientation. This helps users
 * understand the spatial orientation of the point cloud, especially important when
 * clouds are not centered at origin or are rotated.
 *
 * ## Color Convention
 *
 * This follows the standard 3D graphics color convention:
 * - **Red axis (X)**: Extends along positive X direction
 * - **Green axis (Y)**: Extends along positive Y direction (typically "up" in many apps)
 * - **Blue axis (Z)**: Extends along positive Z direction
 *
 * This convention is used in most 3D software (Blender, Maya, Unity, etc.).
 *
 * ## Implementation Details
 *
 * Each axis is rendered as a separate line (THREE.Line):
 * - Line geometry: BufferGeometry with 2 vertices (start and end points)
 * - Vertices: (0,0,0) to (length,0,0) for X axis, etc.
 * - Line material: LineBasicMaterial with solid color
 *
 * Why separate lines instead of THREE.AxesHelper?
 * - THREE.AxesHelper is a built-in but has limited customization
 * - Custom implementation allows specific colors and styling
 * - Matches our color scheme (#ef4444, #22c55e, #3b82f6)
 * - Allows future enhancements (arrows, labels, variable lengths)
 *
 * ## Why Length = 5?
 *
 * - 5 units is sufficient for most point clouds
 * - Clouds are automatically centered by camera positioning
 * - 5 units provides good visibility without overwhelming
 * - If clouds are larger, axes scale appropriately with context
 *
 * Alternative approaches:
 * - Make length configurable (could be added to ViewerSettings)
 * - Scale length based on cloud size (complex, may be confusing)
 * - Use constant 5 (current approach - simple and works well)
 *
 * ## Performance Considerations
 *
 * - 3 lines with 2 vertices each = 6 total vertices
 * - Negligible GPU/memory overhead
 * - No optimization needed
 * - Rendered conditionally (only when showAxes=true)
 *
 * @returns {JSX.Element} - Three.js group with three colored line axes
 *
 * @see THREE.Line for line rendering primitive
 * @see LineBasicMaterial for line styling
 * @see BufferGeometry for geometry storage
 * @see Scene component where AxesHelper is conditionally rendered
 * @see showAxes setting in ViewerSettings for toggle control
 */
function AxesHelper() {
  const length = 5;

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, length, 0, 0]), 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, length, 0]), 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, 0, length]), 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
    </group>
  );
}

/**
 * Scene component that composes the 3D scene with points, axes, grid, and controls.
 *
 * ## Component Purpose
 *
 * This is the scene graph root for the point cloud viewer. It composes all renderable
 * elements into a coherent 3D scene and applies conditional rendering based on settings.
 *
 * ## Component Hierarchy
 *
 * ```
 * PointCloudViewer (container)
 * └── Canvas (Three.js rendering context)
 *     └── Scene (this component)
 *         ├── Points (point cloud mesh)
 *         │   └── CameraAutoFit (camera positioning)
 *         ├── AxesHelper (X/Y/Z axes, conditional)
 *         ├── Grid (ground plane, conditional)
 *         └── OrbitControls (interactive camera control)
 * ```
 *
 * ## Conditional Rendering
 *
 * - **Points**: Always rendered (core content)
 * - **AxesHelper**: Rendered only when settings.showAxes === true
 * - **Grid**: Rendered only when settings.showGrid === true
 * - **OrbitControls**: Always rendered (user interaction)
 *
 * This conditional rendering:
 * - Reduces GPU load when helpers not needed
 * - Provides cleaner UI for different use cases
 * - Allows users to toggle helpers on/off
 *
 * ## Scene Composition Order
 *
 * Elements are rendered in the order they appear:
 * 1. Points (the point cloud itself)
 * 2. Axes (if enabled)
 * 3. Grid (if enabled)
 * 4. OrbitControls (not rendered, but added to scene)
 *
 * The rendering order affects:
 * - Transparency blending (transparency requires back-to-front)
 * - Depth testing (opaque objects first, then transparent)
 * - Performance (GPU culling based on scene order)
 *
 * For our use case (mostly opaque points), order is not critical.
 * However, it's good practice to order intentionally.
 *
 * @param {Object} props - Component props
 * @param {PointData} props.data - Point data containing positions, colors, and metadata
 * @param {ViewerSettings} props.settings - Viewer configuration settings (showAxes, showGrid, etc.)
 * @returns {JSX.Element} - Scene elements including points, axes, grid, and orbit controls
 *
 * @see Points component for point cloud rendering
 * @see AxesHelper component for coordinate system visualization
 * @see Grid component from @react-three/drei
 * @see OrbitControls component from @react-three/drei
 * @see ViewerSettings type for configuration options
 */
function Scene({
  data,
  settings,
}: {
  data: PointData;
  settings: ViewerSettings;
}) {
  /**
   * Memoized bounding box calculated from point positions.
   *
   * ## What is a Bounding Box?
   *
   * A bounding box (AABB - Axis-Aligned Bounding Box) is the smallest
   * rectangular box that encloses all points in the cloud, aligned with
   * the coordinate axes.
   *
   Represented by two points: min (x, y, z) and max (x, y, z).
   *
   * ## Why Calculate Bounding Box?
   *
   The bounding box is used for:
   * 1. **Grid sizing**: Grid should cover the entire cloud plus margin
   * 2. **Camera positioning**: CameraAutoFit uses it for placement
   * 3. **Performance**: Could be used for frustum culling (not currently used)
   * 4. **Analysis**: Could provide cloud dimensions to user (not currently shown)
   *
   * ## Implementation Algorithm
   *
   * O(n) iteration over all points:
   * ```js
   * for each point (x, y, z):
   *   box.expandByPoint(new THREE.Vector3(x, y, z))
   * ```
   *
   * expandByPoint efficiently updates min/max to include the point.
   *
   * ## Performance Considerations
   *
   - O(n) time complexity where n = vertex count
   - For large clouds (>1M points), this takes 10-100ms
   - Memoized to only recalculate when positions change
   - positions change only when new file loaded (rare event)
   *
   ## Why Only data.positions Dependency?
   *
   The bounding box depends ONLY on point positions:
   - Colors don't affect spatial extent
   - Settings don't affect cloud size
   - Only new data requires recalculation
   *
   Incorrect dependencies would cause:
   - Unnecessary recalculation on every render (if no deps)
   - Stale bounds if dependency missing (if wrong deps)
   *
   * @returns {THREE.Box3} Bounding box enclosing all points in the cloud
   *
   * @see THREE.Box3 for bounding box implementation
   * @see gridSize useMemo where bbox is used for grid sizing
   * @see CameraAutoFit where bbox is used for camera positioning
   */
  const bbox = useMemo(() => {
    const box = new THREE.Box3();

    // Iterate through all points and expand box to include each point
    // Positions format: [x, y, z, x, y, z, ...] for all points
    for (let i = 0; i < data.positions.length; i += 3) {
      box.expandByPoint(
        new THREE.Vector3(
          data.positions[i],
          data.positions[i + 1],
          data.positions[i + 2]
        )
      );
    }

    return box;
  }, [data.positions]);

  /**
   * Memoized grid size based on the bounding box dimensions.
   *
   * ## Why Multiply by 3?
   *
   The grid should be significantly larger than the point cloud to:
   * 1. Provide context around the cloud (not just under it)
   * 2. Allow for camera rotation without grid clipping
   * 3. Show spatial relationship between cloud and empty space
   * 4. Avoid grid looking "too tight" around the cloud
   *
   Factor of 3 provides comfortable margin:
   * 1x would tightly fit the cloud (looks cramped)
   * 2x provides some margin (okay but minimal)
   * 3x provides generous margin (good balance)
   * 4x+ would make grid too sparse (wasteful)
   *
   ## Implementation Algorithm
   *
   * 1. Extract size from bounding box (width, height, depth)
   * 2. Find maximum dimension (largest of width, height, depth)
   * 3. Multiply by 3 to get grid size
   * 4. Use this value for grid dimensions
   *
   Why max dimension?
   * - Grid is square (same size in X and Z directions)
   * - Cloud may be elongated (tall, wide, or deep)
   * - Using max ensures grid covers all directions
   * - Example: 10x1x10 cloud → max=10 → grid=30x30
   *
   ## Grid Configuration Details
   *
   Grid component from @react-three/drei is configured with:
   * - position: [0, 0, 0] (centered at origin)
   * - args: [gridSize, gridSize] (dimensions)
   * - cellSize: 0.5 (size of each grid cell)
   * - cellThickness: 0.5 (line thickness for cells)
   * - cellColor: #404040 (dark gray for minor lines)
   * - sectionSize: 1 (size of major grid sections)
   * - sectionThickness: 1 (line thickness for major lines)
   * - sectionColor: #525252 (lighter gray for major lines)
   * - fadeDistance: gridSize (distance at which grid fades)
   * - fadeStrength: 1 (fade intensity)
   * - infiniteGrid: false (finite grid, not infinite)
   *
   This creates a subtle grid that provides spatial reference
   * without distracting from the point cloud.
   *
   * ## Why These Dependency?
   *
   - bbox: Required to calculate grid size
   * - Only bbox is needed (size derived from bbox)
   * - Recalculated when bbox changes (new file loaded)
   *
   * @returns {number} Grid size (same in X and Z directions)
   *
   * @see bbox useMemo where bounding box is calculated
   * @see Grid component from @react-three/drei where size is used
   * @see showAxes setting in ViewerSettings for toggle control
   */
  const gridSize = useMemo(() => {
    // Extract dimensions from bounding box
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Find largest dimension (width, height, or depth)
    const maxDim = Math.max(size.x, size.y, size.z);

    // Grid size = 3x max dimension for generous margin around cloud
    return maxDim * 3;
  }, [bbox]);

  return (
    <>
      {/* Core point cloud rendering */}
      {/* Always rendered regardless of settings */}
      {/* Contains geometry, material, and camera positioning */}
      <Points data={data} settings={settings} />

      {/* Coordinate system axes (conditional) */}
      {/* - X axis: red (points right) */}
      {/* - Y axis: green (points up) */}
      {/* - Z axis: blue (points forward) */}
      {/* Only rendered when settings.showAxes === true */}
      {/* @see AxesHelper component for implementation */}
      {settings.showAxes && <AxesHelper />}

      {/* Ground plane grid (conditional) */}
      {/* - Provides spatial reference for orientation */}
      {/* - Helps users understand cloud position relative to origin */}
      {/* - Size calculated to encompass cloud with 3x margin */}
      {/* Only rendered when settings.showGrid === true */}
      {/* @see gridSize useMemo for size calculation */}
      {/* @see Grid component from @react-three/drei */}
      {settings.showGrid && (
        <Grid
          position={[0, 0, 0]} // Centered at origin
          args={[gridSize, gridSize]} // Size in X and Z directions
          cellSize={0.5} // Size of each grid cell
          cellThickness={0.5} // Line thickness for minor grid lines
          cellColor="#404040" // Dark gray for minor lines
          sectionSize={1} // Size of major grid sections
          sectionThickness={1} // Line thickness for major lines
          sectionColor="#525252" // Lighter gray for major lines
          fadeDistance={gridSize} // Distance at which grid fades
          fadeStrength={1} // Fade intensity (0-1)
          infiniteGrid={false} // Finite grid, not infinite
        />
      )}

      {/* Interactive camera controls */}
      {/* - Orbit: rotate around cloud (left drag) */}
      {/* - Zoom: move closer/further (scroll wheel) */}
      {/* - Pan: move side-to-side (right drag) */}
      {/* - Damping: smooth, weighted movement (not instant) */}
      {/* - dampingFactor 0.1: Smooth but responsive */}
      {/* Always rendered to enable user interaction */}
      {/* @see OrbitControls from @react-three/drei */}
      <OrbitControls enableDamping dampingFactor={0.1} />
    </>
  );
}

/**
 * Props interface for the PointCloudViewer component.
 *
 * ## Required Props
 *
 * @property data - Point data containing positions and colors parsed from PLY file.
 *                   This is the core data to be visualized.
 *
 * @property settings - Viewer configuration settings controlling appearance and behavior.
 *                      Includes point size, color, opacity, shape, background, and scene options.
 *
 * ## Optional Props
 *
 * @property className - Optional CSS class name to apply to the container div.
 *                       Allows for custom styling or layout adjustments.
 *                       Typically used for parent component layout needs.
 *
 * @see PointData type from @/lib/ply-parser for data structure
 * @see ViewerSettings type from @/lib/viewer-settings for configuration options
 */
interface PointCloudViewerProps {
  /** Point data containing positions and colors parsed from PLY file */
  data: PointData;
  /** Viewer configuration settings controlling appearance and behavior */
  settings: ViewerSettings;
  /** Optional CSS class name to apply to the container div */
  className?: string;
}

/**
 * Main PointCloudViewer component that renders a 3D point cloud visualization.
 *
 * ## Component Architecture
 *
 * This is the top-level component for point cloud visualization. It provides:
 * - Three.js rendering context via Canvas component
 * - Scene composition via Scene component
 * - Background color configuration
 * - Full-height, full-width responsive layout
 *
 * ## Component Hierarchy
 *
 * ```
 * PointCloudViewer (container div)
 * └── Canvas (Three.js rendering context)
 *     ├── Camera (configured with fov, near, far)
 *     ├── Scene (scene graph root)
 *     │   ├── Points (point cloud mesh)
 *     │   │   ├── BufferGeometry (position/color attributes)
 *     │   │   ├── PointsMaterial (visual properties)
 *     │   │   └── CameraAutoFit (camera positioning)
 *     │   ├── AxesHelper (X/Y/Z axes, conditional)
 *     │   ├── Grid (ground plane, conditional)
 *     │   └── OrbitControls (interactive camera control)
 *     └── Background (configured via style)
 * ```
 *
 * ## Canvas Camera Configuration
 *
 * The camera is configured with specific values for optimal point cloud viewing:
 *
 * ### Field of View (fov: 50)
 * - 50 degrees provides good balance between:
 *   - Too narrow (<40): looks "zoomed in", hard to see overall shape
 *   - Too wide (>70): distortion at edges, exaggerated perspective
 * - 50 is a standard value for 3D visualization
 * - Matches human eye's comfortable viewing angle
 *
 * ### Near Plane (near: 0.01)
 * - 0.01 units is very close to the camera
 * - Allows rendering of points very close to camera
 * - Can't be 0 (would cause division by zero in projection matrix)
 * - Smaller values allow closer zoom but reduce precision
 * - 0.01 is a good balance (allows zoom to 1% of view distance)
 *
 * ### Far Plane (far: 10000)
 * - 10000 units is very far from the camera
 * - Allows rendering of points very far from camera
 * - Typical point clouds: < 1000 units in size
 * - Clouds centered by camera, so 10000 provides ample range
 * - Larger values reduce depth buffer precision
 * - 10000 is generous without sacrificing precision
 *
 * ### Depth Precision Considerations
 *
 * The depth buffer uses log-scale, not linear:
 * - More precision near camera, less precision far away
 * - near:far ratio affects precision
 * - 0.01:10000 = 1:1,000,000 ratio
 * - This is acceptable for typical point clouds
 * - Clouds are auto-centered, so most points at medium distances
 *
 * Alternative configurations:
 * - near: 0.1, far: 1000 (better precision, smaller range)
 * - near: 0.001, far: 100000 (worse precision, larger range)
 * - Current choice: 0.01, 10000 (good balance)
 *
 * ## Three.js Rendering Pipeline
 *
 * ### 1. Geometry Creation (Points component)
 * - BufferGeometry stores positions and colors
 * - Float32BufferAttribute for GPU memory efficiency
 * - Attributes: position (always), color (vertex mode only)
 *
 * ### 2. Material Configuration (Points component)
 * - PointsMaterial determines appearance
 * - Size, color, opacity, texture all configurable
 * - Shader compiled based on material properties
 *
 * ### 3. Mesh Composition (Points component)
 * - THREE.Points combines geometry and material
 * - Rendered as individual quads with shader
 * - Each quad = one point from the cloud
 *
 * ### 4. Scene Assembly (Scene component)
 * - Points added to scene graph
 * - AxesHelper added if enabled
 * - Grid added if enabled
 * - OrbitControls added for interaction
 *
 * ### 5. Rendering (Canvas component)
 * - Three.js renders scene graph
 * - Points rendered with perspective
 * - Helpers rendered on top of points
 * - OrbitControls handles camera updates
 *
 * ## OrbitControls Configuration
 *
 * - enableDamping: true (smooth, weighted movement)
 * - dampingFactor: 0.1 (smooth but responsive)
 *
 * Damping provides:
 * - "Weighted" feel (like heavy camera)
 * - Smoother stopping (not instant)
 * - More professional UX
 *
 * Without damping:
 * - Instant start/stop
 * - Jerky movement
 * - Less polished feel
 *
 * ## Responsive Design
 *
 * - Container uses h-full w-full (100% of parent)
 * - Parent typically has fixed or viewport dimensions
 * - Canvas resizes with container automatically
 * - No explicit resize handling needed (handled by react-three/fiber)
 *
 * @param {PointCloudViewerProps} props - Component props
 * @param {PointData} props.data - Point data containing positions, colors, and metadata
 * @param {ViewerSettings} props.settings - Viewer configuration settings
 * @param {string} [props.className] - Optional CSS class name for container
 * @returns {JSX.Element} - Canvas container with Three.js point cloud viewer
 *
 * @see Canvas from @react-three/fiber for rendering context
 * @see Scene for scene composition
 * @see Points for point cloud rendering
 * @see OrbitControls from @react-three/drei for camera controls
 * @see ViewerSettings for configuration options
 * @see PointData for data structure
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PointCloudViewer data={pointData} settings={viewerSettings} />
 *
 * // With custom class
 * <PointCloudViewer data={pointData} settings={viewerSettings} className="custom-viewer" />
 * ```
 */
export default function PointCloudViewer({
  data,
  settings,
  className,
}: PointCloudViewerProps) {
  return (
    <div className={`h-full w-full ${className ?? ""}`}>
      <Canvas
        camera={{ fov: 50, near: 0.01, far: 10000 }}
        style={{ background: settings.backgroundColor }}
      >
        <Scene data={data} settings={settings} />
      </Canvas>
    </div>
  );
}
