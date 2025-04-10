"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import "./SlimeGame.css"
import MainWidget from "./MainWidget"
import MainMenu from "./MainMenu"
import NightSparkles from "./NightSparkles"
import SlimeManager from "./SlimeManager"
import SunnyOverlay from "./SunnyOverlay"
import Mushroom from "./Mushroom"
import { useDayCycle } from "@/context/dayCycleContext"
import { calculateWeather, getWeatherDuration, Weather } from "@/utils/weatherUtils"
import { DayPhase } from "@/utils/slimeUtils"
import { SlimeProvider, useSlime } from "@/context/slimeContext"

const SlimeGameContent = () => {
  const { currentPhase, currentDateTime, dayPhaseOpacity } = useDayCycle()
  const { dispatch } = useSlime()

  // Use the provided background image
  const backgroundImage = "/assets/background.png"

  const defaultWeather: Weather = Weather.SUNNY
  const [weather, setWeather] = useState<Weather>(defaultWeather)

  // Handle background click to deselect slimes
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking directly on the background (not on a slime or UI element)
      if (e.target === e.currentTarget) {
        dispatch({ type: "SET_ACTIVE_SLIME", payload: null })
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

        {/* Mushroom is now placed before the night overlay */}
        <Mushroom />

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
        <SlimeManager />
      </div>
    </div>
  )
}

export default function SlimeGame() {
  return (
    <SlimeProvider>
      <SlimeGameContent />
    </SlimeProvider>
  )
}
