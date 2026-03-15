import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── AI Tutor Knowledge Base ───

const TOPICS = {
  'boolean-basics': {
    title: 'Boolean Algebra Basics',
    icon: '📐',
    color: '#6366f1',
    lessons: [
      {
        q: 'What is Boolean Algebra?',
        a: `Boolean algebra is a branch of mathematics that deals with variables that have only two possible values: **TRUE (1)** and **FALSE (0)**.

It was introduced by **George Boole** in 1854 and forms the foundation of digital logic circuits.

**Three fundamental operations:**
• **AND (·)** — output is 1 only when ALL inputs are 1
• **OR (+)** — output is 1 when ANY input is 1
• **NOT (')** — inverts the input`,
      },
      {
        q: 'What are the basic Boolean laws?',
        a: `**Identity Laws:** A + 0 = A, A · 1 = A
**Null Laws:** A + 1 = 1, A · 0 = 0
**Complement Laws:** A + A' = 1, A · A' = 0
**Idempotent Laws:** A + A = A, A · A = A
**Involution Law:** (A')' = A
**Commutative:** A + B = B + A, A · B = B · A
**Associative:** A + (B + C) = (A + B) + C
**Distributive:** A · (B + C) = A·B + A·C
**Absorption:** A + A·B = A, A · (A + B) = A
**De Morgan's:** (A + B)' = A' · B', (A · B)' = A' + B'`,
      },
    ],
  },
  'kmap-guide': {
    title: 'K-Map Simplification',
    icon: '🗺️',
    color: '#22c55e',
    lessons: [
      {
        q: 'How do I solve a K-map?',
        a: `**Step-by-step K-map solving:**

1. **Draw the K-map** — Use Gray code ordering for rows and columns
2. **Fill in the values** — Place 1s for minterms, 0s for maxterms
3. **Group the 1s** — Form rectangular groups of 1, 2, 4, 8 cells
4. **Grouping rules:**
   • Groups must be powers of 2
   • Groups must be rectangular
   • Groups can wrap around edges
   • Each 1 must be in at least one group
   • Make groups as large as possible
5. **Read the groups** — For each group, find variables that don't change
6. **Write the expression** — OR all the group terms together`,
      },
      {
        q: 'How do groups simplify expressions?',
        a: `**Larger groups = simpler terms:**

• **1 cell** → 4 literals (for 4-var K-map)
• **2 cells** → 3 literals (eliminates 1 variable)
• **4 cells** → 2 literals (eliminates 2 variables)
• **8 cells** → 1 literal (eliminates 3 variables)
• **16 cells** → F = 1 (tautology)

**Example:** In a 4-variable K-map, a group of 4 cells where A=0 and B=1, but C and D change → the term is **A'B**`,
      },
    ],
  },
  'gate-universality': {
    title: 'Universal Gates',
    icon: '🔧',
    color: '#f59e0b',
    lessons: [
      {
        q: 'Why are NAND and NOR called universal gates?',
        a: `A **universal gate** can implement ANY Boolean function using only that gate type.

**NAND is universal because:**
• NOT: A' = A NAND A
• AND: A · B = (A NAND B) NAND (A NAND B)
• OR: A + B = (A NAND A) NAND (B NAND B)

**NOR is universal because:**
• NOT: A' = A NOR A
• OR: A + B = (A NOR B) NOR (A NOR B)
• AND: A · B = (A NOR A) NOR (B NOR B)

This means you can build an entire computer using only NAND gates (or only NOR gates)!`,
      },
    ],
  },
  'sop-pos': {
    title: 'SOP & POS Forms',
    icon: '📝',
    color: '#ec4899',
    lessons: [
      {
        q: 'What is SOP and POS?',
        a: `**SOP (Sum of Products):**
• OR of AND terms
• Example: F = AB + A'C + BC'
• Each product term (minterm) gives output 1
• Written as Σm(list of minterms)

**POS (Product of Sums):**
• AND of OR terms
• Example: F = (A+B)(A'+C)(B+C')
• Each sum term (maxterm) gives output 0
• Written as ΠM(list of maxterms)

**Conversion:** SOP minterms = complement of POS maxterms
If F = Σm(0,1,3) for 3 variables, then F = ΠM(2,4,5,6,7)`,
      },
      {
        q: 'How to convert SOP to NAND-NAND?',
        a: `**SOP → NAND-NAND in 3 steps:**

1. Start with SOP: F = AB + CD
2. Double complement: F = ((AB + CD)')'
3. Apply De Morgan's: F = ((AB)' · (CD)')' 
4. This is NAND of NANDs!

**Level 1:** Each AND term → NAND gate
**Level 2:** Final OR → NAND gate combining Level 1 outputs

**Similarly, POS → NOR-NOR:**
1. Start with POS: F = (A+B)(C+D)
2. Double complement and De Morgan's
3. Level 1: Each OR term → NOR gate
4. Level 2: Final AND → NOR gate`,
      },
    ],
  },
  'quine-mccluskey': {
    title: 'Quine-McCluskey Method',
    icon: '⚡',
    color: '#a855f7',
    lessons: [
      {
        q: 'When should I use Quine-McCluskey over K-maps?',
        a: `**Use K-maps when:**
• 2-4 variables (visual, quick)
• Manual solving / exams

**Use Quine-McCluskey when:**
• 5+ variables (K-maps become impractical)
• Computer implementation needed
• Systematic/algorithmic approach required

**The QM algorithm:**
1. List minterms in binary, group by number of 1s
2. Compare adjacent groups — combine terms differing by 1 bit
3. Mark combined terms, repeat until no more combinations
4. Uncombined terms = Prime Implicants
5. Build PI chart — find Essential Prime Implicants
6. Cover remaining minterms with minimum PIs`,
      },
    ],
  },
}

