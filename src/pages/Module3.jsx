import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'

// ─── Boolean Expression Parser & Evaluator ───

function tokenize(expr) {
  const tokens = []
  let i = 0
  const s = expr.replace(/\s+/g, '')

  while (i < s.length) {
    const ch = s[i]
    if (ch === '(') { tokens.push({ type: 'LPAREN' }); i++ }
    else if (ch === ')') { tokens.push({ type: 'RPAREN' }); i++ }
    else if (ch === '+') { tokens.push({ type: 'OR' }); i++ }
    else if (ch === '·' || ch === '.') { tokens.push({ type: 'AND' }); i++ }
    else if (ch === "'") { tokens.push({ type: 'NOT' }); i++ }
    else if (/[A-Za-z]/.test(ch)) {
      tokens.push({ type: 'VAR', value: ch.toUpperCase() })
      i++
      // Handle complement notation: A'
      while (i < s.length && s[i] === "'") {
        tokens.push({ type: 'NOT' })
        i++
      }
    }
    else { i++ } // skip unknown chars
  }
  return tokens
}

// Parse into AST: expr = term ('+' term)*
// term = factor (implicit AND factor)*
// factor = atom ("'")*
// atom = VAR | '(' expr ')'
function parse(tokens) {
  let pos = 0

  function peek() { return pos < tokens.length ? tokens[pos] : null }
  function consume(type) {
    const t = peek()
    if (t && t.type === type) { pos++; return t }
    return null
  }

  function parseExpr() {
    let node = parseTerm()
    while (peek() && peek().type === 'OR') {
      consume('OR')
      const right = parseTerm()
      node = { type: 'OR', left: node, right }
    }
    return node
  }

  function parseTerm() {
    let node = parseFactor()
    while (peek() && (peek().type === 'VAR' || peek().type === 'LPAREN' || peek().type === 'AND')) {
      if (peek().type === 'AND') consume('AND')
      const right = parseFactor()
      node = { type: 'AND', left: node, right }
    }
    return node
  }

  function parseFactor() {
    let node = parseAtom()
    while (peek() && peek().type === 'NOT') {
      consume('NOT')
      node = { type: 'NOT', operand: node }
    }
    return node
  }

  function parseAtom() {
    const t = peek()
    if (t && t.type === 'VAR') {
      consume('VAR')
      return { type: 'VAR', name: t.value }
    }
    if (t && t.type === 'LPAREN') {
      consume('LPAREN')
      const node = parseExpr()
      consume('RPAREN')
      return node
    }
    // Fallback
    return { type: 'VAR', name: '?' }
  }

  const ast = parseExpr()
  return ast
}

function evaluate(ast, vars) {
  if (!ast) return 0
  switch (ast.type) {
    case 'VAR': return vars[ast.name] || 0
    case 'NOT': return evaluate(ast.operand, vars) ? 0 : 1
    case 'AND': return (evaluate(ast.left, vars) & evaluate(ast.right, vars))
    case 'OR':  return (evaluate(ast.left, vars) | evaluate(ast.right, vars))
    default: return 0
  }
}

function extractVars(ast, set = new Set()) {
  if (!ast) return set
  if (ast.type === 'VAR' && ast.name !== '?') set.add(ast.name)
  if (ast.left) extractVars(ast.left, set)
  if (ast.right) extractVars(ast.right, set)
  if (ast.operand) extractVars(ast.operand, set)
  return set
}

function astToString(ast) {
  if (!ast) return ''
  switch (ast.type) {
    case 'VAR': return ast.name
    case 'NOT': {
      const inner = astToString(ast.operand)
      return inner.length === 1 ? `${inner}'` : `(${inner})'`
    }
    case 'AND': {
      const l = astToString(ast.left)
      const r = astToString(ast.right)
      return `${l}${r}`
    }
    case 'OR': {
      const l = astToString(ast.left)
      const r = astToString(ast.right)
      return `${l} + ${r}`
    }
    default: return ''
  }
}

