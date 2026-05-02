import React from 'react'
import { useGameStore } from '../../../store/gameStore'
import { ROLE_ORDER, ROLE_LABELS, SINGLETON_ROLES } from '../../../utils/roles'

export default function Step3Roles() {
  const { playerCount, roleCounts, setRoleCounts, setStep, buildPool } = useGameStore()

  const total = Object.values(roleCounts).reduce((a, b) => a + b, 0)
  const valid = total === playerCount

  const set = (role: string, delta: number) => {
    const cur = roleCounts[role] ?? 0
    const next = cur + delta
    if (next < 0) return
    if (SINGLETON_ROLES.has(role) && next > 1) return
    setRoleCounts({ ...roleCounts, [role]: next })
  }

  const handleNext = () => {
    buildPool()
    setStep(4)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Роли</h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          valid ? 'bg-green-700 text-green-100' : total > playerCount ? 'bg-red-700 text-red-100' : 'bg-slate-700 text-slate-300'
        }`}>
          {total} / {playerCount}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ROLE_ORDER.map((role) => {
          const count = roleCounts[role] ?? 0
          return (
            <div key={role} className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-200">{ROLE_LABELS[role]}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => set(role, -1)}
                  className="w-7 h-7 rounded bg-slate-600 text-white hover:bg-slate-500 font-bold text-lg leading-none"
                >
                  −
                </button>
                <span className="w-5 text-center text-white font-medium">{count}</span>
                <button
                  onClick={() => set(role, 1)}
                  className="w-7 h-7 rounded bg-slate-600 text-white hover:bg-slate-500 font-bold text-lg leading-none"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {total > playerCount && (
        <p className="text-red-400 text-sm">Слишком много ролей ({total - playerCount} лишних)</p>
      )}

      <div className="flex justify-between mt-2">
        <button
          onClick={() => setStep(2)}
          className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm"
        >
          ← Назад
        </button>
        <button
          onClick={handleNext}
          disabled={!valid}
          className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Далее →
        </button>
      </div>
    </div>
  )
}
