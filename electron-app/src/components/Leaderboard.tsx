import React, { useEffect, useState } from 'react'
import type { Player } from '../types'

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    window.api.leaderboard.get(50).then(setPlayers)
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Рейтинг</h2>
        <button
          onClick={() => window.api.leaderboard.get(50).then(setPlayers)}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
        >
          Обновить
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700/60 text-slate-400 text-xs">
              <th className="text-center px-4 py-2.5 w-12">#</th>
              <th className="text-left px-4 py-2.5">Имя</th>
              <th className="text-right px-4 py-2.5">Очки</th>
              <th className="text-right px-4 py-2.5">Победы</th>
              <th className="text-right px-4 py-2.5">Поражения</th>
              <th className="text-right px-4 py-2.5">Игры</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 text-center text-slate-400">
                  {i < 3 ? medals[i] : <span className="text-slate-500">{i + 1}</span>}
                </td>
                <td className="px-4 py-3 text-slate-200 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-right font-bold text-indigo-300">{p.total_score.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-green-400">{p.wins}</td>
                <td className="px-4 py-3 text-right text-red-400">{p.losses}</td>
                <td className="px-4 py-3 text-right text-slate-400">{p.games_played}</td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