// ─── SOP / POS Generation ───

function generateTruthTable(variables, ast) {
  const n = variables.length
  const rows = []
  for (let i = 0; i < (1 << n); i++) {
    const vars = {}
    variables.forEach((v, idx) => {
      vars[v] = (i >> (n - 1 - idx)) & 1
    })
    const output = evaluate(ast, vars)
    rows.push({ inputs: { ...vars }, output })
  }
  return rows
}

function generateSOP(variables, truthTable) {
  const minterms = truthTable.filter(row => row.output === 1)
  if (minterms.length === 0) return '0'
  if (minterms.length === truthTable.length) return '1'

  const terms = minterms.map(row => {
    return variables.map(v => row.inputs[v] ? v : `${v}'`).join('')
  })
  return terms.join(' + ')
}

function generatePOS(variables, truthTable) {
  const maxterms = truthTable.filter(row => row.output === 0)
  if (maxterms.length === 0) return '1'
  if (maxterms.length === truthTable.length) return '0'

  const terms = maxterms.map(row => {
    const sum = variables.map(v => row.inputs[v] ? `${v}'` : v).join(' + ')
    return `(${sum})`
  })
  return terms.join('')
}

function getMintermIndices(truthTable) {
  return truthTable
    .map((row, i) => row.output === 1 ? i : -1)
    .filter(i => i !== -1)
}

function getMaxtermIndices(truthTable) {
  return truthTable
    .map((row, i) => row.output === 0 ? i : -1)
    .filter(i => i !== -1)
}

// ─── Gate type extraction from AST ───

function getGatesUsed(ast) {
  const gates = new Set()
  function walk(node) {
    if (!node) return
    if (node.type === 'AND') gates.add('AND')
    if (node.type === 'OR') gates.add('OR')
    if (node.type === 'NOT') gates.add('NOT')
    if (node.left) walk(node.left)
    if (node.right) walk(node.right)
    if (node.operand) walk(node.operand)
  }
  walk(ast)
  return [...gates]
}

// ─── Components ───

