import React, { useEffect, useState } from 'react'
import { useGameStore } from '../../../store/gameStore'
import { ROLE_LABELS, WINNER_LABELS } from '../../../utils/roles'
import type { GameResult } from '../../../types'

export default function StepResult() {
  const {
    selectedPlayers, assigned, aliveStatus, adjustments,
    winnerSide, roleCounts, setLastResult, lastResult, reset,
  } = useGameStore()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (saved || saving || lastResult) return
    const save = async () => {
      setSaving(true)
      try {
        const payload = {
          winnerSide: winnerSide!,
          roleCounts,
          participants: selectedPlayers.map((p) => ({
            playerId: p.id,
            playerName: p.name,
            role: assigned[p.name],
            isAlive: aliveStatus[p.name] ?? true,
            adjustment: adjustments[p.name] ?? 0,
          })),
        }
        const result: GameResult = await window.api.games.commit(payload)
        setLastResult(result)
        setSaved(true)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения')
      } finally {
        setSaving(false)
      }
    }
    save()
  }, [])

  const result = lastResult

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Результаты игры</h2>
        {result && (
          <span className="text-xs text-slate-400">#{result.gameId}</span>
        )}
      </div>

      {winnerSide && (
        <div className="bg-slate-700 rounded-xl px-4 py-3 text-center">
          <p className="text-slate-400 text-sm mb-1">Победитель</p>
          <p className="text-xl font-bold text-white">{WINNER_LABELS[winnerSide] ?? winnerSide}</p>
        </div>
      )}

      {saving && <p className="text-slate-400 text-sm text-center">Сохранение...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-600">
                <th className="text-left pb-2 pr-3">Игрок</th>
                <th className="text-left pb-2 pr-3">Роль</th>
                <th className="text-center pb-2 pr-3">Статус</th>
                <th className="text-center pb-2 pr-3">Итог</th>
                <th className="text-right pb-2">Очки</th>
              </tr>
            </thead>
            <tbody>
              {result.participants.map((p) => (
                <tr key={p.playerName} className="border-b border-slate-700/50">
                  <td className="py-2 pr-3 text-slate-200 font-medium">{p.playerName}</td>
                  <td className="py-2 pr-3 text-slate-300">{ROLE_LABELS[p.role] ?? p.role}</td>
                  <td className="py-2 pr-3 text-center">{p.isAlive ? '✅' : '☠️'}</td>
                  <td className={`py-2 pr-3 text-center text-xs font-medium ${p.won ? 'text-green-400' : 'text-red-400'}`}>
                    {p.won ? 'Победа' : 'Поражение'}
                  </td>
                  <td className={`py-2 text-right font-bold ${p.scoreDelta > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                    {p.scoreDelta > 0 ? '+' : ''}{p.scoreDelta.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={reset}
        className="mt-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
      >
        🎮 Новая игра
      </button>
    </div>
  )
}
