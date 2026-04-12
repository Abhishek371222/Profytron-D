'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Float, Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const GlobePoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions] = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      pos[i * 3] = 2.05 * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = 2.05 * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = 2.05 * Math.cos(phi);
    }
    return [pos];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
      pointsRef.current.scale.set(s, s, s);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#6366f1" 
        size={0.025} 
        transparent 
        opacity={0.4} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const DataArc = ({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) => {
  const curve = useMemo(() => {
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(2.6);
    return new THREE.CatmullRomCurve3([start, mid, end]);
  }, [start, end]);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.003, 8, false]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.1} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.005, 8, false]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const GlobeCore = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  const hubs = useMemo(() => [
    new THREE.Vector3(2.05, 0.5, 0),
    new THREE.Vector3(1.3, 1.6, 0.5),
    new THREE.Vector3(-1.8, 0.8, 0.8),
    new THREE.Vector3(0, -2.05, 0),
    new THREE.Vector3(-1.2, -1.2, 1.2),
  ], []);

  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0015;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y -= 0.0005;
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#020617"
          roughness={0.4}
          metalness={0.8}
          emissive="#1e1b4b"
          emissiveIntensity={2}
        />
      </Sphere>

      <Sphere args={[2.02, 64, 64]}>
        <MeshDistortMaterial
          color="#6366f1"
          transparent
          opacity={0.1}
          distort={0.1}
          speed={2}
          roughness={0}
          metalness={1}
        />
      </Sphere>

      <GlobePoints />
      
      {hubs.map((pos, i) => (
        <group key={i}>
          <mesh position={pos}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#818cf8" blending={THREE.AdditiveBlending} />
            <pointLight distance={1} intensity={2} color="#818cf8" />
          </mesh>
          {hubs[i+1] && <DataArc start={pos} end={hubs[i+1]} />}
        </group>
      ))}
      
      <Sphere ref={atmosphereRef} args={[2.4, 64, 64]}>
        <meshBasicMaterial 
          color="#6366f1" 
          transparent 
          opacity={0.03} 
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
};

export default function GlobeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#818cf8" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#6366f1" />
      
      <Stars 
        radius={50} 
        depth={50} 
        count={2000} 
        factor={4} 
        saturation={1} 
        fade 
        speed={0.5} 
      />
      
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <GlobeCore />
      </Float>
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}
