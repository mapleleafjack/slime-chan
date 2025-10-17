"use client"
import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase } from "@/utils/gameUtils"
import { Card, Button } from "pixel-retroui"

const DebugMenu = () => {
  const { setDebugTime, currentPhase, currentDateTime } = useDayCycle()

  // Simplified debug menu - only time controls
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
    </div>
  )
}

export default DebugMenu
