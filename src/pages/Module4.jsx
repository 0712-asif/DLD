import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Helpers ───

function buildRows(numVars) {
  const varNames = 'ABCD'.slice(0, numVars).split('')
  const n = varNames.length
  const rows = []
  for (let i = 0; i < (1 << n); i++) {
    const inputs = {}
    varNames.forEach((v, idx) => {
      inputs[v] = (i >> (n - 1 - idx)) & 1
    })
    rows.push(inputs)
  }
  return { varNames, rows }
}

function getMintermExpression(varNames, rowInputs) {
  return varNames.map(v => rowInputs[v] ? v : `${v}'`).join('')
}

function getMaxtermExpression(varNames, rowInputs) {
  return '(' + varNames.map(v => rowInputs[v] ? `${v}'` : v).join(' + ') + ')'
}

// ─── Components ───

function VariableSelector({ numVars, onChange }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Number of Variables</h3>
      <div className="flex gap-2">
        {[2, 3, 4].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`w-14 h-14 rounded-xl font-mono text-lg font-bold transition-all duration-200 ${
              numVars === n
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600 font-mono mt-2">
        Variables: {'ABCD'.slice(0, numVars).split('').join(', ')} → {1 << numVars} rows
      </p>
    </div>
  )
}

function InteractiveTruthTable({ varNames, rows, outputs, onToggle }) {
  return (
    <div>
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-3 text-center">
        Interactive Truth Table
      </h3>
      <p className="text-xs text-gray-600 text-center mb-4 font-mono">Click the output column to toggle between 0 and 1</p>

      <table className="truth-table w-full text-center border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2.5 text-gray-500 font-mono text-xs rounded-tl-lg">Row</th>
            {varNames.map(v => (
              <th key={v} className="px-3 py-2.5 text-indigo-300 font-mono text-sm">{v}</th>
            ))}
            <th className="px-3 py-2.5 text-indigo-300 font-mono text-sm">F</th>
            <th className="px-3 py-2.5 text-gray-500 font-mono text-xs">Minterm</th>
            <th className="px-3 py-2.5 text-gray-500 font-mono text-xs rounded-tr-lg">Maxterm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isMinterm = outputs[i] === 1
            const isMaxterm = outputs[i] === 0

            return (
              <tr key={i} className={isMinterm ? 'active-row' : ''}>
                <td className="px-3 py-2 font-mono text-xs border-t border-gray-800 text-gray-600">{i}</td>
                {varNames.map(v => (
                  <td key={v} className={`px-3 py-2 font-mono text-sm border-t border-gray-800 ${row[v] ? 'text-green-400' : 'text-red-400'}`}>
                    {row[v]}
                  </td>
                ))}
                <td className="px-3 py-1.5 border-t border-gray-800">
                  <button
                    onClick={() => onToggle(i)}
                    className={`w-12 h-9 rounded-lg font-mono text-sm font-bold transition-all duration-200 ${
                      isMinterm
                        ? 'bg-green-600 text-white shadow-md shadow-green-500/30 scale-105'
                        : 'bg-gray-800 text-red-400 border border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                    }`}
                  >
                    {outputs[i]}
                  </button>
                </td>
                <td className={`px-3 py-2 font-mono text-xs border-t border-gray-800 ${isMinterm ? 'text-amber-400' : 'text-gray-700'}`}>
                  {isMinterm ? getMintermExpression(varNames, row) : '—'}
                </td>
                <td className={`px-3 py-2 font-mono text-xs border-t border-gray-800 ${isMaxterm ? 'text-cyan-400' : 'text-gray-700'}`}>
                  {isMaxterm ? getMaxtermExpression(varNames, row) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function NotationDisplay({ varNames, rows, outputs }) {
  const minterms = outputs.map((o, i) => o === 1 ? i : -1).filter(i => i !== -1)
  const maxterms = outputs.map((o, i) => o === 0 ? i : -1).filter(i => i !== -1)

  const sopTerms = minterms.map(i => getMintermExpression(varNames, rows[i]))
  const posTerms = maxterms.map(i => getMaxtermExpression(varNames, rows[i]))

  const sopExpr = sopTerms.length > 0 ? sopTerms.join(' + ') : '0'
  const posExpr = posTerms.length > 0 ? posTerms.join('') : '1'

  return (
    <div className="space-y-4">
      {/* Sigma Notation */}
      <div className="bg-amber-950/20 rounded-xl border border-amber-900/30 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-amber-400">Σ</span>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">Minterm Notation (SOP)</h4>
            <p className="font-mono text-amber-300 text-xl mb-2">
              F = Σm({minterms.length > 0 ? minterms.join(', ') : '∅'})
            </p>
            <div className="bg-amber-950/30 rounded-lg p-3 border border-amber-900/20">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Expanded SOP Expression</span>
              <p className="font-mono text-amber-200 text-sm mt-1 break-all">F = {sopExpr}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <strong className="text-amber-400">Minterms</strong> are the rows where output F = 1.
              Each minterm is a product (AND) term using all variables — normal if 1, complemented if 0.
            </p>
          </div>
        </div>
      </div>

      {/* Pi Notation */}
      <div className="bg-cyan-950/20 rounded-xl border border-cyan-900/30 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan-900/30 border border-cyan-700/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">Π</span>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">Maxterm Notation (POS)</h4>
            <p className="font-mono text-cyan-300 text-xl mb-2">
              F = ΠM({maxterms.length > 0 ? maxterms.join(', ') : '∅'})
            </p>
            <div className="bg-cyan-950/30 rounded-lg p-3 border border-cyan-900/20">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Expanded POS Expression</span>
              <p className="font-mono text-cyan-200 text-sm mt-1 break-all">F = {posExpr}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <strong className="text-cyan-400">Maxterms</strong> are the rows where output F = 0.
              Each maxterm is a sum (OR) term using all variables — normal if 0, complemented if 1.
            </p>
          </div>
        </div>
      </div>

      {/* Relationship */}
      <div className="bg-indigo-950/20 rounded-xl border border-indigo-900/30 p-4">
        <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">Key Relationship</h4>
        <div className="flex flex-col md:flex-row gap-3 text-sm text-gray-300">
          <div className="flex-1 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
            <p className="font-mono text-xs text-gray-500 mb-1">Minterms (F=1)</p>
            <p className="font-mono text-amber-400">{'{' + minterms.join(', ') + '}'}</p>
          </div>
          <div className="flex items-center justify-center text-gray-600 font-mono text-lg">∪</div>
          <div className="flex-1 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
            <p className="font-mono text-xs text-gray-500 mb-1">Maxterms (F=0)</p>
            <p className="font-mono text-cyan-400">{'{' + maxterms.join(', ') + '}'}</p>
          </div>
          <div className="flex items-center justify-center text-gray-600 font-mono text-lg">=</div>
          <div className="flex-1 bg-gray-900/40 rounded-lg p-3 border border-gray-800">
            <p className="font-mono text-xs text-gray-500 mb-1">All rows</p>
            <p className="font-mono text-indigo-400">{'{' + Array.from({ length: 1 << varNames.length }, (_, i) => i).join(', ') + '}'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          The set of minterm indices and maxterm indices are <strong className="text-indigo-400">complementary</strong> — together they cover every row of the truth table.
        </p>
      </div>
    </div>
  )
}

function MintermMaxtermDetail({ varNames, rows, outputs }) {
  const minterms = outputs.map((o, i) => o === 1 ? i : -1).filter(i => i !== -1)
  const maxterms = outputs.map((o, i) => o === 0 ? i : -1).filter(i => i !== -1)

  return (
    <div>
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Detailed Breakdown</h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Minterms detail */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
          <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Minterms (m)
          </h4>
          {minterms.length === 0 ? (
            <p className="text-xs text-gray-600 font-mono italic">No minterms — all outputs are 0</p>
          ) : (
            <div className="space-y-2">
              {minterms.map(i => (
                <div key={i} className="flex items-center gap-3 bg-amber-950/20 rounded-lg p-2 border border-amber-900/20">
                  <span className="font-mono text-xs text-gray-500 w-8">m{i}</span>
                  <span className="font-mono text-xs text-gray-400">
                    {varNames.map(v => `${v}=${rows[i][v]}`).join(', ')}
                  </span>
                  <span className="text-gray-600">→</span>
                  <span className="font-mono text-sm text-amber-400 font-bold">
                    {getMintermExpression(varNames, rows[i])}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maxterms detail */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
          <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            Maxterms (M)
          </h4>
          {maxterms.length === 0 ? (
            <p className="text-xs text-gray-600 font-mono italic">No maxterms — all outputs are 1</p>
          ) : (
            <div className="space-y-2">
              {maxterms.map(i => (
                <div key={i} className="flex items-center gap-3 bg-cyan-950/20 rounded-lg p-2 border border-cyan-900/20">
                  <span className="font-mono text-xs text-gray-500 w-8">M{i}</span>
                  <span className="font-mono text-xs text-gray-400">
                    {varNames.map(v => `${v}=${rows[i][v]}`).join(', ')}
                  </span>
                  <span className="text-gray-600">→</span>
                  <span className="font-mono text-sm text-cyan-400 font-bold">
                    {getMaxtermExpression(varNames, rows[i])}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EducationPanel() {
  return (
    <div>
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Understanding Minterms & Maxterms</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-amber-950/10 rounded-xl border border-amber-900/20 p-4">
          <h4 className="font-bold text-amber-400 text-sm mb-3">What is a Minterm?</h4>
          <ul className="text-xs text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">▸</span>
              A minterm is a <strong className="text-amber-300">product term</strong> that contains ALL variables
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">▸</span>
              Each variable appears exactly once — either normal or complemented
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">▸</span>
              Minterm m<sub>i</sub> = 1 for exactly ONE input combination
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">▸</span>
              Example: For 2 variables, m<sub>3</sub> = AB (both A=1 and B=1)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">▸</span>
              Used in <strong className="text-amber-300">SOP (Sum of Products)</strong> form
            </li>
          </ul>
        </div>
        <div className="bg-cyan-950/10 rounded-xl border border-cyan-900/20 p-4">
          <h4 className="font-bold text-cyan-400 text-sm mb-3">What is a Maxterm?</h4>
          <ul className="text-xs text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">▸</span>
              A maxterm is a <strong className="text-cyan-300">sum term</strong> that contains ALL variables
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">▸</span>
              Each variable appears exactly once — normal if row value is 0, complemented if 1
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">▸</span>
              Maxterm M<sub>i</sub> = 0 for exactly ONE input combination
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">▸</span>
              Example: For 2 variables, M<sub>0</sub> = (A + B) (when A=0 and B=0)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">▸</span>
              Used in <strong className="text-cyan-300">POS (Product of Sums)</strong> form
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 bg-indigo-950/20 rounded-xl border border-indigo-900/20 p-4">
        <h4 className="font-bold text-indigo-400 text-sm mb-2">Minterm ↔ Maxterm Relationship</h4>
        <div className="grid md:grid-cols-3 gap-3 text-xs text-gray-400">
          <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-800">
            <p className="font-mono text-gray-500 mb-1">Rule 1</p>
            <p>Minterm m<sub>i</sub> is the <strong className="text-indigo-300">complement</strong> of maxterm M<sub>i</sub></p>
          </div>
          <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-800">
            <p className="font-mono text-gray-500 mb-1">Rule 2</p>
            <p>If F = Σm(1,3,5) then F' = ΠM(1,3,5) and F = ΠM(0,2,4,6,7)</p>
          </div>
          <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-800">
            <p className="font-mono text-gray-500 mb-1">Rule 3</p>
            <p>For n variables: there are <strong className="text-indigo-300">2<sup>n</sup></strong> minterms and 2<sup>n</sup> maxterms</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Presets ───

function QuickPresets({ numVars, onApply }) {
  const presets = numVars === 2
    ? [
        { label: 'AND', outputs: [0, 0, 0, 1] },
        { label: 'OR', outputs: [0, 1, 1, 1] },
        { label: 'XOR', outputs: [0, 1, 1, 0] },
        { label: 'NAND', outputs: [1, 1, 1, 0] },
        { label: 'All 0s', outputs: [0, 0, 0, 0] },
        { label: 'All 1s', outputs: [1, 1, 1, 1] },
      ]
    : numVars === 3
    ? [
        { label: 'Majority', outputs: [0, 0, 0, 1, 0, 1, 1, 1] },
        { label: 'Parity', outputs: [0, 1, 1, 0, 1, 0, 0, 1] },
        { label: 'All 0s', outputs: new Array(8).fill(0) },
        { label: 'All 1s', outputs: new Array(8).fill(1) },
      ]
    : [
        { label: 'All 0s', outputs: new Array(16).fill(0) },
        { label: 'All 1s', outputs: new Array(16).fill(1) },
      ]

  return (
    <div className="mb-5">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Quick Presets</span>
      <div className="flex flex-wrap gap-2 mt-2">
        {presets.map((p, i) => (
          <button key={i} onClick={() => onApply(p.outputs)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Module ───

export default function Module4() {
  const [numVars, setNumVars] = useState(2)
  const [outputs, setOutputs] = useState([0, 0, 0, 1]) // default AND

  const { varNames, rows } = useMemo(() => buildRows(numVars), [numVars])

  const handleVarChange = (n) => {
    setNumVars(n)
    setOutputs(new Array(1 << n).fill(0))
  }

  const toggleOutput = (index) => {
    setOutputs(prev => {
      const next = [...prev]
      next[index] = next[index] ? 0 : 1
      return next
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Minterm & Maxterm Generator</h2>
        <p className="text-sm text-gray-500 mt-1">Module 4 — Select truth table outputs to generate Σm and ΠM notation</p>
      </div>

      {/* Controls */}
      <section className="gate-box active p-6 mb-6">
        <VariableSelector numVars={numVars} onChange={handleVarChange} />
        <QuickPresets numVars={numVars} onApply={setOutputs} />
        <InteractiveTruthTable
          varNames={varNames}
          rows={rows}
          outputs={outputs}
          onToggle={toggleOutput}
        />
      </section>

      {/* Notation Display */}
      <section className="gate-box p-6 mb-6">
        <NotationDisplay varNames={varNames} rows={rows} outputs={outputs} />
      </section>

      {/* Detailed Breakdown */}
      <section className="gate-box p-6 mb-6">
        <MintermMaxtermDetail varNames={varNames} rows={rows} outputs={outputs} />
      </section>

      {/* Educational Section */}
      <section className="gate-box p-6">
        <EducationPanel />
      </section>
    </motion.div>
  )
}
