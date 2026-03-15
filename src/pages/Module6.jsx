import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Helpers ───

const GRAY_CODE_4 = ['00', '01', '11', '10']
const GRAY_CODE_2 = ['0', '1']

function getKmapLayout(numVars) {
  if (numVars === 2) return { rowVars: ['A'], colVars: ['B'], rowHeaders: GRAY_CODE_2, colHeaders: GRAY_CODE_2, rows: 2, cols: 2, cellToMinterm: [[0,1],[2,3]] }
  if (numVars === 3) return { rowVars: ['A'], colVars: ['B','C'], rowHeaders: GRAY_CODE_2, colHeaders: GRAY_CODE_4, rows: 2, cols: 4, cellToMinterm: [[0,1,3,2],[4,5,7,6]] }
  return { rowVars: ['A','B'], colVars: ['C','D'], rowHeaders: GRAY_CODE_4, colHeaders: GRAY_CODE_4, rows: 4, cols: 4, cellToMinterm: [[0,1,3,2],[4,5,7,6],[12,13,15,14],[8,9,11,10]] }
}

function mintermToBinary(m, n) { return m.toString(2).padStart(n, '0') }

// ─── Prime Implicant computation ───

function countOnes(n) { let c=0; while(n){c+=n&1;n>>=1} return c }

function combine(a, b, numVars) {
  const diff = a.mask ^ b.mask
  if (countOnes(diff) !== 1) return null
  if ((a.value & ~diff) !== (b.value & ~diff)) return null
  return { value: a.value & ~diff, dash: a.dash | diff, mask: a.mask, minterms: [...new Set([...a.minterms, ...b.minterms])].sort((x,y)=>x-y) }
}

function findPrimeImplicants(minterms, numVars) {
  if (minterms.length === 0) return []
  const totalBits = numVars
  const allBits = (1 << totalBits) - 1

  let current = minterms.map(m => ({
    value: m, dash: 0, mask: allBits, minterms: [m],
  }))

  const primeImplicants = []
  const steps = []
  let round = 0

  while (current.length > 0) {
    const used = new Set()
    const next = []
    const seen = new Set()

    // Group by number of 1s in value (ignoring dashes)
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        if (current[i].dash !== current[j].dash) continue
        const activeBits = allBits & ~current[i].dash
        const diff = (current[i].value ^ current[j].value) & activeBits
        if (countOnes(diff) === 1) {
          const newDash = current[i].dash | diff
          const newValue = current[i].value & ~diff
          const newMinterms = [...new Set([...current[i].minterms, ...current[j].minterms])].sort((a,b)=>a-b)
          const key = newValue + '|' + newDash
          if (!seen.has(key)) {
            seen.add(key)
            next.push({ value: newValue, dash: newDash, mask: allBits, minterms: newMinterms })
          }
          used.add(i)
          used.add(j)
        }
      }
    }

    // Uncombined terms are prime implicants
    for (let i = 0; i < current.length; i++) {
      if (!used.has(i)) {
        const key = current[i].value + '|' + current[i].dash
        if (!primeImplicants.some(p => p.value === current[i].value && p.dash === current[i].dash)) {
          primeImplicants.push(current[i])
        }
      }
    }

    steps.push({ round: round + 1, terms: current.map(t => formatImplicant(t, totalBits)), combined: next.length })
    current = next
    round++
  }

  return { primeImplicants, steps }
}

function formatImplicant(impl, numVars) {
  let s = ''
  for (let i = numVars - 1; i >= 0; i--) {
    if (impl.dash & (1 << i)) s += '-'
    else if (impl.value & (1 << i)) s += '1'
    else s += '0'
  }
  return s
}

function implicantToExpression(impl, numVars) {
  const vars = 'ABCD'.slice(0, numVars).split('')
  let term = ''
  for (let i = numVars - 1; i >= 0; i--) {
    const varIdx = numVars - 1 - i
    if (impl.dash & (1 << i)) continue
    if (impl.value & (1 << i)) term += vars[varIdx]
    else term += vars[varIdx] + "'"
  }
  return term || '1'
}

