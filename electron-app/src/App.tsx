import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Players from './components/Players'
import Leaderboard from './components/Leaderboard'
import NewGame from './components/game/NewGame'
import ErrorBoundary from './components/ErrorBoundary'

type Page = 'game' | 'players' | 'leaderboard'

export default function App() {
  const [page, setPage] = useState<Page>('game')

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar current={page} onChange={setPage} />
      <main className="flex-1 overflow-y-auto bg-slate-800">
        <ErrorBoundary key={page}>
          {page === 'game' && <NewGame />}
          {page === 'players' && <Players />}
          {page === 'leaderboard' && <Leaderboard />}
        </ErrorBoundary>
      </main>
    </div>
  )
}