// ─── Playground challenges ───

const CHALLENGES = [
  {
    id: 1,
    title: 'Build an AND gate',
    description: 'What is the output of A·B when A=1, B=1?',
    options: ['0', '1'],
    correct: 1,
    explanation: 'AND gate outputs 1 only when ALL inputs are 1. Since A=1 and B=1, output = 1.',
  },
  {
    id: 2,
    title: "De Morgan's Theorem",
    description: "What is (A + B)' equivalent to?",
    options: ["A' + B'", "A' · B'", "A · B", "(AB)'"],
    correct: 1,
    explanation: "De Morgan's Theorem: (A + B)' = A' · B'. The complement of OR becomes AND of complements.",
  },
  {
    id: 3,
    title: 'K-Map Grouping',
    description: 'In a K-map, a group of 4 cells eliminates how many variables?',
    options: ['1', '2', '3', '4'],
    correct: 1,
    explanation: 'Each doubling of group size eliminates one variable. Group of 4 = 2² eliminates 2 variables.',
  },
  {
    id: 4,
    title: 'Universal Gates',
    description: 'How do you implement NOT using only NAND?',
    options: ['A NAND 0', 'A NAND A', 'A NAND 1', 'Not possible'],
    correct: 1,
    explanation: "A NAND A = (A·A)' = A'. When both inputs are the same, NAND acts as NOT.",
  },
  {
    id: 5,
    title: 'Minterms',
    description: 'For F(A,B) = Σm(1,2), what is the SOP expression?',
    options: ["A'B + AB'", "AB + A'B'", "A'B' + AB", "A + B"],
    correct: 0,
    explanation: "m1 = A'B (binary 01), m2 = AB' (binary 10). So F = A'B + AB' which is XOR.",
  },
  {
    id: 6,
    title: 'Boolean Simplification',
    description: 'Simplify: A + AB',
    options: ['AB', 'A', 'A + B', 'B'],
    correct: 1,
    explanation: 'By Absorption Law: A + AB = A. Factor out A: A(1 + B) = A·1 = A.',
  },
]

// ─── Components ───

