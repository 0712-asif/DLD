import { useMemo, useState } from 'react'
import ApplicationShell from './ApplicationShell'

const OPS = ['ADD', 'SUB', 'AND', 'OR', 'XOR']

function bitsToNumber(bits) {
  return parseInt(bits.join(''), 2)
}

function numberToBits(n, width = 4) {
  return (n & ((1 << width) - 1)).toString(2).padStart(width, '0').split('').map(Number)
}

function BitToggle({ bits, setBits, label, colorClass }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <div className="flex gap-2">
        {bits.map((bit, idx) => (
          <button key={idx} onClick={() => setBits((prev) => prev.map((v, i) => i === idx ? (v ? 0 : 1) : v))}
            className={`w-10 h-10 rounded-md border text-sm font-mono ${bit ? `${colorClass} border-white/40` : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
            {bit}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Module19() {
  const [aBits, setABits] = useState([0, 1, 0, 1])
  const [bBits, setBBits] = useState([0, 0, 1, 1])
  const [op, setOp] = useState('ADD')

  const { result, carry } = useMemo(() => {
    const a = bitsToNumber(aBits)
    const b = bitsToNumber(bBits)

    if (op === 'ADD') {
      const sum = a + b
      return { result: numberToBits(sum), carry: sum > 15 ? 1 : 0 }
    }

    if (op === 'SUB') {
      const diff = (a - b + 16) % 16
      return { result: numberToBits(diff), carry: a < b ? 1 : 0 }
    }

    if (op === 'AND') return { result: numberToBits(a & b), carry: 0 }
    if (op === 'OR') return { result: numberToBits(a | b), carry: 0 }
    return { result: numberToBits(a ^ b), carry: 0 }
  }, [aBits, bBits, op])

  const logicMap = {
    ADD: 'F = A + B using ripple-carry full adders',
    SUB: 'F = A + (B two\'s complement)',
    AND: 'F_i = A_i . B_i',
    OR: 'F_i = A_i + B_i',
    XOR: 'F_i = A_i xor B_i',
  }

  return (
    <ApplicationShell
      title="Project 5 - 4-Bit ALU Processor Simulator"
      subtitle="Real-World Applications: Core ALU operations on 4-bit buses"
      logicTitle="Logic Used"
      logicValue={logicMap[op]}
      controls={
        <div className="space-y-4">
          <BitToggle bits={aBits} setBits={setABits} label="Input A" colorClass="bg-indigo-500/35 text-indigo-100" />
          <BitToggle bits={bBits} setBits={setBBits} label="Input B" colorClass="bg-cyan-500/35 text-cyan-100" />
          <div>
            <p className="text-xs text-gray-400 mb-2">Operation</p>
            <select value={op} onChange={(e) => setOp(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-cyan-200 font-mono text-sm">
              {OPS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      }
      simulation={
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-black/35 p-4">
            <p className="text-xs text-gray-400 mb-3">ALU Bus Monitor</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
                <p className="text-[11px] text-indigo-300">A</p>
                <p className="text-2xl font-mono text-indigo-200">{aBits.join('')}</p>
              </div>
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                <p className="text-[11px] text-cyan-300">B</p>
                <p className="text-2xl font-mono text-cyan-200">{bBits.join('')}</p>
              </div>
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                <p className="text-[11px] text-emerald-300">F</p>
                <p className="text-2xl font-mono text-emerald-200">{result.join('')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#10172a] to-[#052a24] p-4 text-sm text-gray-300 font-mono">
            Carry/Borrow: <span className="text-amber-300">{carry}</span>
          </div>
        </div>
      }
      education={
        <div className="space-y-3 text-xs text-gray-300">
          <p>Gate-level ALU design combines arithmetic and bitwise blocks selected by control lines.</p>
          <p>Adder path uses chained full adders: Sum_i = A_i xor B_i xor C_i.</p>
          <p className="font-mono text-cyan-300">Carry_i+1 = A_i.B_i + C_i.(A_i xor B_i)</p>
          <p>Mux logic selects ADD/SUB/AND/OR/XOR result onto final output bus.</p>
        </div>
      }
    />
  )
}
