import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Gate Logic ───
const NAND = (a, b) => (a & b) ? 0 : 1
const NOR  = (a, b) => (a | b) ? 0 : 1

// NAND-only implementations  
const nandImplementations = {
  NOT: (a) => NAND(a, a),
  AND: (a, b) => {
    const nab = NAND(a, b)
    return NAND(nab, nab)
  },
  OR: (a, b) => {
    const na = NAND(a, a)
    const nb = NAND(b, b)
    return NAND(na, nb)
  },
  XOR: (a, b) => {
    const nab = NAND(a, b)
    return NAND(NAND(a, nab), NAND(b, nab))
  },
}

// NOR-only implementations
const norImplementations = {
  NOT: (a) => NOR(a, a),
  AND: (a, b) => {
    const na = NOR(a, a)
    const nb = NOR(b, b)
    const r = NOR(na, nb)
    return NOR(r, r)
  },
  OR: (a, b) => {
    const nab = NOR(a, b)
    return NOR(nab, nab)
  },
  XOR: (a, b) => {
    const nor_ab = NOR(a, b)
    const n2 = NOR(a, nor_ab)
    const n3 = NOR(b, nor_ab)
    return NOR(n2, n3)
  },
}

const targetGates = ['NOT', 'AND', 'OR', 'XOR']

// ─── Step-by-step intermediate values for circuit diagrams ───
function getNandSteps(gate, a, b) {
  switch (gate) {
    case 'NOT': {
      const out = NAND(a, a)
      return { steps: [{ gate: 'NAND', inputs: [a, a], output: out, label: 'NAND(A,A)' }], output: out }
    }
    case 'AND': {
      const s1 = NAND(a, b)
      const out = NAND(s1, s1)
      return { steps: [
        { gate: 'NAND', inputs: [a, b], output: s1, label: 'NAND(A,B)' },
        { gate: 'NAND', inputs: [s1, s1], output: out, label: 'NAND(S1,S1)' },
      ], output: out }
    }
    case 'OR': {
      const s1 = NAND(a, a)
      const s2 = NAND(b, b)
      const out = NAND(s1, s2)
      return { steps: [
        { gate: 'NAND', inputs: [a, a], output: s1, label: 'NAND(A,A)' },
        { gate: 'NAND', inputs: [b, b], output: s2, label: 'NAND(B,B)' },
        { gate: 'NAND', inputs: [s1, s2], output: out, label: 'NAND(S1,S2)' },
      ], output: out }
    }
    case 'XOR': {
      const s1 = NAND(a, b)
      const s2 = NAND(a, s1)
      const s3 = NAND(b, s1)
      const out = NAND(s2, s3)
      return { steps: [
        { gate: 'NAND', inputs: [a, b], output: s1, label: 'NAND(A,B)' },
        { gate: 'NAND', inputs: [a, s1], output: s2, label: 'NAND(A,S1)' },
        { gate: 'NAND', inputs: [b, s1], output: s3, label: 'NAND(B,S1)' },
        { gate: 'NAND', inputs: [s2, s3], output: out, label: 'NAND(S2,S3)' },
      ], output: out }
    }
    default: return { steps: [], output: 0 }
  }
}

function getNorSteps(gate, a, b) {
  switch (gate) {
    case 'NOT': {
      const out = NOR(a, a)
      return { steps: [{ gate: 'NOR', inputs: [a, a], output: out, label: 'NOR(A,A)' }], output: out }
    }
    case 'AND': {
      const s1 = NOR(a, a)
      const s2 = NOR(b, b)
      const s3 = NOR(s1, s2)
      const out = NOR(s3, s3)
      return { steps: [
        { gate: 'NOR', inputs: [a, a], output: s1, label: 'NOR(A,A)' },
        { gate: 'NOR', inputs: [b, b], output: s2, label: 'NOR(B,B)' },
        { gate: 'NOR', inputs: [s1, s2], output: s3, label: 'NOR(S1,S2)' },
        { gate: 'NOR', inputs: [s3, s3], output: out, label: 'NOR(S3,S3)' },
      ], output: out }
    }
    case 'OR': {
      const s1 = NOR(a, b)
      const out = NOR(s1, s1)
      return { steps: [
        { gate: 'NOR', inputs: [a, b], output: s1, label: 'NOR(A,B)' },
        { gate: 'NOR', inputs: [s1, s1], output: out, label: 'NOR(S1,S1)' },
      ], output: out }
    }
    case 'XOR': {
      const s1 = NOR(a, b)
      const s2 = NOR(a, s1)
      const s3 = NOR(b, s1)
      const out = NOR(s2, s3)
      return { steps: [
        { gate: 'NOR', inputs: [a, b], output: s1, label: 'NOR(A,B)' },
        { gate: 'NOR', inputs: [a, s1], output: s2, label: 'NOR(A,S1)' },
        { gate: 'NOR', inputs: [b, s1], output: s3, label: 'NOR(B,S1)' },
        { gate: 'NOR', inputs: [s2, s3], output: out, label: 'NOR(S2,S3)' },
      ], output: out }
    }
    default: return { steps: [], output: 0 }
  }
}

