import { app } from "electron"
import fs from "fs"
import path from "path"
import { ModelProviderConfig } from "./ModelProvider"

export interface ScreenshotConfig {
  selectedMonitor?: number
}

export interface AppConfig {
  modelProvider: ModelProviderConfig
  screenshot?: ScreenshotConfig
}

export class ConfigManager {
  private configPath: string
  private config: AppConfig

  constructor() {
    this.configPath = path.join(app.getPath("userData"), "config.json")
    this.config = this.loadConfig()
  }

  private getDefaultConfig(): AppConfig {
    return {
      modelProvider: {
        provider: 'gemini',
        modelName: 'gemini-2.0-flash',
        apiKey: process.env.GEMINI_API_KEY || ''
      },
      screenshot: {
        selectedMonitor: undefined
      }
    }
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8')
        const savedConfig = JSON.parse(configData)
        
        // Merge with default config to ensure all properties exist
        const defaultConfig = this.getDefaultConfig()
        return {
          ...defaultConfig,
          ...savedConfig,
          modelProvider: {
            ...defaultConfig.modelProvider,
            ...savedConfig.modelProvider
          },
          screenshot: {
            ...defaultConfig.screenshot,
            ...(savedConfig.screenshot || {})
          }
        }
      }
    } catch (error) {
      console.error("Error loading config:", error)
    }
    
    return this.getDefaultConfig()
  }

  public saveConfig(): void {
    try {
      // Ensure the directory exists
      const configDir = path.dirname(this.configPath)
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error("Error saving config:", error)
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config }
  }

  public getModelProviderConfig(): ModelProviderConfig {
    // Fill in API keys from environment variables if not set in config
    const config = { ...this.config.modelProvider }
    
    if (!config.apiKey) {
      switch (config.provider) {
        case 'gemini':
          config.apiKey = process.env.GEMINI_API_KEY
          break
        case 'redhat':
          config.apiKey = process.env.REDHAT_API_KEY
          break
        case 'ollama':
          // Ollama doesn't need an API key
          break
      }
    }
    
    return config
  }

  public setModelProviderConfig(config: Partial<ModelProviderConfig>): void {
    this.config.modelProvider = {
      ...this.config.modelProvider,
      ...config
    }
    this.saveConfig()
  }

  public updateApiKey(provider: string, apiKey: string): void {
    if (this.config.modelProvider.provider === provider) {
      this.config.modelProvider.apiKey = apiKey
      this.saveConfig()
    }
  }

  public getScreenshotConfig(): ScreenshotConfig {
    return { ...this.config.screenshot }
  }

  public setScreenshotConfig(config: Partial<ScreenshotConfig>): void {
    this.config.screenshot = {
      ...this.config.screenshot,
      ...config
    }
    this.saveConfig()
  }
}