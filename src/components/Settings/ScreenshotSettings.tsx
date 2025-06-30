import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'

interface ScreenshotConfig {
  selectedMonitor?: number
}

interface MonitorOption {
  id: number
  name: string
  index: number
}

const ScreenshotSettings: React.FC = () => {
  const [config, setConfig] = useState<ScreenshotConfig>({})
  const [monitors, setMonitors] = useState<MonitorOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load current configuration and available monitors
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [currentConfig, availableMonitors] = await Promise.all([
          window.electronAPI.getScreenshotConfig(),
          window.electronAPI.getAvailableMonitors()
        ])
        
        setConfig(currentConfig || {})
        setMonitors(availableMonitors)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load screenshot configuration:', error)
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const handleMonitorChange = (monitorId: string) => {
    const id = monitorId === '' ? undefined : parseInt(monitorId, 10)
    setConfig(prev => ({
      ...prev,
      selectedMonitor: id
    }))
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      await window.electronAPI.setScreenshotConfig(config)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save screenshot configuration:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">Loading screenshot configuration...</div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Screenshot Settings</h3>
        
        {/* Monitor Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Capture Monitor</label>
          <select
            value={config.selectedMonitor ?? ''}
            onChange={(e) => handleMonitorChange(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Monitors (Default)</option>
            {monitors.map((monitor) => (
              <option key={monitor.id} value={monitor.id}>
                {monitor.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Select which monitor to capture screenshots from. Leave empty to capture from all monitors.
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'error' && 'Error - Try Again'}
            {saveStatus === 'idle' && 'Save Settings'}
          </button>
        </div>
      </div>
    </Card>
  )
}

export default ScreenshotSettings