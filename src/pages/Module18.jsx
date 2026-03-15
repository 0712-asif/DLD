import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ApplicationShell from './ApplicationShell'

const FLOORS = [1, 2, 3, 4]

export default function Module18() {
  const [currentFloor, setCurrentFloor] = useState(1)
  const [queue, setQueue] = useState([])
  const [doorOpen, setDoorOpen] = useState(false)

  const target = queue[0]
  const direction = !target ? 'IDLE' : target > currentFloor ? 'UP' : target < currentFloor ? 'DOWN' : 'ARRIVED'

  const requestFloor = (f) => {
    setQueue((prev) => (prev.includes(f) ? prev : [...prev, f]))
  }

  useEffect(() => {
    if (!target) return

    const id = setInterval(() => {
      setCurrentFloor((floor) => {
        if (floor === target) {
          setDoorOpen(true)
          setTimeout(() => setDoorOpen(false), 700)
          setQueue((prev) => prev.slice(1))
          return floor
        }
        return floor < target ? floor + 1 : floor - 1
      })
    }, 900)

    return () => clearInterval(id)
  }, [target])

  const elevatorBottom = useMemo(() => {
    return (currentFloor - 1) * 24
  }, [currentFloor])

  return (
    <ApplicationShell
      title="Project 4 - Elevator Control System"
      subtitle="Real-World Applications: Sequential floor scheduling with directional state transitions"
      logicTitle="Logic Used"
      logicValue="State = {Floor, Direction, Queue}; NextFloor = Floor +/- 1 based on target; Request latch stores pending floor calls"
      controls={
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {FLOORS.map((f) => (
              <button key={f} onClick={() => requestFloor(f)} className="px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm font-mono hover:bg-indigo-500/35">
                Go Floor {f}
              </button>
            ))}
          </div>
          <button onClick={() => { setQueue([]); setCurrentFloor(1); setDoorOpen(false) }} className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 text-sm font-mono hover:border-gray-500">
            Reset Elevator
          </button>
          <div className="text-xs text-gray-400">Direction: <span className="font-mono text-cyan-300">{direction}</span></div>
          <div className="text-xs text-gray-400">Queue: <span className="font-mono text-emerald-300">{queue.length ? queue.join(' -> ') : 'Empty'}</span></div>
        </div>
      }
      simulation={
        <div className="grid md:grid-cols-[160px_1fr] gap-4">
          <div className="rounded-xl border border-cyan-500/20 bg-black/35 p-3">
            <p className="text-xs text-gray-400 mb-2">Floor Display</p>
            <p className="text-4xl font-mono text-cyan-300">{currentFloor}</p>
            <p className={`mt-2 text-xs font-mono ${direction === 'UP' ? 'text-emerald-300' : direction === 'DOWN' ? 'text-amber-300' : 'text-gray-400'}`}>{direction}</p>
          </div>

          <div className="relative h-[280px] rounded-xl border border-white/10 bg-gradient-to-b from-[#0b1220] to-[#07111e] overflow-hidden">
            <div className="absolute inset-0 grid grid-rows-4">
              {FLOORS.slice().reverse().map((f) => (
                <div key={f} className="border-b border-white/10 flex items-center justify-between px-3 text-xs text-gray-400">
                  <span>Floor {f}</span>
                  <span className="font-mono">{queue.includes(f) ? 'REQ' : '-'}</span>
                </div>
              ))}
            </div>

            <motion.div
              className={`absolute left-1/2 -translate-x-1/2 w-24 h-14 rounded-lg border ${doorOpen ? 'border-emerald-300 bg-emerald-400/20' : 'border-cyan-300 bg-cyan-500/20'}`}
              animate={{ bottom: `${elevatorBottom}%` }}
              transition={{ type: 'spring', stiffness: 110, damping: 16 }}
            >
              <div className="h-full flex items-center justify-center text-xs font-mono text-cyan-100">ELEV</div>
            </motion.div>
          </div>
        </div>
      }
      education={
        <div className="space-y-3 text-xs text-gray-300">
          <p>Elevator control is sequential logic: output depends on present floor and queued requests.</p>
          <p>State transitions: Idle -&gt; MoveUp/MoveDown -&gt; Arrive -&gt; DoorOpen -&gt; NextRequest.</p>
          <p className="font-mono text-cyan-300">FSM output = f(CurrentState, InputRequests)</p>
          <p>Request latches keep button presses until the floor is served.</p>
        </div>
      }
    />
  )
}
