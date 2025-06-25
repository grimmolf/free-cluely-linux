import { ModelProvider, ModelProviderConfig } from "./ModelProvider"
import { ModelProviderFactory } from "./ModelProviderFactory"

export class LLMHelper {
  private provider: ModelProvider

  constructor(config: ModelProviderConfig | string) {
    // Backwards compatibility: if string is passed, treat as Gemini API key
    if (typeof config === 'string') {
      this.provider = ModelProviderFactory.createProvider({
        provider: 'gemini',
        apiKey: config
      })
    } else {
      this.provider = ModelProviderFactory.createProvider(config)
    }
  }

  public async extractProblemFromImages(imagePaths: string[]) {
    return this.provider.extractProblemFromImages(imagePaths)
  }

  public async generateSolution(problemInfo: any) {
    return this.provider.generateSolution(problemInfo)
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    return this.provider.debugSolutionWithImages(problemInfo, currentCode, debugImagePaths)
  }

  public async analyzeAudioFile(audioPath: string) {
    return this.provider.analyzeAudioFile(audioPath)
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    return this.provider.analyzeAudioFromBase64(data, mimeType)
  }

  public async analyzeImageFile(imagePath: string) {
    return this.provider.analyzeImageFile(imagePath)
  }
} 