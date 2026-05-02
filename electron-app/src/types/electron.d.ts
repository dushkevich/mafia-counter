import type { Player, GameCommitPayload, GameResult, GameHistoryRow } from './index'

declare global {
  interface Window {
    api: {
      players: {
        getAll: () => Promise<Player[]>
        add: (name: string) => Promise<Player>
        delete: (id: number) => Promise<void>
      }
      games: {
        commit: (payload: GameCommitPayload) => Promise<GameResult>
        history: (limit?: number) => Promise<GameHistoryRow[]>
      }
      leaderboard: {
        get: (topN?: number) => Promise<Player[]>
      }
    }
  }
}
