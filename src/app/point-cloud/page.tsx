import PointCloudPageClient from "./PointCloudPageClient";

export default function PointCloudPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex w-full max-w-4xl flex-col px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Point Cloud
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Upload a PLY file to visualize 3D point cloud data. Supports ASCII
          format with per-vertex colors.
        </p>

        <div className="mt-8">
          <PointCloudPageClient />
        </div>
      </main>
    </div>
  );
}
