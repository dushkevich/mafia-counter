import React, { useState } from 'react'
import { useGameStore } from '../../../store/gameStore'
import { ROLE_LABELS } from '../../../utils/roles'

const ADJUSTMENTS = [
  { label: '+0.3', value: 0.3 },
  { label: '+0.2', value: 0.2 },
  { label: '+0.1', value: 0.1 },
  { label: '−0.1', value: -0.1 },
  { label: 'Удалён −0.2', value: -0.2 },
  { label: 'ППК −0.3', value: -0.3 },
]

export default function Step6Bonuses() {
  const { selectedPlayers, assigned, adjustments, setAdjustment, setStep } = useGameStore()
  const [activePlayer, setActivePlayer] = useState<string | null>(null)

  if (activePlayer) {
    const adj = adjustments[activePlayer] ?? 0
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setActivePlayer(null)} className="text-slate-400 hover:text-white text-sm">
            ← Назад
          </button>
          <h2 className="text-xl font-semibold text-white">{activePlayer}</h2>
        </div>

        <div className="bg-slate-700 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm mb-1">Текущая корректировка</p>
          <p className={`text-3xl font-bold ${adj > 0 ? 'text-green-400' : adj < 0 ? 'text-red-400' : 'text-white'}`}>
            {adj > 0 ? '+' : ''}{adj.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ADJUSTMENTS.map((a) => (
            <button
              key={a.label}
              onClick={() => setAdjustment(activePlayer, a.value)}
              className="py-3 rounded-xl bg-slate-700 text-slate-200 hover:bg-indigo-600 hover:text-white font-medium transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const keys = Object.keys(adjustments)
            const idx = keys.indexOf(activePlayer)
            if (idx !== -1 && idx < keys.length - 1) {
              setActivePlayer(keys[idx + 1])
            } else {
              setActivePlayer(null)
            }
          }}
          className="mt-2 py-2 rounded-lg bg-green-700 text-white hover:bg-green-600 text-sm font-medium"
        >
          Готово
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-white">Бонусы / Штрафы</h2>
      <p className="text-slate-400 text-sm">Нажмите на игрока, чтобы добавить корректировку</p>

      <div className="space-y-2">
        {selectedPlayers.map((p) => {
          const adj = adjustments[p.name] ?? 0
          return (
            <button
              key={p.id}
              onClick={() => setActivePlayer(p.name)}
              className="w-full flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2.5 hover:bg-slate-600 transition-colors"
            >
              <div className="text-left">
                <span className="text-slate-200 font-medium">{p.name}</span>
                <span className="ml-2 text-xs text-slate-400">{ROLE_LABELS[assigned[p.name]] ?? ''}</span>
              </div>
              <span className={`text-sm font-medium ${adj > 0 ? 'text-green-400' : adj < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {adj !== 0 ? (adj > 0 ? '+' : '') + adj.toFixed(2) : '—'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between mt-2">
        <button onClick={() => setStep(5)} className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">
          ← Назад
        </button>
        <button onClick={() => setStep(7)} className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 text-sm">
          Далее →
        </button>
      </div>
    </div>
  )
}
