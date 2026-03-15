import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'

const Module1 = lazy(() => import('./pages/Module1'))
const Module2 = lazy(() => import('./pages/Module2'))
const Module3 = lazy(() => import('./pages/Module3'))
const Module4 = lazy(() => import('./pages/Module4'))
const Module5 = lazy(() => import('./pages/Module5'))
const Module6 = lazy(() => import('./pages/Module6'))
const Module7 = lazy(() => import('./pages/Module7'))
const Module8 = lazy(() => import('./pages/Module8'))
const Module9 = lazy(() => import('./pages/Module9'))
const Module10 = lazy(() => import('./pages/Module10'))
const Module11 = lazy(() => import('./pages/Module11'))
const Module12 = lazy(() => import('./pages/Module12'))
const Module13 = lazy(() => import('./pages/Module13'))
const Module14 = lazy(() => import('./pages/Module14'))
const RealWorldApplications = lazy(() => import('./pages/RealWorldApplications'))
const Module15 = lazy(() => import('./pages/Module15'))
const Module16 = lazy(() => import('./pages/Module16'))
const Module17 = lazy(() => import('./pages/Module17'))
const Module18 = lazy(() => import('./pages/Module18'))
const Module19 = lazy(() => import('./pages/Module19'))
const Module20 = lazy(() => import('./pages/Module20'))

const coreModules = [
  { path: '/', label: 'M1', name: 'Basic Gates' },
  { path: '/module2', label: 'M2', name: 'Universal' },
  { path: '/module3', label: 'M3', name: 'SOP/POS' },
  { path: '/module4', label: 'M4', name: 'Minterms' },
  { path: '/module5', label: 'M5', name: 'K-Map' },
  { path: '/module6', label: 'M6', name: 'Prime Impl.' },
  { path: '/module7', label: 'M7', name: "Don't Care" },
  { path: '/module8', label: 'M8', name: 'Q-M Method' },
  { path: '/module9', label: 'M9', name: 'NAND-NAND' },
  { path: '/module10', label: 'M10', name: 'NOR-NOR' },
]

const advancedModules = [
  { path: '/module11', label: 'M11', name: 'Circuit Builder', icon: '🔧' },
  { path: '/module12', label: 'M12', name: '3D Visualizer', icon: '🧊' },
  { path: '/module13', label: 'M13', name: 'Step Simulator', icon: '⏯️' },
  { path: '/module14', label: 'M14', name: 'AI Tutor', icon: '🎓' },
]

const realWorldModules = [
  { path: '/applications', label: 'RW', name: 'Overview', icon: '🌐' },
  { path: '/module15', label: 'R1', name: 'Traffic Light Controller', icon: '🚦' },
  { path: '/module16', label: 'R2', name: 'Digital Voting Machine', icon: '🗳️' },
  { path: '/module17', label: 'R3', name: 'Smart Parking System', icon: '🅿️' },
  { path: '/module18', label: 'R4', name: 'Elevator System', icon: '🛗' },
  { path: '/module19', label: 'R5', name: '4-Bit ALU Simulator', icon: '🧮' },
  { path: '/module20', label: 'R6', name: 'Binary Calculator', icon: '🔢' },
]

export default function App() {
  const [navSection, setNavSection] = useState('core')
  const loadingView = (
    <div className="gate-box p-8 text-center">
      <p className="font-mono text-sm text-cyan-300">Loading simulation module...</p>
    </div>
  )

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050508] grid-bg text-white">
        {/* Header */}
        <header className="border-b border-gray-800/40 glass-strong sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="8" height="12" rx="1" />
                  <path d="M10 9h4" />
                  <path d="M10 15h4" />
                  <rect x="14" y="9" width="8" height="6" rx="1" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight gradient-text">DLD Project</h1>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Digital Logic Learning Simulator</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Section toggle */}
              <div className="flex gap-1 bg-gray-900/60 rounded-lg p-0.5 border border-gray-800/50">
                <button onClick={() => setNavSection('core')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${navSection === 'core' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                  Core
                </button>
                <button onClick={() => setNavSection('advanced')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${navSection === 'advanced' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                  Advanced
                </button>
                <button onClick={() => setNavSection('realworld')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${navSection === 'realworld' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                  Real-World Applications
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
                <div className="status-dot"></div>
                LIVE
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
              {navSection === 'core' && coreModules.map((mod) => (
                <NavLink key={mod.path} to={mod.path} end={mod.path === '/'}
                  className={({ isActive }) =>
                    `nav-pill px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                    }`}>
                  <span className="font-mono text-xs mr-1.5 opacity-60">{mod.label}</span>
                  {mod.name}
                </NavLink>
              ))}

              {navSection === 'advanced' && advancedModules.map((mod) => (
                <NavLink key={mod.path} to={mod.path}
                  className={({ isActive }) =>
                    `nav-pill px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                    }`}>
                  <span className="mr-1.5">{mod.icon}</span>
                  <span className="font-mono text-xs mr-1.5 opacity-60">{mod.label}</span>
                  {mod.name}
                </NavLink>
              ))}

              {navSection === 'realworld' && realWorldModules.map((mod) => (
                <NavLink key={mod.path} to={mod.path}
                  className={({ isActive }) =>
                    `nav-pill px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'border-cyan-500 text-cyan-300 bg-cyan-500/5'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                    }`}>
                  <span className="mr-1.5">{mod.icon}</span>
                  <span className="font-mono text-xs mr-1.5 opacity-60">{mod.label}</span>
                  {mod.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Suspense fallback={loadingView}>
            <Routes>
              <Route path="/" element={<Module1 />} />
              <Route path="/module2" element={<Module2 />} />
              <Route path="/module3" element={<Module3 />} />
              <Route path="/module4" element={<Module4 />} />
              <Route path="/module5" element={<Module5 />} />
              <Route path="/module6" element={<Module6 />} />
              <Route path="/module7" element={<Module7 />} />
              <Route path="/module8" element={<Module8 />} />
              <Route path="/module9" element={<Module9 />} />
              <Route path="/module10" element={<Module10 />} />
              <Route path="/module11" element={<Module11 />} />
              <Route path="/module12" element={<Module12 />} />
              <Route path="/module13" element={<Module13 />} />
              <Route path="/module14" element={<Module14 />} />
              <Route path="/applications" element={<RealWorldApplications />} />
              <Route path="/module15" element={<Module15 />} />
              <Route path="/module16" element={<Module16 />} />
              <Route path="/module17" element={<Module17 />} />
              <Route path="/module18" element={<Module18 />} />
              <Route path="/module19" element={<Module19 />} />
              <Route path="/module20" element={<Module20 />} />
            </Routes>
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/30 mt-8">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-600 font-mono">
            <span>DLD Project — Digital Logic Learning Simulator</span>
            <span className="text-gray-700">20 Modules</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}
