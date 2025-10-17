"use client"

import SlimeGame from "@/components/SlimeGame/SlimeGame"
import { DayPhaseProvider } from "@/context/dayCycleContext"
import { AIConfigProvider } from "@/context/aiConfigContext"

export default function Home() {
  return (
    <AIConfigProvider>
      <DayPhaseProvider>
        <SlimeGame />
      </DayPhaseProvider>
    </AIConfigProvider>
  )
}
