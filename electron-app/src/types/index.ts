export interface Player {
  id: number
  name: string
  games_played: number
  total_score: number
  wins: number
  losses: number
  citizen_games: number
  mafia_games: number
  don_games: number
  judge_games: number
  sheriff_games: number
  doctor_games: number
  beauty_games: number
  bodyguard_games: number
  prosecutor_games: number
  con_artist_games: number
  thief_games: number
  maniac_games: number
  created_at: string
}

export interface GameCommitPayload {
  winnerSide: string
  roleCounts: Record<string, number>
  participants: {
    playerId: number
    playerName: string
    role: string
    isAlive: boolean
    adjustment: number
  }[]
}

export interface GameResult {
  gameId: string
  winnerSide: string
  participants: {
    playerName: string
    role: string
    isAlive: boolean
    won: boolean
    scoreDelta: number
    adjustment: number
  }[]
}

export interface GameHistoryRow {
  game_id: string
  played_at: string
  winner_side: string
  player_count: number
  participant_count: number
}
