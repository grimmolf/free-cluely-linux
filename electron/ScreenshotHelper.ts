// ScreenshotHelper.ts

import path from "node:path"
import fs from "node:fs"
import { app } from "electron"
import { v4 as uuidv4 } from "uuid"
import screenshot from "screenshot-desktop"
import { ConfigManager } from "./ConfigManager"
import { ElectronScreenshotHelper } from "./ElectronScreenshotHelper"
import { X11ScreenshotHelper } from "./X11ScreenshotHelper"

export class ScreenshotHelper {
  private screenshotQueue: string[] = []
  private extraScreenshotQueue: string[] = []
  private readonly MAX_SCREENSHOTS = 5

  private readonly screenshotDir: string
  private readonly extraScreenshotDir: string

  private view: "queue" | "solutions" = "queue"
  private configManager: ConfigManager

  constructor(view: "queue" | "solutions" = "queue", configManager: ConfigManager) {
    this.view = view
    this.configManager = configManager

    // Initialize directories
    this.screenshotDir = path.join(app.getPath("userData"), "screenshots")
    this.extraScreenshotDir = path.join(
      app.getPath("userData"),
      "extra_screenshots"
    )

    // Create directories if they don't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir)
    }
    if (!fs.existsSync(this.extraScreenshotDir)) {
      fs.mkdirSync(this.extraScreenshotDir)
    }
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotQueue
  }

  public getExtraScreenshotQueue(): string[] {
    return this.extraScreenshotQueue
  }

  public clearQueues(): void {
    // Clear screenshotQueue
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err)
      })
    })
    this.screenshotQueue = []

    // Clear extraScreenshotQueue
    this.extraScreenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(
            `Error deleting extra screenshot at ${screenshotPath}:`,
            err
          )
      })
    })
    this.extraScreenshotQueue = []
  }

  public async takeScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): Promise<string> {
    hideMainWindow()
    
    // Add delay for Linux to ensure window is fully hidden
    if (process.platform === "linux") {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    let screenshotPath = ""
    
    // Get the selected monitor from configuration
    const screenshotConfig = this.configManager.getScreenshotConfig()
    const selectedMonitor = screenshotConfig.selectedMonitor
    console.log('Screenshot config:', screenshotConfig)
    console.log('Selected monitor:', selectedMonitor)
    
    // List available displays for debugging
    try {
      const displays = await screenshot.listDisplays()
      console.log('Available displays:', displays)
    } catch (error) {
      console.error('Error listing displays:', error)
    }

    if (this.view === "queue") {
      screenshotPath = path.join(this.screenshotDir, `${uuidv4()}.png`)
      
      // Build screenshot options with monitor selection
      const screenshotOptions: any = {
        filename: screenshotPath
      }
      
      // Add monitor selection if configured
      if (selectedMonitor !== undefined && selectedMonitor !== null) {
        screenshotOptions.screen = selectedMonitor
      }
      
      // Linux-specific options - use imagemagick for multi-monitor support
      if (process.platform === "linux") {
        screenshotOptions.format = "png"
        screenshotOptions.linuxLibrary = "imagemagick"
      }
      
      try {
        await screenshot(screenshotOptions)
      } catch (error) {
        console.error('Screenshot error with options:', screenshotOptions, error)
        
        // On Linux, try X11 screenshot first, then Electron fallback
        if (process.platform === "linux") {
          console.log('Trying X11 screenshot with ImageMagick...')
          try {
            if (selectedMonitor !== undefined && selectedMonitor !== null) {
              // selectedMonitor should be the display name (e.g., "DisplayPort-2")
              await X11ScreenshotHelper.captureDisplay(selectedMonitor.toString(), screenshotPath)
            } else {
              await X11ScreenshotHelper.captureAllDisplays(screenshotPath)
            }
          } catch (x11Error) {
            console.error('X11 screenshot failed:', x11Error)
            console.log('Falling back to Electron native screenshot...')
            try {
              if (selectedMonitor !== undefined && selectedMonitor !== null) {
                // Convert to number for Electron API if it's a string
                const numericId = typeof selectedMonitor === 'string' ? 0 : selectedMonitor
                await ElectronScreenshotHelper.captureDisplay(numericId, screenshotPath)
              } else {
                await ElectronScreenshotHelper.captureAllDisplays(screenshotPath)
              }
            } catch (electronError) {
              console.error('Electron screenshot also failed:', electronError)
              // Final fallback: try without screen selection
              if (selectedMonitor !== undefined && selectedMonitor !== null) {
                console.log('Final fallback: trying without monitor selection...')
                delete screenshotOptions.screen
                await screenshot(screenshotOptions)
              } else {
                throw error
              }
            }
          }
        } else {
          throw error
        }
      }

      this.screenshotQueue.push(screenshotPath)
      if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
        const removedPath = this.screenshotQueue.shift()
        if (removedPath) {
          try {
            await fs.promises.unlink(removedPath)
          } catch (error) {
            console.error("Error removing old screenshot:", error)
          }
        }
      }
    } else {
      screenshotPath = path.join(this.extraScreenshotDir, `${uuidv4()}.png`)
      
      // Build screenshot options with monitor selection
      const screenshotOptions: any = {
        filename: screenshotPath
      }
      
      // Add monitor selection if configured
      if (selectedMonitor !== undefined && selectedMonitor !== null) {
        screenshotOptions.screen = selectedMonitor
      }
      
      // Linux-specific options - use imagemagick for multi-monitor support
      if (process.platform === "linux") {
        screenshotOptions.format = "png"
        screenshotOptions.linuxLibrary = "imagemagick"
      }
      
      try {
        await screenshot(screenshotOptions)
      } catch (error) {
        console.error('Screenshot error with options:', screenshotOptions, error)
        
        // On Linux, try X11 screenshot first, then Electron fallback
        if (process.platform === "linux") {
          console.log('Trying X11 screenshot with ImageMagick...')
          try {
            if (selectedMonitor !== undefined && selectedMonitor !== null) {
              // selectedMonitor should be the display name (e.g., "DisplayPort-2")
              await X11ScreenshotHelper.captureDisplay(selectedMonitor.toString(), screenshotPath)
            } else {
              await X11ScreenshotHelper.captureAllDisplays(screenshotPath)
            }
          } catch (x11Error) {
            console.error('X11 screenshot failed:', x11Error)
            console.log('Falling back to Electron native screenshot...')
            try {
              if (selectedMonitor !== undefined && selectedMonitor !== null) {
                // Convert to number for Electron API if it's a string
                const numericId = typeof selectedMonitor === 'string' ? 0 : selectedMonitor
                await ElectronScreenshotHelper.captureDisplay(numericId, screenshotPath)
              } else {
                await ElectronScreenshotHelper.captureAllDisplays(screenshotPath)
              }
            } catch (electronError) {
              console.error('Electron screenshot also failed:', electronError)
              // Final fallback: try without screen selection
              if (selectedMonitor !== undefined && selectedMonitor !== null) {
                console.log('Final fallback: trying without monitor selection...')
                delete screenshotOptions.screen
                await screenshot(screenshotOptions)
              } else {
                throw error
              }
            }
          }
        } else {
          throw error
        }
      }

      this.extraScreenshotQueue.push(screenshotPath)
      if (this.extraScreenshotQueue.length > this.MAX_SCREENSHOTS) {
        const removedPath = this.extraScreenshotQueue.shift()
        if (removedPath) {
          try {
            await fs.promises.unlink(removedPath)
          } catch (error) {
            console.error("Error removing old screenshot:", error)
          }
        }
      }
    }

    showMainWindow()
    return screenshotPath
  }

  public async getImagePreview(filepath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(filepath)
      return `data:image/png;base64,${data.toString("base64")}`
    } catch (error) {
      console.error("Error reading image:", error)
      throw error
    }
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.promises.unlink(path)
      if (this.view === "queue") {
        this.screenshotQueue = this.screenshotQueue.filter(
          (filePath) => filePath !== path
        )
      } else {
        this.extraScreenshotQueue = this.extraScreenshotQueue.filter(
          (filePath) => filePath !== path
        )
      }
      return { success: true }
    } catch (error) {
      console.error("Error deleting file:", error)
      return { success: false, error: error.message }
    }
  }
}
