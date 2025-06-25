import { ModelProvider, ModelProviderConfig } from "./ModelProvider"
import { GeminiProvider } from "./providers/GeminiProvider"
import { RedHatProvider } from "./providers/RedHatProvider"
import { OllamaProvider } from "./providers/OllamaProvider"

export class ModelProviderFactory {
  static createProvider(config: ModelProviderConfig): ModelProvider {
    switch (config.provider) {
      case 'gemini':
        if (!config.apiKey) {
          throw new Error('API key is required for Gemini provider')
        }
        return new GeminiProvider(config)
      
      case 'redhat':
        if (!config.apiKey) {
          throw new Error('API key is required for Red Hat Model as a Service')
        }
        return new RedHatProvider(config)
      
      case 'ollama':
        return new OllamaProvider(config)
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  static getDefaultConfig(): ModelProviderConfig {
    return {
      provider: 'gemini',
      modelName: 'gemini-2.0-flash'
    }
  }

  static getAvailableProviders(): Array<{ value: string, label: string, requiresApiKey: boolean }> {
    return [
      { value: 'gemini', label: 'Google Gemini', requiresApiKey: true },
      { value: 'redhat', label: 'Red Hat Model as a Service', requiresApiKey: true },
      { value: 'ollama', label: 'Ollama (Local)', requiresApiKey: false }
    ]
  }

  static getModelOptions(provider: string): string[] {
    switch (provider) {
      case 'gemini':
        return ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
      
      case 'redhat':
        return [
          'meta-llama/Llama-3.1-8B-Instruct',
          'meta-llama/Llama-3.1-70B-Instruct',
          'mistralai/Mistral-7B-Instruct-v0.3',
          'microsoft/Phi-3-mini-4k-instruct'
        ]
      
      case 'ollama':
        return ['llama3.1', 'llama3.1:70b', 'llama3.2', 'mistral', 'codellama', 'phi3']
      
      default:
        return []
    }
  }
}