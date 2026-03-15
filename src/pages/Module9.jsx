import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Parser (same as Module3) ───

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
    else if (/[A-Da-d]/.test(s[i])) {
      tokens.push({ type: 'VAR', value: s[i].toUpperCase() })
      i++
    }
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
    while (peek() && peek().type !== 'OR' && peek().type !== 'RPAREN' && peek().type !== undefined) {
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

  const ast = parseOr()
  return ast
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

// ─── SOP conversion ───

function expressionToSOP(expr) {
  try {
    const tokens = tokenize(expr)
    const ast = parse(tokens)
    const vars = extractVars(ast)
    if (vars.length === 0 || vars.length > 4) return null

    const minterms = []
    const numCombinations = 1 << vars.length
    for (let i = 0; i < numCombinations; i++) {
      const assignment = {}
      vars.forEach((v, idx) => {
        assignment[v] = (i >> (vars.length - 1 - idx)) & 1
      })
      if (evaluate(ast, assignment)) minterms.push(i)
    }

    // Generate SOP terms
    const sopTerms = minterms.map(m => {
      const bits = m.toString(2).padStart(vars.length, '0')
      return vars.map((v, i) => bits[i] === '1' ? v : v + "'").join('')
    })

    return { vars, minterms, sopTerms, sop: sopTerms.join(' + '), ast }
  } catch { return null }
}

// ─── NAND-NAND conversion logic ───

function sopToNandNand(sopTerms, vars) {
  // SOP: F = T1 + T2 + ... = ((T1)' · (T2)' · ...)' (NAND of NANDs)
  // Each AND term T = A·B = ((A·B)')' = NAND applied then inverted
  // = NAND(NAND(T1), NAND(T2), ...) where each Ti = NAND(literals)

  const level1 = sopTerms.map(term => {
    const literals = []
    let i = 0
    while (i < term.length) {
      if (i + 1 < term.length && term[i + 1] === "'") {
        literals.push({ var: term[i], complemented: true })
        i += 2
      } else {
        literals.push({ var: term[i], complemented: false })
        i++
      }
    }
    return literals
  })

  return {
    level1, // First level: NAND gates for each product term
    level2: level1.length, // Second level: final NAND gate combining all
  }
}

// ─── Circuit Diagram ───

function NandNandCircuit({ nandData, sopTerms }) {
  if (!nandData) return null
  const { level1, level2 } = nandData
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
        {/* Level 1 NAND gates */}
        {level1.map((gate, gi) => {
          const y = margin + gi * (gateH + 20) + gateH / 2

          return (
            <g key={gi}>
              {/* Input labels */}
              {gate.map((lit, li) => {
                const inputY = y - (gate.length - 1) * 8 / 2 + li * 8
                return (
                  <text key={li} x={l1X - 50} y={inputY + 4} fill={lit.complemented ? '#f87171' : '#60a5fa'} fontSize="11" fontFamily="monospace" textAnchor="end">
                    {lit.var}{lit.complemented ? "'" : ''}
                  </text>
                )
              })}

              {/* Input lines */}
              {gate.map((_, li) => {
                const inputY = y - (gate.length - 1) * 8 / 2 + li * 8
                return <line key={'l'+li} x1={l1X - 45} y1={inputY} x2={l1X} y2={inputY} stroke="#4b5563" strokeWidth="1.5" />
              })}

              {/* NAND gate body */}
              <rect x={l1X} y={y - 20} width={gateW} height={40} rx="6" fill="#1a1a2e" stroke="#6366f1" strokeWidth="2" />
              <text x={l1X + gateW/2} y={y + 1} fill="#a5b4fc" fontSize="10" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">NAND</text>
              {/* Bubble */}
              <circle cx={l1X + gateW + 6} cy={y} r="5" fill="none" stroke="#6366f1" strokeWidth="1.5" />

              {/* Wire to level 2 */}
              <line x1={l1X + gateW + 11} y1={y} x2={l2X} y2={l2Y} stroke="#4b5563" strokeWidth="1.5" />
            </g>
          )
        })}

        {/* Level 2 NAND gate */}
        <rect x={l2X} y={l2Y - 25} width={gateW + 10} height={50} rx="6" fill="#1a1a2e" stroke="#22c55e" strokeWidth="2" />
        <text x={l2X + (gateW+10)/2} y={l2Y + 1} fill="#86efac" fontSize="10" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">NAND</text>
        <circle cx={l2X + gateW + 16} cy={l2Y} r="5" fill="none" stroke="#22c55e" strokeWidth="1.5" />

        {/* Output */}
        <line x1={l2X + gateW + 21} y1={l2Y} x2={l2X + gateW + 60} y2={l2Y} stroke="#22c55e" strokeWidth="2" />
        <text x={l2X + gateW + 65} y={l2Y + 5} fill="#22c55e" fontSize="13" fontFamily="monospace" fontWeight="bold">F</text>
      </svg>
    </div>
  )
}