// ─── Essential Prime Implicants ───

function findEssentialPIs(primeImplicants, minterms) {
  const essential = []
  const covered = new Set()

  for (const m of minterms) {
    const covering = primeImplicants.filter(pi => pi.minterms.includes(m))
    if (covering.length === 1) {
      const epi = covering[0]
      if (!essential.includes(epi)) {
        essential.push(epi)
        epi.minterms.forEach(mt => covered.add(mt))
      }
    }
  }

  return { essential, covered }
}

// ─── K-Map display ───

function KmapWithGroups({ numVars, minterms, primeImplicants, essential }) {
  const layout = getKmapLayout(numVars)
  const { rowVars, colVars, rowHeaders, colHeaders, rows, cols, cellToMinterm } = layout
  const mintermSet = new Set(minterms)

  const GROUP_COLORS = ['#ef4444','#3b82f6','#22c55e','#a855f7','#eab308','#ec4899']

  // Map minterm to PI colors
  const cellColors = {}
  essential.forEach((pi, idx) => {
    pi.minterms.forEach(m => {
      if (!cellColors[m]) cellColors[m] = []
      cellColors[m].push(GROUP_COLORS[idx % GROUP_COLORS.length])
    })
  })

  return (
    <table className="mx-auto border-separate border-spacing-1">
      <thead>
        <tr>
          <th className="px-3 py-2 text-xs font-mono text-gray-500">{rowVars.join('')}\{colVars.join('')}</th>
          {colHeaders.map((h,i) => <th key={i} className="px-4 py-2 text-sm font-mono text-indigo-400 font-bold">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rowHeaders.map((rh, r) => (
          <tr key={r}>
            <td className="px-3 py-2 text-sm font-mono text-indigo-400 font-bold">{rh}</td>
            {colHeaders.map((_, c) => {
              const mt = cellToMinterm[r][c]
              const active = mintermSet.has(mt)
              const colors = cellColors[mt] || []
              return (
                <td key={c} className="p-0">
                  <div className="w-14 h-14 rounded-lg font-mono text-lg font-bold flex items-center justify-center border-2 relative"
                    style={{
                      background: colors.length > 0 ? colors[0] + '30' : active ? 'rgba(34,197,94,0.1)' : '#111118',
                      borderColor: colors.length > 0 ? colors[0] : active ? '#22c55e40' : '#1e1e2e',
                      color: active ? '#22c55e' : '#4b5563',
                    }}>
                    {active ? '1' : '0'}
                    <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-600 font-normal">m{mt}</span>
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Main Component ───

export default function Module6() {
  const [numVars, setNumVars] = useState(3)
  const [mintermInput, setMintermInput] = useState('')
  const [activeMinterms, setActiveMinterms] = useState(null)

  const maxMinterm = (1 << numVars) - 1

  const handleAnalyze = () => {
    const parsed = mintermInput
      .split(/[,\s]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= maxMinterm)
    const unique = [...new Set(parsed)].sort((a,b) => a-b)
    setActiveMinterms(unique)
  }

  const result = useMemo(() => {
    if (!activeMinterms || activeMinterms.length === 0) return null
    const { primeImplicants, steps } = findPrimeImplicants(activeMinterms, numVars)
    const { essential, covered } = findEssentialPIs(primeImplicants, activeMinterms)
    const expression = essential.length > 0
      ? essential.map(pi => implicantToExpression(pi, numVars)).join(' + ')
      : '0'
    return { primeImplicants, steps, essential, covered, expression }
  }, [activeMinterms, numVars])

  const presets = numVars === 3
    ? [{ label: 'Σm(1,3,5,7)', val: '1,3,5,7' }, { label: 'Σm(0,2,4,6)', val: '0,2,4,6' }, { label: 'Σm(0,1,2,5,7)', val: '0,1,2,5,7' }]
    : numVars === 4
    ? [{ label: 'Σm(0,1,2,5,8,9,10)', val: '0,1,2,5,8,9,10' }, { label: 'Σm(4,5,6,7,12,13,14,15)', val: '4,5,6,7,12,13,14,15' }, { label: 'Σm(0,2,5,7,8,10,13,15)', val: '0,2,5,7,8,10,13,15' }]
    : [{ label: 'Σm(0,1,3)', val: '0,1,3' }, { label: 'Σm(1,2,3)', val: '1,2,3' }]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Essential Prime Implicant Finder</h2>
        <p className="text-sm text-gray-500 mt-1">Module 6 — Find prime implicants and essential prime implicants</p>
      </div>

      {/* Input */}
      <section className="gate-box active p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Number of Variables</h3>
          <div className="flex gap-2">
            {[2,3,4].map(n => (
              <button key={n} onClick={() => { setNumVars(n); setActiveMinterms(null); setMintermInput('') }}
                className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${numVars===n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}>
                {n}-Variable
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">Enter Minterms (comma-separated, 0-{maxMinterm})</label>
          <div className="flex gap-2">
            <input type="text" value={mintermInput} onChange={e => setMintermInput(e.target.value)}
              placeholder="e.g., 0,1,3,5,7"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            />
            <button onClick={handleAnalyze}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-mono text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25">
              Analyze
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <button key={i} onClick={() => { setMintermInput(p.val); }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <>
          {/* K-Map */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">K-Map Visualization</h3>
            <KmapWithGroups numVars={numVars} minterms={activeMinterms} primeImplicants={result.primeImplicants} essential={result.essential} />
          </section>

          {/* Steps */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Step-by-Step Process</h3>
            {result.steps.map((step, i) => (
              <div key={i} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 mb-3">
                <h4 className="text-xs font-mono text-indigo-400 font-bold mb-2">Round {step.round}</h4>
                <p className="text-xs text-gray-400 font-mono">Terms: {step.terms.join(', ')}</p>
                <p className="text-xs text-gray-500 mt-1">{step.combined} new combinations formed</p>
              </div>
            ))}
          </section>

          {/* Prime Implicants Table */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Prime Implicants</h3>
            <div className="overflow-x-auto">
              <table className="truth-table w-full">
                <thead>
                  <tr>
                    <th>PI</th>
                    <th>Binary</th>
                    <th>Covers Minterms</th>
                    <th>Expression</th>
                    <th>Essential?</th>
                  </tr>
                </thead>
                <tbody>
                  {result.primeImplicants.map((pi, i) => {
                    const isEssential = result.essential.includes(pi)
                    return (
                      <tr key={i} className={isEssential ? 'active-row' : ''}>
                        <td className="font-mono text-gray-400">PI{i+1}</td>
                        <td className="font-mono text-indigo-300">{formatImplicant(pi, numVars)}</td>
                        <td className="font-mono text-gray-300">{pi.minterms.join(', ')}</td>
                        <td className="font-mono text-green-400">{implicantToExpression(pi, numVars)}</td>
                        <td>{isEssential ? <span className="text-yellow-400 font-bold">★ Yes</span> : <span className="text-gray-600">No</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Result */}
          <section className="gate-box p-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Minimized Expression</h3>
            <div className="bg-indigo-950/30 rounded-xl border border-indigo-900/30 p-5 text-center">
              <p className="font-mono text-indigo-300 text-2xl font-bold">F = {result.expression}</p>
            </div>
            <div className="mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-xs text-gray-400">
                <strong className="text-indigo-400">Essential Prime Implicants</strong> are prime implicants that cover at least one minterm not covered by any other prime implicant. They must be included in the final minimized expression.
              </p>
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}
