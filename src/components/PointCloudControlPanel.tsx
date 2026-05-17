"use client";

import { useState } from "react";
import type { ViewerSettings } from "@/lib/viewer-settings";

interface PointCloudControlPanelProps {
  settings: ViewerSettings;
  onSettingsChange: (settings: ViewerSettings) => void;
}

export default function PointCloudControlPanel({
  settings,
  onSettingsChange,
}: PointCloudControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const update = <K extends keyof ViewerSettings>(
    key: K,
    value: ViewerSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
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

      <div
        className={`absolute left-0 top-0 z-10 flex h-full w-72 flex-col gap-5 overflow-y-auto bg-zinc-900/90 px-5 py-4 backdrop-blur-md transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
