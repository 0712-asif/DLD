import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Gate definitions ───

const GATE_TYPES = {
  AND:  { inputs: 2, fn: (a,b) => a & b, color: '#6366f1' },
  OR:   { inputs: 2, fn: (a,b) => a | b, color: '#3b82f6' },
  NOT:  { inputs: 1, fn: (a) => a ? 0 : 1, color: '#f59e0b' },
  NAND: { inputs: 2, fn: (a,b) => (a & b) ? 0 : 1, color: '#ef4444' },
  NOR:  { inputs: 2, fn: (a,b) => (a | b) ? 0 : 1, color: '#ec4899' },
  XOR:  { inputs: 2, fn: (a,b) => a ^ b, color: '#22c55e' },
  XNOR: { inputs: 2, fn: (a,b) => (a ^ b) ? 0 : 1, color: '#a855f7' },
}

let nextId = 1

// ─── Canvas Gate component ───

function CanvasGate({ gate, onDragEnd, onRemove, onPortClick, portValues }) {
  const def = GATE_TYPES[gate.type]
  const inputCount = def.inputs
  const output = portValues?.output

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => onDragEnd(gate.id, gate.x + info.offset.x, gate.y + info.offset.y)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{ left: gate.x, top: gate.y }}
    >
      <div className="relative glass-card p-0 group" style={{ borderColor: def.color + '40' }}>
        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(gate.id) }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >×</button>

        {/* Input ports */}
        <div className="absolute -left-3 top-0 bottom-0 flex flex-col justify-center gap-3">
          {Array.from({ length: inputCount }, (_, i) => (
            <button key={i} onClick={() => onPortClick(gate.id, 'input', i)}
              className="w-5 h-5 rounded-full border-2 transition-all hover:scale-125"
              style={{
                borderColor: def.color,
                background: portValues?.inputs?.[i] ? def.color : '#111118',
              }}
              title={`Input ${i === 0 ? 'A' : 'B'}`}
            />
          ))}
        </div>

        {/* Gate body */}
        <div className="px-6 py-4 flex flex-col items-center min-w-[80px]">
          <svg width="50" height="36" viewBox="0 0 50 36">
            <rect x="2" y="2" width="46" height="32" rx="6" fill={def.color + '15'} stroke={def.color} strokeWidth="1.5" />
            <text x="25" y="22" textAnchor="middle" fill={def.color} fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">{gate.type}</text>
          </svg>
          <span className="text-[9px] font-mono text-gray-600 mt-1">ID: {gate.id}</span>
        </div>

        {/* Output port */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2">
          <button onClick={() => onPortClick(gate.id, 'output', 0)}
            className="w-5 h-5 rounded-full border-2 transition-all hover:scale-125"
            style={{
              borderColor: def.color,
              background: output ? '#22c55e' : '#111118',
              boxShadow: output ? '0 0 8px rgba(34,197,94,0.5)' : 'none',
            }}
            title="Output"
          />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Simulation engine ───

function simulate(gates, wires, inputSources) {
  const values = {}

  // Set input source values
  inputSources.forEach(src => {
    values['src_' + src.id] = src.value
  })

  // Topological sort and evaluate
  const evaluated = new Set()
  const inProgress = new Set() // cycle detection
  const gateValues = {}

  function evalGate(gateId) {
    if (evaluated.has(gateId)) return gateValues[gateId]
    if (inProgress.has(gateId)) return { inputs: [0, 0], output: 0 } // break cycle

    inProgress.add(gateId)
    const gate = gates.find(g => g.id === gateId)
    if (!gate) { inProgress.delete(gateId); return { inputs: [0, 0], output: 0 } }

    const def = GATE_TYPES[gate.type]
    const inputs = []

    for (let i = 0; i < def.inputs; i++) {
      const wire = wires.find(w => w.toGate === gateId && w.toPort === i)
      if (wire) {
        if (wire.fromType === 'source') {
          inputs.push(values['src_' + wire.fromId] || 0)
        } else {
          const srcResult = evalGate(wire.fromId)
          inputs.push(srcResult?.output || 0)
        }
      } else {
        inputs.push(0)
      }
    }

    const output = def.fn(...inputs)
    const result = { inputs, output }
    gateValues[gateId] = result
    evaluated.add(gateId)
    inProgress.delete(gateId)
    return result
  }

  gates.forEach(g => evalGate(g.id))
  return gateValues
}

// ─── Main Component ───

export default function Module11() {
  const [gates, setGates] = useState([])
  const [wires, setWires] = useState([])
  const [inputSources, setInputSources] = useState([
    { id: 1, label: 'A', value: 0, x: 20, y: 100 },
    { id: 2, label: 'B', value: 0, x: 20, y: 250 },
  ])
  const [connecting, setConnecting] = useState(null) // { fromId, fromType, portIdx }
  const canvasRef = useRef(null)

  // Simulate
  const gateValues = useMemo(() => simulate(gates, wires, inputSources), [gates, wires, inputSources])

  // Add gate from palette
  const handleDrop = useCallback((type) => {
    const id = nextId++
    setGates(prev => [...prev, { id, type, x: 200 + Math.random() * 200, y: 80 + Math.random() * 200 }])
  }, [])

  const handleDragEnd = useCallback((id, x, y) => {
    setGates(prev => prev.map(g => g.id === id ? { ...g, x: Math.max(0, x), y: Math.max(0, y) } : g))
  }, [])

  const handleRemove = useCallback((id) => {
    setGates(prev => prev.filter(g => g.id !== id))
    setWires(prev => prev.filter(w => w.toGate !== id && (w.fromType !== 'gate' || w.fromId !== id)))
  }, [])

  // Port clicking for wire connections
  const handlePortClick = useCallback((gateId, portType, portIdx) => {
    if (!connecting) {
      if (portType === 'output') {
        setConnecting({ fromId: gateId, fromType: 'gate', portIdx })
      }
    } else {
      if (portType === 'input') {
        // Remove existing wire to this input
        setWires(prev => {
          const filtered = prev.filter(w => !(w.toGate === gateId && w.toPort === portIdx))
          return [...filtered, {
            fromId: connecting.fromId,
            fromType: connecting.fromType,
            toGate: gateId,
            toPort: portIdx,
          }]
        })
      }
      setConnecting(null)
    }
  }, [connecting])

  const handleSourceClick = useCallback((srcId) => {
    if (!connecting) {
      setConnecting({ fromId: srcId, fromType: 'source', portIdx: 0 })
    } else {
      setConnecting(null)
    }
  }, [connecting])

  const toggleSource = (srcId) => {
    setInputSources(prev => prev.map(s => s.id === srcId ? { ...s, value: s.value ? 0 : 1 } : s))
  }

  const clearAll = () => {
    setGates([])
    setWires([])
    setConnecting(null)
    nextId = 1
  }

  // Find output wire result
  const outputValue = useMemo(() => {
    if (gates.length === 0) return null
    const lastGate = gates[gates.length - 1]
    return gateValues[lastGate.id]?.output ?? null
  }, [gates, gateValues])

  return (
    <div>
      <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight">Drag & Drop Circuit Builder</h2>
        <p className="text-sm text-gray-500 mt-1">Module 11 — Design circuits by placing gates and connecting wires</p>
      </motion.div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Gate Palette */}
        <motion.aside className="glass-card p-5" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">Gate Palette</h3>
          <div className="space-y-2">
            {Object.entries(GATE_TYPES).map(([type, def]) => (
              <button key={type} onClick={() => handleDrop(type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 border border-transparent hover:border-gray-700 group">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: def.color + '15', border: '1px solid ' + def.color + '40' }}>
                  <span className="text-[10px] font-mono font-bold" style={{ color: def.color }}>{type.slice(0, 2)}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-mono text-gray-300">{type}</p>
                  <p className="text-[10px] text-gray-600">{def.inputs} input{def.inputs > 1 ? 's' : ''}</p>
                </div>
                <span className="ml-auto text-gray-700 group-hover:text-gray-400 text-lg">+</span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-800/50 mt-4 pt-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Input Sources</h3>
            {inputSources.map(src => (
              <div key={src.id} className="flex items-center gap-3 mb-2">
                <button onClick={() => handleSourceClick(src.id)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center border-2 font-mono text-sm font-bold transition-all ${
                    connecting?.fromId === src.id && connecting?.fromType === 'source'
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                  }`}>
                  {src.label}
                </button>
                <label className="toggle-switch" style={{ transform: 'scale(0.75)' }}>
                  <input type="checkbox" checked={src.value === 1} onChange={() => toggleSource(src.id)} />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`text-xs font-mono font-bold ${src.value ? 'text-green-400' : 'text-red-400'}`}>{src.value}</span>
              </div>
            ))}
          </div>

          <button onClick={clearAll}
            className="w-full mt-4 px-3 py-2 rounded-lg text-xs font-mono bg-red-950/30 text-red-400 border border-red-900/30 hover:bg-red-950/50 transition-all">
            Clear All
          </button>
        </motion.aside>

        {/* Canvas */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div ref={canvasRef} className="drop-canvas relative" style={{ minHeight: '500px' }}>
            {/* Connection mode indicator */}
            {connecting && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-mono animate-pulse">
                Click an input port to connect · ESC to cancel
              </div>
            )}

            {/* Gates on canvas */}
            <AnimatePresence>
              {gates.map(gate => (
                <CanvasGate
                  key={gate.id}
                  gate={gate}
                  onDragEnd={handleDragEnd}
                  onRemove={handleRemove}
                  onPortClick={handlePortClick}
                  portValues={gateValues[gate.id]}
                />
              ))}
            </AnimatePresence>

            {/* Wire list */}
            {wires.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {wires.map((w, i) => {
                  const fromGate = w.fromType === 'gate' ? gates.find(g => g.id === w.fromId) : null
                  const toGate = gates.find(g => g.id === w.toGate)
                  if (!toGate) return null

                  const x1 = fromGate ? fromGate.x + 90 : 60
                  const y1 = fromGate ? fromGate.y + 35 : (inputSources.find(s => s.id === w.fromId)?.y || 100) + 15
                  const x2 = toGate.x - 3
                  const inputDef = GATE_TYPES[toGate.type]
                  const portCount = inputDef.inputs
                  const portSpacing = 60 / (portCount + 1)
                  const y2 = toGate.y + portSpacing * (w.toPort + 1)

                  const active = w.fromType === 'source'
                    ? inputSources.find(s => s.id === w.fromId)?.value
                    : gateValues[w.fromId]?.output

                  return (
                    <path key={i}
                      d={`M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`}
                      fill="none"
                      stroke={active ? '#22c55e' : '#334155'}
                      strokeWidth={active ? 2.5 : 1.5}
                      opacity={active ? 1 : 0.5}
                      style={active ? { filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.4))' } : {}}
                    />
                  )
                })}
              </svg>
            )}

            {/* Empty state */}
            {gates.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="2" y="6" width="8" height="12" rx="1" />
                      <path d="M10 9h4M10 15h4" />
                      <rect x="14" y="9" width="8" height="6" rx="1" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Click gates from the palette to add them</p>
                  <p className="text-gray-600 text-xs mt-1">Then connect output → input ports</p>
                </div>
              </div>
            )}
          </div>

          {/* Output indicator */}
          <motion.div className="mt-4 glass-card p-4 flex items-center justify-between"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Circuit Status</span>
              <p className="text-sm text-gray-400 mt-1">{gates.length} gate{gates.length !== 1 ? 's' : ''} · {wires.length} wire{wires.length !== 1 ? 's' : ''}</p>
            </div>
            {outputValue !== null && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500">Output:</span>
                <div className={`led ${outputValue ? 'led-on glow-green' : 'led-off'}`} style={{ width: 28, height: 28 }}></div>
                <span className={`font-mono font-bold ${outputValue ? 'text-green-400' : 'text-red-400'}`}>{outputValue}</span>
              </div>
            )}
          </motion.div>

          {/* Instructions */}
          <motion.div className="mt-4 glass-card p-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">How to Use</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-800/50">
                <div className="text-indigo-400 font-mono text-sm font-bold mb-1">1. Add Gates</div>
                <p className="text-xs text-gray-500">Click gates from the palette to place them on the canvas.</p>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-800/50">
                <div className="text-indigo-400 font-mono text-sm font-bold mb-1">2. Connect Wires</div>
                <p className="text-xs text-gray-500">Click an input source or output port, then click an input port on another gate.</p>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-800/50">
                <div className="text-indigo-400 font-mono text-sm font-bold mb-1">3. Toggle Inputs</div>
                <p className="text-xs text-gray-500">Use the switches in the palette to toggle input values and see real-time output.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
