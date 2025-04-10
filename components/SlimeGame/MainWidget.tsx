"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface MainWidgetProps {
  currentDateTime: Date
}

const MainWidget: React.FC<MainWidgetProps> = ({ currentDateTime }) => {
  // Use client-side state to prevent hydration mismatch
  const [formattedDate, setFormattedDate] = useState("")
  const [formattedTime, setFormattedTime] = useState("")
  const [mounted, setMounted] = useState(false)

  // Only update time after component is mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update the formatted date and time on the client side only
  useEffect(() => {
    if (!mounted) return

    const updateTime = () => {
      const now = new Date()
      setFormattedDate(now.toLocaleDateString())
      setFormattedTime(now.toLocaleTimeString())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [mounted])

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 101,
        width: "150px",
        textAlign: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        color: "white",
      }}
    >
      <h4 style={{ margin: 0, fontSize: "14px" }}>{formattedDate}</h4>
      <p style={{ margin: 0, fontSize: "12px" }}>{formattedTime}</p>
    </div>
  )
}

export default MainWidget
