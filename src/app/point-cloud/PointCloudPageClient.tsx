"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import PointCloudUpload from "@/components/point-cloud/PointCloudUpload";
import PointCloudControlPanel from "@/components/point-cloud/PointCloudControlPanel";
import type { PointData } from "@/lib/ply-parser";
import type { ViewerSettings } from "@/lib/viewer-settings";
import { defaultSettings } from "@/lib/viewer-settings";

// Dynamic import with SSR disabled because the viewer uses WebGL and browser-only APIs
// This prevents hydration errors and ensures the component only runs in client-side environment
// @see https://nextjs.org/docs/app/api-reference/next/dynamic
const PointCloudViewer = dynamic(
  () => import("@/components/point-cloud/PointCloudViewer"),
  { ssr: false }
);

/**
 * Client-side page component that orchestrates the point cloud viewing experience.
 *
 * ## Architecture & Data Flow
 *
 * This component serves as the main coordinator for the point cloud feature, managing the transition
 * between two distinct UI states:
 *
 * 1. **Upload State**: When `data` is null, renders the PointCloudUpload component
 *    - User selects a .ply file via drag-and-drop or file picker
 *    - File is parsed by parsePlyFile from @/lib/ply-parser
 *    - Successfully parsed data triggers the handlePointCloudLoaded callback
 *
 * 2. **Viewer State**: When `data` exists, renders a fullscreen 3D viewer overlay
 *    - PointCloudViewer renders the Three.js canvas with the point cloud
 *    - PointCloudControlPanel provides adjustable settings (size, color, etc.)
 *    - Settings state is managed locally and passed to both components
 *    - User can close the viewer to return to upload state
 *
 * ## State Management
 *
 * The component maintains two key pieces of state:
 * - `data`: The parsed point cloud data (null = upload mode, non-null = viewer mode)
 * - `settings`: Viewer configuration that persists across the session
 *
 * When a new file is loaded, settings are reset to defaults to ensure consistent starting
 * conditions. This is important because different point clouds may have different scales and
 * characteristics that require different viewing parameters.
 *
 * @see PointCloudUpload Component for file selection and parsing
 * @see PointCloudViewer Component for Three.js rendering
 * @see PointCloudControlPanel Component for user controls
 * @see ViewerSettings from @/lib/viewer-settings for configuration options
 *
 * @example
 * ```tsx
 * // Typical usage in page.tsx
 * export default function Page() {
 *   return <PointCloudPageClient />;
 * }
 * ```
 *
 * @returns {JSX.Element} Either the upload interface or fullscreen viewer overlay
 */
export default function PointCloudPageClient() {
  // State: Parsed point cloud data from PLY file (positions, colors, metadata)
  // When null: render upload interface
  // When non-null: render fullscreen viewer with the loaded data
  const [data, setData] = useState<PointData | null>(null);

  // State: Viewer configuration settings (point size, color mode, opacity, etc.)
  // Initialized to default settings and updated via control panel
  // Persists during viewer session, reset when new file is loaded
  const [settings, setSettings] = useState<ViewerSettings>(defaultSettings);

  /**
   * Callback handler invoked when a PLY file is successfully parsed and loaded.
   *
   * ## Processing Flow
   *
   * 1. PointCloudUpload component calls this after successful parsePlyFile execution
   * 2. Viewer settings are reset to defaults to ensure clean slate for new data
   * 3. Point data is stored in state, triggering transition to viewer mode
   * 4. Component re-renders with fullscreen viewer overlay
   *
   * ## Why Reset Settings?
   *
   * Different point clouds have vastly different characteristics:
   * - Scale: Some clouds span millimeters, others kilometers
   * - Point density: Ranges from hundreds to millions of points
   * - Color distribution: May be monochrome or fully colored
   * - Position: Centered at origin or offset in 3D space
   *
   * Resetting ensures each cloud starts from a known-good configuration.
   * Users can then adjust settings based on the specific cloud they're viewing.
   *
   * @param pointData - The parsed point cloud data containing vertices (positions),
   *                    colors, and metadata (vertex count, bounds)
   *
   * @see parsePlyFile from @/lib/ply-parser for the parsing implementation
   * @see PointData type for the data structure
   */
  const handlePointCloudLoaded = useCallback((pointData: PointData) => {
    setSettings(defaultSettings);
    setData(pointData);
  }, []);

  /**
   * Callback handler to close the viewer and return to the upload screen.
   *
   * ## Transition Flow
   *
   * 1. User clicks the close button (X icon) in the viewer header
   * 2. This handler clears the data state by setting it to null
   * 3. Component re-renders, now showing the upload interface instead of viewer
   * 4. Previous point data is discarded (can be re-loaded by selecting file again)
   *
   * ## Design Considerations
   *
   * - Settings are NOT preserved when closing (they reset on next file load)
   * - This is intentional: new clouds should start fresh
   * - If settings persistence is needed in future, could store in localStorage
   *
   * ## Performance
   *
   * Clearing data allows the Three.js canvas to unmount and release WebGL resources.
   * This is important for memory management, especially with large point clouds
   * that may use significant GPU memory for geometry and buffers.
   *
   * @see handleClose button trigger in the viewer header JSX
   */
  const handleClose = useCallback(() => {
    setData(null);
  }, []);

  // Conditional Rendering Strategy
  // - If data exists: Show fullscreen viewer overlay (z-50 to cover entire screen)
  //   - Header with close button positioned top-right
  //   - Main area with control panel (absolute left) and viewer (fills space)
  // - If no data: Show upload interface for file selection
  //
  // This two-state approach provides a clean UX where upload and viewing are
  // separate modes, preventing clutter and ensuring appropriate UI for each task
  if (data) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900">
        <div className="flex items-center justify-end px-4 py-3">
          <button
            onClick={handleClose}
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close viewer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="relative flex-1">
          <PointCloudControlPanel
            settings={settings}
            onSettingsChange={setSettings}
          />
          <PointCloudViewer data={data} settings={settings} />
        </div>
      </div>
    );
  }

  return (
    <PointCloudUpload onPointCloudLoaded={handlePointCloudLoaded} />
  );
}
