"use client"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase } from "@/utils/slimeUtils"

const DebugMenu = () => {
  const { setDebugTime, currentPhase } = useDayCycle()

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

  return (
    <div
      className="debug-panel"
      style={{
        position: "absolute",
        top: "50px",
        left: "10px",
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        color: "white",
        width: "auto",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ marginBottom: "12px", textAlign: "center" }}>
        <div style={{ fontSize: "14px", marginBottom: "8px", fontWeight: "bold" }}>Time of Day</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
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
          marginTop: "10px",
          fontSize: "12px",
        }}
      >
        Reset to System Time
      </button>
    </div>
  )
}

export default DebugMenu
