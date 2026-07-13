import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(__dirname, '../public')

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ShapeForge',
    backgroundColor: '#1a2332',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('dialog:saveProject', async (_event, data: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save ShapeForge Project',
    defaultPath: 'my-design.shapeforge.json',
    filters: [
      { name: 'ShapeForge Project', extensions: ['shapeforge.json', 'json'] },
    ],
  })
  if (result.canceled || !result.filePath) return { ok: false }
  await fs.writeFile(result.filePath, data, 'utf-8')
  return { ok: true, path: result.filePath }
})

ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open ShapeForge Project',
    filters: [
      { name: 'ShapeForge Project', extensions: ['shapeforge.json', 'json'] },
    ],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return { ok: false }
  const content = await fs.readFile(result.filePaths[0], 'utf-8')
  return { ok: true, path: result.filePaths[0], content }
})

ipcMain.handle('dialog:exportStl', async (_event, stl: string, suggestedName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export STL',
    defaultPath: suggestedName || 'model.stl',
    filters: [{ name: 'STL Model', extensions: ['stl'] }],
  })
  if (result.canceled || !result.filePath) return { ok: false }
  await fs.writeFile(result.filePath, stl, 'utf-8')
  return { ok: true, path: result.filePath }
})
