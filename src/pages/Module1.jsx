import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

const gateLogic = {
  AND:  (a, b) => a & b,
  OR:   (a, b) => a | b,
  XOR:  (a, b) => a ^ b,
  NOT:  (a) => a ? 0 : 1,
  NAND: (a, b) => (a & b) ? 0 : 1,
  NOR:  (a, b) => (a | b) ? 0 : 1,
  XNOR: (a, b) => (a ^ b) ? 0 : 1,
}

const gateInfo = {
  AND:  'Output is 1 only when BOTH inputs are 1',
  OR:   'Output is 1 when ANY input is 1',
  XOR:  'Output is 1 when inputs are DIFFERENT',
  NOT:  'Output is the INVERSE of input A',
  NAND: 'Output is 0 only when BOTH inputs are 1',
  NOR:  'Output is 0 when ANY input is 1',
  XNOR: 'Output is 1 when inputs are the SAME',
}

const gates = ['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR', 'XNOR']

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

function LED({ value }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Output</span>
      <span className="text-lg font-bold font-mono text-indigo-400">Q</span>
      <div className={`led ${value ? 'led-on glow-green' : 'led-off'}`}></div>
      <span className={`text-sm font-mono font-bold ${value ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  )
}

function GateDiagram({ gate, inputA, inputB, output }) {
  const isNot = gate === 'NOT'
  return (
    <div className="flex items-center justify-center gap-0 my-6">
      <div className="flex flex-col gap-6 items-end">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${inputA ? 'text-green-400' : 'text-gray-500'}`}>A={inputA}</span>
          <div className={`w-16 h-[3px] rounded ${inputA ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-600'}`}></div>
        </div>
        {!isNot && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${inputB ? 'text-green-400' : 'text-gray-500'}`}>B={inputB}</span>
            <div className={`w-16 h-[3px] rounded ${inputB ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-600'}`}></div>
          </div>
        )}
      </div>
      <GateSymbol gate={gate} />
      <div className="flex items-center gap-2">
        <div className={`w-16 h-[3px] rounded ${output ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-600'}`}></div>
        <span className={`text-xs font-mono font-bold ${output ? 'text-green-400' : 'text-gray-500'}`}>Q={output}</span>
      </div>
    </div>
  )
}

function GateSymbol({ gate }) {
  const isInverted = ['NOT', 'NAND', 'NOR', 'XNOR'].includes(gate)
  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="70" viewBox="0 0 100 70" className="drop-shadow-lg">
        {gate === 'NOT' ? (
          <>
            <polygon points="15,10 75,35 15,60" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
            <circle cx="80" cy="35" r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
          </>
        ) : gate === 'AND' || gate === 'NAND' ? (
          <>
            <path d="M15,10 L50,10 Q85,10 85,35 Q85,60 50,60 L15,60 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
            {isInverted && <circle cx="90" cy="35" r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />}
          </>
        ) : gate === 'OR' || gate === 'NOR' ? (
          <>
            <path d="M15,10 Q35,10 55,10 Q80,15 90,35 Q80,55 55,60 Q35,60 15,60 Q30,35 15,10 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
            {isInverted && <circle cx="93" cy="35" r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />}
          </>
        ) : gate === 'XOR' || gate === 'XNOR' ? (
          <>
            <path d="M20,10 Q40,10 55,10 Q80,15 90,35 Q80,55 55,60 Q40,60 20,60 Q35,35 20,10 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
            <path d="M12,10 Q27,35 12,60" fill="none" stroke="#6366f1" strokeWidth="2" />
            {isInverted && <circle cx="93" cy="35" r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />}
          </>
        ) : null}
        <text x={gate === 'NOT' ? 38 : 50} y="39" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
          {gate}
        </text>
      </svg>
    </div>
  )
}

