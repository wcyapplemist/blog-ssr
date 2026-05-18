"use client";

import { useState } from "react";
import type { ViewerSettings } from "@/lib/viewer-settings";

/**
 * Props interface for the PointCloudControlPanel component.
 *
 * ## Data Flow
 *
 * This component operates as a controlled component:
 * - Receives current settings via `settings` prop
 * - Notifies parent of changes via `onSettingsChange` callback
 * - Parent component (PointCloudPageClient) maintains the authoritative settings state
 *
 * This pattern allows multiple components to react to settings changes
 * (e.g., viewer updates when control panel changes settings).
 *
 * @property settings - Current viewer settings object containing all configuration values
 * @property onSettingsChange - Callback invoked with new settings object when any control is changed
 *
 * @see ViewerSettings type from @/lib/viewer-settings for the complete settings structure
 * @see PointCloudPageClient for the parent component that manages settings state
 */
interface PointCloudControlPanelProps {
  settings: ViewerSettings;
  onSettingsChange: (settings: ViewerSettings) => void;
}

/**
 * Collapsible control panel component for point cloud viewer settings.
 *
 * ## Architecture Overview
 *
 * This component provides a slide-in sidebar panel with comprehensive controls for
 * customizing the point cloud viewing experience. It's designed to be unobtrusive
 * yet powerful, giving users fine-grained control over visual presentation.
 *
 * ## Component Hierarchy
 *
 * ```
 * PointCloudControlPanel
 * ├── Toggle Button (always visible, top-left corner)
 * │   └── Settings icon (opens/closes panel)
 * ├── Collapsible Panel (slides in from left)
 * │   ├── Header (title + close button)
 * │   ├── Section: Point Rendering
 * │   │   ├── Size slider (0.01 - 1.0)
 * │   │   ├── Shape toggle (circle/square)
 * │   │   └── Opacity slider (0.05 - 1.0)
 * │   ├── Section: Color
 * │   │   ├── Color mode toggle (vertex/uniform)
 * │   │   ├── Uniform color picker (shown when uniform mode active)
 * │   │   └── Background color picker
 * │   └── Section: Scene
 * │       ├── Show Axes toggle
 * │       └── Show Grid toggle
 * ```
 *
 * ## UI/UX Design Decisions
 *
 * ### Collapsible Design
 * - Panel starts closed to maximize viewing area
 * - Toggle button remains accessible for quick access
 * - Smooth slide animation (200ms) provides polished feel
 * - Backdrop blur ensures text remains readable over 3D scene
 *
 * ### Control Organization
 * - Grouped into logical sections with clear headers
 * - Point Rendering: affects individual point appearance
 * - Color: affects overall color presentation
 * - Scene: affects scene-level helpers and environment
 *
 * ### Control Types
 * - Sliders for continuous values (size, opacity) with live value display
 * - Toggle buttons for binary choices (shape, mode, visibility)
 * - Color pickers for visual color selection
 *
 * ## Technical Implementation
 *
 * ### State Management
 * - `isOpen`: Local state for panel visibility (not persisted)
 * - Settings are NOT managed locally - they come from parent
 * - This ensures single source of truth and enables shared settings across components
 *
 * ### Update Pattern
 * - Generic `update()` helper function with TypeScript generics
 * - Creates new settings object with spread operator for immutability
 * - Type-safe thanks to `K extends keyof ViewerSettings` constraint
 *
 * @see PointCloudViewer for the component that consumes these settings
 * @see ViewerSettings from @/lib/viewer-settings for all available settings
 *
 * @example
 * ```tsx
 * // Usage in parent component
 * const [settings, setSettings] = useState(defaultSettings);
 * <PointCloudControlPanel
 *   settings={settings}
 *   onSettingsChange={setSettings}
 * />
 * ```
 */
