import { useState, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, RoundedBox, Float, Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// ─── 3D Gate Component ───

function Gate3D({ position, type, active, onClick, color }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2
      if (hovered) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1)
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      }
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position} ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Gate body */}
        <RoundedBox args={[1.6, 1, 0.5]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color={active ? color : '#334155'}
            emissive={active ? color : '#1d4ed8'}
            emissiveIntensity={active ? 0.45 : 0.1}
            metalness={0.15}
            roughness={0.25}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
            transparent
            opacity={0.95}
          />
        </RoundedBox>

        {/* Gate label */}
        <Text position={[0, 0, 0.3]} fontSize={0.3} color={active ? '#ffffff' : '#6366f1'}
          font={undefined} anchorX="center" anchorY="middle">
          {type}
        </Text>

        {/* LED indicator on top */}
        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={active ? '#22c55e' : '#7f1d1d'}
            emissive={active ? '#22c55e' : '#000000'}
            emissiveIntensity={active ? 1 : 0}
          />
        </mesh>

        {/* Input port spheres */}
        <mesh position={[-0.95, 0.2, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-0.95, -0.2, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.3} />
        </mesh>

        {/* Output port */}
        <mesh position={[0.95, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color={active ? '#22c55e' : '#ef4444'}
            emissive={active ? '#22c55e' : '#ef4444'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </Float>
  )
}

// ─── 3D Wire ───

function Wire3D({ start, end, active }) {
  const points = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(start[0] + 1, start[1], start[2]),
      new THREE.Vector3(end[0] - 1, end[1], end[2]),
      new THREE.Vector3(...end)
    )
    return curve.getPoints(30)
  }, [start, end])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={active ? '#22c55e' : '#334155'} linewidth={2} />
    </line>
  )
}

// ─── Grid Floor ───

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial
        color="#0f172a"
        metalness={0.2}
        roughness={0.8}
        transparent
        opacity={0.98}
      />
    </mesh>
  )
}

// ─── Scene ───

