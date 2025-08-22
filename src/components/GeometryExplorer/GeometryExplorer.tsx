import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  // Estados persistentes
  const [wireframe, setWireframe] = useState<boolean>(() => {
    return localStorage.getItem("wireframe") === "true"
  })
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem("autoRotate") !== "false"
  })
  const [selected, setSelected] = useState<string>('cube')

  // Refs espejo
  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  // Catálogo de geometrías tipado
  const geometries: Record<string, {
    name: string
    category: string
    description: string
    create: () => THREE.BufferGeometry
    color: string
  }> = useMemo(() => ({
    cube: {
      name: 'Cubo',
      category: 'Primitivas',
      description: 'Un cubo de 6 caras',
      create: () => new THREE.BoxGeometry(1.5, 1.5, 1.5),
      color: '#44aa88'
    },
    sphere: {
      name: 'Esfera',
      category: 'Primitivas',
      description: 'Esfera básica',
      create: () => new THREE.SphereGeometry(1, 32, 16),
      color: '#FF6B6B'
    },
    cone: {
      name: 'Cono',
      category: 'Primitivas',
      description: 'Cono circular',
      create: () => new THREE.ConeGeometry(1, 2, 32),
      color: '#FFD93D'
    },
    cylinder: {
      name: 'Cilindro',
      category: 'Primitivas',
      description: 'Cilindro circular',
      create: () => new THREE.CylinderGeometry(1, 1, 2, 32),
      color: '#6C63FF'
    },
    torus: {
      name: 'Dona',
      category: 'Primitivas',
      description: 'Donut 3D',
      create: () => new THREE.TorusGeometry(1, 0.4, 16, 100),
      color: '#00C9A7'
    },
    tetra: {
      name: 'Tetraedro',
      category: 'Poliedros',
      description: 'Poliedro con 4 caras triangulares',
      create: () => new THREE.TetrahedronGeometry(1.2),
      color: '#FF8C42'
    },
    octa: {
      name: 'Octaedro',
      category: 'Poliedros',
      description: 'Poliedro con 8 caras',
      create: () => new THREE.OctahedronGeometry(1.2),
      color: '#3ABEFF'
    },
    icosa: {
      name: 'Icosaedro',
      category: 'Poliedros',
      description: 'Poliedro con 20 caras',
      create: () => new THREE.IcosahedronGeometry(1.2),
      color: '#9D4EDD'
    }
  }), [])

  // Sync React -> Ref + localStorage
  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
  }, [autoRotate])

  // Inicialización de la escena
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Luces
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Helpers
    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    // Función para crear la malla
    const createMesh = (key: string) => {
      const def = geometries[key]
      if (!def) return null
      const geometry = def.create()
      const material = new THREE.MeshPhongMaterial({ color: def.color, wireframe: wireframeRef.current })
      const mesh = new THREE.Mesh(geometry, material)
      return { mesh, geometry, material }
    }

    // Crear geometría inicial
    const created = createMesh(selected)
    if (!created) return
    const { mesh, geometry, material } = created
    currentMeshRef.current = mesh
    scene.add(mesh)

    // Animación
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [geometries, selected])

  // Wireframe dinámico
  useEffect(() => {
    const cube = currentMeshRef.current
    if (!cube) return
    const mat = cube.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', display: 'flex' }}>
      {/* Panel lateral */}
      <div style={{ width: 200, background: '#1a1a1a', color: 'white', padding: 12, overflowY: 'auto' }}>
        <h3>📐 Geometrías</h3>
        {Object.entries(geometries).map(([key, def]) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            style={{
              display: 'block',
              width: '100%',
              margin: '6px 0',
              padding: '6px',
              background: selected === key ? '#333' : '#222',
              color: 'white',
              border: '1px solid #444',
              cursor: 'pointer'
            }}
          >
            {def.name}
          </button>
        ))}
      </div>

      {/* Canvas Three.js */}
      <div ref={mountRef} style={{ flex: 1, height: '100%' }} />

      {/* Controles UI */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8 }}>
        <button onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>
    </div>
  )
}
