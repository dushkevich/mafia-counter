import React from 'react'

type Page = 'game' | 'players' | 'leaderboard'

interface SidebarProps {
  current: Page
  onChange: (page: Page) => void
}

const items: { id: Page; label: string; icon: string }[] = [
  { id: 'game', label: 'Новая игра', icon: '🎮' },
  { id: 'players', label: 'Игроки', icon: '👥' },
  { id: 'leaderboard', label: 'Рейтинг', icon: '🏆' },
]

export default function Sidebar({ current, onChange }: SidebarProps) {
  return (
    <div className="w-48 bg-slate-900 border-r border-slate-700 flex flex-col py-4 flex-shrink-0">
      <div className="px-4 mb-6">
        <h1 className="text-lg font-bold text-white leading-tight">Мафия</h1>
        <p className="text-xs text-slate-400">счётчик очков</p>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              current === item.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