export default function PointCloudControlPanel({
  settings,
  onSettingsChange,
}: PointCloudControlPanelProps) {
  // State: Controls panel visibility (slide-in animation state)
  // When true: panel slides in from left (translate-x-0)
  // When false: panel hidden off-screen (-translate-x-full)
  // This state is local to this component and not persisted between sessions
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Generic helper function to update a specific viewer setting key.
   *
   * ## Implementation Details
   *
   * This function uses TypeScript generics to ensure type safety:
   * - `K extends keyof ViewerSettings` ensures only valid setting keys can be passed
   * - `value: ViewerSettings[K]` ensures the value type matches the key's expected type
   *
   * ## Immutability Pattern
   *
   * Creates a new settings object using the spread operator:
   * 1. Spreads existing settings: `{ ...settings }`
   * 2. Overrides specific key with new value: `[key]: value`
   * 3. Passes new object to parent callback
   *
   * This pattern prevents direct state mutation and enables React's change detection.
   *
   * ## Why This Helper?
   *
   * Instead of repeating this pattern for every control:
   * ```tsx
   * onSettingsChange({ ...settings, pointSize: newValue });
   * ```
   *
   * We can write:
   * ```tsx
   * update("pointSize", newValue);
   * ```
   *
   * This reduces code duplication and makes updates more maintainable.
   *
   * @template K - Type parameter constrained to valid ViewerSettings keys
   * @param key - The setting key to update (e.g., "pointSize", "opacity", "colorMode")
   * @param value - The new value for the specified setting (type must match the key's expected type)
   *
   * @see ViewerSettings interface from @/lib/viewer-settings for all valid keys and their types
   *
   * @example
   * ```tsx
   * // Update point size
   * update("pointSize", 0.5);
   *
   * // Toggle axes visibility
   * update("showAxes", !settings.showAxes);
   *
   * // Change color mode
   * update("colorMode", "uniform");
   * ```
   */
  const update = <K extends keyof ViewerSettings>(
    key: K,
    value: ViewerSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
      {/* Toggle Button: Always visible in top-left corner */}
      {/* - Gear/settings icon indicates customization capability */}
      {/* - z-index 10 ensures it's above the canvas but below fullscreen overlays */}
      {/* - Backdrop blur provides modern glass effect over 3D scene */}
      {/* - Transitions provide hover feedback */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-4 top-4 z-10 flex size-9 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-400 backdrop-blur-sm transition-colors hover:bg-zinc-700 hover:text-white"
        aria-label="Toggle control panel"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Collapsible Panel Container */}
      {/* - Positioned absolute to overlay on top of canvas */}
      {/* - Slides in/out via translate-x CSS transform */}
      {/* - w-72 (288px) provides comfortable width for controls */}
      {/* - h-full ensures panel spans full viewport height */}
      {/* - Overflow-y-auto allows scrolling on smaller screens */}
      {/* - Backdrop blur and semi-transparent background allow scene visibility */}
      {/* - Smooth 200ms transition for polished UX */}
      {/* - z-index 10 to stay above canvas but below modals */}
      <div
        className={`absolute left-0 top-0 z-10 flex h-full w-72 flex-col gap-5 overflow-y-auto bg-zinc-900/90 px-5 py-4 backdrop-blur-md transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Panel Header: Title + Close Button */}
        {/* - Flex row with space-between for proper alignment */}
        {/* - Close button allows users to dismiss without reaching toggle button */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Controls</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Close panel"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* ==================== SECTION: Point Rendering ==================== */}
        {/* Controls that affect how individual points are rendered */}
        {/* These settings directly influence PointsMaterial properties */}
        {/* @see Points component in PointCloudViewer.tsx for rendering implementation */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Point Rendering
          </h3>

          <label className="block space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Size</span>
              <span className="text-xs tabular-nums text-zinc-500">
                {settings.pointSize.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.005}
              value={settings.pointSize}
              onChange={(e) => update("pointSize", parseFloat(e.target.value))}
              className="w-full accent-zinc-400"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Shape</span>
            <div className="flex gap-2">
              {(["circle", "square"] as const).map((shape) => (
                <button
                  key={shape}
                  onClick={() => update("pointShape", shape)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs capitalize transition-colors ${
                    settings.pointShape === shape
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </label>

          <label className="block space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Opacity</span>
              <span className="text-xs tabular-nums text-zinc-500">
                {settings.opacity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={(e) => update("opacity", parseFloat(e.target.value))}
              className="w-full accent-zinc-400"
            />
          </label>
        </section>

        {/* ==================== SECTION: Color ==================== */}
        {/* Controls for color presentation and environment */}
        {/* - Color mode: whether to use vertex colors from file or uniform color */}
        {/* - Uniform color picker: active only when colorMode is "uniform" */}
        {/* - Background: canvas background color for scene atmosphere */}
        {/* @see PointsMaterial vertexColors and color properties */}
        {/* @see Canvas background style in PointCloudViewer.tsx */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Color
          </h3>

          <div className="flex gap-2">
            {(["vertex", "uniform"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => update("colorMode", mode)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs capitalize transition-colors ${
                  settings.colorMode === mode
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-800/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                {mode === "vertex" ? "Vertex" : "Uniform"}
              </button>
            ))}
          </div>

          {settings.colorMode === "uniform" && (
            <label className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Color</span>
              <input
                type="color"
                value={settings.uniformColor}
                onChange={(e) => update("uniformColor", e.target.value)}
                className="size-7 cursor-pointer rounded border border-zinc-700 bg-transparent"
              />
              <span className="text-xs tabular-nums text-zinc-500">
                {settings.uniformColor}
              </span>
            </label>
          )}

          <label className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Background</span>
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => update("backgroundColor", e.target.value)}
              className="size-7 cursor-pointer rounded border border-zinc-700 bg-transparent"
            />
            <span className="text-xs tabular-nums text-zinc-500">
              {settings.backgroundColor}
            </span>
          </label>
        </section>

        {/* ==================== SECTION: Scene ==================== */}
        {/* Controls for scene-level helpers and visualization aids */}
        {/* - Show Axes: displays X (red), Y (green), Z (blue) axes at origin */}
        {/* - Show Grid: displays ground plane grid for spatial reference */}
        {/* These helpers don't affect the point cloud itself but provide context */}
        {/* @see AxesHelper component in PointCloudViewer.tsx */}
        {/* @see Grid component from @react-three/drei */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Scene
          </h3>

          <label className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Show Axes</span>
            <button
              onClick={() => update("showAxes", !settings.showAxes)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                settings.showAxes ? "bg-zinc-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                  settings.showAxes ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Show Grid</span>
            <button
              onClick={() => update("showGrid", !settings.showGrid)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                settings.showGrid ? "bg-zinc-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                  settings.showGrid ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </label>
        </section>
      </div>
    </>
  );
}
