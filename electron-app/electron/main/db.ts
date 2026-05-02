import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import crypto from 'crypto'
import { computeScore, didWin } from '../../src/utils/scoring'
import { ROLE_SIDES } from '../../src/utils/roles'

const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'mafia.db')
  : path.join(app.getPath('userData'), 'mafia-dev.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    games_played INTEGER DEFAULT 0,
    total_score REAL DEFAULT 0.0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    citizen_games INTEGER DEFAULT 0,
    mafia_games INTEGER DEFAULT 0,
    don_games INTEGER DEFAULT 0,
    judge_games INTEGER DEFAULT 0,
    sheriff_games INTEGER DEFAULT 0,
    doctor_games INTEGER DEFAULT 0,
    beauty_games INTEGER DEFAULT 0,
    bodyguard_games INTEGER DEFAULT 0,
    prosecutor_games INTEGER DEFAULT 0,
    con_artist_games INTEGER DEFAULT 0,
    thief_games INTEGER DEFAULT 0,
    maniac_games INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT UNIQUE NOT NULL,
    played_at TEXT DEFAULT (datetime('now')),
    winner_side TEXT NOT NULL,
    player_count INTEGER NOT NULL,
    roles_used TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    role TEXT NOT NULL,
    side TEXT NOT NULL,
    is_alive_end INTEGER DEFAULT 1,
    score_delta REAL NOT NULL,
    won INTEGER NOT NULL,
    adjustment REAL DEFAULT 0.0,
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
`)

export interface PlayerRow {
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

export function getAllPlayers(): PlayerRow[] {
  return db.prepare('SELECT * FROM players ORDER BY total_score DESC').all() as PlayerRow[]
}

export function addPlayer(name: string): PlayerRow {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Имя не может быть пустым')
  db.prepare('INSERT INTO players (name) VALUES (?)').run(trimmed)
  return db.prepare('SELECT * FROM players WHERE name = ?').get(trimmed) as PlayerRow
}

export function deletePlayer(id: number): void {
  db.prepare('DELETE FROM players WHERE id = ?').run(id)
}

export function getLeaderboard(topN = 10): PlayerRow[] {
  return db
    .prepare('SELECT * FROM players ORDER BY total_score DESC, wins DESC LIMIT ?')
    .all(topN) as PlayerRow[]
}

export function getGameHistory(limit = 50): unknown[] {
  return db
    .prepare(
      `SELECT g.game_id, g.played_at, g.winner_side, g.player_count,
              COUNT(gp.id) as participant_count
       FROM games g
       LEFT JOIN game_participants gp ON gp.game_id = g.game_id
       GROUP BY g.game_id
       ORDER BY g.played_at DESC
       LIMIT ?`
    )
    .all(limit)
}

export function commitGame(payload: GameCommitPayload): GameResult {
  const gameId = crypto.randomBytes(4).toString('hex').toUpperCase()

  const results = payload.participants.map((p) => {
    const won = didWin(p.role, payload.winnerSide)
    const scoreDelta = computeScore(p.role, payload.winnerSide, p.isAlive, p.adjustment)
    return { ...p, won, scoreDelta }
  })

  const run = db.transaction(() => {
    db.prepare(
      'INSERT INTO games (game_id, winner_side, player_count, roles_used) VALUES (?, ?, ?, ?)'
    ).run(gameId, payload.winnerSide, payload.participants.length, JSON.stringify(payload.roleCounts))

    const insertPart = db.prepare(
      `INSERT INTO game_participants
         (game_id, player_id, player_name, role, side, is_alive_end, score_delta, won, adjustment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    const updatePlayer = db.prepare(
      `UPDATE players SET
         games_played = games_played + 1,
         total_score  = ROUND(total_score + ?, 2),
         wins         = wins + ?,
         losses       = losses + ?,
         ${''/* role column updated below */}
         updated_at   = datetime('now')
       WHERE id = ?`
    )

    for (const r of results) {
      const side = ROLE_SIDES[r.role] ?? 'citizens'
      insertPart.run(
        gameId, r.playerId, r.playerName, r.role, side,
        r.isAlive ? 1 : 0, r.scoreDelta, r.won ? 1 : 0, r.adjustment
      )

      const roleCol = `${r.role}_games`
      db.prepare(
        `UPDATE players SET
           games_played = games_played + 1,
           total_score  = ROUND(total_score + ?, 2),
           wins         = wins + ?,
           losses       = losses + ?,
           "${roleCol}"  = "${roleCol}" + 1
         WHERE id = ?`
      ).run(r.scoreDelta, r.won ? 1 : 0, r.won ? 0 : 1, r.playerId)
    }
  })

  run()

  return {
    gameId,
    winnerSide: payload.winnerSide,
    participants: results.map((r) => ({
      playerName: r.playerName,
      role: r.role,
      isAlive: r.isAlive,
      won: r.won,
      scoreDelta: r.scoreDelta,
      adjustment: r.adjustment
    }))
  }
}
