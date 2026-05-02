import React, { useState } from 'react'
import { useGameStore } from '../../../store/gameStore'

const PRESETS = [6, 8, 10, 12]

export default function Step1Count() {
  const { playerCount, setPlayerCount, setStep } = useGameStore()
  const [custom, setCustom] = useState('')

  const handlePreset = (n: number) => {
    setPlayerCount(n)
    setCustom('')
  }

  const handleCustom = (v: string) => {
    setCustom(v)
    const n = parseInt(v)
    if (!isNaN(n) && n >= 3) setPlayerCount(n)
  }

  const count = custom ? parseInt(custom) || 0 : playerCount

  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      <h2 className="text-xl font-semibold text-white">Количество игроков</h2>

      <div className="flex gap-3">
        {PRESETS.map((n) => (
          <button
            key={n}
            onClick={() => handlePreset(n)}
            className={`w-16 h-16 rounded-xl text-xl font-bold transition-colors ${
              count === n && !custom
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm">или своё:</span>
        <input
          type="number"
          min={3}
          max={20}
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="..."
          className="w-20 px-3 py-2 rounded-lg bg-slate-700 text-white text-center border border-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={count < 3}
        className="mt-4 px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Далее →
      </button>
    </div>
  )
}
