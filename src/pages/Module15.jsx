import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ApplicationShell from './ApplicationShell'

const ROADS = ['North-South', 'East-West', 'South-North', 'West-East']

function LedLight({ color, on }) {
  const colorMap = {
    red: 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.75)]',
    yellow: 'bg-amber-400 shadow-[0_0_20px_rgba(250,204,21,0.75)]',
    green: 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.75)]',
  }

  return (
    <div className={`w-5 h-5 rounded-full border border-white/20 transition-all ${on ? colorMap[color] : 'bg-gray-800'}`}></div>
  )
}

export default function Module15() {
  const [activeRoad, setActiveRoad] = useState(0)
  const [phase, setPhase] = useState('green')
  const [countdown, setCountdown] = useState(12)
  const [pedestrianRequest, setPedestrianRequest] = useState(false)
  const [emergencyOverride, setEmergencyOverride] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (countdown > 0) return

    if (emergencyOverride) {
      setActiveRoad(0)
      setPhase('green')
      setCountdown(8)
      setEmergencyOverride(false)
      return
    }

    if (phase === 'green') {
      setPhase('yellow')
      setCountdown(3)
      return
    }

    if (phase === 'yellow') {
      if (pedestrianRequest) {
        setPhase('pedestrian')
        setCountdown(6)
      } else {
        setActiveRoad((r) => (r + 1) % 4)
        setPhase('green')
        setCountdown(12)
      }
      return
    }

    if (phase === 'pedestrian') {
      setPedestrianRequest(false)
      setActiveRoad((r) => (r + 1) % 4)
      setPhase('green')
      setCountdown(12)
    }
  }, [countdown, emergencyOverride, pedestrianRequest, phase])

  const signalState = useMemo(() => {
    return ROADS.map((_, idx) => {
      const isActive = idx === activeRoad
      return {
        red: !isActive || phase === 'pedestrian',
        yellow: isActive && phase === 'yellow',
        green: isActive && phase === 'green',
      }
    })
  }, [activeRoad, phase])

  const modeLabel = phase === 'pedestrian' ? 'Pedestrian Crossing' : phase.toUpperCase()

  return (
    <ApplicationShell
      title="Project 1 - Smart Traffic Light Controller"
      subtitle="Real-World Applications: Timer-based intersection control with emergency and pedestrian overrides"
      logicTitle="Logic Used"
      logicValue="Green_i = ActiveRoad_i AND NOT Emergency AND NOT PedestrianMode; Yellow_i = ActiveRoad_i AND Transition; PedestrianWalk = PedRequest AND AllRoadsRed"
      controls={
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Active road: <span className="text-cyan-300 font-mono">{ROADS[activeRoad]}</span></p>
          <p className="text-xs text-gray-400">Phase: <span className="text-emerald-300 font-mono">{modeLabel}</span></p>
          <p className="text-xs text-gray-400">Countdown: <span className="text-amber-300 font-mono">{countdown}s</span></p>

          <button
            onClick={() => setEmergencyOverride(true)}
            className="w-full px-3 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-mono hover:bg-red-500/30"
          >
            Emergency Override
          </button>

          <button
            onClick={() => setPedestrianRequest(true)}
            className="w-full px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm font-mono hover:bg-cyan-500/30"
          >
            Pedestrian Crossing Request
          </button>

          <button
            onClick={() => {
              setActiveRoad(0)
              setPhase('green')
              setCountdown(12)
              setPedestrianRequest(false)
              setEmergencyOverride(false)
            }}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 text-sm font-mono hover:border-gray-500"
          >
            Reset Controller
          </button>
        </div>
      }
      simulation={
        <div>
          <div className="relative h-[360px] rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-[#071321] to-slate-950 overflow-hidden">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }}></div>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-24 h-full bg-gray-900/90 border-x border-white/10"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-24 w-full bg-gray-900/90 border-y border-white/10"></div>

            {[0, 1, 2, 3].map((road) => (
              <motion.div key={road} className="absolute p-2 rounded-xl bg-black/40 border border-white/10"
                animate={{ scale: road === activeRoad ? 1.04 : 1, boxShadow: road === activeRoad ? '0 0 30px rgba(34,211,238,0.25)' : '0 0 0 rgba(0,0,0,0)' }}
                transition={{ duration: 0.3 }}
                style={{
                  left: road === 1 ? '73%' : road === 3 ? '5%' : '43%',
                  top: road === 0 ? '4%' : road === 2 ? '72%' : '41%',
                  width: road % 2 === 0 ? '14%' : '18%',
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <LedLight color="red" on={signalState[road].red} />
                  <LedLight color="yellow" on={signalState[road].yellow} />
                  <LedLight color="green" on={signalState[road].green} />
                </div>
              </motion.div>
            ))}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 font-mono text-sm">
              T-{countdown}s
            </div>
          </div>
        </div>
      }
      education={
        <div className="space-y-3 text-xs text-gray-300">
          <p className="text-gray-400">Truth table (controller mode)</p>
          <table className="w-full text-center text-[11px] border border-gray-700">
            <thead className="bg-gray-900/80 text-cyan-300">
              <tr><th>E</th><th>P</th><th>T</th><th>Mode</th></tr>
            </thead>
            <tbody>
              <tr><td>0</td><td>0</td><td>0</td><td>Green</td></tr>
              <tr><td>0</td><td>0</td><td>1</td><td>Yellow</td></tr>
              <tr><td>0</td><td>1</td><td>1</td><td>Pedestrian</td></tr>
              <tr><td>1</td><td>X</td><td>X</td><td>Emergency</td></tr>
            </tbody>
          </table>
          <p>Only one road is green at a time. The FSM cycles Green -&gt; Yellow -&gt; next road Green, with override states for pedestrian and emergency events.</p>
          <p>Boolean signals gate every lamp output to guarantee no conflicting greens.</p>
        </div>
      }
    />
  )
}