// ─── NAND/NOR circuit description text ───
const circuitDescriptions = {
  NAND: {
    NOT: 'Connect both inputs of a NAND gate to A. Output = NOT A.',
    AND: 'Step 1: NAND(A, B) → S1\nStep 2: NAND(S1, S1) → Output (inverts the NAND to get AND)',
    OR:  'Step 1: NAND(A, A) → S1 (NOT A)\nStep 2: NAND(B, B) → S2 (NOT B)\nStep 3: NAND(S1, S2) → Output',
    XOR: 'Step 1: NAND(A, B) → S1\nStep 2: NAND(A, S1) → S2\nStep 3: NAND(B, S1) → S3\nStep 4: NAND(S2, S3) → Output',
  },
  NOR: {
    NOT: 'Connect both inputs of a NOR gate to A. Output = NOT A.',
    AND: 'Step 1: NOR(A, A) → S1 (NOT A)\nStep 2: NOR(B, B) → S2 (NOT B)\nStep 3: NOR(S1, S2) → S3\nStep 4: NOR(S3, S3) → Output',
    OR:  'Step 1: NOR(A, B) → S1\nStep 2: NOR(S1, S1) → Output (inverts the NOR to get OR)',
    XOR: 'Step 1: NOR(A, B) → S1\nStep 2: NOR(A, S1) → S2\nStep 3: NOR(B, S1) → S3\nStep 4: NOR(S2, S3) → Output',
  },
}

// ─── Components ───

