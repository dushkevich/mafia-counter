import React, { useState, useEffect, useRef } from 'react'

export default function GameTimer() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const ss = (elapsed % 60).toString().padStart(2, '0')

  const reset = () => {
    setRunning(false)
    setElapsed(0)
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900/60 rounded-xl px-4 py-2.5 mb-4">
      <span className="font-mono text-2xl font-bold text-white tabular-nums tracking-widest">
        {mm}:{ss}
      </span>
      <div className="flex gap-2 ml-auto">
        {!running && elapsed === 0 && (
          <button
            onClick={() => setRunning(true)}
            className="px-4 py-1.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600"
          >
            ▶ Старт
          </button>
        )}
        {running && (
          <button
            onClick={() => setRunning(false)}
            className="px-4 py-1.5 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-500"
          >
            ⏸ Пауза
          </button>
        )}
        {!running && elapsed > 0 && (
          <button
            onClick={() => setRunning(true)}
            className="px-4 py-1.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-600"
          >
            ▶ Продолжить
          </button>
        )}
        {elapsed > 0 && (
          <button
            onClick={reset}
            className="w-9 h-9 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-base flex items-center justify-center"
            title="Сбросить"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  )
}
