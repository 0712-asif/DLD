import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Parser ───

function tokenize(expr) {
  const tokens = []
  let i = 0
  const s = expr.replace(/\s+/g, '')
  while (i < s.length) {
    if (s[i] === '(') { tokens.push({ type: 'LPAREN' }); i++ }
    else if (s[i] === ')') { tokens.push({ type: 'RPAREN' }); i++ }
    else if (s[i] === '+') { tokens.push({ type: 'OR' }); i++ }
    else if (s[i] === '·' || s[i] === '.') { tokens.push({ type: 'AND' }); i++ }
    else if (s[i] === "'") { tokens.push({ type: 'NOT' }); i++ }
    else if (/[A-Da-d]/.test(s[i])) { tokens.push({ type: 'VAR', value: s[i].toUpperCase() }); i++ }
    else i++
  }
  return tokens
}

function parse(tokens) {
  let pos = 0
  function peek() { return tokens[pos] }
  function consume(type) { if (tokens[pos]?.type === type) return tokens[pos++]; return null }

  function parseOr() {
    let left = parseAnd()
    while (peek()?.type === 'OR') { consume('OR'); left = { type: 'OR', left, right: parseAnd() } }
    return left
  }

  function parseAnd() {
    let left = parseUnary()
    while (peek() && peek().type !== 'OR' && peek().type !== 'RPAREN') {
      if (peek().type === 'AND') { consume('AND'); left = { type: 'AND', left, right: parseUnary() } }
      else if (peek().type === 'VAR' || peek().type === 'LPAREN') { left = { type: 'AND', left, right: parseUnary() } }
      else break
    }
    return left
  }

  function parseUnary() {
    let node = parsePrimary()
    while (peek()?.type === 'NOT') { consume('NOT'); node = { type: 'NOT', child: node } }
    return node
  }

  function parsePrimary() {
    if (peek()?.type === 'LPAREN') { consume('LPAREN'); const n = parseOr(); consume('RPAREN'); return n }
    if (peek()?.type === 'VAR') { const t = consume('VAR'); return { type: 'VAR', name: t.value } }
    return { type: 'VAR', name: '?' }
  }

  return parseOr()
}

function evaluate(ast, vars) {
  if (!ast) return 0
  if (ast.type === 'VAR') return vars[ast.name] || 0
  if (ast.type === 'NOT') return evaluate(ast.child, vars) ? 0 : 1
  if (ast.type === 'AND') return evaluate(ast.left, vars) & evaluate(ast.right, vars)
  if (ast.type === 'OR') return evaluate(ast.left, vars) | evaluate(ast.right, vars)
  return 0
}

function extractVars(ast) {
  const vars = new Set()
  function walk(node) {
    if (!node) return
    if (node.type === 'VAR') vars.add(node.name)
    if (node.left) walk(node.left)
    if (node.right) walk(node.right)
    if (node.child) walk(node.child)
  }
  walk(ast)
  return [...vars].sort()
}

// ─── POS conversion ───

function expressionToPOS(expr) {
  try {
    const tokens = tokenize(expr)
    const ast = parse(tokens)
    const vars = extractVars(ast)
    if (vars.length === 0 || vars.length > 4) return null

    const minterms = []
    const maxterms = []
    const numCombinations = 1 << vars.length
    for (let i = 0; i < numCombinations; i++) {
      const assignment = {}
      vars.forEach((v, idx) => { assignment[v] = (i >> (vars.length - 1 - idx)) & 1 })
      if (evaluate(ast, assignment)) minterms.push(i)
      else maxterms.push(i)
    }

    // Generate POS terms (maxterms)
    const posTerms = maxterms.map(m => {
      const bits = m.toString(2).padStart(vars.length, '0')
      return '(' + vars.map((v, i) => bits[i] === '0' ? v : v + "'").join(' + ') + ')'
    })

    return { vars, minterms, maxterms, posTerms, pos: posTerms.join(''), ast }
  } catch { return null }
}

// ─── NOR-NOR conversion ───

