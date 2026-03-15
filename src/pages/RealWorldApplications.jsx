import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const projects = [
  {
    title: 'Traffic Light Controller',
    path: '/module15',
    badge: 'R1',
    icon: '🚦',
    desc: '4-way intersection with timer sequencing, pedestrian requests, and emergency override logic.',
    logic: 'Mutual exclusion + timed FSM',
    color: 'from-rose-500/20 to-amber-400/10 border-rose-400/30',
  },
  {
    title: 'Digital Voting Machine',
    path: '/module16',
    badge: 'R2',
    icon: '🗳️',
    desc: 'Three-candidate e-voting panel with live counters and dynamic result visualization.',
    logic: 'Pulse-driven up counters',
    color: 'from-indigo-500/20 to-cyan-400/10 border-indigo-400/30',
  },
  {
    title: 'Smart Parking System',
    path: '/module17',
    badge: 'R3',
    icon: '🅿️',
    desc: 'Eight-slot occupancy simulation using entry/exit sensors and full-condition detection.',
    logic: 'Up/down counter + full flag',
    color: 'from-emerald-500/20 to-cyan-400/10 border-emerald-400/30',
  },
  {
    title: 'Elevator System',
    path: '/module18',
    badge: 'R4',
    icon: '🛗',
    desc: '4-floor elevator scheduler with request queue, direction state, and door events.',
    logic: 'Sequential FSM + request latches',
    color: 'from-cyan-500/20 to-blue-400/10 border-cyan-400/30',
  },
  {
    title: '4-Bit ALU Simulator',
    path: '/module19',
    badge: 'R5',
    icon: '🧮',
    desc: 'Binary ALU operations across two 4-bit buses: ADD, SUB, AND, OR, XOR.',
    logic: 'Gate-select datapath',
    color: 'from-violet-500/20 to-indigo-400/10 border-violet-400/30',
  },
  {
    title: 'Binary Calculator',
    path: '/module20',
    badge: 'R6',
    icon: '🔢',
    desc: 'Binary-only calculator with arithmetic output and decimal conversion for interpretation.',
    logic: 'Adder/subtractor + shift-add',
    color: 'from-sky-500/20 to-emerald-400/10 border-sky-400/30',
  },
]

export default function RealWorldApplications() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Real-World Digital Logic Applications</h2>
        <p className="text-sm text-gray-400 mt-1">Choose a simulation to explore how digital logic powers practical systems.</p>
      </div>

      <section className="gate-box p-5 mb-5 border border-cyan-500/20">
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">Interactive Controls</span>
          <span className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-400/20 text-indigo-300">Live Simulation</span>
          <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-300">Boolean Logic Panels</span>
          <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-400/20 text-amber-300">Educational Explanations</span>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project, i) => (
          <motion.div key={project.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}>
            <Link to={project.path} className="block h-full">
              <article className={`h-full rounded-2xl border bg-gradient-to-br ${project.color} p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(6,182,212,0.15)]`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="text-2xl leading-none">{project.icon}</div>
                  <span className="text-[11px] px-2 py-1 rounded-md bg-black/30 border border-white/10 font-mono text-gray-300">{project.badge}</span>
                </div>

                <h3 className="text-base font-semibold text-white mb-1">{project.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">{project.desc}</p>

                <div className="mt-auto pt-2 border-t border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Core Logic</p>
                  <p className="text-xs font-mono text-cyan-200">{project.logic}</p>
                </div>
              </article>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
