// ElectronScreenshotHelper.ts
// Alternative screenshot implementation using Electron's desktopCapturer

import { desktopCapturer, screen, NativeImage } from "electron"
import path from "node:path"
import fs from "node:fs"
import { app } from "electron"
import { v4 as uuidv4 } from "uuid"

export class ElectronScreenshotHelper {
  public static async listDisplays() {
    const displays = screen.getAllDisplays()
    return displays.map((display, index) => ({
      id: display.id,
      name: `Display ${index + 1} (${display.size.width}x${display.size.height})`,
      bounds: display.bounds,
      index: index
    }))
  }

  public static async captureDisplay(displayId: number, outputPath: string): Promise<void> {
    try {
      // Get all displays
      const displays = screen.getAllDisplays()
      const targetDisplay = displays.find(d => d.id === displayId)
      
      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`)
      }

      // Get sources for desktop capture
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: targetDisplay.size.width * targetDisplay.scaleFactor,
          height: targetDisplay.size.height * targetDisplay.scaleFactor
        }
      })

      console.log('Available sources:', sources.map(s => ({ id: s.id, name: s.name })))

      // Find the source for our target display
      let targetSource = sources.find(source => {
        // On Linux, the source name might contain the display information
        return source.display_id === displayId.toString() || 
               source.id === `screen:${displayId}` ||
               sources.length === 1 // If only one source, use it
      })

      // If we can't find by ID, try to match by index
      if (!targetSource && displays.length === sources.length) {
        const displayIndex = displays.findIndex(d => d.id === displayId)
        if (displayIndex >= 0 && displayIndex < sources.length) {
          targetSource = sources[displayIndex]
        }
      }

      if (!targetSource) {
        console.warn(`Could not find source for display ${displayId}, using first available`)
        targetSource = sources[0]
      }

      if (!targetSource) {
        throw new Error('No screen sources available')
      }

      // Get the thumbnail as a NativeImage
      const image = targetSource.thumbnail

      // Save the image
      const buffer = image.toPNG()
      await fs.promises.writeFile(outputPath, buffer)
    } catch (error) {
      console.error('Error capturing display with Electron:', error)
      throw error
    }
  }

  public static async captureAllDisplays(outputPath: string): Promise<void> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: screen.getPrimaryDisplay().size.width,
          height: screen.getPrimaryDisplay().size.height
        }
      })

      if (sources.length === 0) {
        throw new Error('No screen sources available')
      }

      // Use the first source which should be all screens combined
      const image = sources[0].thumbnail
      const buffer = image.toPNG()
      await fs.promises.writeFile(outputPath, buffer)
    } catch (error) {
      console.error('Error capturing all displays:', error)
      throw error
    }
  }
}