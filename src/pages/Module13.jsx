import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Circuit definitions ───

const CIRCUITS = {
  'AND-OR': {
    name: 'AND-OR Circuit',
    description: 'F = (A·B) + (C·D)',
    inputs: ['A', 'B', 'C', 'D'],
    gates: [
      { id: 'g1', type: 'AND', label: 'AND₁', inputVars: ['A', 'B'], x: 180, y: 60 },
      { id: 'g2', type: 'AND', label: 'AND₂', inputVars: ['C', 'D'], x: 180, y: 180 },
      { id: 'g3', type: 'OR', label: 'OR', inputFrom: ['g1', 'g2'], x: 360, y: 120 },
    ],
    evaluate: (A, B, C, D) => [
      { id: 'g1', inputs: [A, B], output: A & B },
      { id: 'g2', inputs: [C, D], output: C & D },
      { id: 'g3', inputs: [A & B, C & D], output: (A & B) | (C & D) },
    ],
  },
  'NAND-CHAIN': {
    name: 'NAND Chain (AND from NANDs)',
    description: 'F = ((A NAND B) NAND (A NAND B)) = A·B',
    inputs: ['A', 'B'],
    gates: [
      { id: 'g1', type: 'NAND', label: 'NAND₁', inputVars: ['A', 'B'], x: 180, y: 100 },
      { id: 'g2', type: 'NAND', label: 'NAND₂', inputFrom: ['g1', 'g1'], x: 360, y: 100 },
    ],
    evaluate: (A, B) => {
      const nand1 = (A & B) ? 0 : 1
      return [
        { id: 'g1', inputs: [A, B], output: nand1 },
        { id: 'g2', inputs: [nand1, nand1], output: nand1 ? 0 : 1 },
      ]
    },
  },
  'XOR-BUILD': {
    name: 'XOR from Basic Gates',
    description: "F = A'B + AB' = A ⊕ B",
    inputs: ['A', 'B'],
    gates: [
      { id: 'g1', type: 'NOT', label: "NOT_A", inputVars: ['A'], x: 140, y: 40 },
      { id: 'g2', type: 'NOT', label: "NOT_B", inputVars: ['B'], x: 140, y: 180 },
      { id: 'g3', type: 'AND', label: "AND₁", inputFrom: ['g1'], inputVars: ['B'], x: 280, y: 70 },
      { id: 'g4', type: 'AND', label: "AND₂", inputVars: ['A'], inputFrom: ['g2'], x: 280, y: 160 },
      { id: 'g5', type: 'OR', label: 'OR', inputFrom: ['g3', 'g4'], x: 420, y: 115 },
    ],
    evaluate: (A, B) => {
      const notA = A ? 0 : 1
      const notB = B ? 0 : 1
      return [
        { id: 'g1', inputs: [A], output: notA },
        { id: 'g2', inputs: [B], output: notB },
        { id: 'g3', inputs: [notA, B], output: notA & B },
        { id: 'g4', inputs: [A, notB], output: A & notB },
        { id: 'g5', inputs: [notA & B, A & notB], output: (notA & B) | (A & notB) },
      ]
    },
  },
}

const GATE_COLORS = {
  AND: '#6366f1', OR: '#3b82f6', NOT: '#f59e0b',
  NAND: '#ef4444', NOR: '#ec4899', XOR: '#22c55e',
}

// ─── Main Component ───