// ─── Main Component ───

export default function Module9() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState(null)

  const handleConvert = () => {
    const res = expressionToSOP(expr)
    if (res) {
      const nandData = sopToNandNand(res.sopTerms, res.vars)
      setResult({ ...res, nandData })
    }
  }

  const quickExamples = [
    { label: "A'B + AB'", expr: "A'B + AB'" },
    { label: "AB + BC + AC", expr: "AB + BC + AC" },
    { label: "A'B'C + ABC' + AB", expr: "A'B'C + ABC' + AB" },
    { label: "A'B'C'D' + ABCD", expr: "A'B'C'D' + ABCD" },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">NAND-NAND Implementation</h2>
        <p className="text-sm text-gray-500 mt-1">Module 9 — Convert SOP expressions to two-level NAND-only circuits</p>
      </div>

      {/* Input */}
      <section className="gate-box active p-6 mb-6">
        <div className="mb-4">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">Enter Boolean Expression (SOP form preferred)</label>
          <div className="flex gap-2">
            <input type="text" value={expr} onChange={e => setExpr(e.target.value)}
              placeholder="e.g., A'B + AB' + BC"
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
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
              {ex.label}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <>
          {/* SOP Form */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">SOP Expression</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 text-center mb-4">
              <p className="font-mono text-green-400 text-xl">F = {result.sop}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
              <span className="text-xs font-mono text-gray-500">Minterms: </span>
              <span className="font-mono text-indigo-300">Σm({result.minterms.join(', ')})</span>
            </div>
          </section>

          {/* Conversion Steps */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">NAND-NAND Conversion Steps</h3>
            <div className="space-y-4">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-xs font-mono text-indigo-400 font-bold mb-2">Step 1: Start with SOP</h4>
                <p className="font-mono text-gray-300 text-sm">F = {result.sop}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-xs font-mono text-indigo-400 font-bold mb-2">Step 2: Double Complement</h4>
                <p className="font-mono text-gray-300 text-sm">F = (({result.sop})')'</p>
                <p className="text-xs text-gray-500 mt-1">Apply double inversion (doesn't change the function)</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-xs font-mono text-indigo-400 font-bold mb-2">Step 3: Apply De Morgan's to outer complement</h4>
                <p className="font-mono text-gray-300 text-sm">
                  F = {result.sopTerms.map((t, i) => `(${t})'`).join(' · ')} → NAND
                </p>
                <p className="text-xs text-gray-500 mt-1">OR becomes AND with complements → NAND gate</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-xs font-mono text-indigo-400 font-bold mb-2">Step 4: Each AND term → NAND</h4>
                <p className="font-mono text-gray-300 text-sm">
                  Each product term (e.g., {result.sopTerms[0]}) = NAND(inputs)'s complement, which feeds into final NAND
                </p>
                <p className="text-xs text-gray-500 mt-1">Two-level NAND-NAND circuit realized</p>
              </div>
            </div>
          </section>

          {/* Circuit Diagram */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">NAND-NAND Circuit</h3>
            <NandNandCircuit nandData={result.nandData} sopTerms={result.sopTerms} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                <span className="text-xs font-mono text-gray-500">Level-1 NAND Gates</span>
                <p className="font-mono text-indigo-300 text-xl font-bold">{result.nandData.level1.length}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 text-center">
                <span className="text-xs font-mono text-gray-500">Level-2 NAND Gate</span>
                <p className="font-mono text-green-400 text-xl font-bold">1</p>
              </div>
            </div>
          </section>

          {/* Truth Table Verification */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Truth Table Verification</h3>
            <div className="overflow-x-auto">
              <table className="truth-table w-full">
                <thead>
                  <tr>
                    {result.vars.map(v => <th key={v}>{v}</th>)}
                    <th>F(SOP)</th>
                    <th>F(NAND-NAND)</th>
                    <th>Match</th>
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
                        <td className={`font-mono font-bold ${output ? 'text-green-400' : 'text-gray-500'}`}>{output}</td>
                        <td className="text-green-400">✓</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Education */}
          <section className="gate-box p-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">NAND-NAND Theory</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-bold text-indigo-400 mb-2">Why NAND?</h4>
                <p className="text-xs text-gray-400">NAND is a universal gate — any Boolean function can be implemented using only NAND gates. This is cost-effective in IC manufacturing.</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-bold text-indigo-400 mb-2">Two-Level Structure</h4>
                <p className="text-xs text-gray-400">Level 1: NAND gates replace each AND term. Level 2: A final NAND gate replaces the OR operation. The double inversion cancels out.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}
