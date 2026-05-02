import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import {
  getAllPlayers,
  addPlayer,
  deletePlayer,
  getLeaderboard,
  getGameHistory,
  commitGame,
} from './db'
import type { GameCommitPayload } from './db'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mafia.counter')

  app.on('browser-window-created', (_, win) => {
    optimizer.watchWindowShortcuts(win)
  })

  ipcMain.handle('players:getAll', () => getAllPlayers())
  ipcMain.handle('players:add', (_, name: string) => addPlayer(name))
  ipcMain.handle('players:delete', (_, id: number) => deletePlayer(id))
  ipcMain.handle('games:commit', (_, payload: GameCommitPayload) => commitGame(payload))
  ipcMain.handle('games:history', (_, limit?: number) => getGameHistory(limit))
  ipcMain.handle('leaderboard:get', (_, topN?: number) => getLeaderboard(topN))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
