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

export default function Step5LiveBonuses() {
  const { selectedPlayers, assigned, aliveStatus, adjustments, toggleAlive, setAdjustment, clearAdjustment, setStep } =
    useGameStore()
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (name: string) => setExpanded((prev) => (prev === name ? null : name))

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-white">Живые и очки</h2>

      <div className="space-y-2">
        {selectedPlayers.map((p) => {
          const alive = aliveStatus[p.name] ?? true
          const adj = adjustments[p.name] ?? 0
          const isOpen = expanded === p.name

          return (
            <div
              key={p.id}
              className={`rounded-xl overflow-hidden border transition-colors ${
                isOpen ? 'border-indigo-500/50 bg-slate-700' : 'border-transparent bg-slate-700'
              }`}
            >
              {/* Row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  onClick={() => toggleAlive(p.name)}
                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    alive
                      ? 'bg-green-700 text-green-100 hover:bg-green-600'
                      : 'bg-red-800/80 text-red-200 hover:bg-red-700'
                  }`}
                >
                  {alive ? '✅ Жив' : '☠️ Мёрт'}
                </button>

                <button
                  onClick={() => toggle(p.name)}
                  className="flex-1 text-left min-w-0 py-0.5"
                >
                  <span className="block text-slate-200 font-medium leading-tight truncate">{p.name}</span>
                  <span className="block text-xs text-slate-400 leading-tight">{ROLE_LABELS[assigned[p.name]] ?? ''}</span>
                </button>

                <button
                  onClick={() => toggle(p.name)}
                  className={`flex-shrink-0 min-w-[3rem] text-center text-sm font-bold rounded-lg px-2 py-1.5 transition-colors ${
                    adj > 0
                      ? 'text-green-400 bg-green-900/30'
                      : adj < 0
                      ? 'text-red-400 bg-red-900/30'
                      : 'text-slate-500 bg-slate-600/40 hover:bg-slate-600'
                  }`}
                >
                  {adj !== 0 ? `${adj > 0 ? '+' : ''}${adj.toFixed(2)}` : '±'}
                </button>

                <button
                  onClick={() => toggle(p.name)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-200 w-5 text-center text-xs"
                >
                  {isOpen ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded panel */}
              {isOpen && (
                <div className="px-3 pb-3 border-t border-slate-600/60">
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                    {ADJUSTMENTS.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => setAdjustment(p.name, a.value)}
                        className="py-2 rounded-lg bg-slate-600 text-slate-200 hover:bg-indigo-600 hover:text-white text-xs font-medium transition-colors"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {adj !== 0 && (
                    <button
                      onClick={() => clearAdjustment(p.name)}
                      className="w-full mt-1.5 py-1.5 rounded-lg bg-slate-600/50 text-slate-400 hover:text-red-400 text-xs transition-colors"
                    >
                      Сбросить корректировку
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between mt-2">
        <button
          onClick={() => setStep(4)}
          className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm"
        >
          ← Назад
        </button>
        <button
          onClick={() => setStep(6)}
          className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 text-sm"
        >
          Далее →
        </button>
      </div>
    </div>
  )
}
