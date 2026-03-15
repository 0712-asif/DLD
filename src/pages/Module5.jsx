import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

// ─── K-Map Layout Helpers ───

const GRAY_CODE_2 = ['0', '1']
const GRAY_CODE_4 = ['00', '01', '11', '10']

function getKmapLayout(numVars) {
  if (numVars === 2) {
    return {
      rowVars: ['A'], colVars: ['B'],
      rowHeaders: GRAY_CODE_2, colHeaders: GRAY_CODE_2,
      rows: 2, cols: 2,
      cellToMinterm: [
        [0, 1],
        [2, 3],
      ],
    }
  }
  if (numVars === 3) {
    return {
      rowVars: ['A'], colVars: ['B', 'C'],
      rowHeaders: GRAY_CODE_2, colHeaders: GRAY_CODE_4,
      rows: 2, cols: 4,
      cellToMinterm: [
        [0, 1, 3, 2],
        [4, 5, 7, 6],
      ],
    }
  }
  return {
    rowVars: ['A', 'B'], colVars: ['C', 'D'],
    rowHeaders: GRAY_CODE_4, colHeaders: GRAY_CODE_4,
    rows: 4, cols: 4,
    cellToMinterm: [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [12, 13, 15, 14],
      [8, 9, 11, 10],
    ],
  }
}

function mintermToBinary(m, n) {
  return m.toString(2).padStart(n, '0')
}

// ─── K-Map Simplification (grouping) ───

function findGroups(cells, layout) {
  const { rows, cols, cellToMinterm } = layout
  const groups = []
  const totalCells = rows * cols

  // Build a set of active minterms
  const activeMinterms = new Set()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cells[cellToMinterm[r][c]]) {
        activeMinterms.add(cellToMinterm[r][c])
      }
    }
  }

  if (activeMinterms.size === 0) return []
  if (activeMinterms.size === totalCells) {
    return [{ cells: [...activeMinterms], size: totalCells, color: GROUP_COLORS[0] }]
  }

  // Try groups of size 8, 4, 2, 1 (greedy approach)
  const covered = new Set()
  const sizes = [8, 4, 2, 1].filter(s => s <= totalCells)

  for (const size of sizes) {
    const possibleGroups = getPossibleGroups(rows, cols, size, cellToMinterm)
    for (const pg of possibleGroups) {
      if (pg.every(m => activeMinterms.has(m)) && pg.some(m => !covered.has(m))) {
        groups.push({
          cells: pg,
          size,
          color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
        })
        pg.forEach(m => covered.add(m))
      }
    }
  }

  // Cover remaining
  for (const m of activeMinterms) {
    if (!covered.has(m)) {
      groups.push({
        cells: [m],
        size: 1,
        color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      })
      covered.add(m)
    }
  }

  return groups
}

function getPossibleGroups(rows, cols, size, cellToMinterm) {
  const groups = []

  if (size === 1) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        groups.push([cellToMinterm[r][c]])
    return groups
  }

  // Generate rectangular groups with wraparound
  const dimPairs = []
  if (size === 2) dimPairs.push([1, 2], [2, 1])
  if (size === 4) dimPairs.push([1, 4], [4, 1], [2, 2])
  if (size === 8) dimPairs.push([2, 4], [4, 2])

  for (const [h, w] of dimPairs) {
    if (h > rows || w > cols) continue
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cells = []
        for (let dr = 0; dr < h; dr++) {
          for (let dc = 0; dc < w; dc++) {
            cells.push(cellToMinterm[(r + dr) % rows][(c + dc) % cols])
          }
        }
        // Deduplicate
        const key = [...cells].sort((a, b) => a - b).join(',')
        if (!groups.some(g => [...g].sort((a, b) => a - b).join(',') === key)) {
          groups.push(cells)
        }
      }
    }
  }
  return groups
}

