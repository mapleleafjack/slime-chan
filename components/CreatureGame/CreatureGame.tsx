"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import "./CreatureGame.css"
import MainWidget from "./ui/MainWidget"
import MainMenu from "./ui/MainMenu"
import NightSparkles from "./effects/NightSparkles"
import CreatureManager from "./CreatureManager"
import SunnyOverlay from "./effects/SunnyOverlay"
import CreatureDetailPanel from "./CreatureDetailPanel"
import { useDayCycle } from "@/context/dayCycleContext"
import { calculateWeather, getWeatherDuration, Weather } from "@/utils/weatherUtils"
import { DayPhase } from "@/utils/gameUtils"
import { CreatureProvider, useCreature } from "@/context/creatureContext"

const CreatureGameContent = () => {
  const { currentPhase, currentDateTime, dayPhaseOpacity } = useDayCycle()
  const { dispatch } = useCreature()

  // Use the provided background image
  const backgroundImage = "/assets/background.png"

  const defaultWeather: Weather = Weather.SUNNY
  const [weather, setWeather] = useState<Weather>(defaultWeather)

  // Handle background click to deselect creatures
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking directly on the background (not on a creature or UI element)
      if (e.target === e.currentTarget) {
        dispatch({ type: "SET_ACTIVE_CREATURE", payload: null })
        dispatch({ type: "HIDE_ALL_BUBBLES", payload: undefined })
      }
    },
    [dispatch],
  )

  useEffect(() => {
    const updateWeather = () => {
      const weatherState = calculateWeather()
      setWeather(weatherState.condition)

      setTimeout(updateWeather, getWeatherDuration())
    }

    updateWeather()

    // Debug menu for setting weather
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "1") setWeather(Weather.SUNNY)
      if (event.ctrlKey && event.key === "2") setWeather(Weather.CLOUDY)
      if (event.ctrlKey && event.key === "3") setWeather(Weather.RAINY)
    })

    return () => {
      window.removeEventListener("keydown", (event) => {
        // Cleanup
      })
    }
  }, [])

  return (
    <div className="game-container">
      <div
        className={`slime-game ${currentPhase === DayPhase.DAY ? "day-mode" : ""}`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
        onClick={handleBackgroundClick}
      >
        {/* Only show sunny overlay during DAY phase */}
        {currentPhase === DayPhase.DAY && weather === Weather.SUNNY && <SunnyOverlay />}

        <div
          className="night-overlay"
          style={{
            backgroundColor: `rgba(0, 0, 85, ${dayPhaseOpacity})`,
            zIndex: currentPhase === DayPhase.NIGHT ? 95 : 90, // Dynamic z-index
            transition: "all 0.5s ease-in-out",
          }}
        />
        <NightSparkles />

        <MainMenu />
        <MainWidget currentDateTime={currentDateTime} />
        <CreatureManager />
      </div>
      <CreatureDetailPanel />
    </div>
  )
}

export default function CreatureGame() {
  return (
    <CreatureProvider>
      <CreatureGameContent />
    </CreatureProvider>
  )
}
