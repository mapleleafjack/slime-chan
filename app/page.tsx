"use client"

import CreatureGame from "@/components/CreatureGame/CreatureGame"
import { DayPhaseProvider } from "@/context/dayCycleContext"
import { AIConfigProvider } from "@/context/aiConfigContext"

export default function Home() {
  return (
    <AIConfigProvider>
      <DayPhaseProvider>
        <CreatureGame />
      </DayPhaseProvider>
    </AIConfigProvider>
  )
}
