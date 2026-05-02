import React from 'react'
import { useGameStore } from '../../../store/gameStore'
import { ROLE_LABELS } from '../../../utils/roles'

export default function Step5AliveDead() {
  const { selectedPlayers, assigned, aliveStatus, toggleAlive, setStep } = useGameStore()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-white">Живые / Мёртвые</h2>

      <div className="space-y-2">
        {selectedPlayers.map((p) => {
          const alive = aliveStatus[p.name] ?? true
          return (
            <div
              key={p.id}
              className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2.5"
            >
              <div>
                <span className="text-slate-200 font-medium">{p.name}</span>
                <span className="ml-2 text-xs text-slate-400">{ROLE_LABELS[assigned[p.name]] ?? ''}</span>
              </div>
              <button
                onClick={() => toggleAlive(p.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  alive
                    ? 'bg-green-700 text-green-100 hover:bg-green-600'
                    : 'bg-red-800 text-red-200 hover:bg-red-700'
                }`}
              >
                {alive ? '✅ Жив' : '☠️ Мёртв'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between mt-2">
        <button onClick={() => setStep(4)} className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">
          ← Назад
        </button>
        <button onClick={() => setStep(6)} className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 text-sm">
          Далее →
        </button>
      </div>
    </div>
  )
}