export default function Module13() {
  const [circuit, setCircuit] = useState('AND-OR')
  const [inputs, setInputs] = useState({ A: 0, B: 0, C: 0, D: 0 })
  const [currentStep, setCurrentStep] = useState(-1) // -1 = not started
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1000) // ms per step
  const intervalRef = useRef(null)

  const circuitDef = CIRCUITS[circuit]
  const inputValues = circuitDef.inputs.map(v => inputs[v])
  const evaluation = circuitDef.evaluate(...inputValues)
  const totalSteps = evaluation.length

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, totalSteps])

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) setCurrentStep(-1)
    setIsPlaying(true)
  }
  const handlePause = () => setIsPlaying(false)
  const handleStepForward = () => {
    setIsPlaying(false)
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
  }
  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(-1)
  }

  const toggleInput = (v) => {
    handleReset()
    setInputs(prev => ({ ...prev, [v]: prev[v] ? 0 : 1 }))
  }

  const progress = currentStep >= 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  return (
    <div>
      <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight">Step-by-Step Simulation</h2>
        <p className="text-sm text-gray-500 mt-1">Module 13 — Watch signal propagation through circuits gate by gate</p>
      </motion.div>

      {/* Circuit selector */}
      <motion.section className="glass-card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Select Circuit</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CIRCUITS).map(([key, c]) => (
            <button key={key} onClick={() => { setCircuit(key); handleReset() }}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                circuit === key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-600'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-3 font-mono">{circuitDef.description}</p>
      </motion.section>

      {/* Inputs */}
      <motion.section className="glass-card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">Inputs</h3>
        <div className="flex gap-6 flex-wrap">
          {circuitDef.inputs.map(v => (
            <div key={v} className="flex flex-col items-center gap-2">
              <span className="text-sm font-mono text-indigo-400 font-bold">{v}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={inputs[v] === 1} onChange={() => toggleInput(v)} />
                <span className="toggle-slider"></span>
              </label>
              <span className={`text-sm font-mono font-bold ${inputs[v] ? 'text-green-400' : 'text-red-400'}`}>{inputs[v]}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Timeline Controls */}
      <motion.section className="glass-card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4">Simulation Controls</h3>

        {/* Progress bar */}
        <div className="timeline-track mb-4">
          <div className="timeline-progress" style={{ width: progress + '%' }} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleReset}
            className="px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white text-sm font-mono transition-all">
            ⏮ Reset
          </button>
          {isPlaying ? (
            <button onClick={handlePause}
              className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-mono transition-all shadow-lg">
              ⏸ Pause
            </button>
          ) : (
            <button onClick={handlePlay}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-mono transition-all shadow-lg shadow-green-500/25">
              ▶ Play
            </button>
          )}
          <button onClick={handleStepForward}
            className="px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white text-sm font-mono transition-all">
            ⏭ Step
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">Speed:</span>
            {[2000, 1000, 500].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                  speed === s ? 'bg-indigo-600 text-white' : 'bg-gray-900/50 text-gray-500 border border-gray-800'
                }`}>
                {s === 2000 ? 'Slow' : s === 1000 ? 'Normal' : 'Fast'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 font-mono">
          Step {currentStep >= 0 ? currentStep + 1 : 0} / {totalSteps}
        </p>
      </motion.section>

      {/* Gate Evaluation Visualization */}
      <motion.section className="glass-card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4 text-center">Signal Propagation</h3>

        <div className="flex flex-wrap gap-4 justify-center">
          {evaluation.map((step, i) => {
            const gate = circuitDef.gates.find(g => g.id === step.id)
            const isEvaluated = i <= currentStep
            const isCurrent = i === currentStep
            const color = GATE_COLORS[gate.type] || '#6366f1'

            return (
              <motion.div key={step.id}
                className={`relative rounded-xl p-4 border-2 min-w-[140px] transition-all duration-500 ${
                  isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#050508]' : ''
                }`}
                style={{
                  background: isEvaluated ? color + '10' : 'rgba(15,15,25,0.5)',
                  borderColor: isEvaluated ? color : '#1e1e2e',
                  ringColor: isCurrent ? color : undefined,
                }}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatType: 'reverse' }}
              >
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: isEvaluated ? color : '#1e1e2e', color: isEvaluated ? '#fff' : '#666' }}>
                  {i + 1}
                </div>

                <div className="text-center">
                  <p className="text-xs font-mono font-bold mb-2" style={{ color: isEvaluated ? color : '#666' }}>
                    {gate.label}
                  </p>

                  {/* Inputs */}
                  <div className="flex gap-2 justify-center mb-2">
                    {step.inputs.map((inp, ii) => (
                      <span key={ii} className={`px-2 py-0.5 rounded text-xs font-mono ${
                        isEvaluated
                          ? inp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          : 'bg-gray-800 text-gray-600'
                      }`}>
                        {isEvaluated ? inp : '?'}
                      </span>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-600 text-xs mb-1">↓</div>

                  {/* Output */}
                  <div className={`px-3 py-1 rounded-lg text-sm font-mono font-bold ${
                    isEvaluated
                      ? step.output ? 'bg-green-500/20 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-red-500/20 text-red-400'
                      : 'bg-gray-800 text-gray-600'
                  }`}>
                    {isEvaluated ? step.output : '?'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Final output */}
        <AnimatePresence>
          {currentStep >= totalSteps - 1 && (
            <motion.div className="mt-6 text-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${
                evaluation[totalSteps - 1].output
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className={`led ${evaluation[totalSteps - 1].output ? 'led-on glow-green' : 'led-off'}`} style={{ width: 24, height: 24 }}></div>
                <span className={`font-mono font-bold text-lg ${
                  evaluation[totalSteps - 1].output ? 'text-green-400' : 'text-red-400'
                }`}>
                  Final Output: {evaluation[totalSteps - 1].output}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Step details */}
      <motion.section className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4 text-center">Step Details Log</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {evaluation.map((step, i) => {
            const gate = circuitDef.gates.find(g => g.id === step.id)
            const isEvaluated = i <= currentStep
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isEvaluated ? 'bg-gray-900/50 border border-gray-800' : 'opacity-30'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                  isEvaluated ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-600'
                }`}>{i + 1}</span>
                <span className="text-sm font-mono text-gray-300 flex-1">
                  {gate.label}: ({step.inputs.join(', ')}) → <strong className={step.output ? 'text-green-400' : 'text-red-400'}>{isEvaluated ? step.output : '?'}</strong>
                </span>
                {isEvaluated && <span className="text-green-400 text-xs">✓</span>}
              </div>
            )
          })}
        </div>
      </motion.section>
    </div>
  )
}
