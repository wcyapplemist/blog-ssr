"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { parsePlyFile, type PointData } from "@/lib/ply-parser";

interface PointCloudUploadProps {
  onPointCloudLoaded: (data: PointData) => void;
}

export default function PointCloudUpload({
  onPointCloudLoaded,
}: PointCloudUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [vertexCount, setVertexCount] = useState<number | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(null);
      setVertexCount(null);
      setIsLoading(true);

      try {
        const data = await parsePlyFile(file);
        setFileName(file.name);
        setVertexCount(data.vertexCount);
        onPointCloudLoaded(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse PLY file"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onPointCloudLoaded]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

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
