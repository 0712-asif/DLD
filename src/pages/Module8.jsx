import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── Quine-McCluskey Algorithm ───

function countOnes(n) { let c=0; while(n){c+=n&1;n>>=1} return c }

function mintermToBinary(m, n) { return m.toString(2).padStart(n, '0') }

function formatWithDash(value, dash, numVars) {
  let s = ''
  for (let i = numVars - 1; i >= 0; i--) {
    if (dash & (1 << i)) s += '-'
    else if (value & (1 << i)) s += '1'
    else s += '0'
  }
  return s
}

function implicantToExpr(value, dash, numVars) {
  const vars = 'ABCD'.slice(0, numVars).split('')
  let term = ''
  for (let i = numVars - 1; i >= 0; i--) {
    const varIdx = numVars - 1 - i
    if (dash & (1 << i)) continue
    if (value & (1 << i)) term += vars[varIdx]
    else term += vars[varIdx] + "'"
  }
  return term || '1'
}

function quineMccluskey(mintermList, dontCareList, numVars) {
  const allTerms = [...new Set([...mintermList, ...dontCareList])].sort((a,b) => a-b)
  if (allTerms.length === 0) return { rounds: [], primeImplicants: [], chart: null, essential: [], expression: '0' }

  const allBits = (1 << numVars) - 1

  // Step 1: Group minterms by number of 1s
  let current = allTerms.map(m => ({
    value: m, dash: 0, minterms: [m], id: 'm' + m
  }))

  const rounds = []
  const allPIs = []

  while (current.length > 0) {
    // Group by ones count
    const groups = {}
    current.forEach(t => {
      const activeBits = allBits & ~t.dash
      let ones = 0
      for (let i = 0; i < numVars; i++) {
        if ((t.value & (1 << i)) && (activeBits & (1 << i))) ones++
      }
      if (!groups[ones]) groups[ones] = []
      groups[ones].push(t)
    })

    const roundData = { groups: {}, combinations: [] }
    Object.keys(groups).sort((a,b) => a-b).forEach(k => {
      roundData.groups[k] = groups[k].map(t => ({
        binary: formatWithDash(t.value, t.dash, numVars),
        minterms: t.minterms,
      }))
    })

    const used = new Set()
    const next = []
    const seen = new Set()

    const sortedGroups = Object.keys(groups).map(Number).sort((a,b) => a-b)

    for (let g = 0; g < sortedGroups.length - 1; g++) {
      const g1 = sortedGroups[g]
      const g2 = sortedGroups[g + 1]
      if (g2 - g1 !== 1) continue

      for (const t1 of groups[g1]) {
        for (const t2 of groups[g2]) {
          if (t1.dash !== t2.dash) continue
          const activeBits = allBits & ~t1.dash
          const diff = (t1.value ^ t2.value) & activeBits
          if (countOnes(diff) === 1) {
            const newDash = t1.dash | diff
            const newValue = t1.value & ~diff
            const newMinterms = [...new Set([...t1.minterms, ...t2.minterms])].sort((a,b)=>a-b)
            const key = newValue + '|' + newDash

            if (!seen.has(key)) {
              seen.add(key)
              next.push({ value: newValue, dash: newDash, minterms: newMinterms, id: key })
              roundData.combinations.push({
                from: [formatWithDash(t1.value, t1.dash, numVars), formatWithDash(t2.value, t2.dash, numVars)],
                result: formatWithDash(newValue, newDash, numVars),
                minterms: newMinterms,
              })
            }
            used.add(t1.id)
            used.add(t2.id)
          }
        }
      }
    }

    // Uncombined = prime implicants
    for (const t of current) {
      if (!used.has(t.id)) {
        if (!allPIs.some(p => p.value === t.value && p.dash === t.dash)) {
          allPIs.push(t)
        }
      }
    }

    rounds.push(roundData)
    current = next.map((t, i) => ({ ...t, id: 'r' + rounds.length + '_' + i }))
  }

  // Step 2: Prime Implicant Chart
  const mintermSet = new Set(mintermList)
  const chart = {
    pis: allPIs.map((pi, i) => ({
      index: i,
      binary: formatWithDash(pi.value, pi.dash, numVars),
      expression: implicantToExpr(pi.value, pi.dash, numVars),
      minterms: pi.minterms,
      coversActual: pi.minterms.filter(m => mintermSet.has(m)),
    })),
    minterms: mintermList,
  }

  // Step 3: Find essential PIs
  const essential = []
  const covered = new Set()

  for (const m of mintermList) {
    const covering = allPIs.filter(pi => pi.minterms.includes(m))
    if (covering.length === 1) {
      if (!essential.includes(covering[0])) {
        essential.push(covering[0])
        covering[0].minterms.forEach(mt => { if (mintermSet.has(mt)) covered.add(mt) })
      }
    }
  }

  // Cover remaining
  const selected = [...essential]
  const remaining = mintermList.filter(m => !covered.has(m))
  for (const m of remaining) {
    if (covered.has(m)) continue
    const covering = allPIs.filter(pi => pi.minterms.includes(m) && !selected.includes(pi))
    if (covering.length > 0) {
      const best = covering.sort((a,b) => b.minterms.filter(x => mintermSet.has(x) && !covered.has(x)).length - a.minterms.filter(x => mintermSet.has(x) && !covered.has(x)).length)[0]
      selected.push(best)
      best.minterms.forEach(mt => { if (mintermSet.has(mt)) covered.add(mt) })
    }
  }

  const expression = selected.length > 0
    ? selected.map(pi => implicantToExpr(pi.value, pi.dash, numVars)).join(' + ')
    : '0'

  return { rounds, primeImplicants: allPIs, chart, essential, selected, expression }
}

