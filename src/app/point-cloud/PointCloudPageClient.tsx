"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import PointCloudUpload from "@/components/PointCloudUpload";
import type { PointData } from "@/lib/ply-parser";

const PointCloudViewer = dynamic(
  () => import("@/components/PointCloudViewer"),
  { ssr: false }
);

export default function PointCloudPageClient() {
  const [data, setData] = useState<PointData | null>(null);

  const handlePointCloudLoaded = useCallback((pointData: PointData) => {
    setData(pointData);
  }, []);

  const handleClose = useCallback(() => {
    setData(null);
  }, []);

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
        <div className="flex-1">
          <PointCloudViewer data={data} />
        </div>
      </div>
    );
  }

  return (
    <PointCloudUpload onPointCloudLoaded={handlePointCloudLoaded} />
  );
}
