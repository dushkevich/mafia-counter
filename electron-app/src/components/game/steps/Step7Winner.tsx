import React from 'react'
import { useGameStore } from '../../../store/gameStore'

const SIDES = [
  { id: 'citizens', label: '🏘 Мирные', color: 'bg-blue-700 hover:bg-blue-600' },
  { id: 'mafia', label: '🔫 Мафия', color: 'bg-red-800 hover:bg-red-700' },
  { id: 'maniac', label: '🔪 Маньяк', color: 'bg-purple-800 hover:bg-purple-700' },
]

export default function Step7Winner() {
  const { winnerSide, setWinner, setStep } = useGameStore()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-white">Кто победил?</h2>

      <div className="flex flex-col gap-3">
        {SIDES.map((s) => (
          <button
            key={s.id}
            onClick={() => setWinner(s.id)}
            className={`py-5 rounded-2xl text-white text-xl font-bold transition-all ${s.color} ${
              winnerSide === s.id ? 'ring-4 ring-white/40 scale-[1.02]' : ''
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(5)} className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">
          ← Назад
        </button>
        <button
          onClick={() => setStep(7)}
          disabled={!winnerSide}
          className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Далее →
        </button>
      </div>
    </div>
  )
}
