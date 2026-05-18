"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { parsePlyFile, type PointData } from "@/lib/ply-parser";

/**
 * Props interface for the PointCloudUpload component.
 *
 * ## Callback Contract
 *
 * The `onPointCloudLoaded` callback is invoked ONLY when:
 * 1. A valid .ply file is selected or dropped
 * 2. The file is successfully parsed by parsePlyFile
 * 3. No errors occurred during parsing
 *
 * If any of these conditions fail, an error state is displayed instead
 * and the callback is NOT invoked.
 *
 * @property onPointCloudLoaded - Callback invoked when a PLY file is successfully parsed and loaded.
 *                                  Receives the parsed PointData object containing positions, colors,
 *                                  and metadata. Parent component should handle transitioning to viewer mode.
 *
 * @see parsePlyFile from @/lib/ply-parser for the parsing implementation
 * @see PointData type for the structure of the returned data
 * @see PointCloudPageClient for typical usage (transitions to viewer on load)
 *
 * @example
 * ```tsx
 * const handleLoad = useCallback((data: PointData) => {
 *   // Store data and switch to viewer mode
 *   setPointCloudData(data);
 *   setShowViewer(true);
 * }, []);
 *
 * <PointCloudUpload onPointCloudLoaded={handleLoad} />
 * ```
 */
interface PointCloudUploadProps {
  onPointCloudLoaded: (data: PointData) => void;
}

/**
 * File upload component for loading point cloud data from PLY files.
 *
 * ## Architecture Overview
 *
 * This component provides a drag-and-drop and file browser interface for loading
 * 3D point cloud data in PLY (Polygon File Format) format. It handles the complete
 * upload lifecycle: file selection, parsing, success/failure feedback, and data handoff.
 *
 * ## Component Lifecycle
 *
 * 1. **Initial State**: Shows drop zone with "drag and drop or browse" message
 * 2. **File Selection**: User either:
 *    - Drags a file over the drop zone (visual feedback with border highlight)
 *    - Clicks "Browse files" to open file picker
 * 3. **Processing**: Loading spinner appears while file is parsed
 * 4. **Success**: Displays filename and vertex count, triggers parent callback
 * 5. **Error**: Shows error message with retry button
 *
 * ## State Management
 *
 * The component maintains 5 pieces of state to manage the upload flow:
 * - `inputRef`: Ref to hidden file input element for programmatic clicking
 * - `isDragging`: Tracks drag-over state for visual feedback
 * - `isLoading`: Async operation state for loading indicator
 * - `error`: Error message string (null = no error)
 * - `fileName`: Name of successfully loaded file (null = no file loaded)
 * - `vertexCount`: Number of points in loaded cloud (null = no file loaded)
 *
 * Each state serves a specific purpose in the upload UX.
 *
 * ## Technical Implementation
 *
 * ### Drag and Drop
 * - Uses HTML5 Drag and Drop API (dragover, dragleave, drop events)
 * - Prevents default browser behavior (which would open the file)
 * - Provides immediate visual feedback with border color change
 * - Handles edge cases like dragging over child elements
 *
 * ### File Parsing
 * - Delegates to parsePlyFile from @/lib/ply-parser
 * - Parsing happens asynchronously to avoid blocking UI
 * - Wrapped in try/catch for graceful error handling
 * - Error messages are user-friendly (not raw exceptions)
 *
 * ### Memory Management
 * - File objects are not stored, only processed and handed off
 * - Large files are streamed by the parser (not loaded entirely into memory first)
 * - Component doesn't persist state between file uploads
 *
 * ## Security Considerations
 *
 * - Input only accepts .ply files via accept=".ply" attribute
 * - Only the first file from file list/drop is processed
 * - File size validation could be added in future
 * - File content is parsed, not executed
 *
 * @see parsePlyFile from @/lib/ply-parser for PLY file format parsing
 * @see PointCloudPageClient for parent component usage
 * @see https://en.wikipedia.org/wiki/PLY_(file_format) for PLY format specification
 */
