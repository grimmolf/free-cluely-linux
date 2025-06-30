// ipcHandlers.ts

import { ipcMain, app, screen } from "electron"
import { AppState } from "./main"
import { ModelProviderFactory } from "./ModelProviderFactory"
import { ProcessingHelper } from "./ProcessingHelper"
import screenshot from "screenshot-desktop"
import { ElectronScreenshotHelper } from "./ElectronScreenshotHelper"
import { X11ScreenshotHelper } from "./X11ScreenshotHelper"

export function initializeIpcHandlers(appState: AppState): void {
  ipcMain.handle(
    "update-content-dimensions",
    async (event, { width, height }: { width: number; height: number }) => {
      if (width && height) {
        appState.setWindowDimensions(width, height)
      }
    }
  )

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    return appState.deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      const preview = await appState.getImagePreview(screenshotPath)
      return { path: screenshotPath, preview }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    console.log({ view: appState.getView() })
    try {
      let previews = []
      if (appState.getView() === "queue") {
        previews = await Promise.all(
          appState.getScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      } else {
        previews = await Promise.all(
          appState.getExtraScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      }
      previews.forEach((preview: any) => console.log(preview.path))
      return previews
    } catch (error) {
      console.error("Error getting screenshots:", error)
      throw error
    }
  })

  ipcMain.handle("toggle-window", async () => {
    appState.toggleMainWindow()
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      appState.clearQueues()
      console.log("Screenshot queues have been cleared.")
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  ipcMain.handle("quit-app", () => {
    app.quit()
  })

  // Model Provider Configuration IPC Handlers
  ipcMain.handle("get-model-provider-config", async () => {
    try {
      return appState.configManager.getModelProviderConfig()
    } catch (error: any) {
      console.error("Error getting model provider config:", error)
      throw error
    }
  })

  ipcMain.handle("set-model-provider-config", async (event, config) => {
    try {
      appState.configManager.setModelProviderConfig(config)
      // Reinitialize ProcessingHelper with new config
      appState.processingHelper = new ProcessingHelper(appState)
      return { success: true }
    } catch (error: any) {
      console.error("Error setting model provider config:", error)
      throw error
    }
  })

  ipcMain.handle("get-available-providers", async () => {
    try {
      return ModelProviderFactory.getAvailableProviders()
    } catch (error: any) {
      console.error("Error getting available providers:", error)
      throw error
    }
  })

  ipcMain.handle("get-model-options", async (event, provider: string) => {
    try {
      return ModelProviderFactory.getModelOptions(provider)
    } catch (error: any) {
      console.error("Error getting model options:", error)
      throw error
    }
  })

  // Screenshot Configuration IPC Handlers
  ipcMain.handle("get-screenshot-config", async () => {
    try {
      return appState.configManager.getScreenshotConfig()
    } catch (error: any) {
      console.error("Error getting screenshot config:", error)
      throw error
    }
  })

  ipcMain.handle("set-screenshot-config", async (event, config) => {
    try {
      appState.configManager.setScreenshotConfig(config)
      return { success: true }
    } catch (error: any) {
      console.error("Error setting screenshot config:", error)
      throw error
    }
  })

  ipcMain.handle("get-available-monitors", async () => {
    try {
      // On Linux, use X11 for accurate display information
      if (process.platform === "linux") {
        try {
          const x11Displays = await X11ScreenshotHelper.getX11Displays()
          console.log('X11 displays:', x11Displays)
          
          return x11Displays.map((display, index) => ({
            id: display.name, // Use display name as ID (e.g., "DisplayPort-1", "DisplayPort-2")
            name: `${display.name} (${display.resolution})${display.primary ? ' - Primary' : ''}`,
            index: index
          }))
        } catch (x11Error) {
          console.error('X11 display detection failed:', x11Error)
          // Fall back to Electron's screen API
        }
      }
      
      // Fallback: Try Electron's screen API
      const electronDisplays = await ElectronScreenshotHelper.listDisplays()
      console.log('Electron displays:', electronDisplays)
      
      // Also try screenshot-desktop for comparison
      try {
        const screenshotDisplays = await screenshot.listDisplays()
        console.log('Screenshot-desktop displays:', screenshotDisplays)
      } catch (e) {
        console.log('screenshot.listDisplays() failed:', e)
      }
      
      return electronDisplays
    } catch (error: any) {
      console.error("Error getting available monitors:", error)
      throw error
    }
  })
}
