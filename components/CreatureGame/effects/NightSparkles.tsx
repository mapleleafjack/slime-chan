"use client"

import { useDayCycle } from "@/context/dayCycleContext"
import { DayPhase, randomInt } from "@/utils/gameUtils"
import type React from "react"
import { useState, useEffect } from "react"

interface Sparkle {
  id: number
  startX: number
  startY: number
  deltaX: number
  deltaY: number
  size: number
  twinkleDuration: number
  floatDuration: number
  delay: number
}

const NightSparkles: React.FC = () => {
  const { currentPhase } = useDayCycle()
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [lastNightPhase, setLastNightPhase] = useState<Date | null>(null)

  useEffect(() => {
    if (currentPhase === DayPhase.NIGHT) {
      if (!lastNightPhase || Date.now() - lastNightPhase.getTime() > 60000) {
        setSparkles(generateSparkles())
        setLastNightPhase(new Date())
      }
    }
  }, [currentPhase, lastNightPhase])

  const generateSparkles = () => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      startX: randomInt(0, 100),
      startY: randomInt(0, 70),
      deltaX: randomInt(-3, 3),
      deltaY: randomInt(-2, 2),
      size: randomInt(2, 5),
      twinkleDuration: randomInt(3000, 7000),
      floatDuration: randomInt(15000, 40000),
      delay: randomInt(-15000, 15000),
    }))
  }

  if (currentPhase !== DayPhase.NIGHT) return null

  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={`${sparkle.id}-${lastNightPhase?.getTime()}`}
          className="night-sparkle"
          style={{
            left: `${sparkle.startX}%`,
            top: `${sparkle.startY}%`,
            zIndex: 96,
            width: sparkle.size,
            height: sparkle.size,
            animation: `
              twinkle ${sparkle.twinkleDuration}ms infinite ease-in-out,
              float ${sparkle.floatDuration}ms infinite linear
            `,
            animationDelay: `${sparkle.delay}ms`,
            filter: `blur(${sparkle.size / 3}px)`,
            "--dx": `${sparkle.deltaX}`,
            "--dy": `${sparkle.deltaY}`,
          } as React.CSSProperties}
        />
      ))}
    </>
  )
}

export default NightSparkles
