"use client"
import { useDayCycle } from "@/context/dayCycleContext"
import { useAIConfig, AIProvider } from "@/context/aiConfigContext"
import { testAIConnection } from "@/utils/aiService"
import { DayPhase } from "@/utils/gameUtils"
import { useState } from "react"

const DebugMenu = () => {
  const { setDebugTime, currentPhase, currentDateTime } = useDayCycle()
  const { config, updateConfig, isConfigured, resetConfig } = useAIConfig()
  const [showApiKey, setShowApiKey] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")

  // Simplified debug menu - removed time input, kept phase presets
  const setPhaseTime = (phase: DayPhase) => {
    const date = new Date()
    switch (phase) {
      case DayPhase.MORNING:
        date.setHours(7, 0)
        break
      case DayPhase.DAY:
        date.setHours(12, 0)
        break
      case DayPhase.DUSK:
        date.setHours(18, 0)
        break
      case DayPhase.NIGHT:
        date.setHours(22, 0)
        break
    }
    setDebugTime(date)
  }

  const handleTestConnection = async () => {
    setTestStatus("testing")
    setTestMessage("Testing...")
    
    const result = await testAIConnection(config)
    
    if (result.success) {
      setTestStatus("success")
      setTestMessage("✓ Connection successful!")
      setTimeout(() => {
        setTestStatus("idle")
        setTestMessage("")
      }, 3000)
    } else {
      setTestStatus("error")
      setTestMessage(`✗ ${result.error || "Connection failed"}`)
    }
  }

  return (
    <div
      className="debug-panel"
      style={{
        position: "absolute",
        top: "50px",
        left: "10px",
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        color: "white",
        width: "320px",
        maxHeight: "calc(100vh - 70px)",
        overflowY: "auto",
        transition: "all 0.3s ease",
      }}
    >
      {/* Time Controls */}
      <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <div style={{ fontSize: "14px", marginBottom: "8px", fontWeight: "bold" }}>⏰ Time of Day</div>
        <div style={{ fontSize: "12px", marginBottom: "8px", opacity: 0.8 }}>
          Current: {currentDateTime.toLocaleTimeString()} ({currentPhase})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <button
            className="debug-button"
            onClick={() => setPhaseTime(DayPhase.MORNING)}
            style={{
              padding: "6px",
              background: "#5499C7",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Morning
          </button>
          <button
            className="debug-button"
            onClick={() => setPhaseTime(DayPhase.DAY)}
            style={{
              padding: "6px",
              background: "#F4D03F",
              border: "none",
              borderRadius: "4px",
              color: "#333",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Day
          </button>
          <button
            className="debug-button"
            onClick={() => setPhaseTime(DayPhase.DUSK)}
            style={{
              padding: "6px",
              background: "#E67E22",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Dusk
          </button>
          <button
            className="debug-button"
            onClick={() => setPhaseTime(DayPhase.NIGHT)}
            style={{
              padding: "6px",
              background: "#2C3E50",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Night
          </button>
        </div>
        <button
          className="debug-button"
          onClick={() => setDebugTime(null)}
          style={{
            padding: "6px 10px",
            background: "#444",
            border: "none",
            borderRadius: "4px",
            color: "white",
            cursor: "pointer",
            width: "100%",
            fontSize: "12px",
          }}
        >
          Reset to System Time
        </button>
      </div>

      {/* AI Configuration */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "14px", marginBottom: "12px", fontWeight: "bold" }}>
          🤖 AI Configuration
          {isConfigured && <span style={{ marginLeft: "8px", fontSize: "10px", color: "#4ade80" }}>● Configured</span>}
        </div>

        {/* Provider Selection */}
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>Provider</label>
          <select
            value={config.provider}
            onChange={(e) => updateConfig({ provider: e.target.value as AIProvider })}
            style={{
              width: "100%",
              padding: "6px",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "4px",
              color: "white",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>
            API Key
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            <input
              type={showApiKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(e) => updateConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              style={{
                flex: 1,
                padding: "6px",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "white",
                fontSize: "12px",
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: "6px 10px",
                background: "#444",
                border: "none",
                borderRadius: "4px",
                color: "white",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {showApiKey ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        {/* Model */}
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>Model</label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => updateConfig({ model: e.target.value })}
            placeholder="deepseek-chat"
            style={{
              width: "100%",
              padding: "6px",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "4px",
              color: "white",
              fontSize: "12px",
            }}
          />
        </div>

        {/* Base URL (for custom provider) */}
        {config.provider === "custom" && (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>
              Base URL
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => updateConfig({ baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              style={{
                width: "100%",
                padding: "6px",
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "white",
                fontSize: "12px",
              }}
            />
          </div>
        )}

        {/* Advanced Settings */}
        <details style={{ marginBottom: "12px" }}>
          <summary style={{ cursor: "pointer", fontSize: "11px", opacity: 0.8, marginBottom: "8px" }}>
            Advanced Settings
          </summary>
          <div style={{ paddingLeft: "8px" }}>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>
                Temperature: {config.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "11px", marginBottom: "4px", opacity: 0.8 }}>
                Max Tokens: {config.maxTokens}
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={config.maxTokens}
                onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </details>

        {/* Test & Reset Buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <button
            onClick={handleTestConnection}
            disabled={!isConfigured || testStatus === "testing"}
            style={{
              flex: 1,
              padding: "8px",
              background: testStatus === "success" ? "#4ade80" : testStatus === "error" ? "#ef4444" : "#6366f1",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: isConfigured && testStatus !== "testing" ? "pointer" : "not-allowed",
              fontSize: "12px",
              opacity: isConfigured ? 1 : 0.5,
              fontWeight: "bold",
            }}
          >
            {testStatus === "testing" ? "Testing..." : "Test Connection"}
          </button>
          <button
            onClick={resetConfig}
            style={{
              padding: "8px 12px",
              background: "#dc2626",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset
          </button>
        </div>

        {/* Status Message */}
        {testMessage && (
          <div
            style={{
              padding: "8px",
              background: testStatus === "success" ? "rgba(74, 222, 128, 0.2)" : "rgba(239, 68, 68, 0.2)",
              borderRadius: "4px",
              fontSize: "11px",
              color: testStatus === "success" ? "#4ade80" : "#fca5a5",
              marginTop: "8px",
            }}
          >
            {testMessage}
          </div>
        )}

        <div
          style={{
            fontSize: "10px",
            opacity: 0.6,
            marginTop: "12px",
            lineHeight: "1.4",
          }}
        >
          💡 Your API key is stored locally in your browser (localStorage) and never sent to our servers. It will persist across sessions.
        </div>
      </div>
    </div>
  )
}

export default DebugMenu