function posToNorNor(posTerms, vars) {
  // POS: F = M1 · M2 · ... where each Mi = (A+B+C')
  // NOR-NOR: Replace each OR with NOR (+ bubble), then AND with NOR (+ bubble)
  // Level 1: NOR gates for each sum term (with complemented inputs)
  // Level 2: Final NOR gate combining all

  const level1 = posTerms.map(term => {
    // Parse the maxterm like (A + B' + C)
    const inner = term.replace(/[()]/g, '').split('+').map(s => s.trim())
    return inner.map(lit => {
      const clean = lit.trim()
      if (clean.endsWith("'")) return { var: clean[0], complemented: true }
      return { var: clean[0], complemented: false }
    })
  })

  return { level1, level2: level1.length }
}

// ─── Circuit Diagram ───

function NorNorCircuit({ norData }) {
  if (!norData) return null
  const { level1, level2 } = norData
  const gateH = 50
  const gateW = 70
  const margin = 30
  const l1X = 120
  const l2X = 300
  const svgH = Math.max(200, level1.length * (gateH + 20) + 60)
  const l2Y = svgH / 2

  return (
    <div className="overflow-x-auto">
      <svg width="480" height={svgH} className="mx-auto">
        {/* Level 1 NOR gates */}
        {level1.map((gate, gi) => {
          const y = margin + gi * (gateH + 20) + gateH / 2
          return (
            <g key={gi}>
              {gate.map((lit, li) => {
                const inputY = y - (gate.length - 1) * 8 / 2 + li * 8
                return (
                  <g key={li}>
                    <text x={l1X - 50} y={inputY + 4} fill={lit.complemented ? '#f87171' : '#60a5fa'} fontSize="11" fontFamily="monospace" textAnchor="end">
                      {lit.var}{lit.complemented ? "'" : ''}
                    </text>
                    <line x1={l1X - 45} y1={inputY} x2={l1X} y2={inputY} stroke="#4b5563" strokeWidth="1.5" />
                  </g>
                )
              })}
              <rect x={l1X} y={y - 20} width={gateW} height={40} rx="6" fill="#1a1a2e" stroke="#f59e0b" strokeWidth="2" />
              <text x={l1X + gateW/2} y={y + 1} fill="#fcd34d" fontSize="10" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">NOR</text>
              <circle cx={l1X + gateW + 6} cy={y} r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={l1X + gateW + 11} y1={y} x2={l2X} y2={l2Y} stroke="#4b5563" strokeWidth="1.5" />
            </g>
          )
        })}

        {/* Level 2 NOR gate */}
        <rect x={l2X} y={l2Y - 25} width={gateW + 10} height={50} rx="6" fill="#1a1a2e" stroke="#22c55e" strokeWidth="2" />
        <text x={l2X + (gateW+10)/2} y={l2Y + 1} fill="#86efac" fontSize="10" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">NOR</text>
        <circle cx={l2X + gateW + 16} cy={l2Y} r="5" fill="none" stroke="#22c55e" strokeWidth="1.5" />

        <line x1={l2X + gateW + 21} y1={l2Y} x2={l2X + gateW + 60} y2={l2Y} stroke="#22c55e" strokeWidth="2" />
        <text x={l2X + gateW + 65} y={l2Y + 5} fill="#22c55e" fontSize="13" fontFamily="monospace" fontWeight="bold">F</text>
      </svg>
    </div>
  )
}

// ─── Main Component ───

