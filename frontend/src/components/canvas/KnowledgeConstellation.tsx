import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

import type { AppState } from '../../types';

interface KnowledgeConstellationProps {
  appState: AppState;
}

export default function KnowledgeConstellation({ appState }: KnowledgeConstellationProps) {
  const group = useRef<THREE.Group>(null);
  
  // Shared geometry and material caching (huge performance boost)
  const sharedGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const sharedMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.8,
    wireframe: true
  }), []);

  // Generate fewer structured target positions for the nodes
  const nodes = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => {
      // Golden ratio for spiral distribution (Fibonacci sphere)
      const phi = Math.acos(-1 + (2 * i) / 25);
      const theta = Math.sqrt(25 * Math.PI) * phi;
      const radius = 8;
      
      const targetPos = new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      return {
        initialPos: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        targetPos,
        currentPos: new THREE.Vector3(),
        scale: Math.random() * 0.4 + 0.2, // Reduced size slightly
        speed: Math.random() * 0.2 + 0.1,
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    const isStructured = appState === 'results' || appState === 'dashboard';

    // Material emission interpolation
    if (appState === 'error') {
      sharedMaterial.color.set('#ef4444');
      sharedMaterial.emissive.set('#ef4444');
      sharedMaterial.emissiveIntensity = 1;
    } else if (appState === 'processing') {
      sharedMaterial.color.set('#ffffff');
      sharedMaterial.emissive.set('#60a5fa');
      sharedMaterial.emissiveIntensity = 2.5;
    } else if (appState === 'results') {
      sharedMaterial.color.set('#ffffff');
      sharedMaterial.emissive.set('#c084fc');
      sharedMaterial.emissiveIntensity = 1.5;
    } else if (appState === 'dashboard') {
      sharedMaterial.color.set('#ffffff');
      sharedMaterial.emissive.set('#818cf8'); // slightly lighter indigo
      sharedMaterial.emissiveIntensity = 1.5;
    } else { // upload
      sharedMaterial.color.set('#ffffff');
      sharedMaterial.emissive.set('#3b82f6');
      sharedMaterial.emissiveIntensity = 1.5;
    }

    // Rotation logic
    if (appState === 'upload') {
      group.current.rotation.y = state.clock.elapsedTime * 0.05;
      group.current.rotation.x = state.clock.elapsedTime * 0.02;
    } else if (appState === 'processing') {
      // Spin faster during processing
      group.current.rotation.y += delta * 0.4;
      group.current.rotation.x += delta * 0.15;
    } else if (isStructured) {
      // Slow, calming rotation for results and dashboard
      group.current.rotation.y += delta * 0.02;
      group.current.rotation.x += delta * 0.01;
    }

    // Position interpolation based on state
    nodes.forEach((node, i) => {
      // +3 offset is due to the 3 lighting elements added dynamically in the group
      if (!group.current!.children[3 + i]) return; 
      
      const floatGroup = group.current!.children[3 + i].children[0];
      if (!floatGroup) return;

      const mesh = floatGroup as THREE.Mesh;

      // Keep it chaotic during processing, structure it once generated
      const target = isStructured ? node.targetPos : node.initialPos;
      
      // Speed of interpolation
      const lerpFactor = isStructured ? 1.5 : 0.5;

      mesh.position.lerp(target, delta * lerpFactor);
    });
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 10]} intensity={2} color="#60a5fa" />
      <directionalLight position={[-10, -10, -10]} intensity={1.5} color="#c084fc" />
      
      {nodes.map((node, i) => (
        <Float key={i} speed={appState === 'results' ? 0.5 : node.speed} rotationIntensity={appState === 'results' ? 0.2 : 1} floatIntensity={appState === 'results' ? 0.5 : 2}>
          <mesh 
            position={node.initialPos} 
            scale={node.scale}
            geometry={sharedGeometry}
            material={sharedMaterial}
          />
        </Float>
      ))}
    </group>
  );
}
