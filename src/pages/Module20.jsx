import { useMemo, useState } from 'react'
import ApplicationShell from './ApplicationShell'

const OPS = ['ADD', 'SUB', 'MUL']

function bitsToNumber(bits) {
  return parseInt(bits.join(''), 2)
}

function numberToBits(num, width = 8) {
  const mask = (1 << width) - 1
  return (num & mask).toString(2).padStart(width, '0')
}

function BinaryInput({ label, bits, setBits }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {bits.map((bit, idx) => (
          <button
            key={idx}
            onClick={() => setBits((prev) => prev.map((v, i) => i === idx ? (v ? 0 : 1) : v))}
            className={`w-9 h-9 rounded border text-sm font-mono ${bit ? 'bg-emerald-500/30 text-emerald-100 border-emerald-300/40' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
          >
            {bit}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Module20() {
  const [xBits, setXBits] = useState([0, 0, 1, 1])
  const [yBits, setYBits] = useState([0, 1, 0, 1])
  const [op, setOp] = useState('ADD')

  const { x, y, value, binaryResult } = useMemo(() => {
    const xVal = bitsToNumber(xBits)
    const yVal = bitsToNumber(yBits)

    const result = op === 'ADD'
      ? xVal + yVal
      : op === 'SUB'
        ? xVal - yVal
        : xVal * yVal

    return {
      x: xVal,
      y: yVal,
      value: result,
      binaryResult: numberToBits(result, 8),
    }
  }, [xBits, yBits, op])

  return (
    <ApplicationShell
      title="Project 6 - Binary Calculator"
      subtitle="Real-World Applications: Binary-only arithmetic with decimal interpretation"
      logicTitle="Logic Used"
      logicValue="Addition/Subtraction via binary adders; Multiplication via shift-and-add partial products"
      controls={
        <div className="space-y-4">
          <BinaryInput label="Binary X" bits={xBits} setBits={setXBits} />
          <BinaryInput label="Binary Y" bits={yBits} setBits={setYBits} />
          <div>
            <p className="text-xs text-gray-400 mb-2">Operation</p>
            <div className="grid grid-cols-3 gap-2">
              {OPS.map((item) => (
                <button key={item} onClick={() => setOp(item)} className={`px-2 py-2 rounded-lg border text-xs font-mono ${op === item ? 'bg-cyan-500/25 border-cyan-300/50 text-cyan-200' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      simulation={
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#05121f] to-[#0a1317] p-4">
            <p className="text-xs text-gray-400">Calculator Output LED Bus</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {binaryResult.split('').map((bit, idx) => (
                <div key={idx} className={`w-8 h-8 rounded-md border flex items-center justify-center font-mono text-xs ${bit === '1' ? 'bg-emerald-400/35 border-emerald-300/50 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'bg-gray-900 border-gray-700 text-gray-500'}`}>
                  {bit}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            <p className="text-gray-400">Expression</p>
            <p className="font-mono text-cyan-200 mt-1">{xBits.join('')} {op === 'ADD' ? '+' : op === 'SUB' ? '-' : 'x'} {yBits.join('')} = {binaryResult}</p>
            <p className="font-mono text-amber-200 mt-2">Decimal: {x} {op === 'ADD' ? '+' : op === 'SUB' ? '-' : 'x'} {y} = {value}</p>
          </div>
        </div>
      }
      education={
        <div className="space-y-3 text-xs text-gray-300">
          <p>Binary arithmetic uses the same digital logic primitives as CPUs.</p>
          <p>Addition relies on half/full adders. Subtraction uses two's complement.</p>
          <p>Multiplication is built from shifted additions of partial products.</p>
          <p className="font-mono text-cyan-300">Example: 0101 x 0011 = 1111 (5 x 3 = 15)</p>
        </div>
      }
    />
  )
}