function ToggleSwitch({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Input</span>
      <span className="text-lg font-bold font-mono text-indigo-400">{label}</span>
      <label className="toggle-switch">
        <input type="checkbox" checked={value === 1} onChange={() => onChange(value === 1 ? 0 : 1)} />
        <span className="toggle-slider"></span>
      </label>
      <span className={`text-sm font-mono font-bold ${value ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  )
}

function LED({ value, label = 'Q' }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Output</span>
      <span className="text-lg font-bold font-mono text-indigo-400">{label}</span>
      <div className={`led ${value ? 'led-on glow-green' : 'led-off'}`}></div>
      <span className={`text-sm font-mono font-bold ${value ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  )
}

function SmallNandNorGate({ type, inputs, output, label }) {
  const fill = output ? '#0d3320' : '#1e1b4b'
  const stroke = output ? '#22c55e' : '#6366f1'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="80" height="56" viewBox="0 0 80 56">
          {/* Gate body */}
          <path d="M10,8 L40,8 Q65,8 65,28 Q65,48 40,48 L10,48 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="70" cy="28" r="4" fill={fill} stroke={stroke} strokeWidth="2" />
          {/* Input wires */}
          <line x1="0" y1="18" x2="10" y2="18" stroke={inputs[0] ? '#22c55e' : '#4b5563'} strokeWidth="2" />
          <line x1="0" y1="38" x2="10" y2="38" stroke={inputs[1] ? '#22c55e' : '#4b5563'} strokeWidth="2" />
          {/* Output wire */}
          <line x1="74" y1="28" x2="80" y2="28" stroke={output ? '#22c55e' : '#4b5563'} strokeWidth="2" />
          {/* Label */}
          <text x="35" y="31" textAnchor="middle" fill="#a5b4fc" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
            {type}
          </text>
        </svg>
      </div>
      <span className="text-[10px] font-mono text-gray-500">{label}</span>
      <span className={`text-xs font-mono font-bold ${output ? 'text-green-400' : 'text-red-400'}`}>{output}</span>
    </div>
  )
}

function CircuitDiagram({ steps, universalGate, inputA, inputB, output, targetGate }) {
  const isNot = targetGate === 'NOT'

  return (
    <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-6 my-6">
      <h4 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-4 text-center">
        Circuit: {targetGate} using {universalGate} gates ({steps.length} gate{steps.length > 1 ? 's' : ''})
      </h4>

      {/* Inputs */}
      <div className="flex items-start justify-center gap-4 flex-wrap">
        {/* Input Labels */}
        <div className="flex flex-col items-center justify-center gap-4 mr-4 pt-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-bold ${inputA ? 'text-green-400' : 'text-red-400'}`}>A = {inputA}</span>
            <div className={`w-8 h-[3px] rounded ${inputA ? 'bg-green-500' : 'bg-gray-600'}`}></div>
          </div>
          {!isNot && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono font-bold ${inputB ? 'text-green-400' : 'text-red-400'}`}>B = {inputB}</span>
              <div className={`w-8 h-[3px] rounded ${inputB ? 'bg-green-500' : 'bg-gray-600'}`}></div>
            </div>
          )}
        </div>

        {/* Gate chain */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <SmallNandNorGate
                type={universalGate}
                inputs={step.inputs}
                output={step.output}
                label={`S${i + 1}`}
              />
              {i < steps.length - 1 && (
                <div className={`w-4 h-[2px] ${step.output ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="flex items-center gap-2 ml-4 pt-2">
          <div className={`w-8 h-[3px] rounded ${output ? 'bg-green-500' : 'bg-gray-600'}`}></div>
          <div className={`w-6 h-6 rounded-full border-2 ${output ? 'bg-green-500 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-red-900 border-red-800'}`}></div>
          <span className={`text-sm font-mono font-bold ${output ? 'text-green-400' : 'text-red-400'}`}>= {output}</span>
        </div>
      </div>

      {/* Step-by-step explanation */}
      <div className="mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-800">
        <p className="text-xs font-mono text-gray-400 whitespace-pre-line">{circuitDescriptions[universalGate][targetGate]}</p>
      </div>
    </div>
  )
}

function ComparisonTable({ universalGate, inputA, inputB }) {
  const getSteps = universalGate === 'NAND' ? getNandSteps : getNorSteps

  return (
    <div className="mt-6">
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-3 text-center">
        All Gates from {universalGate} — Verification Table
      </h3>
      <table className="truth-table w-full text-center border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-indigo-300 font-mono text-sm rounded-tl-lg">A</th>
            <th className="px-3 py-2 text-indigo-300 font-mono text-sm">B</th>
            {targetGates.map(g => (
              <th key={g} className="px-3 py-2 text-indigo-300 font-mono text-sm">{g}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            [0, 0], [0, 1], [1, 0], [1, 1]
          ].map(([a, b], i) => {
            const isActive = a === inputA && b === inputB
            return (
              <tr key={i} className={isActive ? 'active-row' : ''}>
                <td className={`px-3 py-2 font-mono text-sm border-t border-gray-800 ${a ? 'text-green-400' : 'text-red-400'}`}>{a}</td>
                <td className={`px-3 py-2 font-mono text-sm border-t border-gray-800 ${b ? 'text-green-400' : 'text-red-400'}`}>{b}</td>
                {targetGates.map(g => {
                  const { output } = getSteps(g, a, b)
                  return (
                    <td key={g} className={`px-3 py-2 font-mono text-sm font-bold border-t border-gray-800 ${output ? 'text-green-400' : 'text-red-400'}`}>
                      {output}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Module ───

export default function Module2() {
  const [universalGate, setUniversalGate] = useState('NAND')
  const [targetGate, setTargetGate] = useState('AND')
  const [inputA, setInputA] = useState(0)
  const [inputB, setInputB] = useState(0)

  const isNot = targetGate === 'NOT'
  const getSteps = universalGate === 'NAND' ? getNandSteps : getNorSteps

  const { steps, output } = useMemo(() => {
    return getSteps(targetGate, inputA, inputB)
  }, [universalGate, targetGate, inputA, inputB])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Universal Gates Simulator</h2>
        <p className="text-sm text-gray-500 mt-1">Module 2 — Implementing all gates using NAND-only or NOR-only</p>
      </div>

      {/* Universal Gate Toggle */}
      <section className="mb-6">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Universal Gate</h3>
        <div className="flex gap-2">
          {['NAND', 'NOR'].map((g) => (
            <button key={g} onClick={() => setUniversalGate(g)}
              className={`px-6 py-3 rounded-lg font-mono text-sm font-bold transition-all duration-200 ${
                universalGate === g
                  ? g === 'NAND'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {g}-Only
            </button>
          ))}
        </div>
      </section>

      {/* Target Gate Selector */}
      <section className="mb-6">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Implement Gate</h3>
        <div className="flex flex-wrap gap-2">
          {targetGates.map((g) => (
            <button key={g} onClick={() => setTargetGate(g)}
              className={`px-4 py-2 rounded-lg font-mono text-sm font-medium transition-all duration-200 ${
                targetGate === g
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
              }`}
            >{g}</button>
          ))}
        </div>
      </section>

      {/* Simulator Panel */}
      <section className="gate-box active p-8 mb-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold font-mono mb-1">
            <span className="text-indigo-400">{targetGate}</span>
            <span className="text-gray-500 mx-2">using</span>
            <span className={universalGate === 'NAND' ? 'text-amber-400' : 'text-cyan-400'}>{universalGate}</span>
          </h2>
          <p className="text-sm text-gray-400">
            {targetGate} gate implemented with {steps.length} {universalGate} gate{steps.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Input Toggles + Output LED */}
        <div className="flex items-center justify-center gap-12 md:gap-20 py-6">
          <div className="flex flex-col gap-6">
            <ToggleSwitch label="A" value={inputA} onChange={setInputA} />
            {!isNot && <ToggleSwitch label="B" value={inputB} onChange={setInputB} />}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <svg width="60" height="24" viewBox="0 0 60 24">
              <line x1="0" y1="12" x2="50" y2="12" stroke={output ? '#22c55e' : '#4b5563'} strokeWidth="3" />
              <polygon points="50,4 60,12 50,20" fill={output ? '#22c55e' : '#4b5563'} />
            </svg>
            <span className="text-[10px] font-mono text-gray-600">{universalGate} circuit</span>
          </div>

          <LED value={output} />
        </div>

        {/* Circuit Diagram */}
        <CircuitDiagram
          steps={steps}
          universalGate={universalGate}
          inputA={inputA}
          inputB={inputB}
          output={output}
          targetGate={targetGate}
        />
      </section>

      {/* Verification Truth Table */}
      <section className="gate-box p-6 mb-6">
        <ComparisonTable universalGate={universalGate} inputA={inputA} inputB={inputB} />
      </section>

      {/* Why Universal Gates? */}
      <section className="gate-box p-6">
        <h3 className="text-lg font-bold text-indigo-400 mb-4">Why are NAND and NOR Universal Gates?</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-amber-900/30">
            <h4 className="font-mono font-bold text-amber-400 mb-2 text-sm">NAND — Universal Gate</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">▸</span>
                A NAND gate can implement <strong>any</strong> Boolean function
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">▸</span>
                NOT: Connect both inputs together → NAND(A, A) = NOT A
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">▸</span>
                AND: NAND followed by NOT (another NAND)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">▸</span>
                OR: NOT both inputs, then NAND the results
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">▸</span>
                Widely used in CMOS IC fabrication (e.g., 74LS00)
              </li>
            </ul>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-cyan-900/30">
            <h4 className="font-mono font-bold text-cyan-400 mb-2 text-sm">NOR — Universal Gate</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">▸</span>
                A NOR gate can also implement <strong>any</strong> Boolean function
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">▸</span>
                NOT: Connect both inputs together → NOR(A, A) = NOT A
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">▸</span>
                OR: NOR followed by NOT (another NOR)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">▸</span>
                AND: NOT both inputs, then NOR the results, then NOT
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">▸</span>
                Used in early computers — Apollo Guidance Computer used only NOR gates!
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 bg-indigo-950/30 rounded-lg p-4 border border-indigo-900/30 text-center">
          <p className="text-sm text-gray-300">
            <strong className="text-indigo-400">Key Theorem:</strong> Any combinational logic circuit can be built using only NAND gates or only NOR gates.
            This makes them <em>functionally complete</em> — a single gate type is sufficient to implement any Boolean function.
          </p>
        </div>
      </section>
    </motion.div>
  )
}
