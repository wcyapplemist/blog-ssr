export interface PointData {
  positions: Float32Array;
  colors: Float32Array;
  vertexCount: number;
}

export function parsePly(content: string): PointData {
  const lines = content.split("\n").map((l) => l.trim());

  if (lines[0] !== "ply") {
    throw new Error("Invalid PLY file: must start with 'ply'");
  }

  const formatLine = lines.find((l) => l.startsWith("format "));
  if (!formatLine || !formatLine.includes("ascii")) {
    throw new Error("Unsupported PLY format: only ASCII format is supported");
  }

  const vertexLine = lines.find((l) => l.startsWith("element vertex "));
  if (!vertexLine) {
    throw new Error("Invalid PLY file: missing 'element vertex' declaration");
  }
  const vertexCount = parseInt(vertexLine.split(" ")[2], 10);
  if (isNaN(vertexCount) || vertexCount <= 0) {
    throw new Error(`Invalid vertex count: ${vertexLine}`);
  }

  const endHeaderIndex = lines.indexOf("end_header");
  if (endHeaderIndex === -1) {
    throw new Error("Invalid PLY file: missing 'end_header'");
  }

  const propertyLines = lines
    .slice(0, endHeaderIndex)
    .filter((l) => l.startsWith("property "));

  const xIdx = propertyLines.findIndex(
    (l) => /^property\s+(float|double)\s+x$/.test(l)
  );
  const yIdx = propertyLines.findIndex(
    (l) => /^property\s+(float|double)\s+y$/.test(l)
  );
  const zIdx = propertyLines.findIndex(
    (l) => /^property\s+(float|double)\s+z$/.test(l)
  );
  const redIdx = propertyLines.findIndex(
    (l) => /^property\s+(uchar|uint8)\s+red$/.test(l)
  );
  const greenIdx = propertyLines.findIndex(
    (l) => /^property\s+(uchar|uint8)\s+green$/.test(l)
  );
  const blueIdx = propertyLines.findIndex(
    (l) => /^property\s+(uchar|uint8)\s+blue$/.test(l)
  );

  if (xIdx === -1 || yIdx === -1 || zIdx === -1) {
    throw new Error("Invalid PLY file: missing x/y/z position properties");
  }
  if (redIdx === -1 || greenIdx === -1 || blueIdx === -1) {
    throw new Error("Invalid PLY file: missing red/green/blue color properties");
  }

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);

  const dataStart = endHeaderIndex + 1;
  let parsed = 0;

  for (let i = dataStart; i < lines.length && parsed < vertexCount; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = line.split(/\s+/).map(Number);
    if (values.length < propertyLines.length || values.some(isNaN)) continue;

    const offset = parsed * 3;
    positions[offset] = values[xIdx];
    positions[offset + 1] = values[yIdx];
    positions[offset + 2] = values[zIdx];

    colors[offset] = values[redIdx] / 255;
    colors[offset + 1] = values[greenIdx] / 255;
    colors[offset + 2] = values[blueIdx] / 255;

    parsed++;
  }

  if (parsed !== vertexCount) {
    throw new Error(
      `Vertex count mismatch: expected ${vertexCount}, got ${parsed}`
    );
  }

  return { positions, colors, vertexCount };
}

export function parsePlyFile(file: File): Promise<PointData> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith(".ply")) {
      reject(new Error("Invalid file type: only .ply files are supported"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        resolve(parsePly(content));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}
