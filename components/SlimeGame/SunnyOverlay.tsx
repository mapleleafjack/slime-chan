"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import "./SunnyOverlay.css"

const SunnyOverlay: React.FC = () => {
  // Use static initial values to prevent hydration mismatch
  const [initialized, setInitialized] = useState(false)
  const [sunPosition, setSunPosition] = useState({ x: -10, y: 20 }) // Start sun off-screen to the left
  const [cloudPositions, setCloudPositions] = useState<
    Array<{ x: number; y: number; scale: number; opacity: number; speed: number }>
  >([])
  const [lightIntensity, setLightIntensity] = useState(1)
  const [rays, setRays] = useState<React.ReactNode[]>([])
  const [clouds, setClouds] = useState<React.ReactNode[]>([])
  const [particles, setParticles] = useState<React.ReactNode[]>([])

  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  // Initialize everything after first render (client-side only)
  useEffect(() => {
    // Initialize cloud positions
    const newClouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 30 + 5,
      scale: Math.random() * 0.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.02 + 0.01,
    }))
    setCloudPositions(newClouds)

    // Generate initial rays, clouds, and particles
    updateVisualElements()

    setInitialized(true)
  }, [])

  // Generate all visual elements based on current state
  const updateVisualElements = () => {
    // Generate rays
    const newRays = Array.from({ length: 12 }, (_, index) => {
      const angle = (index * 30) % 360
      const length = 80 + Math.sin(Date.now() / 3000 + index) * 10
      const width = 6 + Math.sin(Date.now() / 2000 + index) * 2
      const opacity = 0.6 + Math.sin(Date.now() / 4000 + index) * 0.2

      return (
        <div
          key={`sun-ray-${index}`}
          className="sun-ray"
          style={{
            transform: `rotate(${angle}deg)`,
            width: `${width}px`,
            height: `${length}%`,
            opacity: opacity,
            left: `${sunPosition.x}%`,
            top: `${sunPosition.y}%`,
            animationDelay: `${index * 0.2}s`,
          }}
        />
      )
    })
    setRays(newRays)

    // Generate clouds
    const newClouds = cloudPositions.map((cloud, index) => (
      <div
        key={`cloud-${index}`}
        className="cloud-shadow"
        style={{
          left: `${cloud.x}%`,
          top: `${cloud.y}%`,
          transform: `scale(${cloud.scale})`,
          opacity: cloud.opacity,
        }}
      />
    ))
    setClouds(newClouds)

    // Generate particles with static random values
    const newParticles = Array.from({ length: 20 }, (_, index) => {
      // Use seeded random values based on index
      const leftPos = (index * 17) % 100
      const topPos = (index * 23) % 100
      const duration = 5 + ((index * 13) % 10)
      const delay = (index * 7) % 5
      const size = 1 + ((index * 11) % 4)
      const opacity = ((index * 19) % 30) / 100

      return (
        <div
          key={`particle-${index}`}
          className="light-particle"
          style={{
            left: `${leftPos}%`,
            top: `${topPos}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: opacity,
          }}
        />
      )
    })
    setParticles(newParticles)
  }

  // Animate sun and clouds
  useEffect(() => {
    if (!initialized) return

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }

      const deltaTime = time - lastTimeRef.current

      // Only update every 50ms for performance
      if (deltaTime > 50) {
        // Subtle sun movement - keep sun off to the side
        setSunPosition((prev) => ({
          x: -10 + Math.sin(time / 10000) * 5,
          y: 20 + Math.sin(time / 12000) * 3,
        }))

        // Move clouds
        setCloudPositions((prev) =>
          prev.map((cloud) => ({
            ...cloud,
            x: ((cloud.x + (cloud.speed * deltaTime) / 100) % 120) - 20,
            opacity: cloud.opacity + Math.sin(time / 5000) * 0.01,
          })),
        )

        // Vary light intensity slightly
        setLightIntensity(0.9 + Math.sin(time / 8000) * 0.1)

        // Update visual elements
        updateVisualElements()

        lastTimeRef.current = time
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [initialized, cloudPositions])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="sunny-overlay" style={{ filter: `brightness(${lightIntensity})` }}>
      <div className="sun-glow" style={{ left: `${sunPosition.x}%`, top: `${sunPosition.y}%` }} />
      {rays}
      {clouds}
      {particles}
      <div className="light-reflection" />
      <div className="floor-glow" />
    </div>
  )
}

export default SunnyOverlay