// ─── Main Component ───

export default function Module8() {
  const [numVars, setNumVars] = useState(4)
  const [mintermInput, setMintermInput] = useState('')
  const [dcInput, setDcInput] = useState('')
  const [result, setResult] = useState(null)

  const maxMinterm = (1 << numVars) - 1

  const handleRun = () => {
    const minterms = mintermInput.split(/[,\s]+/).map(s => parseInt(s.trim(),10)).filter(n => !isNaN(n) && n >= 0 && n <= maxMinterm)
    const dcs = dcInput.split(/[,\s]+/).map(s => parseInt(s.trim(),10)).filter(n => !isNaN(n) && n >= 0 && n <= maxMinterm)
    const unique = [...new Set(minterms)].sort((a,b) => a-b)
    const uniqueDC = [...new Set(dcs)].filter(d => !unique.includes(d)).sort((a,b) => a-b)
    setResult(quineMccluskey(unique, uniqueDC, numVars))
  }

  const presets = numVars === 4
    ? [
      { label: 'Σm(0,1,2,5,6,7,8,9,10,14)', m: '0,1,2,5,6,7,8,9,10,14', d: '' },
      { label: 'Σm(2,6,8,9,10,11,14,15)', m: '2,6,8,9,10,11,14,15', d: '' },
      { label: 'Σm(0,1,2,8,9) + d(10,11)', m: '0,1,2,8,9', d: '10,11' },
    ]
    : numVars === 3
    ? [
      { label: 'Σm(0,1,2,5,6,7)', m: '0,1,2,5,6,7', d: '' },
      { label: 'Σm(1,3,5,7)', m: '1,3,5,7', d: '' },
    ]
    : [{ label: 'Σm(0,1,3)', m: '0,1,3', d: '' }]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Quine-McCluskey Method</h2>
        <p className="text-sm text-gray-500 mt-1">Module 8 — Tabular method for Boolean function minimization</p>
      </div>

      {/* Input */}
      <section className="gate-box active p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Variables</h3>
          <div className="flex gap-2">
            {[2,3,4].map(n => (
              <button key={n} onClick={() => { setNumVars(n); setResult(null) }}
                className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${numVars===n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}>
                {n}-Variable
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">Minterms (0-{maxMinterm})</label>
            <input type="text" value={mintermInput} onChange={e => setMintermInput(e.target.value)}
              placeholder="e.g., 0,1,2,5,6,7"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              onKeyDown={e => e.key === 'Enter' && handleRun()}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider font-mono block mb-2">Don't Cares (optional)</label>
            <input type="text" value={dcInput} onChange={e => setDcInput(e.target.value)}
              placeholder="e.g., 10,11"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 font-mono text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              onKeyDown={e => e.key === 'Enter' && handleRun()}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleRun}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-mono text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25">
            Run Quine-McCluskey
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <button key={i} onClick={() => { setMintermInput(p.m); setDcInput(p.d) }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-500 hover:text-indigo-400 transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <>
          {/* Step 1: Grouping Rounds */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Step 1: Iterative Combination Rounds</h3>
            {result.rounds.map((round, ri) => (
              <div key={ri} className="mb-5">
                <h4 className="text-xs font-mono text-indigo-400 font-bold mb-3">Column {ri + 1}</h4>
                <div className="overflow-x-auto">
                  <table className="truth-table w-full mb-3">
                    <thead>
                      <tr>
                        <th>Group (# of 1s)</th>
                        <th>Binary</th>
                        <th>Minterms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(round.groups).sort(([a],[b]) => a-b).map(([ones, terms]) =>
                        terms.map((t, ti) => (
                          <tr key={ones + '-' + ti} className={ti === 0 && parseInt(ones) > 0 ? 'border-t-2 border-gray-700' : ''}>
                            {ti === 0 && <td rowSpan={terms.length} className="font-mono text-indigo-400 font-bold text-center">{ones}</td>}
                            <td className="font-mono text-gray-300">{t.binary}</td>
                            <td className="font-mono text-gray-400 text-xs">{t.minterms.join(', ')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {round.combinations.length > 0 && (
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <span className="text-xs font-mono text-gray-500">{round.combinations.length} combination{round.combinations.length !== 1 ? 's' : ''} found:</span>
                    <div className="mt-1 space-y-1">
                      {round.combinations.slice(0, 10).map((c, ci) => (
                        <p key={ci} className="text-xs font-mono text-gray-400">
                          <span className="text-gray-500">{c.from[0]}</span> + <span className="text-gray-500">{c.from[1]}</span> → <span className="text-indigo-300">{c.result}</span>
                          <span className="text-gray-600 ml-2">({c.minterms.join(',')})</span>
                        </p>
                      ))}
                      {round.combinations.length > 10 && <p className="text-xs text-gray-600">...and {round.combinations.length - 10} more</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Step 2: Prime Implicant Chart */}
          {result.chart && (
            <section className="gate-box p-6 mb-6">
              <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Step 2: Prime Implicant Chart</h3>
              <div className="overflow-x-auto">
                <table className="truth-table w-full">
                  <thead>
                    <tr>
                      <th>PI</th>
                      <th>Binary</th>
                      <th>Expression</th>
                      {result.chart.minterms.map(m => <th key={m} className="text-center">m{m}</th>)}
                      <th>Essential?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.chart.pis.map((pi, i) => {
                      const isEssential = result.essential.some(e => e.value === result.primeImplicants[pi.index].value && e.dash === result.primeImplicants[pi.index].dash)
                      return (
                        <tr key={i} className={isEssential ? 'active-row' : ''}>
                          <td className="font-mono text-gray-400">PI{i+1}</td>
                          <td className="font-mono text-indigo-300">{pi.binary}</td>
                          <td className="font-mono text-green-400">{pi.expression}</td>
                          {result.chart.minterms.map(m => (
                            <td key={m} className="text-center">
                              {pi.coversActual.includes(m) ? <span className="text-green-400 font-bold">✓</span> : <span className="text-gray-700">·</span>}
                            </td>
                          ))}
                          <td>{isEssential ? <span className="text-yellow-400 font-bold">★</span> : <span className="text-gray-600">-</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Result */}
          <section className="gate-box p-6 mb-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Minimized Expression</h3>
            <div className="bg-indigo-950/30 rounded-xl border border-indigo-900/30 p-5 text-center">
              <p className="font-mono text-indigo-300 text-2xl font-bold">F = {result.expression}</p>
            </div>
          </section>

          {/* Education */}
          <section className="gate-box p-6">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">About Quine-McCluskey</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-bold text-indigo-400 mb-2">Why Use It?</h4>
                <p className="text-xs text-gray-400">Unlike K-maps (limited to ~4 variables), Quine-McCluskey works with any number of variables and can be easily programmed.</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h4 className="text-sm font-bold text-indigo-400 mb-2">The Process</h4>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Group minterms by number of 1s</li>
                  <li>Combine adjacent groups (differ by 1 bit)</li>
                  <li>Repeat until no more combinations</li>
                  <li>Use PI chart to find essential PIs</li>
                </ol>
              </div>
            </div>
          </section>
        </>
      )}
    </motion.div>
  )
}
