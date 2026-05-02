import React, { useEffect, useState } from 'react'
import type { Player } from '../types'

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const load = () => window.api.players.getAll().then(setPlayers)

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await window.api.players.add(name)
      setNewName('')
      setError('')
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const handleDelete = async (id: number) => {
    await window.api.players.delete(id)
    setConfirmDelete(null)
    load()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Игроки</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Имя нового игрока..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
        >
          Добавить
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700/60 text-slate-400 text-xs">
              <th className="text-left px-4 py-2.5">Имя</th>
              <th className="text-right px-4 py-2.5">Игры</th>
              <th className="text-right px-4 py-2.5">Очки</th>
              <th className="text-right px-4 py-2.5">Победы</th>
              <th className="text-right px-4 py-2.5">Поражения</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-slate-300 text-right">{p.games_played}</td>
                <td className="px-4 py-2.5 text-indigo-300 text-right font-medium">{p.total_score.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-green-400 text-right">{p.wins}</td>
                <td className="px-4 py-2.5 text-red-400 text-right">{p.losses}</td>
                <td className="px-4 py-2.5 text-right">
                  {confirmDelete === p.id ? (
                    <span className="flex items-center justify-end gap-1">
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-900/30">Удалить</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-700">Отмена</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="text-slate-500 hover:text-red-400 text-lg leading-none"
                      title="Удалить"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Нет игроков. Добавьте первого!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