function TutorPanel({ topic, onBack }) {
  const [currentLesson, setCurrentLesson] = useState(0)
  const data = TOPICS[topic]
  const lesson = data.lessons[currentLesson]

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button onClick={onBack} className="text-xs text-gray-500 hover:text-indigo-400 font-mono mb-4 flex items-center gap-1 transition-colors">
        ← Back to topics
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{data.icon}</span>
        <div>
          <h3 className="text-lg font-bold" style={{ color: data.color }}>{data.title}</h3>
          <p className="text-xs text-gray-500">Lesson {currentLesson + 1} of {data.lessons.length}</p>
        </div>
      </div>

      {/* Question */}
      <div className="chat-bubble-user px-5 py-3 mb-4">
        <p className="text-sm text-gray-200 font-medium">{lesson.q}</p>
      </div>

      {/* Answer */}
      <div className="chat-bubble px-5 py-4 mb-6">
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
          {lesson.a.split('\n').map((line, i) => {
            // Bold
            const parts = line.split(/\*\*(.*?)\*\*/g)
            return (
              <p key={i} className={line.startsWith('•') ? 'ml-4' : ''}>
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j} className="text-indigo-300">{part}</strong> : part
                )}
              </p>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      {data.lessons.length > 1 && (
        <div className="flex gap-2">
          {data.lessons.map((_, i) => (
            <button key={i} onClick={() => setCurrentLesson(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                i === currentLesson
                  ? 'text-white shadow-lg' : 'bg-gray-900/50 text-gray-500 border border-gray-800'
              }`}
              style={i === currentLesson ? { background: data.color } : {}}>
              Lesson {i + 1}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function PlaygroundPanel() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(new Set())

  const challenge = CHALLENGES[currentQ]

  const handleAnswer = (idx) => {
    if (answered.has(currentQ)) return
    setSelected(idx)
    setAnswered(prev => new Set([...prev, currentQ]))
    if (idx === challenge.correct) setScore(s => s + 1)
  }

  const nextQuestion = () => {
    setSelected(null)
    setCurrentQ(prev => Math.min(prev + 1, CHALLENGES.length - 1))
  }

  const resetQuiz = () => {
    setCurrentQ(0)
    setSelected(null)
    setScore(0)
    setAnswered(new Set())
  }

  const allDone = answered.size === CHALLENGES.length

  return (
    <div>
      {/* Score */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Score</span>
          <p className="text-2xl font-mono font-bold text-indigo-400">{score}/{CHALLENGES.length}</p>
        </div>
        <div className="flex gap-1">
          {CHALLENGES.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${
              !answered.has(i) ? 'bg-gray-800' :
              CHALLENGES[i].correct === (i === currentQ ? selected : null) ? 'bg-green-500' : 'bg-gray-700'
            } ${i === currentQ ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[#050508]' : ''}`} />
          ))}
        </div>
      </div>

      {allDone ? (
        <motion.div className="text-center py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-5xl mb-4">{score === CHALLENGES.length ? '🏆' : score >= CHALLENGES.length / 2 ? '👍' : '📚'}</div>
          <h3 className="text-xl font-bold text-indigo-400 mb-2">Quiz Complete!</h3>
          <p className="text-gray-400 mb-6">You scored {score}/{CHALLENGES.length}</p>
          <button onClick={resetQuiz}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-mono text-sm hover:bg-indigo-500 transition-all">
            Try Again
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Question */}
            <div className="mb-2 text-xs font-mono text-gray-600">Question {currentQ + 1} of {CHALLENGES.length}</div>
            <h4 className="text-sm font-bold text-indigo-400 mb-1">{challenge.title}</h4>
            <p className="text-gray-300 mb-5">{challenge.description}</p>

            {/* Options */}
            <div className="space-y-2 mb-5">
              {challenge.options.map((opt, i) => {
                const isAnswered = answered.has(currentQ)
                const isCorrect = i === challenge.correct
                const isSelected = i === selected

                let style = 'bg-gray-900/50 border-gray-800 text-gray-300 hover:border-indigo-500'
                if (isAnswered) {
                  if (isCorrect) style = 'bg-green-500/10 border-green-500/40 text-green-400'
                  else if (isSelected) style = 'bg-red-500/10 border-red-500/40 text-red-400'
                  else style = 'bg-gray-900/30 border-gray-800/50 text-gray-600'
                }

                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-mono transition-all ${style}`}
                    disabled={isAnswered}>
                    <span className="mr-3 text-gray-600">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isAnswered && isCorrect && <span className="float-right">✓</span>}
                    {isAnswered && isSelected && !isCorrect && <span className="float-right">✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {answered.has(currentQ) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="chat-bubble px-5 py-4 mb-4">
                <p className="text-xs text-indigo-400 font-mono font-bold mb-1">Explanation</p>
                <p className="text-sm text-gray-300">{challenge.explanation}</p>
              </motion.div>
            )}

            {answered.has(currentQ) && currentQ < CHALLENGES.length - 1 && (
              <button onClick={nextQuestion}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-mono hover:bg-indigo-500 transition-all">
                Next Question →
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// ─── Main Component ───

export default function Module14() {
  const [activeTab, setActiveTab] = useState('tutor') // 'tutor' | 'playground'
  const [selectedTopic, setSelectedTopic] = useState(null)

  return (
    <div>
      <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight">AI Tutor & Playground</h2>
        <p className="text-sm text-gray-500 mt-1">Module 14 — Learn DLD concepts interactively with guided explanations and quizzes</p>
      </motion.div>

      {/* Tab switcher */}
      <motion.div className="flex gap-2 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <button onClick={() => { setActiveTab('tutor'); setSelectedTopic(null) }}
          className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${
            activeTab === 'tutor'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-600'
          }`}>
          🎓 AI Tutor
        </button>
        <button onClick={() => setActiveTab('playground')}
          className={`px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all ${
            activeTab === 'playground'
              ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-600'
          }`}>
          🎮 Playground Quiz
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'tutor' ? (
          <motion.div key="tutor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {selectedTopic ? (
              <div className="glass-card p-6">
                <TutorPanel topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
              </div>
            ) : (
              <div>
                <motion.p className="text-sm text-gray-400 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Select a topic to explore with the AI Tutor:
                </motion.p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(TOPICS).map(([key, topic], i) => (
                    <motion.button key={key} onClick={() => setSelectedTopic(key)}
                      className="glass-card p-5 text-left group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{topic.icon}</span>
                        <h3 className="text-sm font-bold transition-colors" style={{ color: topic.color }}>{topic.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{topic.lessons.length} lesson{topic.lessons.length > 1 ? 's' : ''} available</p>
                      <div className="mt-3 flex gap-1">
                        {topic.lessons.map((_, li) => (
                          <div key={li} className="w-full h-1 rounded-full" style={{ background: topic.color + '30' }} />
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="playground" className="glass-card p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PlaygroundPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
