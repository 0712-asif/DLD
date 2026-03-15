import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ApplicationShell from './ApplicationShell'

const SIZE = 8

export default function Module17() {
  const [slots, setSlots] = useState(Array(SIZE).fill(false))

  const available = useMemo(() => slots.filter((s) => !s).length, [slots])
  const full = available === 0

  const handleEntry = () => {
    if (full) return
    setSlots((prev) => {
      const next = [...prev]
      const idx = next.findIndex((s) => !s)
      if (idx >= 0) next[idx] = true
      return next
    })
  }

  const handleExit = () => {
    setSlots((prev) => {
      const next = [...prev]
      const idx = next.map((v, i) => (v ? i : -1)).filter((v) => v >= 0).pop()
      if (idx !== undefined) next[idx] = false
      return next
    })
  }

  return (
    <ApplicationShell
      title="Project 3 - Smart Parking System"
      subtitle="Real-World Applications: Occupancy counter with entry/exit sensors and full detection"
      logicTitle="Logic Used"
      logicValue="Available_next = Available - Entry + Exit; Full = (Available == 0); EntryEnable = EntrySensor AND NOT Full"
      controls={
        <div className="space-y-3">
          <button onClick={handleEntry} className="w-full px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-mono hover:bg-emerald-500/30">
            Entry Sensor Trigger
          </button>
          <button onClick={handleExit} className="w-full px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm font-mono hover:bg-cyan-500/30">
            Exit Sensor Trigger
          </button>
          <button onClick={() => setSlots(Array(SIZE).fill(false))} className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 text-sm font-mono hover:border-gray-500">
            Reset Parking Lot
          </button>
          <div className="text-xs text-gray-400">Available slots: <span className="font-mono text-cyan-300">{available}</span></div>
          <div className={`text-xs font-mono ${full ? 'text-red-300' : 'text-emerald-300'}`}>{full ? 'PARKING FULL' : 'SPACES AVAILABLE'}</div>
        </div>
      }
      simulation={
        <div className="space-y-4">
          <div className="rounded-xl p-3 border border-cyan-500/20 bg-black/30">
            <div className="grid grid-cols-4 gap-2">
              {slots.map((occupied, idx) => (
                <motion.div key={idx} layout className={`h-16 rounded-lg border flex items-center justify-center text-xs font-mono ${occupied ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300'}`}>
                  {occupied ? 'CAR' : `S${idx + 1}`}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#111827] to-[#052022] p-4 flex items-center justify-between">
            <p className="text-sm text-gray-300">Display Board</p>
            <p className={`text-lg font-mono tracking-widest ${full ? 'text-red-300' : 'text-cyan-300'}`}>
              {full ? 'PARKING FULL' : `SLOTS: ${available}`}
            </p>
          </div>
        </div>
      }
      education={
        <div className="space-y-3 text-xs text-gray-300">
          <p>Entry and exit sensors behave like digital pulses into an up/down counter.</p>
          <p>Boolean full detection is true only when the counter value reaches 000.</p>
          <p className="font-mono text-cyan-300">For 3-bit available count S2 S1 S0: Full = S2' . S1' . S0'</p>
          <p>In hardware, this logic blocks entry pulses when full to avoid underflow.</p>
        </div>
      }
    />
  )
}
