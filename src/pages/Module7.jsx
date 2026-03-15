import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Layout Helpers ───

const GRAY_CODE_2 = ['0', '1']
const GRAY_CODE_4 = ['00', '01', '11', '10']

function getKmapLayout(numVars) {
  if (numVars === 2) return { rowVars: ['A'], colVars: ['B'], rowHeaders: GRAY_CODE_2, colHeaders: GRAY_CODE_2, rows: 2, cols: 2, cellToMinterm: [[0,1],[2,3]] }
  if (numVars === 3) return { rowVars: ['A'], colVars: ['B','C'], rowHeaders: GRAY_CODE_2, colHeaders: GRAY_CODE_4, rows: 2, cols: 4, cellToMinterm: [[0,1,3,2],[4,5,7,6]] }
  return { rowVars: ['A','B'], colVars: ['C','D'], rowHeaders: GRAY_CODE_4, colHeaders: GRAY_CODE_4, rows: 4, cols: 4, cellToMinterm: [[0,1,3,2],[4,5,7,6],[12,13,15,14],[8,9,11,10]] }
}

function mintermToBinary(m, n) { return m.toString(2).padStart(n, '0') }

// ─── Simplification with don't cares ───

function countOnes(n) { let c=0; while(n){c+=n&1;n>>=1} return c }

function findPrimeImplicantsWithDC(minterms, dontCares, numVars) {
  const allTerms = [...new Set([...minterms, ...dontCares])].sort((a,b)=>a-b)
  if (allTerms.length === 0) return { primeImplicants: [], expression: '0' }

  const allBits = (1 << numVars) - 1
  let current = allTerms.map(m => ({ value: m, dash: 0, minterms: [m] }))
  const primeImplicants = []

  while (current.length > 0) {
    const used = new Set()
    const next = []
    const seen = new Set()

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
            next.push({ value: newValue, dash: newDash, minterms: newMinterms })
          }
          used.add(i)
          used.add(j)
        }
      }
    }

    for (let i = 0; i < current.length; i++) {
      if (!used.has(i)) {
        if (!primeImplicants.some(p => p.value === current[i].value && p.dash === current[i].dash)) {
          primeImplicants.push(current[i])
        }
      }
    }
    current = next
  }

  // Find essential PIs — only cover actual minterms, not don't cares
  const mintermSet = new Set(minterms)
  const essential = []
  const covered = new Set()

  for (const m of minterms) {
    const covering = primeImplicants.filter(pi => pi.minterms.includes(m))
    if (covering.length === 1) {
      const epi = covering[0]
      if (!essential.includes(epi)) {
        essential.push(epi)
        epi.minterms.forEach(mt => { if (mintermSet.has(mt)) covered.add(mt) })
      }
    }
  }

  // Cover remaining minterms with smallest PIs
  const remaining = minterms.filter(m => !covered.has(m))
  const selected = [...essential]
  for (const m of remaining) {
    if (covered.has(m)) continue
    const covering = primeImplicants.filter(pi => pi.minterms.includes(m) && !selected.includes(pi))
    if (covering.length > 0) {
      const best = covering.sort((a, b) => b.minterms.length - a.minterms.length)[0]
      selected.push(best)
      best.minterms.forEach(mt => { if (mintermSet.has(mt)) covered.add(mt) })
    }
  }

  const vars = 'ABCD'.slice(0, numVars).split('')
  const expression = selected.length > 0
    ? selected.map(pi => {
        let term = ''
        for (let i = numVars - 1; i >= 0; i--) {
          const varIdx = numVars - 1 - i
          if (pi.dash & (1 << i)) continue
          if (pi.value & (1 << i)) term += vars[varIdx]
          else term += vars[varIdx] + "'"
        }
        return term || '1'
      }).join(' + ')
    : '0'

  return { primeImplicants, essential, selected, expression }
}

const GROUP_COLORS = ['#ef4444','#3b82f6','#22c55e','#a855f7','#eab308','#ec4899']

// ─── Main Component ───