function TruthTable({ gate, inputA, inputB }) {
  const isNot = gate === 'NOT'
  const fn = gateLogic[gate]
  const rows = isNot
    ? [{ a: 0, out: fn(0) }, { a: 1, out: fn(1) }]
    : [
        { a: 0, b: 0, out: fn(0, 0) },
        { a: 0, b: 1, out: fn(0, 1) },
        { a: 1, b: 0, out: fn(1, 0) },
        { a: 1, b: 1, out: fn(1, 1) },
      ]

  return (
    <div className="mt-8">
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-3 text-center">
        Truth Table — {gate}
      </h3>
      <table className="truth-table w-full text-center border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 text-indigo-300 font-mono text-sm rounded-tl-lg">A</th>
            {!isNot && <th className="px-4 py-2 text-indigo-300 font-mono text-sm">B</th>}
            <th className="px-4 py-2 text-indigo-300 font-mono text-sm rounded-tr-lg">Output</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isActive = isNot ? row.a === inputA : row.a === inputA && row.b === inputB
            return (
              <tr key={i} className={isActive ? 'active-row' : ''}>
                <td className={`px-4 py-2 font-mono text-sm border-t border-gray-800 ${row.a ? 'text-green-400' : 'text-red-400'}`}>{row.a}</td>
                {!isNot && <td className={`px-4 py-2 font-mono text-sm border-t border-gray-800 ${row.b ? 'text-green-400' : 'text-red-400'}`}>{row.b}</td>}
                <td className={`px-4 py-2 font-mono text-sm font-bold border-t border-gray-800 ${row.out ? 'text-green-400' : 'text-red-400'}`}>{row.out}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BooleanExpression({ gate, inputA, inputB, output }) {
  const expressions = {
    AND:  `A · B = ${inputA} · ${inputB} = ${output}`,
    OR:   `A + B = ${inputA} + ${inputB} = ${output}`,
    XOR:  `A ⊕ B = ${inputA} ⊕ ${inputB} = ${output}`,
    NOT:  `A̅ = ${inputA}̅ = ${output}`,
    NAND: `(A · B)̅ = (${inputA} · ${inputB})̅ = ${output}`,
    NOR:  `(A + B)̅ = (${inputA} + ${inputB})̅ = ${output}`,
    XNOR: `(A ⊕ B)̅ = (${inputA} ⊕ ${inputB})̅ = ${output}`,
  }
  return (
    <div className="text-center mt-4 px-4 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Boolean Expression</span>
      <p className="text-indigo-300 font-mono text-lg mt-1">{expressions[gate]}</p>
    </div>
  )
}

export default function Module1() {
  const [selectedGate, setSelectedGate] = useState('AND')
  const [inputA, setInputA] = useState(0)
  const [inputB, setInputB] = useState(0)
  const isNot = selectedGate === 'NOT'
  const output = useMemo(() => gateLogic[selectedGate](inputA, inputB), [selectedGate, inputA, inputB])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Basic Logic Gates</h2>
        <p className="text-sm text-gray-500 mt-1">Module 1 — AND, OR, XOR, NOT, NAND, NOR, XNOR gate simulation</p>
      </div>

      <section className="mb-8">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Select Gate</h3>
        <div className="flex flex-wrap gap-2">
          {gates.map((gate) => (
            <button key={gate} onClick={() => setSelectedGate(gate)}
              className={`px-4 py-2 rounded-lg font-mono text-sm font-medium transition-all duration-200 ${
                selectedGate === gate
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
              }`}
            >{gate}</button>
          ))}
        </div>
      </section>

      <section className="gate-box active p-8 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-mono text-indigo-400 mb-1">{selectedGate} Gate</h2>
          <p className="text-sm text-gray-400">{gateInfo[selectedGate]}</p>
        </div>
        <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
          <div className="flex flex-col gap-6">
            <ToggleSwitch label="A" value={inputA} onChange={setInputA} />
            {!isNot && <ToggleSwitch label="B" value={inputB} onChange={setInputB} />}
          </div>
          <GateDiagram gate={selectedGate} inputA={inputA} inputB={inputB} output={output} />
          <LED value={output} />
        </div>
        <BooleanExpression gate={selectedGate} inputA={inputA} inputB={inputB} output={output} />
      </section>

      <section className="gate-box p-6">
        <TruthTable gate={selectedGate} inputA={inputA} inputB={inputB} />
      </section>
    </motion.div>
  )
}
