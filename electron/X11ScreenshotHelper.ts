// X11ScreenshotHelper.ts
// Direct X11 screenshot implementation using ImageMagick

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"

const execAsync = promisify(exec)

interface X11Display {
  name: string
  resolution: string
  offset: string
  primary: boolean
  connected: boolean
}

export class X11ScreenshotHelper {
  public static async getX11Displays(): Promise<X11Display[]> {
    try {
      const { stdout } = await execAsync('xrandr --query')
      const lines = stdout.split('\n')
      const displays: X11Display[] = []
      
      for (const line of lines) {
        // Look for connected displays: "DisplayPort-1 connected primary 2560x1440+0+0"
        const match = line.match(/^(\S+)\s+connected\s+(primary\s+)?(\d+x\d+\+\d+\+\d+)/)
        if (match) {
          const [, name, primaryStr, geometry] = match
          const [resolution, offset] = geometry.split('+')
          const offsetX = parseInt(geometry.split('+')[1])
          const offsetY = parseInt(geometry.split('+')[2])
          
          displays.push({
            name,
            resolution,
            offset: `+${offsetX}+${offsetY}`,
            primary: !!primaryStr,
            connected: true
          })
        }
      }
      
      console.log('X11 displays found:', displays)
      return displays
    } catch (error) {
      console.error('Error getting X11 displays:', error)
      throw error
    }
  }

  public static async captureDisplay(displayName: string, outputPath: string): Promise<void> {
    try {
      const displays = await this.getX11Displays()
      const targetDisplay = displays.find(d => d.name === displayName)
      
      if (!targetDisplay) {
        throw new Error(`Display ${displayName} not found`)
      }

      // Use ImageMagick's import command with specific geometry
      const geometry = `${targetDisplay.resolution}${targetDisplay.offset}`
      const command = `import -window root -crop ${geometry} "${outputPath}"`
      
      console.log(`Capturing display ${displayName} with command: ${command}`)
      
      const { stdout, stderr } = await execAsync(command)
      if (stderr && !stderr.includes('Warning')) {
        console.warn('ImageMagick warning:', stderr)
      }
      
      // Verify the file was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Screenshot file was not created')
      }
      
      console.log(`Successfully captured ${displayName} to ${outputPath}`)
    } catch (error) {
      console.error(`Error capturing display ${displayName}:`, error)
      throw error
    }
  }

  public static async captureAllDisplays(outputPath: string): Promise<void> {
    try {
      // Capture the entire screen (all displays)
      const command = `import -window root "${outputPath}"`
      
      console.log(`Capturing all displays with command: ${command}`)
      
      const { stdout, stderr } = await execAsync(command)
      if (stderr && !stderr.includes('Warning')) {
        console.warn('ImageMagick warning:', stderr)
      }
      
      // Verify the file was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Screenshot file was not created')
      }
      
      console.log(`Successfully captured all displays to ${outputPath}`)
    } catch (error) {
      console.error('Error capturing all displays:', error)
      throw error
    }
  }

  public static async isImageMagickAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('which import')
      return stdout.trim().length > 0
    } catch (error) {
      return false
    }
  }
}