export default function Module7() {
  const [numVars, setNumVars] = useState(3)
  // cells: 0 = off, 1 = on, 'x' = don't care
  const [cells, setCells] = useState({})

  const layout = useMemo(() => getKmapLayout(numVars), [numVars])
  const totalCells = 1 << numVars

  const toggleCell = (minterm) => {
    setCells(prev => {
      const current = prev[minterm] || 0
      const next = current === 0 ? 1 : current === 1 ? 'x' : 0
      return { ...prev, [minterm]: next }
    })
  }

  const minterms = useMemo(() => {
    const m = []
    for (let i = 0; i < totalCells; i++) if (cells[i] === 1) m.push(i)
    return m
  }, [cells, totalCells])

  const dontCares = useMemo(() => {
    const d = []
    for (let i = 0; i < totalCells; i++) if (cells[i] === 'x') d.push(i)
    return d
  }, [cells, totalCells])

  const result = useMemo(() => {
    if (minterms.length === 0 && dontCares.length === 0) return null
    return findPrimeImplicantsWithDC(minterms, dontCares, numVars)
  }, [minterms, dontCares, numVars])

  // Cell coloring
  const cellColors = useMemo(() => {
    if (!result || !result.selected) return {}
    const map = {}
    result.selected.forEach((pi, idx) => {
      pi.minterms.forEach(m => {
        if (cells[m] === 1 || cells[m] === 'x') {
          if (!map[m]) map[m] = []
          map[m].push(GROUP_COLORS[idx % GROUP_COLORS.length])
        }
      })
    })
    return map
  }, [result, cells])

  const { rowVars, colVars, rowHeaders, colHeaders, rows, cols, cellToMinterm } = layout

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Don't Care Conditions</h2>
        <p className="text-sm text-gray-500 mt-1">Module 7 — K-map simplification with don't care (X) conditions</p>
      </div>

      {/* Controls */}
      <section className="gate-box active p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Variables</h3>
          <div className="flex gap-2">
            {[2,3,4].map(n => (
              <button key={n} onClick={() => { setNumVars(n); setCells({}) }}
                className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${numVars===n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}>
                {n}-Variable
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 mb-5">
          <p className="text-xs text-gray-400 font-mono">
            Click cells to cycle: <span className="text-gray-500">0</span> → <span className="text-green-400">1</span> → <span className="text-yellow-400">X</span> → <span className="text-gray-500">0</span>
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setCells({})}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-red-500 hover:text-red-400 transition-all">
            Clear All
          </button>
        </div>

        {/* K-Map Grid */}
        <div className="overflow-x-auto">
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
                    const val = cells[mt] || 0
                    const colors = cellColors[mt] || []
                    const isOne = val === 1
                    const isDC = val === 'x'

                    return (
                      <td key={c} className="p-0">
                        <button onClick={() => toggleCell(mt)}
                          className="relative w-14 h-14 rounded-lg font-mono text-lg font-bold transition-all duration-200 border-2"
                          style={{
                            background: colors.length > 0 ? colors[0] + '30' : isOne ? 'rgba(34,197,94,0.1)' : isDC ? 'rgba(234,179,8,0.1)' : '#111118',
                            borderColor: colors.length > 0 ? colors[0] : isOne ? '#22c55e40' : isDC ? '#eab30840' : '#1e1e2e',
                            color: isOne ? '#22c55e' : isDC ? '#eab308' : '#4b5563',
                          }}>
                          {isDC ? 'X' : val}
                          <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-600 font-normal">m{mt}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-600 font-mono text-center mt-3">
          {minterms.length} minterm{minterms.length !== 1 ? 's' : ''} · {dontCares.length} don't care{dontCares.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Notation */}
      <section className="gate-box p-6 mb-6">
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Function Notation</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 text-center">
            <span className="text-xs font-mono text-gray-500">Minterms</span>
            <p className="font-mono text-green-400 text-lg mt-1">Σm({minterms.length > 0 ? minterms.join(', ') : '∅'})</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 text-center">
            <span className="text-xs font-mono text-gray-500">Don't Cares</span>
            <p className="font-mono text-yellow-400 text-lg mt-1">d({dontCares.length > 0 ? dontCares.join(', ') : '∅'})</p>
          </div>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className="gate-box p-6 mb-6">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Minimized Expression</h3>
          <div className="bg-indigo-950/30 rounded-xl border border-indigo-900/30 p-5 text-center mb-4">
            <p className="font-mono text-indigo-300 text-2xl font-bold">F = {result.expression}</p>
          </div>

          {result.selected && result.selected.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Selected Terms</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.selected.map((pi, i) => {
                  const isEPI = result.essential.includes(pi)
                  const vars = 'ABCD'.slice(0, numVars).split('')
                  let term = ''
                  for (let b = numVars - 1; b >= 0; b--) {
                    const varIdx = numVars - 1 - b
                    if (pi.dash & (1 << b)) continue
                    if (pi.value & (1 << b)) term += vars[varIdx]
                    else term += vars[varIdx] + "'"
                  }
                  return (
                    <div key={i} className="px-3 py-2 rounded-lg border text-xs font-mono"
                      style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] + '20', borderColor: GROUP_COLORS[i % GROUP_COLORS.length], color: GROUP_COLORS[i % GROUP_COLORS.length] }}>
                      {term || '1'} → covers m{pi.minterms.join(', m')}
                      {isEPI && <span className="ml-2 text-yellow-400">★ EPI</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Education */}
      <section className="gate-box p-6">
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">About Don't Care Conditions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">What are Don't Cares?</h4>
            <p className="text-xs text-gray-400">Don't care conditions (X) represent input combinations that will never occur or whose output doesn't matter. They can be treated as either 0 or 1 during minimization.</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">How They Help</h4>
            <p className="text-xs text-gray-400">By treating don't cares as 1 when beneficial, we can form larger groups in the K-map, leading to simpler expressions with fewer gates.</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">Common Examples</h4>
            <p className="text-xs text-gray-400">BCD code only uses 0-9, so combinations 10-15 are don't cares. Seven-segment displays also have don't care conditions for unused segments.</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">Key Rule</h4>
            <p className="text-xs text-gray-400">Don't cares can be included in groups to make them larger, but a group consisting entirely of don't cares should not be formed — at least one actual minterm must be in each group.</p>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
