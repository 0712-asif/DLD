import { motion } from 'framer-motion'

export default function ApplicationShell({ title, subtitle, controls, simulation, education, logicTitle, logicValue }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>

      {(logicTitle || logicValue) && (
        <div className="gate-box p-4 mb-5 border border-cyan-500/20">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-300/80 mb-1">{logicTitle || 'Logic Expression'}</p>
          <p className="text-sm md:text-base text-cyan-200 font-mono break-words">{logicValue}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="gate-box p-4 lg:col-span-3 border border-indigo-500/20">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300 mb-3">Controls</h3>
          {controls}
        </section>

        <section className="gate-box p-4 lg:col-span-6 border border-cyan-500/20">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-300 mb-3">Interactive Simulation</h3>
          {simulation}
        </section>

        <section className="gate-box p-4 lg:col-span-3 border border-emerald-500/20">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-300 mb-3">Education Panel</h3>
          {education}
        </section>
      </div>
    </motion.div>
  )
}
