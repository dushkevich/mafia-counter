import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  players: {
    getAll: () => ipcRenderer.invoke('players:getAll'),
    add: (name: string) => ipcRenderer.invoke('players:add', name),
    delete: (id: number) => ipcRenderer.invoke('players:delete', id),
  },
  games: {
    commit: (payload: unknown) => ipcRenderer.invoke('games:commit', payload),
    history: (limit?: number) => ipcRenderer.invoke('games:history', limit),
  },
  leaderboard: {
    get: (topN?: number) => ipcRenderer.invoke('leaderboard:get', topN),
  },
})
