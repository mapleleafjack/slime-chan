"use client"
import { useDayCycle } from "@/context/dayCycleContext"
import { useAIConfig, AIProvider } from "@/context/aiConfigContext"
import { testAIConnection } from "@/utils/aiService"
import { DayPhase } from "@/utils/gameUtils"
import { useState } from "react"
import { Card, Button } from "pixel-retroui"

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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "380px",
        pointerEvents: "none",
      }}
    >
      {/* Time Controls Card */}
      <Card
        bg="rgba(0, 0, 0, 0.85)"
        borderColor="rgba(255,255,255,0.3)"
        style={{
          padding: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "auto",
          backdropFilter: "blur(10px)",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#ffffff",
            fontFamily: "monospace",
          }}
        >
          ⏰ Time of Day
        </h4>
        <div
          style={{
            fontSize: "12px",
            marginBottom: "12px",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "monospace",
          }}
        >
          Current: {currentDateTime.toLocaleTimeString()} ({currentPhase})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <Button
            onClick={() => setPhaseTime(DayPhase.MORNING)}
            bg="#5499C7"
            textColor="#ffffff"
            borderColor="#000000"
            style={{ fontSize: "12px", padding: "8px", backgroundColor: "#5499C7" }}
          >
            Morning
          </Button>
          <Button
            onClick={() => setPhaseTime(DayPhase.DAY)}
            bg="#F4D03F"
            textColor="#333333"
            borderColor="#000000"
            style={{ fontSize: "12px", padding: "8px", backgroundColor: "#F4D03F" }}
          >
            Day
          </Button>
          <Button
            onClick={() => setPhaseTime(DayPhase.DUSK)}
            bg="#E67E22"
            textColor="#ffffff"
            borderColor="#000000"
            style={{ fontSize: "12px", padding: "8px", backgroundColor: "#E67E22" }}
          >
            Dusk
          </Button>
          <Button
            onClick={() => setPhaseTime(DayPhase.NIGHT)}
            bg="#2C3E50"
            textColor="#ffffff"
            borderColor="#000000"
            style={{ fontSize: "12px", padding: "8px", backgroundColor: "#2C3E50" }}
          >
            Night
          </Button>
        </div>
        <Button
          onClick={() => setDebugTime(null)}
          bg="#444444"
          textColor="#ffffff"
          borderColor="#000000"
          style={{ fontSize: "12px", padding: "8px", width: "100%", backgroundColor: "#444444" }}
        >
          Reset to System Time
        </Button>
      </Card>

      {/* AI Configuration Card */}
      <Card
        bg="rgba(0, 0, 0, 0.85)"
        borderColor="rgba(255,255,255,0.3)"
        style={{
          padding: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "auto",
          backdropFilter: "blur(10px)",
          maxHeight: "calc(100vh - 250px)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ffffff",
              fontFamily: "monospace",
            }}
          >
            🤖 AI Configuration
          </h4>
          {isConfigured && (
            <span
              style={{
                fontSize: "10px",
                color: "#4ade80",
                fontFamily: "monospace",
                background: "rgba(74, 222, 128, 0.2)",
                padding: "4px 8px",
                border: "2px solid #4ade80",
              }}
            >
              ● Configured
            </span>
          )}
        </div>

        {/* Provider Selection */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              marginBottom: "6px",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            Provider
          </label>
          <select
            value={config.provider}
            onChange={(e) => updateConfig({ provider: e.target.value as AIProvider })}
            style={{
              width: "100%",
              padding: "8px",
              background: "#ffffff",
              border: "4px solid #000000",
              color: "#000000",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "monospace",
              imageRendering: "pixelated",
            }}
          >
            <option value="local">Local LLM (No API Key Required)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Local LLM Info */}
        {config.provider === "local" && (
          <Card
            bg="rgba(74, 222, 128, 0.2)"
            borderColor="#4ade80"
            style={{
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#4ade80",
                lineHeight: "1.6",
                fontFamily: "monospace",
              }}
            >
              🚀 Using local LLM (DistilGPT2)
              <br />✓ No API key needed
              <br />✓ Free & private
              <br />⚠️ First message downloads ~350MB model
            </div>
          </Card>
        )}

        {/* API Key (hidden for local provider) */}
        {config.provider !== "local" && (
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                marginBottom: "6px",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              API Key
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                placeholder="sk-..."
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#ffffff",
                  border: "4px solid #000000",
                  color: "#000000",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  imageRendering: "pixelated",
                }}
              />
              <Button
                onClick={() => setShowApiKey(!showApiKey)}
                bg="#444444"
                textColor="#ffffff"
                borderColor="#000000"
                style={{ minWidth: "50px", fontSize: "14px", backgroundColor: "#444444" }}
              >
                {showApiKey ? "👁️" : "👁️‍🗨️"}
              </Button>
            </div>
          </div>
        )}

        {/* Model */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              marginBottom: "6px",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            Model
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => updateConfig({ model: e.target.value })}
            placeholder="deepseek-chat"
            style={{
              width: "100%",
              padding: "8px",
              background: "#ffffff",
              border: "4px solid #000000",
              color: "#000000",
              fontSize: "12px",
              fontFamily: "monospace",
              imageRendering: "pixelated",
            }}
          />
        </div>

        {/* Base URL (for custom provider) */}
        {config.provider === "custom" && (
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                marginBottom: "6px",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              Base URL
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => updateConfig({ baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              style={{
                width: "100%",
                padding: "8px",
                background: "#ffffff",
                border: "4px solid #000000",
                color: "#000000",
                fontSize: "12px",
                fontFamily: "monospace",
                imageRendering: "pixelated",
              }}
            />
          </div>
        )}

        {/* Advanced Settings */}
        <details style={{ marginBottom: "12px" }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "11px",
              color: "rgba(255,255,255,0.8)",
              marginBottom: "12px",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            ⚙️ Advanced Settings
          </summary>
          <div style={{ paddingLeft: "8px" }}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  marginBottom: "6px",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "monospace",
                }}
              >
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
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  marginBottom: "6px",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "monospace",
                }}
              >
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
          <Button
            onClick={handleTestConnection}
            disabled={!isConfigured || testStatus === "testing"}
            bg={testStatus === "success" ? "#4ade80" : testStatus === "error" ? "#ef4444" : "#6366f1"}
            textColor="#ffffff"
            borderColor="#000000"
            style={{
              flex: 1,
              opacity: isConfigured ? 1 : 0.5,
              cursor: isConfigured && testStatus !== "testing" ? "pointer" : "not-allowed",
              fontSize: "12px",
              backgroundColor: testStatus === "success" ? "#4ade80" : testStatus === "error" ? "#ef4444" : "#6366f1",
            }}
          >
            {testStatus === "testing" ? "Testing..." : "Test Connection"}
          </Button>
          <Button
            onClick={resetConfig}
            bg="#dc2626"
            textColor="#ffffff"
            borderColor="#000000"
            style={{ minWidth: "70px", fontSize: "12px", backgroundColor: "#dc2626" }}
          >
            Reset
          </Button>
        </div>

        {/* Status Message */}
        {testMessage && (
          <Card
            bg={testStatus === "success" ? "rgba(74, 222, 128, 0.2)" : "rgba(239, 68, 68, 0.2)"}
            borderColor={testStatus === "success" ? "#4ade80" : "#ef4444"}
            style={{ padding: "8px", marginBottom: "8px" }}
          >
            <div
              style={{
                fontSize: "11px",
                color: testStatus === "success" ? "#4ade80" : "#fca5a5",
                fontFamily: "monospace",
              }}
            >
              {testMessage}
            </div>
          </Card>
        )}

        <div
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "12px",
            lineHeight: "1.4",
            fontFamily: "monospace",
          }}
        >
          💡 Your API key is stored locally in your browser (localStorage) and never sent to our servers. It will
          persist across sessions.
        </div>
      </Card>
    </div>
  )
}

export default DebugMenu
