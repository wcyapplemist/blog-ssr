"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { PointData } from "@/lib/ply-parser";

function CameraAutoFit({ positions }: { positions: Float32Array }) {
  const { camera } = useThree();

  useEffect(() => {
    const box = new THREE.Box3();
    const posArray = new Float32Array(positions);
    for (let i = 0; i < posArray.length; i += 3) {
      box.expandByPoint(
        new THREE.Vector3(posArray[i], posArray[i + 1], posArray[i + 2])
      );
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    camera.position.set(
      center.x + distance * 0.6,
      center.y + distance * 0.6,
      center.z + distance * 0.6
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [positions, camera]);

  return null;
}

function Points({ data }: { data: PointData }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(data.positions, 3)
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(data.colors, 3));
    return geo;
  }, [data.positions, data.colors]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation={true}
        vertexColors={true}
      />
      <CameraAutoFit positions={data.positions} />
    </points>
  );
}

interface PointCloudViewerProps {
  data: PointData;
  className?: string;
}

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

function Scene({ data }: { data: PointData }){
  const bbox = useMemo(() => {
    const box = new THREE.Box3();
    for (let i = 0; i < data.positions.length; i += 3) {
      box.expandByPoint(
        new THREE.Vector3(data.positions[i], data.positions[i + 1], data.positions[i + 2])
      );
    }
    return box;
  }, [data.positions]);

  const gridSize = useMemo(() => {
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    return maxDim * 3;
  }, [bbox]);

  return (
    <>
      <Points data={data} />
      <AxesHelper />
      <Grid
        position={[0, 0, 0]}
        args={[gridSize, gridSize]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#404040"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#525252"
        fadeDistance={gridSize}
        fadeStrength={1}
        infiniteGrid={false}
      />
      <OrbitControls enableDamping dampingFactor={0.1} />
    </>
  );
}

export default function PointCloudViewer({
  data,
  className,
}: PointCloudViewerProps) {
  return (
    <div className={`h-full w-full ${className ?? ""}`}>
      <Canvas
        camera={{ fov: 50, near: 0.01, far: 10000 }}
        style={{ background: "#18181b" }}
      >
        <Scene data={data} />
      </Canvas>
    </div>
  );
}