const GROUP_COLORS = [
  { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444', text: 'text-red-400' },
  { bg: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6', text: 'text-blue-400' },
  { bg: 'rgba(34, 197, 94, 0.25)', border: '#22c55e', text: 'text-green-400' },
  { bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7', text: 'text-purple-400' },
  { bg: 'rgba(234, 179, 8, 0.25)', border: '#eab308', text: 'text-yellow-400' },
  { bg: 'rgba(236, 72, 153, 0.25)', border: '#ec4899', text: 'text-pink-400' },
]

// ─── Simplify expression from groups ───

function simplifyFromGroups(groups, numVars) {
  const varNames = 'ABCD'.slice(0, numVars).split('')
  if (groups.length === 0) return '0'

  // Check if all cells covered = tautology
  const allMinterms = new Set()
  groups.forEach(g => g.cells.forEach(c => allMinterms.add(c)))
  if (allMinterms.size === (1 << numVars)) return '1'

  const terms = groups.map(group => {
    const binaries = group.cells.map(m => mintermToBinary(m, numVars))
    let term = ''
    for (let i = 0; i < numVars; i++) {
      const bits = binaries.map(b => b[i])
      if (bits.every(b => b === '0')) term += varNames[i] + "'"
      else if (bits.every(b => b === '1')) term += varNames[i]
      // else: variable is eliminated
    }
    return term || '1'
  })

  return [...new Set(terms)].join(' + ')
}

// ─── Components ───

function KmapGrid({ layout, cells, onToggle, groups, numVars }) {
  const { rowVars, colVars, rowHeaders, colHeaders, rows, cols, cellToMinterm } = layout

  // Build a map of minterm -> group colors
  const cellGroupColors = useMemo(() => {
    const map = {}
    groups.forEach(g => {
      g.cells.forEach(m => {
        if (!map[m]) map[m] = []
        map[m].push(g.color)
      })
    })
    return map
  }, [groups])

  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="px-3 py-2 text-xs font-mono text-gray-500">
              {rowVars.join('')}\{colVars.join('')}
            </th>
            {colHeaders.map((h, i) => (
              <th key={i} className="px-4 py-2 text-sm font-mono text-indigo-400 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowHeaders.map((rh, r) => (
            <tr key={r}>
              <td className="px-3 py-2 text-sm font-mono text-indigo-400 font-bold">{rh}</td>
              {colHeaders.map((_, c) => {
                const minterm = cellToMinterm[r][c]
                const val = cells[minterm] || 0
                const colors = cellGroupColors[minterm] || []

                return (
                  <td key={c} className="p-0">
                    <button
                      onClick={() => onToggle(minterm)}
                      className="relative w-14 h-14 rounded-lg font-mono text-lg font-bold transition-all duration-200 border-2"
                      style={{
                        background: colors.length > 0 ? colors[0].bg : val ? 'rgba(34, 197, 94, 0.1)' : '#111118',
                        borderColor: colors.length > 0 ? colors[0].border : val ? '#22c55e40' : '#1e1e2e',
                        color: val ? '#22c55e' : '#4b5563',
                      }}
                    >
                      {val}
                      <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-600 font-normal">
                        m{minterm}
                      </span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Module5() {
  const [numVars, setNumVars] = useState(3)
  const [cells, setCells] = useState({})

  const layout = useMemo(() => getKmapLayout(numVars), [numVars])

  const handleVarChange = (n) => {
    setNumVars(n)
    setCells({})
  }

  const toggleCell = (minterm) => {
    setCells(prev => ({ ...prev, [minterm]: prev[minterm] ? 0 : 1 }))
  }

  const groups = useMemo(() => findGroups(cells, layout), [cells, layout])
  const simplified = useMemo(() => simplifyFromGroups(groups, numVars), [groups, numVars])

  const activeCount = Object.values(cells).filter(v => v === 1).length
  const minterms = []
  for (let i = 0; i < (1 << numVars); i++) { if (cells[i]) minterms.push(i) }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Karnaugh Map Simulator</h2>
        <p className="text-sm text-gray-500 mt-1">Module 5 — Click cells to fill the K-map, get simplified Boolean expression</p>
      </div>

      {/* Controls */}
      <section className="gate-box active p-6 mb-6">
        <div className="mb-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">K-Map Size</h3>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => handleVarChange(n)}
                className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${
                  numVars === n
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'
                }`}
              >
                {n}-Variable
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setCells({})}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-red-500 hover:text-red-400 transition-all">
            Clear All
          </button>
          <button onClick={() => {
            const all = {}
            for (let i = 0; i < (1 << numVars); i++) all[i] = 1
            setCells(all)
          }}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 text-gray-400 border border-gray-800 hover:border-green-500 hover:text-green-400 transition-all">
            Fill All
          </button>
        </div>

        {/* K-Map Grid */}
        <KmapGrid
          layout={layout}
          cells={cells}
          onToggle={toggleCell}
          groups={groups}
          numVars={numVars}
        />

        <p className="text-xs text-gray-600 font-mono text-center mt-3">
          Click cells to toggle between 0 and 1 · {activeCount} cell{activeCount !== 1 ? 's' : ''} active
        </p>
      </section>

      {/* Groups & Simplified Expression */}
      <section className="gate-box p-6 mb-6">
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">Simplified Expression</h3>

        {/* Minterm notation */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 mb-4 text-center">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Minterms</span>
          <p className="font-mono text-indigo-300 text-lg mt-1">
            F = Σm({minterms.length > 0 ? minterms.join(', ') : '∅'})
          </p>
        </div>

        {/* Result */}
        <div className="bg-indigo-950/30 rounded-xl border border-indigo-900/30 p-5 text-center">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Minimized Expression</span>
          <p className="font-mono text-indigo-300 text-2xl mt-2 font-bold">F = {simplified}</p>
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div className="mt-4">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Groups Found: {groups.length}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {groups.map((g, i) => (
                <div key={i} className="px-3 py-2 rounded-lg border text-xs font-mono"
                  style={{ background: g.color.bg, borderColor: g.color.border, color: g.color.border }}>
                  Group {i + 1}: {g.cells.length} cells (m{g.cells.join(', m')})
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* How K-Maps Work */}
      <section className="gate-box p-6">
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4 text-center">How K-Maps Work</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-indigo-400 mb-2">Gray Code Ordering</h4>
            <p className="text-xs text-gray-400">Adjacent cells differ by only one variable. This enables visual grouping of terms that can be simplified.</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-indigo-400 mb-2">Grouping Rules</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Groups must be powers of 2 (1, 2, 4, 8)</li>
              <li>• Groups must be rectangular</li>
              <li>• Groups can wrap around edges</li>
              <li>• Larger groups = simpler terms</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-indigo-400 mb-2">Reading Groups</h4>
            <p className="text-xs text-gray-400">For each group, find variables that stay constant. If a variable is always 1, include it. If always 0, include its complement. If it changes, eliminate it.</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-bold text-indigo-400 mb-2">Final Expression</h4>
            <p className="text-xs text-gray-400">OR (sum) all the simplified group terms together to get the minimized SOP expression.</p>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
