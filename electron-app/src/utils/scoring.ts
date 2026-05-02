// role → winner_side → alive → base score
export const SCORE_TABLE: Record<string, Record<string, Record<string, number>>> = {
  citizen: {
    citizens: { alive: 1.0, dead: 0.5 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  sheriff: {
    citizens: { alive: 2.0, dead: 1.0 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  doctor: {
    citizens: { alive: 2.0, dead: 1.0 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  beauty: {
    citizens: { alive: 1.0, dead: 0.5 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  bodyguard: {
    citizens: { alive: 1.0, dead: 1.0 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  prosecutor: {
    citizens: { alive: 1.0, dead: 0.5 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  con_artist: {
    citizens: { alive: 1.0, dead: 0.5 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  thief: {
    citizens: { alive: 1.0, dead: 0.5 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  mafia: {
    citizens: { alive: 0.0, dead: 0.0 },
    mafia:    { alive: 2.0, dead: 1.5 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  don: {
    citizens: { alive: 0.0, dead: 0.0 },
    mafia:    { alive: 2.0, dead: 1.5 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  judge: {
    citizens: { alive: 0.0, dead: 0.0 },
    mafia:    { alive: 2.0, dead: 1.0 },
    maniac:   { alive: 0.0, dead: 0.0 },
  },
  maniac: {
    citizens: { alive: 0.0, dead: 0.0 },
    mafia:    { alive: 0.0, dead: 0.0 },
    maniac:   { alive: 2.0, dead: 2.0 },
  },
}

export function computeScore(
  role: string,
  winnerSide: string,
  isAlive: boolean,
  adjustment = 0
): number {
  const aliveKey = isAlive ? 'alive' : 'dead'
  const base = SCORE_TABLE[role]?.[winnerSide]?.[aliveKey] ?? 0
  return Math.round((base + adjustment) * 100) / 100
}

export function didWin(role: string, winnerSide: string): boolean {
  const base = SCORE_TABLE[role]?.[winnerSide]?.['alive'] ?? 0
  return base > 0
}
