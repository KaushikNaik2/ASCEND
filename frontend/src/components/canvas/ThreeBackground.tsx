import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import KnowledgeConstellation from './KnowledgeConstellation'
import type { AppState } from '../../types'

interface ThreeBackgroundProps {
    appState: AppState;
}

/**
 * Extracted 3D background component.
 * Lazy-loaded and wrapped in an error boundary by App.tsx
 * so that failures here never kill the page.
 */
export default function ThreeBackground({ appState }: ThreeBackgroundProps) {
    return (
        <div className="fixed inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                <color attach="background" args={['#0f172a']} />
                <KnowledgeConstellation appState={appState} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 3}
                />
            </Canvas>
        </div>
    )
}
