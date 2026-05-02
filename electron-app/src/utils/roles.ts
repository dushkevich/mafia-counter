export const ROLE_SIDES: Record<string, string> = {
  citizen: 'citizens',
  sheriff: 'citizens',
  doctor: 'citizens',
  beauty: 'citizens',
  bodyguard: 'citizens',
  prosecutor: 'citizens',
  con_artist: 'citizens',
  thief: 'citizens',
  mafia: 'mafia',
  don: 'mafia',
  judge: 'mafia',
  maniac: 'maniac',
}

export const ROLE_LABELS: Record<string, string> = {
  citizen: 'Мирный',
  sheriff: 'Шериф',
  doctor: 'Доктор',
  beauty: 'Красотка',
  bodyguard: 'Телохранитель',
  prosecutor: 'Прокурор',
  con_artist: 'Аферист',
  thief: 'Вор',
  mafia: 'Мафия',
  don: 'Дон',
  judge: 'Судья',
  maniac: 'Маньяк',
}

export const ROLE_ORDER = [
  'citizen',
  'mafia',
  'don',
  'judge',
  'sheriff',
  'doctor',
  'beauty',
  'bodyguard',
  'prosecutor',
  'con_artist',
  'thief',
  'maniac',
]

export const SINGLETON_ROLES = new Set([
  'don',
  'sheriff',
  'doctor',
  'beauty',
  'maniac',
  'judge',
  'bodyguard',
  'prosecutor',
  'con_artist',
  'thief',
])

export const WINNER_LABELS: Record<string, string> = {
  citizens: '🏘 Мирные',
  mafia: '🔫 Мафия',
  maniac: '🔪 Маньяк',
}

export function buildRolePool(counts: Record<string, number>): string[] {
  const pool: string[] = []
  for (const role of ROLE_ORDER) {
    const n = counts[role] ?? 0
    for (let i = 0; i < n; i++) pool.push(role)
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

export function getRemainingPool(pool: string[], assigned: Record<string, string>): string[] {
  const used = Object.values(assigned)
  const remaining = [...pool]
  for (const role of used) {
    const idx = remaining.indexOf(role)
    if (idx !== -1) remaining.splice(idx, 1)
  }
  return remaining
}

export function uniqueRolesInPool(remaining: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const role of ROLE_ORDER) {
    if (remaining.includes(role) && !seen.has(role)) {
      seen.add(role)
      result.push(role)
    }
  }
  return result
}
