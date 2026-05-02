import { create } from 'zustand'
import { buildRolePool } from '../utils/roles'
import type { Player } from '../types'

interface GameStore {
  step: number
  playerCount: number
  selectedPlayers: Player[]
  roleCounts: Record<string, number>
  rolePool: string[]
  assigned: Record<string, string>
  assignmentIndex: number
  aliveStatus: Record<string, boolean>
  adjustments: Record<string, number>
  winnerSide: string | null
  lastResult: import('../types').GameResult | null

  setStep: (s: number) => void
  setPlayerCount: (n: number) => void
  setSelectedPlayers: (players: Player[]) => void
  setRoleCounts: (counts: Record<string, number>) => void
  buildPool: () => void
  assignNextRole: (role: string) => void
  toggleAlive: (playerName: string) => void
  setAdjustment: (playerName: string, delta: number) => void
  clearAdjustment: (playerName: string) => void
  setWinner: (side: string) => void
  setLastResult: (result: import('../types').GameResult) => void
  reset: () => void
}

const initialState = {
  step: 1,
  playerCount: 6,
  selectedPlayers: [],
  roleCounts: {},
  rolePool: [],
  assigned: {},
  assignmentIndex: 0,
  aliveStatus: {},
  adjustments: {},
  winnerSide: null,
  lastResult: null,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setStep: (s) => set({ step: s }),
  setPlayerCount: (n) => set({ playerCount: n }),
  setSelectedPlayers: (players) => set({ selectedPlayers: players }),
  setRoleCounts: (counts) => set({ roleCounts: counts }),

  buildPool: () => {
    const pool = buildRolePool(get().roleCounts)
    const { selectedPlayers } = get()
    const aliveStatus: Record<string, boolean> = {}
    const adjustments: Record<string, number> = {}
    for (const p of selectedPlayers) {
      aliveStatus[p.name] = true
      adjustments[p.name] = 0
    }
    set({ rolePool: pool, assigned: {}, assignmentIndex: 0, aliveStatus, adjustments })
  },

  assignNextRole: (role) => {
    const { assignmentIndex, selectedPlayers, assigned } = get()
    const playerName = selectedPlayers[assignmentIndex].name
    set({
      assigned: { ...assigned, [playerName]: role },
      assignmentIndex: assignmentIndex + 1,
    })
  },

  toggleAlive: (playerName) => {
    const { aliveStatus } = get()
    set({ aliveStatus: { ...aliveStatus, [playerName]: !aliveStatus[playerName] } })
  },

  setAdjustment: (playerName, delta) => {
    const { adjustments } = get()
    const current = adjustments[playerName] ?? 0
    set({ adjustments: { ...adjustments, [playerName]: Math.round((current + delta) * 100) / 100 } })
  },

  clearAdjustment: (playerName) => {
    const { adjustments } = get()
    set({ adjustments: { ...adjustments, [playerName]: 0 } })
  },

  setWinner: (side) => set({ winnerSide: side }),
  setLastResult: (result) => set({ lastResult: result }),
  reset: () => set(initialState),
}))
