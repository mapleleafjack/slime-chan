"use client"

import SlimeGame from "@/components/SlimeGame/SlimeGame"
import { DayPhaseProvider } from "@/context/dayCycleContext"

export default function Home() {
  return (
    <DayPhaseProvider>
      <SlimeGame />
    </DayPhaseProvider>
  )
}
