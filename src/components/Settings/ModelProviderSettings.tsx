import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'

interface ModelProviderConfig {
  provider: 'gemini' | 'redhat' | 'ollama'
  apiKey?: string
  baseUrl?: string
  modelName?: string
}

interface ProviderOption {
  value: string
  label: string
  requiresApiKey: boolean
}

const ModelProviderSettings: React.FC = () => {
  const [config, setConfig] = useState<ModelProviderConfig>({
    provider: 'gemini',
    modelName: 'gemini-2.0-flash'
  })
  const [providers, setProviders] = useState<ProviderOption[]>([])
  const [modelOptions, setModelOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load current configuration and provider options
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [currentConfig, availableProviders] = await Promise.all([
          window.electronAPI.getModelProviderConfig(),
          window.electronAPI.getAvailableProviders()
        ])
        
        setConfig(currentConfig)
        setProviders(availableProviders)
        
        // Load model options for the current provider
        const models = await window.electronAPI.getModelOptions(currentConfig.provider)
        setModelOptions(models)
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load configuration:', error)
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Update model options when provider changes
  useEffect(() => {
    if (config.provider) {
      window.electronAPI.getModelOptions(config.provider).then(setModelOptions)
    }
  }, [config.provider])

  const handleProviderChange = (provider: string) => {
    setConfig(prev => ({
      ...prev,
      provider: provider as any,
      modelName: '', // Reset model when provider changes
      apiKey: prev.provider === provider ? prev.apiKey : '' // Keep API key if same provider
    }))
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      await window.electronAPI.setModelProviderConfig(config)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save configuration:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const requiresApiKey = providers.find(p => p.value === config.provider)?.requiresApiKey ?? false

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">Loading configuration...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Model Provider Settings</h3>
        
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Provider</label>
          <select
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            {providers.map(provider => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        {modelOptions.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Model</label>
            <select
              value={config.modelName || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, modelName: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Select a model...</option>
              {modelOptions.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API Key */}
        {requiresApiKey && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">API Key</label>
            <input
              type="password"
              value={config.apiKey || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your API key..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500">
              {config.provider === 'gemini' && 'Get your API key from Google AI Studio'}
              {config.provider === 'redhat' && 'Get your API key from Red Hat Developer Portal'}
            </p>
          </div>
        )}

        {/* Base URL for custom endpoints */}
        {config.provider === 'ollama' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Base URL</label>
            <input
              type="text"
              value={config.baseUrl || 'http://localhost:11434'}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="http://localhost:11434"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500">
              URL where your Ollama instance is running
            </p>
          </div>
        )}

        {config.provider === 'redhat' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Base URL (Optional)</label>
            <input
              type="text"
              value={config.baseUrl || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://api.redhat.com/ai/v1"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500">
              Leave empty to use default Red Hat API endpoint
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`w-full p-2 rounded-md font-medium transition-colors ${
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved!'}
            {saveStatus === 'error' && 'Error saving'}
            {saveStatus === 'idle' && 'Save Configuration'}
          </button>
        </div>
      </div>
    </Card>
  )
}

export default ModelProviderSettings