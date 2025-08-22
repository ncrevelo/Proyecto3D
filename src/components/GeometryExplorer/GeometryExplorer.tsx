import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, (width || 800) / (height || 600), 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width || 800, height || 600)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (mountRef.current?.contains(renderer.domElement)) mountRef.current.removeChild(renderer.domElement)
      renderer.dispose()
      scene.clear()
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}

export default GeometryExplorer
