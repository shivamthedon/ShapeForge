import { contextBridge, ipcRenderer } from 'electron'

export type SaveResult = { ok: boolean; path?: string }
export type OpenResult = { ok: boolean; path?: string; content?: string }

const api = {
  saveProject: (data: string): Promise<SaveResult> =>
    ipcRenderer.invoke('dialog:saveProject', data),
  openProject: (): Promise<OpenResult> => ipcRenderer.invoke('dialog:openProject'),
  exportStl: (stl: string, suggestedName: string): Promise<SaveResult> =>
    ipcRenderer.invoke('dialog:exportStl', stl, suggestedName),
  platform: process.platform,
}

contextBridge.exposeInMainWorld('shapeforge', api)

export type ShapeForgeApi = typeof api