function ExpressionInput({ expression, onChange }) {
  return (
    <div className="mb-6">
      <label className="block text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">
        Boolean Expression
      </label>
      <div className="relative">
        <input
          type="text"
          value={expression}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. A'B + AB'  or  (A+B)(A'+C)"
          className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-xl text-white font-mono text-lg placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-mono">
          ' = NOT &nbsp; + = OR &nbsp; AB = AND
        </div>
      </div>
    </div>
  )
}

function QuickExpressions({ onSelect }) {
  const examples = [
    { label: "A'B + AB'", expr: "A'B + AB'" },
    { label: "AB + A'B'", expr: "AB + A'B'" },
    { label: "A'B'C + AB'C + ABC", expr: "A'B'C + AB'C + ABC" },
    { label: "(A+B)(A'+B')", expr: "(A+B)(A'+B')" },
    { label: "A'B + BC'", expr: "A'B + BC'" },
    { label: "AB + AC + BC", expr: "AB + AC + BC" },
  ]

  return (
    <div className="mb-6">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Quick Examples</span>
      <div className="flex flex-wrap gap-2 mt-2">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onSelect(ex.expr)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CircuitVisualization({ ast, variables }) {
  const gates = getGatesUsed(ast)

  return (
    <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-6">
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Circuit Visualization</h3>

      {/* Input signals */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="flex gap-4">
          {variables.map(v => (
            <div key={v} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center">
                <span className="font-mono font-bold text-indigo-400">{v}</span>
              </div>
              <span className="text-[10px] font-mono text-gray-600">INPUT</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gates */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-12 h-[2px] bg-gray-700"></div>
        <div className="flex gap-3">
          {gates.map(g => (
            <div key={g} className="relative">
              <svg width="70" height="50" viewBox="0 0 70 50">
                {g === 'AND' ? (
                  <path d="M8,5 L35,5 Q60,5 60,25 Q60,45 35,45 L8,45 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                ) : g === 'OR' ? (
                  <path d="M8,5 Q25,5 40,5 Q58,10 65,25 Q58,40 40,45 Q25,45 8,45 Q20,25 8,5 Z" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                ) : (
                  <>
                    <polygon points="8,5 52,25 8,45" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                    <circle cx="57" cy="25" r="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                  </>
                )}
                <text x={g === 'NOT' ? 25 : 33} y="28" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                  {g}
                </text>
              </svg>
            </div>
          ))}
        </div>
        <div className="w-12 h-[2px] bg-gray-700"></div>
      </div>

      {/* Output */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-green-900/30 border-2 border-green-700/50 flex items-center justify-center">
            <span className="font-mono font-bold text-green-400 text-sm">Q</span>
          </div>
          <span className="text-[10px] font-mono text-gray-600">OUTPUT</span>
        </div>
      </div>

      <div className="mt-4 text-center text-xs font-mono text-gray-600">
        Gates used: {gates.join(', ')} | Variables: {variables.join(', ')}
      </div>
    </div>
  )
}

function TruthTablePanel({ variables, truthTable, inputVals, setInputVals }) {
  return (
    <div>
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-3 text-center">Truth Table</h3>

      {/* Interactive input toggles */}
      <div className="flex justify-center gap-4 mb-4">
        {variables.map(v => (
          <div key={v} className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono text-gray-500">{v}</span>
            <button
              onClick={() => setInputVals(prev => ({ ...prev, [v]: prev[v] ? 0 : 1 }))}
              className={`w-8 h-8 rounded-lg font-mono text-sm font-bold transition-all ${
                inputVals[v] ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {inputVals[v] || 0}
            </button>
          </div>
        ))}
      </div>

      <table className="truth-table w-full text-center border-collapse">
        <thead>
          <tr>
            {variables.map(v => (
              <th key={v} className="px-3 py-2 text-indigo-300 font-mono text-sm">{v}</th>
            ))}
            <th className="px-3 py-2 text-indigo-300 font-mono text-sm">Output</th>
            <th className="px-3 py-2 text-indigo-300 font-mono text-sm">Minterm</th>
          </tr>
        </thead>
        <tbody>
          {truthTable.map((row, i) => {
            const isActive = variables.every(v => row.inputs[v] === (inputVals[v] || 0))
            return (
              <tr key={i} className={isActive ? 'active-row' : ''}>
                {variables.map(v => (
                  <td key={v} className={`px-3 py-2 font-mono text-sm border-t border-gray-800 ${row.inputs[v] ? 'text-green-400' : 'text-red-400'}`}>
                    {row.inputs[v]}
                  </td>
                ))}
                <td className={`px-3 py-2 font-mono text-sm font-bold border-t border-gray-800 ${row.output ? 'text-green-400' : 'text-red-400'}`}>
                  {row.output}
                </td>
                <td className="px-3 py-2 font-mono text-xs border-t border-gray-800 text-gray-500">
                  m{i}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SOPPOSPanel({ variables, truthTable, sopExpr, posExpr }) {
  const minterms = getMintermIndices(truthTable)
  const maxterms = getMaxtermIndices(truthTable)

  return (
    <div className="space-y-4">
      {/* SOP */}
      <div className="bg-amber-950/20 rounded-xl border border-amber-900/30 p-4">
        <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">Sum of Products (SOP)</h4>
        <p className="font-mono text-amber-300 text-sm break-all">{sopExpr}</p>
        <div className="mt-2 text-xs font-mono text-gray-500">
          Σm({minterms.join(', ')})
        </div>
        <div className="mt-3 text-xs text-gray-400">
          <strong className="text-amber-400">How SOP works:</strong> Take each row where output = 1.
          Write the product (AND) of all variables — use the variable as-is if it's 1, complemented if it's 0.
          Sum (OR) all these product terms together.
        </div>
      </div>

      {/* POS */}
      <div className="bg-cyan-950/20 rounded-xl border border-cyan-900/30 p-4">
        <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">Product of Sums (POS)</h4>
        <p className="font-mono text-cyan-300 text-sm break-all">{posExpr}</p>
        <div className="mt-2 text-xs font-mono text-gray-500">
          ΠM({maxterms.join(', ')})
        </div>
        <div className="mt-3 text-xs text-gray-400">
          <strong className="text-cyan-400">How POS works:</strong> Take each row where output = 0.
          Write the sum (OR) of all variables — use the variable complemented if it's 1, as-is if it's 0.
          Multiply (AND) all these sum terms together.
        </div>
      </div>
    </div>
  )
}

function StepByStep({ expression, variables, sopExpr, posExpr, truthTable }) {
  const minterms = getMintermIndices(truthTable)
  const maxterms = getMaxtermIndices(truthTable)

  const steps = [
    {
      title: 'Parse Expression',
      detail: `Input expression: ${expression}\nVariables detected: ${variables.join(', ')}`,
    },
    {
      title: 'Generate Truth Table',
      detail: `Total rows: ${truthTable.length} (2^${variables.length} combinations)\nOutputs with 1: ${minterms.length} rows\nOutputs with 0: ${maxterms.length} rows`,
    },
    {
      title: 'Identify Minterms',
      detail: `Rows where output = 1: ${minterms.map(m => `m${m}`).join(', ')}\nΣm(${minterms.join(', ')})`,
    },
    {
      title: 'Identify Maxterms',
      detail: `Rows where output = 0: ${maxterms.map(m => `M${m}`).join(', ')}\nΠM(${maxterms.join(', ')})`,
    },
    {
      title: 'SOP Expression',
      detail: `Sum of Products:\nF = ${sopExpr}`,
    },
    {
      title: 'POS Expression',
      detail: `Product of Sums:\nF = ${posExpr}`,
    },
  ]

  return (
    <div>
      <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Step-by-Step Explanation</h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-indigo-400">{i + 1}</span>
            </div>
            <div className="flex-1 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
              <h4 className="text-sm font-medium text-indigo-400 mb-1">{step.title}</h4>
              <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap">{step.detail}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Design from Truth Table component ───

function buildTruthTableRows(numVars) {
  const varNames = 'ABCDE'.slice(0, numVars).split('')
  const n = varNames.length
  const rows = []
  for (let i = 0; i < (1 << n); i++) {
    const inputs = {}
    varNames.forEach((v, idx) => {
      inputs[v] = (i >> (n - 1 - idx)) & 1
    })
    rows.push({ inputs, output: 0 })
  }
  return { varNames, rows }
}

function DesignFromTruthTable({ onResult }) {
  const [numVars, setNumVars] = useState(2)
  const [outputs, setOutputs] = useState(() => new Array(4).fill(0))

  const { varNames, rows } = useMemo(() => buildTruthTableRows(numVars), [numVars])

  // Reset outputs when numVars changes
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

  const truthTable = useMemo(() => {
    return rows.map((row, i) => ({ ...row, output: outputs[i] || 0 }))
  }, [rows, outputs])

  const sopExpr = useMemo(() => generateSOP(varNames, truthTable), [varNames, truthTable])
  const posExpr = useMemo(() => generatePOS(varNames, truthTable), [varNames, truthTable])
  const minterms = getMintermIndices(truthTable)
  const maxterms = getMaxtermIndices(truthTable)

  return (
    <div>
      {/* Variable Count Selector */}
      <div className="mb-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Number of Variables</span>
        <div className="flex gap-2 mt-2">
          {[2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => handleVarChange(n)}
              className={`w-10 h-10 rounded-lg font-mono text-sm font-bold transition-all ${
                numVars === n
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'
              }`}
            >{n}</button>
          ))}
        </div>
      </div>

      {/* Editable Truth Table */}
      <div className="mb-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">
          Click output cells to set desired values (0 or 1)
        </span>
        <table className="truth-table w-full text-center border-collapse mt-2">
          <thead>
            <tr>
              <th className="px-3 py-2 text-indigo-300 font-mono text-sm rounded-tl-lg">Row</th>
              {varNames.map(v => (
                <th key={v} className="px-3 py-2 text-indigo-300 font-mono text-sm">{v}</th>
              ))}
              <th className="px-3 py-2 text-indigo-300 font-mono text-sm rounded-tr-lg">Output (F)</th>
            </tr>
          </thead>
          <tbody>
            {truthTable.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-mono text-xs border-t border-gray-800 text-gray-600">m{i}</td>
                {varNames.map(v => (
                  <td key={v} className={`px-3 py-2 font-mono text-sm border-t border-gray-800 ${row.inputs[v] ? 'text-green-400' : 'text-red-400'}`}>
                    {row.inputs[v]}
                  </td>
                ))}
                <td className="px-3 py-1.5 border-t border-gray-800">
                  <button
                    onClick={() => toggleOutput(i)}
                    className={`w-10 h-8 rounded-lg font-mono text-sm font-bold transition-all ${
                      outputs[i]
                        ? 'bg-green-600 text-white shadow-md shadow-green-500/30'
                        : 'bg-gray-800 text-red-400 border border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {outputs[i]}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick presets */}
      <div className="mb-5">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Quick Presets</span>
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => setOutputs(new Array(1 << numVars).fill(0))}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-red-500 hover:text-red-400 transition-all">
            All 0s
          </button>
          <button onClick={() => setOutputs(new Array(1 << numVars).fill(1))}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-green-500 hover:text-green-400 transition-all">
            All 1s
          </button>
          {numVars === 2 && (
            <>
              <button onClick={() => setOutputs([0, 1, 1, 0])}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
                XOR pattern
              </button>
              <button onClick={() => setOutputs([0, 0, 0, 1])}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
                AND pattern
              </button>
              <button onClick={() => setOutputs([0, 1, 1, 1])}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
                OR pattern
              </button>
            </>
          )}
        </div>
      </div>

      {/* Generated SOP & POS */}
      {(minterms.length > 0 || maxterms.length > 0) && (
        <div className="space-y-4">
          <div className="bg-amber-950/20 rounded-xl border border-amber-900/30 p-4">
            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">Sum of Products (SOP)</h4>
            <p className="font-mono text-amber-300 text-lg break-all">F = {sopExpr}</p>
            <p className="mt-2 text-xs font-mono text-gray-500">Σm({minterms.join(', ')})</p>
          </div>

          <div className="bg-cyan-950/20 rounded-xl border border-cyan-900/30 p-4">
            <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">Product of Sums (POS)</h4>
            <p className="font-mono text-cyan-300 text-lg break-all">F = {posExpr}</p>
            <p className="mt-2 text-xs font-mono text-gray-500">ΠM({maxterms.join(', ')})</p>
          </div>

          {/* Step-by-step for truth table mode */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 space-y-3">
            <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Step-by-Step</h4>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-indigo-400">1</span>
              </div>
              <p className="text-xs text-gray-400">
                <strong className="text-indigo-400">Variables:</strong> {varNames.join(', ')} ({varNames.length} variables → {1 << varNames.length} rows)
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-indigo-400">2</span>
              </div>
              <p className="text-xs text-gray-400">
                <strong className="text-amber-400">Minterms (output=1):</strong> {minterms.length > 0 ? minterms.map(m => `m${m}`).join(', ') : 'none'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-indigo-400">3</span>
              </div>
              <p className="text-xs text-gray-400">
                <strong className="text-cyan-400">Maxterms (output=0):</strong> {maxterms.length > 0 ? maxterms.map(m => `M${m}`).join(', ') : 'none'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-indigo-400">4</span>
              </div>
              <div className="text-xs text-gray-400">
                <p><strong className="text-amber-400">SOP:</strong> For each minterm, AND together the variables (complement if 0, normal if 1). Then OR all terms.</p>
                <p className="mt-1"><strong className="text-cyan-400">POS:</strong> For each maxterm, OR together the variables (complement if 1, normal if 0). Then AND all terms.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Module ───

export default function Module3() {
  const [mode, setMode] = useState('expression') // 'expression' | 'truthtable'
  const [expression, setExpression] = useState("A'B + AB'")
  const [inputVals, setInputVals] = useState({})

  const analysis = useMemo(() => {
    try {
      if (!expression.trim()) return null
      const tokens = tokenize(expression)
      if (tokens.length === 0) return null

      const ast = parse(tokens)
      const varSet = extractVars(ast)
      const variables = [...varSet].sort()

      if (variables.length === 0 || variables.length > 5) return null

      const truthTable = generateTruthTable(variables, ast)
      const sopExpr = generateSOP(variables, truthTable)
      const posExpr = generatePOS(variables, truthTable)
      const canonical = astToString(ast)

      return { ast, variables, truthTable, sopExpr, posExpr, canonical, error: null }
    } catch {
      return { error: 'Invalid expression. Use format like: A\'B + AB\' or (A+B)(A\'+C)' }
    }
  }, [expression])

  const handleExprChange = useCallback((val) => {
    setExpression(val)
    setInputVals({})
  }, [])

  const hasResult = analysis && !analysis.error && analysis.variables

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">SOP & POS Expression Simulator</h2>
        <p className="text-sm text-gray-500 mt-1">Module 3 — Enter a Boolean expression or design from truth table</p>
      </div>

      {/* Mode Toggle */}
      <section className="mb-6">
        <div className="flex gap-2">
          <button onClick={() => setMode('expression')}
            className={`px-5 py-2.5 rounded-lg font-mono text-sm font-medium transition-all duration-200 ${
              mode === 'expression'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            Enter Expression
          </button>
          <button onClick={() => setMode('truthtable')}
            className={`px-5 py-2.5 rounded-lg font-mono text-sm font-medium transition-all duration-200 ${
              mode === 'truthtable'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            Design from Truth Table
          </button>
        </div>
      </section>

      {mode === 'truthtable' ? (
        <section className="gate-box active p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-indigo-400">Design from Truth Table</h3>
            <p className="text-sm text-gray-500">Choose your variables, set desired outputs, get SOP & POS</p>
          </div>
          <DesignFromTruthTable />
        </section>
      ) : (
        <>
          {/* Expression Input */}
          <section className="gate-box active p-6 mb-6">
            <ExpressionInput expression={expression} onChange={handleExprChange} />
            <QuickExpressions onSelect={handleExprChange} />

            {analysis?.error && (
              <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 text-sm text-red-400 font-mono">
                {analysis.error}
              </div>
            )}

            {hasResult && (
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Parsed Expression</span>
                <p className="text-lg font-mono text-indigo-300 mt-1">F = {analysis.canonical}</p>
              </div>
            )}
          </section>

          {hasResult && (
            <>
              {/* SOP and POS */}
              <section className="gate-box p-6 mb-6">
                <SOPPOSPanel
                  variables={analysis.variables}
                  truthTable={analysis.truthTable}
                  sopExpr={analysis.sopExpr}
                  posExpr={analysis.posExpr}
                />
              </section>

              {/* Circuit Visualization */}
              <section className="gate-box p-6 mb-6">
                <CircuitVisualization ast={analysis.ast} variables={analysis.variables} />
              </section>

              {/* Truth Table */}
              <section className="gate-box p-6 mb-6">
                <TruthTablePanel
                  variables={analysis.variables}
                  truthTable={analysis.truthTable}
                  inputVals={inputVals}
                  setInputVals={setInputVals}
                />
              </section>

              {/* Step-by-step */}
              <section className="gate-box p-6">
                <StepByStep
                  expression={expression}
                  variables={analysis.variables}
                  sopExpr={analysis.sopExpr}
                  posExpr={analysis.posExpr}
                  truthTable={analysis.truthTable}
                />
              </section>
            </>
          )}
        </>
      )}
    </motion.div>
  )
}
