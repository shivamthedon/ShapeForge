export {}

declare global {
  interface Window {
    shapeforge?: {
      saveProject: (data: string) => Promise<{ ok: boolean; path?: string }>
      openProject: () => Promise<{ ok: boolean; path?: string; content?: string }>
      exportStl: (
        stl: string,
        suggestedName: string,
      ) => Promise<{ ok: boolean; path?: string }>
      platform: string
    }
  }
}