function Scene({ gates, selectedGate, onGateClick }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight skyColor="#93c5fd" groundColor="#1f2937" intensity={0.55} />
      <directionalLight position={[8, 10, 6]} intensity={1.05} color="#bfdbfe" />
      <pointLight position={[5, 8, 5]} intensity={1.1} color="#818cf8" />
      <pointLight position={[-5, 6, -5]} intensity={0.9} color="#22c55e" />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={0.7} color="#6366f1" />
      <Environment preset="city" />

      <GridFloor />

      {gates.map((gate, i) => (
        <Gate3D
          key={gate.id}
          position={gate.pos}
          type={gate.type}
          active={gate.active}
          color={gate.color}
          onClick={() => onGateClick(gate.id)}
        />
      ))}

      {/* Wires between sequential gates */}
      {gates.slice(1).map((gate, i) => (
        <Wire3D
          key={'w' + i}
          start={[gates[i].pos[0] + 0.95, gates[i].pos[1], gates[i].pos[2]]}
          end={[gate.pos[0] - 0.95, gate.pos[1], gate.pos[2]]}
          active={gates[i].active}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

// ─── Gate logic ───

const GATE_FNS = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  NOT: (a) => a ? 0 : 1,
  NAND: (a, b) => (a & b) ? 0 : 1,
  NOR: (a, b) => (a | b) ? 0 : 1,
  XOR: (a, b) => a ^ b,
}

const GATE_COLORS = {
  AND: '#6366f1', OR: '#3b82f6', NOT: '#f59e0b',
  NAND: '#ef4444', NOR: '#ec4899', XOR: '#22c55e',
}

// ─── Main Component ───

export default function Module12() {
  const [inputA, setInputA] = useState(0)
  const [inputB, setInputB] = useState(0)
  const [circuitType, setCircuitType] = useState('AND')
  const [selectedGate, setSelectedGate] = useState(null)

  const presets = [
    { label: 'Single AND', type: 'AND', chain: ['AND'] },
    { label: 'Single OR', type: 'OR', chain: ['OR'] },
    { label: 'NOT Gate', type: 'NOT', chain: ['NOT'] },
    { label: 'NAND → NOT', type: 'NAND→NOT', chain: ['NAND', 'NOT'] },
    { label: 'OR → AND', type: 'OR→AND', chain: ['OR', 'AND'] },
    { label: 'XOR Gate', type: 'XOR', chain: ['XOR'] },
  ]

  const [activePreset, setActivePreset] = useState(presets[0])

  const gates3D = useMemo(() => {
    const chain = activePreset.chain
    let prevOutput = null

    return chain.map((type, i) => {
      const fn = GATE_FNS[type]
      let active = false

      if (i === 0) {
        active = !!fn(inputA, inputB)
        prevOutput = active ? 1 : 0
      } else {
        active = !!fn(prevOutput, inputB)
        prevOutput = active ? 1 : 0
      }

      return {
        id: i,
        type,
        pos: [i * 3 - (chain.length - 1) * 1.5, 0, 0],
        active,
        color: GATE_COLORS[type],
      }
    })
  }, [activePreset, inputA, inputB])

  const finalOutput = gates3D.length > 0 ? gates3D[gates3D.length - 1].active : false

  return (
    <div>
      <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight">3D Circuit Visualization</h2>
        <p className="text-sm text-gray-500 mt-1">Module 12 — Explore logic gates in interactive 3D space</p>
      </motion.div>

      {/* 3D Canvas */}
      <motion.div className="canvas-3d mb-6" style={{ height: '420px', background: '#050508' }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Canvas camera={{ position: [0, 3, 7], fov: 50 }} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <Scene gates={gates3D} selectedGate={selectedGate} onGateClick={setSelectedGate} />
          </Suspense>
        </Canvas>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <motion.div className="glass-card p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">Circuit Preset</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {presets.map(p => (
              <button key={p.type} onClick={() => setActivePreset(p)}
                className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                  activePreset.type === p.type
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-600'
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Inputs</h3>
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-mono text-indigo-400 font-bold">A</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={inputA === 1} onChange={() => setInputA(v => v ? 0 : 1)} />
                <span className="toggle-slider"></span>
              </label>
              <span className={`text-sm font-mono font-bold ${inputA ? 'text-green-400' : 'text-red-400'}`}>{inputA}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-mono text-indigo-400 font-bold">B</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={inputB === 1} onChange={() => setInputB(v => v ? 0 : 1)} />
                <span className="toggle-slider"></span>
              </label>
              <span className={`text-sm font-mono font-bold ${inputB ? 'text-green-400' : 'text-red-400'}`}>{inputB}</span>
            </div>
          </div>
        </motion.div>

        {/* Output + Info */}
        <motion.div className="glass-card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">Output</h3>
          <div className="flex items-center gap-6 mb-6">
            <div className={`led ${finalOutput ? 'led-on glow-green' : 'led-off'}`} style={{ width: 48, height: 48 }}></div>
            <div>
              <p className={`text-3xl font-mono font-bold ${finalOutput ? 'text-green-400' : 'text-red-400'}`}>{finalOutput ? 1 : 0}</p>
              <p className="text-xs text-gray-500 mt-1">Circuit output</p>
            </div>
          </div>

          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">3D Controls</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-20 text-gray-600 font-mono">Rotate</span>
              <span>Left-click + drag</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-20 text-gray-600 font-mono">Zoom</span>
              <span>Mouse wheel / pinch</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-20 text-gray-600 font-mono">Pan</span>
              <span>Right-click + drag</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-20 text-gray-600 font-mono">Click</span>
              <span>Click a gate to select</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chain display */}
      <motion.div className="mt-6 glass-card p-5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3 text-center">Signal Path</h3>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            A={inputA}, B={inputB}
          </div>
          {gates3D.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-600">→</span>
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono border"
                style={{ background: g.color + '10', borderColor: g.color + '30', color: g.color }}>
                {g.type} = {g.active ? 1 : 0}
              </div>
            </div>
          ))}
          <span className="text-gray-600">→</span>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
            finalOutput ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            Output = {finalOutput ? 1 : 0}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
