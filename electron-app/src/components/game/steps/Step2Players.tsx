import React, { useEffect, useState } from 'react'
import { useGameStore } from '../../../store/gameStore'
import type { Player } from '../../../types'

export default function Step2Players() {
  const { playerCount, selectedPlayers, setSelectedPlayers, setStep } = useGameStore()
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    window.api.players.getAll().then(setAllPlayers)
  }, [])

  const isSelected = (p: Player) => selectedPlayers.some((s) => s.id === p.id)

  const toggle = (p: Player) => {
    if (isSelected(p)) {
      setSelectedPlayers(selectedPlayers.filter((s) => s.id !== p.id))
    } else if (selectedPlayers.length < playerCount) {
      setSelectedPlayers([...selectedPlayers, p])
    }
  }

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      const p = await window.api.players.add(name)
      setAllPlayers((prev) => [...prev, p])
      if (selectedPlayers.length < playerCount) {
        setSelectedPlayers([...selectedPlayers, p])
      }
      setNewName('')
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const canProceed = selectedPlayers.length === playerCount

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Выбор игроков</h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          canProceed ? 'bg-green-700 text-green-100' : 'bg-slate-700 text-slate-300'
        }`}>
          {selectedPlayers.length} / {playerCount}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {allPlayers.map((p) => {
          const sel = isSelected(p)
          const disabled = !sel && selectedPlayers.length >= playerCount
          return (
            <button
              key={p.id}
              onClick={() => toggle(p)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                sel
                  ? 'bg-indigo-600 text-white'
                  : disabled
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              <span>{sel ? '✓' : '○'}</span>
              <span className="truncate">{p.name}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Добавить игрока..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
        >
          Добавить
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex justify-between mt-2">
        <button
          onClick={() => setStep(1)}
          className="px-5 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm"
        >
          ← Назад
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!canProceed}
          className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Далее →
        </button>
      </div>
    </div>
  )
}