export default function Module10() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState(null)

  const handleConvert = () => {
    const res = expressionToPOS(expr)
    if (res && res.maxterms.length > 0) {
      const norData = posToNorNor(res.posTerms, res.vars)
      setResult({ ...res, norData })
    } else if (res && res.maxterms.length === 0) {
      setResult({ ...res, norData: null, tautology: true })
    }
  }

  const quickExamples = [
    { label: "(A+B)(A'+C)", expr: "(A+B)(A'+C)" },
    { label: "(A+B')(A'+B)", expr: "(A+B')(A'+B)" },
    { label: "(A+B+C)(A'+B)", expr: "(A+B+C)(A'+B)" },
    { label: "A'B + AB'", expr: "A'B + AB'" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">NOR-NOR Implementation</h2>
        <p className="text-sm text-gray-500 mt-1">Module 10 — Convert POS expressions to two-level NOR-only circuits</p>
      </div>

      {/* Input */}
      <section className="gate-box active p-6 mb-6">
        <div className="mb-4">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">Enter Boolean Expression</label>
          <div className="flex gap-2">
            <input type="text" value={expr} onChange={e => setExpr(e.target.value)}
              placeholder="e.g., (A+B)(A'+C) or A'B + AB'"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              onKeyDown={e => e.key === 'Enter' && handleConvert()}
            />
            <button onClick={handleConvert}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-mono text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25">
              Convert
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickExamples.map((ex, i) => (
            <button key={i} onClick={() => setExpr(ex.expr)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-amber-500 hover:text-amber-400 transition-all">
              {ex.label}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <>
          {/* POS Form */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">POS Expression</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 text-center mb-4">
              <p className="font-mono text-amber-400 text-xl">
                {result.maxterms.length > 0 ? `F = ${result.pos}` : 'F = 1 (tautology — no maxterms)'}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                <span className="text-xs font-mono text-gray-500">Minterms: </span>
                <span className="font-mono text-green-400">Σm({result.minterms.join(', ')})</span>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                <span className="text-xs font-mono text-gray-500">Maxterms: </span>
                <span className="font-mono text-red-400">ΠM({result.maxterms.join(', ')})</span>
              </div>
            </div>
          </section>

          {result.norData && (
            <>
              {/* Conversion Steps */}
              <section className="gate-box p-6 mb-6">
                <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">NOR-NOR Conversion Steps</h3>
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-xs font-mono text-amber-400 font-bold mb-2">Step 1: Start with POS</h4>
                    <p className="font-mono text-gray-300 text-sm">F = {result.pos}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-xs font-mono text-amber-400 font-bold mb-2">Step 2: Double Complement</h4>
                    <p className="font-mono text-gray-300 text-sm">F = (({result.pos})')'</p>
                    <p className="text-xs text-gray-500 mt-1">Apply double inversion (doesn't change the function)</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-xs font-mono text-amber-400 font-bold mb-2">Step 3: Apply De Morgan's to outer complement</h4>
                    <p className="font-mono text-gray-300 text-sm">
                      F = {result.posTerms.map(t => `${t}'`).join(' + ')} → NOR
                    </p>
                    <p className="text-xs text-gray-500 mt-1">AND becomes OR with complements → NOR gate</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <h4 className="text-xs font-mono text-amber-400 font-bold mb-2">Step 4: Each OR term → NOR</h4>
                    <p className="font-mono text-gray-300 text-sm">
                      Each sum term feeds into a NOR gate at level 1, outputs go to final NOR at level 2
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Two-level NOR-NOR circuit realized</p>
                  </div>
                </div>
              </section>

              {/* Circuit */}
              <section className="gate-box p-6 mb-6">
                <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">NOR-NOR Circuit</h3>
                <NorNorCircuit norData={result.norData} />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                    <span className="text-xs font-mono text-gray-500">Level-1 NOR Gates</span>
                    <p className="font-mono text-amber-400 text-xl font-bold">{result.norData.level1.length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                    <span className="text-xs font-mono text-gray-500">Level-2 NOR Gate</span>
                    <p className="font-mono text-green-400 text-xl font-bold">1</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Truth Table */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Truth Table Verification</h3>
            <div className="overflow-x-auto">
              <table className="truth-table w-full">
                <thead>
                  <tr>
                    {result.vars.map(v => <th key={v}>{v}</th>)}
                    <th>F</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 1 << result.vars.length }, (_, i) => {
                    const bits = i.toString(2).padStart(result.vars.length, '0')
                    const assignment = {}
                    result.vars.forEach((v, idx) => { assignment[v] = parseInt(bits[idx]) })
                    const output = evaluate(result.ast, assignment)
                    return (
                      <tr key={i} className={output ? 'active-row' : ''}>
                        {bits.split('').map((b, bi) => <td key={bi} className="font-mono">{b}</td>)}
                        <td className={`font-mono font-bold ${output ? 'text-green-400' : 'text-gray-500'}`}>{output}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Education */}
          <section className="gate-box p-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">NOR-NOR Theory</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-bold text-amber-400 mb-2">Why NOR?</h4>
                <p className="text-xs text-gray-400">Like NAND, NOR is a universal gate. Any Boolean function can be implemented using only NOR gates. NOR-NOR is the dual of NAND-NAND.</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-bold text-amber-400 mb-2">POS → NOR-NOR</h4>
                <p className="text-xs text-gray-400">Start with POS form. Level 1 NOR gates implement each OR (sum) term with complemented inputs. Level 2 NOR gate implements the AND of all terms.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}
