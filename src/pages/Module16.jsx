import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ApplicationShell from './ApplicationShell'

const CANDIDATES = ['Candidate A', 'Candidate B', 'Candidate C']

export default function Module16() {
  const [votes, setVotes] = useState([0, 0, 0])

  const totalVotes = useMemo(() => votes.reduce((a, b) => a + b, 0), [votes])
  const winner = useMemo(() => {
    const maxVote = Math.max(...votes)
    const idx = votes.findIndex((v) => v === maxVote)
    return maxVote === 0 ? 'No votes yet' : CANDIDATES[idx]
  }, [votes])

  const voteFor = (idx) => {
    setVotes((prev) => prev.map((v, i) => (i === idx ? v + 1 : v)))
  }

  return (
    <ApplicationShell
      title="Project 2 - Digital Voting Machine"
      subtitle="Real-World Applications: Event-driven digital counters for secure vote accumulation"
      logicTitle="Logic Used"
      logicValue="Counter_next[i] = Counter[i] + VotePulse[i]; Reset = 1 forces all counters to 0"
      controls={
        <div className="space-y-3">
          {CANDIDATES.map((c, idx) => (
            <button key={c} onClick={() => voteFor(idx)} className="w-full px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm font-mono hover:bg-indigo-500/35">
              Vote {c}
            </button>
          ))}
          <button
            onClick={() => setVotes([0, 0, 0])}
            className="w-full px-3 py-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-mono hover:bg-red-500/35"
          >
            Reset Election
          </button>
          <div className="pt-2 text-xs text-gray-400">Total votes: <span className="font-mono text-cyan-300">{totalVotes}</span></div>
          <div className="text-xs text-gray-400">Leader: <span className="font-mono text-emerald-300">{winner}</span></div>
        </div>
      }
      simulation={
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CANDIDATES.map((candidate, idx) => (
              <motion.div key={candidate} layout className="rounded-xl border border-white/10 bg-black/30 p-3"
                animate={{ boxShadow: votes[idx] > 0 ? '0 0 24px rgba(99,102,241,0.25)' : '0 0 0 rgba(0,0,0,0)' }}>
                <p className="text-xs text-gray-400">{candidate}</p>
                <p className="text-3xl mt-2 font-mono text-indigo-300">{votes[idx].toString().padStart(3, '0')}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#091424] to-[#071114] p-4">
            <p className="text-xs text-gray-400 mb-2">Live result bars</p>
            <div className="space-y-2">
              {votes.map((v, idx) => {
                const width = totalVotes === 0 ? 0 : Math.max(8, Math.round((v / totalVotes) * 100))
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-gray-300">C{idx + 1}</span>
                    <div className="flex-1 h-5 rounded bg-gray-900 overflow-hidden border border-white/10">
                      <motion.div className="h-full bg-gradient-to-r from-indigo-400 to-cyan-400" animate={{ width: `${width}%` }} transition={{ duration: 0.35 }} />
                    </div>
                    <span className="w-10 text-right text-xs font-mono text-indigo-300">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      }
      education={
        <div className="space-y-3 text-xs text-gray-300">
          <p>A vote button generates a pulse that clocks an incrementer for that candidate counter.</p>
          <p>Each candidate uses a parallel digital counter register. Reset applies asynchronous clear.</p>
          <p className="font-mono text-cyan-300">Circuit idea: Button -&gt; Debounce -&gt; Edge Detect -&gt; +1 Counter</p>
          <p>Output decoding drives seven-segment displays and chart logic in software here.</p>
        </div>
      }
    />
  )
}
