import React from 'react'
import { useGameStore } from '../../../store/gameStore'
import { ROLE_LABELS } from '../../../utils/roles'
import { getRemainingPool, uniqueRolesInPool } from '../../../utils/roles'

export default function Step4Assign() {
  const {
    selectedPlayers,
    rolePool,
    assigned,
    assignmentIndex,
    assignNextRole,
    setStep,
  } = useGameStore()

  const remaining = getRemainingPool(rolePool, assigned)
  const uniqueRoles = uniqueRolesInPool(remaining)
  const currentPlayer = selectedPlayers[assignmentIndex]
  const done = assignmentIndex >= selectedPlayers.length

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-white">Роли назначены</h2>
        <div className="space-y-2">
          {selectedPlayers.map((p) => (
            <div key={p.id} className="flex justify-between bg-slate-700 rounded-lg px-3 py-2">
              <span className="text-slate-200">{p.name}</span>
              <span className="text-indigo-300 font-medium">{ROLE_LABELS[assigned[p.name]] ?? assigned[p.name]}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <button onClick={() => setStep(3)} className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">
            ← Назад
          </button>
          <button onClick={() => setStep(5)} className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 text-sm">
            Далее →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Назначение ролей</h2>
        <span className="text-sm text-slate-400">{assignmentIndex} / {selectedPlayers.length}</span>
      </div>

      <div className="bg-slate-700 rounded-xl p-4 text-center">
        <p className="text-slate-400 text-sm mb-1">Текущий игрок</p>
        <p className="text-2xl font-bold text-white">{currentPlayer?.name}</p>
      </div>

      <p className="text-slate-400 text-sm">Выберите роль:</p>
      <div className="grid grid-cols-2 gap-2">
        {uniqueRoles.map((role) => (
          <button
            key={role}
            onClick={() => assignNextRole(role)}
            className="py-3 rounded-xl bg-slate-700 text-slate-200 hover:bg-indigo-600 hover:text-white font-medium transition-colors"
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      <button onClick={() => setStep(3)} className="mt-2 px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm self-start">
        ← Назад
      </button>
    </div>
  )
}