export default function PointCloudUpload({
  onPointCloudLoaded,
}: PointCloudUploadProps) {
  // Ref: Reference to hidden file input element
  // - Hidden input allows programmatic file opening via button click
  // - Using ref instead of controlled state for performance (no re-renders)
  // - Current ref provides .click() method for triggering file picker
  const inputRef = useRef<HTMLInputElement>(null);

  // State: Tracks whether a file is currently being dragged over the drop zone
  // - When true: drop zone highlights with active border color and background
  // - When false: drop zone shows neutral/resting border color
  // - Toggled on dragenter/dragover and dragleave events
  // - Provides immediate visual feedback for better UX
  const [isDragging, setIsDragging] = useState(false);

  // State: Indicates async file parsing is in progress
  // - When true: shows loading spinner with "Parsing PLY file..." text
  // - When false: shows drop zone UI or success/error states
  // - Critical for UX: prevents user from thinking nothing is happening
  // - Must be set to false in finally block to ensure cleanup
  const [isLoading, setIsLoading] = useState(false);

  // State: Stores error message from failed file parsing
  // - When null: no error has occurred
  // - When string: error message to display to user
  // - Cleared when user starts new file upload or clicks retry
  // - Uses user-friendly messages, not raw error objects
  const [error, setError] = useState<string | null>(null);

  // State: Stores the filename of successfully loaded point cloud
  // - When null: no file has been loaded yet
  // - When string: displays filename in success message
  // - Purely informational, used for confirmation display
  // - Reset when new file upload begins
  const [fileName, setFileName] = useState<string | null>(null);

  // State: Stores the vertex count of successfully loaded point cloud
  // - When null: no file has been loaded yet
  // - When number: displays point count in success message
  // - Provides immediate feedback on data size (helps gauge complexity)
  // - Useful for users to understand the scale of the cloud they're viewing
  const [vertexCount, setVertexCount] = useState<number | null>(null);

  /**
   * Asynchronously processes a PLY file by parsing it and updating component state.
   *
   * ## Processing Lifecycle
   *
   * This function orchestrates the complete file processing workflow:
   *
   * 1. **Cleanup Phase**
   *    - Clears any previous error state (fresh start)
   *    - Resets filename and vertexCount (previous data is discarded)
   *    - Sets isLoading=true to show loading spinner
   *
   * 2. **Parsing Phase**
   *    - Calls parsePlyFile(file) which reads and parses the file
   *    - parsePlyFile returns PointData object on success
   *    - On error, execution jumps to catch block
   *
   * 3. **Success Phase**
   *    - Stores filename from file object for display
   *    - Stores vertexCount from parsed data for display
   *    - Invokes onPointCloudLoaded(data) to notify parent
   *    - Parent typically transitions to viewer mode
   *
   * 4. **Error Phase**
   *    - Catches any errors from parsePlyFile or other operations
   *    - Extracts user-friendly message from Error object
   *    - Falls back to generic message if error isn't an Error instance
   *    - Error state triggers error UI display
   *
   * 5. **Cleanup Phase (finally)**
   *    - Always sets isLoading=false (regardless of success/failure)
   *    - Ensures loading spinner disappears
   *    - Allows user to try again or see success state
   *
   * ## Error Handling Strategy
   *
   * Errors can occur at multiple points:
   * - File format invalid (not a PLY file)
   * - PLY header malformed or missing required fields
   * - Binary data corrupted or truncated
   * - Required properties (x, y, z) missing
   * - File too large for browser memory
   *
   * All errors are caught and displayed as user-friendly messages.
   * Console may show detailed stack traces for debugging.
   *
   * ## Why async/await?
   *
   * PLY file parsing is CPU-intensive, especially for large files.
   * Using async ensures the UI remains responsive during parsing.
   * Without async, the browser would freeze until parsing completes.
   *
   * @param file - The File object to be parsed. Must be a .ply file for successful parsing.
   *
   * @throws {Error} When file parsing fails (caught internally, displayed to user)
   *
   * @see parsePlyFile from @/lib/ply-parser for the parsing implementation
   * @see PointData type for the structure of the returned data
   * @see onPointCloudLoaded callback for data handoff to parent
   *
   * @example
   * ```tsx
   * // Example: Processing a file from drop event
   * const handleDrop = (e: React.DragEvent) => {
   *   const file = e.dataTransfer.files[0];
   *   if (file) processFile(file);
   * };
   * ```
   */
  const processFile = useCallback(
    async (file: File) => {
      // Cleanup: Reset all state to ensure clean slate for new file
      setError(null);
      setFileName(null);
      setVertexCount(null);
      setIsLoading(true);

      try {
        // Parse the PLY file asynchronously
        // This operation may take time for large files (millions of points)
        const data = await parsePlyFile(file);

        // Success: Store metadata for display
        setFileName(file.name);
        setVertexCount(data.vertexCount);

        // Handoff: Notify parent component to transition to viewer
        onPointCloudLoaded(data);
      } catch (err) {
        // Error: Extract user-friendly message and display to user
        setError(
          err instanceof Error ? err.message : "Failed to parse PLY file"
        );
      } finally {
        // Cleanup: Always hide loading indicator
        // This executes regardless of success or failure
        setIsLoading(false);
      }
    },
    [onPointCloudLoaded]
  );

  /**
   * Handler for file input change events.
   *
   * ## Event Flow
   *
   * 1. User clicks "Browse files" button
   * 2. Button triggers hidden input via inputRef.current?.click()
   * 3. OS file picker dialog opens
   * 4. User selects a file and clicks "Open"
   * 5. Browser fires 'change' event on input element
   * 6. This handler extracts file and passes to processFile()
   *
   * ## Why Reset Input Value?
   *
   * Setting `e.target.value = ""` after processing is critical:
   *
   * Without reset:
   * - User selects "file1.ply" → processes successfully
   * - User tries to select "file1.ply" again → 'change' event doesn't fire!
   * - Browser thinks the value hasn't changed
   * - User is confused because clicking "Browse" does nothing
   *
   * With reset:
   * - User selects "file1.ply" → processes → input cleared
   * - User selects "file1.ply" again → 'change' event fires → processes
   * - Expected behavior restored
   *
   * This is a common gotcha in React file input handling.
   *
   * @param e - React change event from the file input element.
   *             Contains e.target.files array with selected file(s).
   *
   * @see processFile for the file processing logic
   * @see inputRef reference for programmatic input triggering
   *
   * @example
   * ```tsx
   * // Example: Triggering file selection programmatically
   * <Button onClick={() => inputRef.current?.click()}>
   *   Browse files
   * </Button>
   * ```
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Extract first file from FileList (we only support single file upload)
      const file = e.target.files?.[0];
      if (file) processFile(file);

      // Critical: Clear input value to allow re-selecting the same file
      // Without this, selecting the same file twice won't trigger 'change' event
      e.target.value = "";
    },
    [processFile]
  );

  /**
   * Handler for drag over events to enable file drop.
   *
   * ## Browser Default Behavior
   *
   * By default, when a file is dragged over an element, the browser:
   * - Shows a "drop" cursor icon
   * - Plans to open the file in a new tab/window on drop
   * - This is undesirable for a drop zone component
   *
   * ## Why preventDefault()?
   *
   * Calling `preventDefault()` tells the browser:
   * - "Don't handle this drop, I'll handle it"
   * - Allows our drop handler to receive the file
   * - Prevents the file from opening in a new tab
   *
   * ## Why stopPropagation()?
   *
   * Stopping propagation prevents the event from bubbling up to parent elements.
   * This is important when nested elements have drag handlers to avoid conflicts.
   *
   * ## Visual Feedback Timing
   *
   * Setting `isDragging(true)` here triggers the active border style:
   * - Border color changes from neutral to highlighted
   * - Background color lightens
   * - User gets immediate feedback that drop zone is ready
   *
   * @param e - React drag event containing the drag operation details.
   *             Includes dataTransfer with files being dragged.
   *
   * @see handleDrop for the file processing logic when file is dropped
   * @see handleDragLeave for cleanup when file leaves drop zone
   *
   * @example
   * ```tsx
   * // Drop zone structure
   * <div
   *   onDragOver={handleDragOver}
   *   onDragEnter={handleDragOver}
   *   onDragLeave={handleDragLeave}
   *   onDrop={handleDrop}
   * >
   *   {/* Drop zone content *\/}
   * </div>
   * ```
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Prevent browser from opening the file
    e.preventDefault();
    // Stop event from bubbling to parent elements
    e.stopPropagation();
    // Show visual feedback that drop zone is active
    setIsDragging(true);
  }, []);

  /**
   * Handler for drag leave events to indicate the file has left the drop zone.
   *
   * ## When is this triggered?
   *
   * Drag leave fires when:
   * - File moves outside the drop zone boundary
   * - File is dropped on another element
   * - User cancels the drag operation
   *
   * ## Why preventDefault() and stopPropagation()?
   *
   * Same reasons as handleDragOver:
   * - Prevent browser's default drag handling
   * - Avoid event bubbling conflicts with nested elements
   *
   * ## Visual Feedback Cleanup
   *
   * Setting `isDragging(false)` restores the resting border style:
   * - Border color returns to neutral
   * - Background color returns to normal
   * - Indicates drop zone is no longer ready to receive files
   *
   * ## Edge Case: Child Elements
   *
   * If the drop zone contains child elements, drag leave may fire when the
   * cursor moves over a child (even though still in drop zone). This can cause
   * flickering. More complex implementations track enter/leave counts.
   *
   * This simple implementation is sufficient for our use case (no nested children
   * that would trigger this issue).
   *
   * @param e - React drag event containing the drag operation details.
   *
   * @see handleDragOver for the matching enter/over handler
   * @see handleDrop for the drop completion handler
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Prevent browser's default behavior
    e.preventDefault();
    // Stop event bubbling
    e.stopPropagation();
    // Remove visual feedback
    setIsDragging(false);
  }, []);

  /**
   * Handler for drop events when a file is dropped onto the component.
   *
   * ## Drop Event Flow
   *
   * 1. User drags file over drop zone (handleDragOver fires)
   * 2. Visual feedback shows drop zone is active (isDragging=true)
   * 3. User releases mouse button over drop zone
   * 4. Browser fires 'drop' event on the element
   * 5. This handler processes the dropped file
   *
   * ## Why preventDefault()?
   *
   * Same critical reason as drag handlers:
   * - Prevents browser from opening the file in a new tab
   * - Required for custom drop handling
   *
   * ## File Extraction
   *
   * Files are accessed via `e.dataTransfer.files` (FileList):
   * - Contains all files dropped at once
   * - We only process the first file ([0])
   * - Future enhancement could support multiple files
   *
   * ## State Cleanup
   *
   * Setting `isDragging(false)` is important:
   * - Removes active border style
   * - Even though UI will update to loading/success state
   * - Ensures clean state if drop fails (no file selected)
   *
   * ## Multi-File Consideration
   *
   * Current implementation only processes first file.
   * If user drops multiple files:
   * - Only first file is processed
   * - Other files are silently ignored
   * - Could add validation/warning in future
   *
   * @param e - React drag event containing the dropped files.
   *             Files accessible via e.dataTransfer.files array.
   *
   * @throws {Error} Indirectly via processFile if file parsing fails
   *
   * @see processFile for the file processing logic
   * @see dataTransfer.files API for accessing dropped files
   *
   * @example
   * ```tsx
   * // Example: Accessing all dropped files
   * const files = Array.from(e.dataTransfer.files);
   * files.forEach(file => processFile(file));
   * ```
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      // Prevent browser from opening the file
      e.preventDefault();
      // Stop event bubbling
      e.stopPropagation();

      // Remove active drop zone visual feedback
      setIsDragging(false);

      // Extract and process the first dropped file
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <svg
              className="size-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm">Parsing PLY file...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Drag and drop a <code className="font-mono text-xs">.ply</code>{" "}
              file here, or
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Browse files
            </Button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".ply"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {fileName && vertexCount !== null && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loaded: <strong>{fileName}</strong> ({vertexCount} vertices)
        </p>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setError(null)}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
