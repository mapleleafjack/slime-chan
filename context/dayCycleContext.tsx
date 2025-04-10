"use client"

import { calculateOverlay, type DayPhase } from "@/utils/slimeUtils"
import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"

type DayCycleContextType = {
  currentPhase: DayPhase
  currentDateTime: Date
  dayPhaseOpacity: number
  setDebugTime: (date: Date | null) => void
  debugTime: Date | null
}

const DayCycleContext = createContext<DayCycleContextType>({} as DayCycleContextType)

export const DayPhaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [debugTime, setDebugTime] = useState<Date | null>(null)
  const [state, setState] = useState(() => {
    const now = new Date()
    const { phase, opacity } = calculateOverlay(now)
    return {
      currentPhase: phase,
      currentDateTime: now,
      dayPhaseOpacity: opacity,
    }
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      const now = debugTime || new Date()
      const { phase, opacity } = calculateOverlay(now)
      setState({
        currentPhase: phase,
        currentDateTime: now,
        dayPhaseOpacity: opacity,
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [debugTime])

  return <DayCycleContext.Provider value={{ ...state, setDebugTime, debugTime }}>{children}</DayCycleContext.Provider>
}

export const useDayCycle = () => useContext(DayCycleContext)
