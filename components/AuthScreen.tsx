"use client"

import { useState } from "react"
import { useAuth } from "@/context/authContext"
import { Card, Button } from "pixel-retroui"

type AuthMode = "login" | "register"

interface AuthScreenProps {
  onClose?: () => void
}

export const AuthScreen = ({ onClose }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const result = mode === "login" 
        ? await login({ username, password })
        : await register({ username, password })

      if (!result.success) {
        setError(result.message || "An error occurred")
      } else {
        // Successfully logged in or registered - close the auth screen
        onClose?.()
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        pointerEvents: "auto",
      }}
    >
      {/* Backdrop */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Auth Panel */}
      <Card
        bg="rgba(0, 0, 0, 0.9)"
        borderColor="rgba(255,255,255,0.3)"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "450px",
          padding: "32px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              color: "white",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)"
            }}
            title="Play without saving"
          >
            ✕
          </button>
        )}

        {/* Logo/Title */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 
            style={{ 
              fontSize: "32px",
              fontWeight: "bold",
              color: "#ffffff",
              margin: "0 0 8px 0",
              fontFamily: "monospace",
            }}
          >
            🌟 Slime-chan
          </h1>
          <p 
            style={{ 
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              fontFamily: "monospace",
            }}
          >
            {mode === "login" ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label 
              htmlFor="username" 
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "bold",
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "6px",
                fontFamily: "monospace",
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                fontSize: "14px",
                fontFamily: "monospace",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)"
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)"
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
              }}
              placeholder="Enter your username"
              required
              minLength={3}
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "bold",
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "6px",
                fontFamily: "monospace",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                fontSize: "14px",
                fontFamily: "monospace",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)"
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)"
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
              }}
              placeholder="Enter your password"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div 
              style={{
                padding: "12px",
                backgroundColor: "rgba(220, 38, 38, 0.2)",
                border: "2px solid rgba(220, 38, 38, 0.5)",
                borderRadius: "4px",
              }}
            >
              <p 
                style={{
                  fontSize: "13px",
                  color: "#fca5a5",
                  margin: 0,
                  fontFamily: "monospace",
                }}
              >
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            bg="#3b82f6"
            textColor="#ffffff"
            borderColor="#000000"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "bold",
              backgroundColor: isSubmitting ? "#60a5fa" : "#3b82f6",
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting 
              ? "Please wait..." 
              : mode === "login" ? "Login" : "Create Account"
            }
          </Button>
        </form>

        {/* Toggle Mode */}
        <div 
          style={{
            textAlign: "center",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            marginTop: "20px",
          }}
        >
          <p 
            style={{
              fontSize: "13px",
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              fontFamily: "monospace",
            }}
          >
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            {" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login")
                setError("")
              }}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                fontWeight: "bold",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                textDecoration: "underline",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
              disabled={isSubmitting}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.color = "#93c5fd")}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.color = "#60a5fa")}
            >
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>

        {/* Info */}
        {onClose && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <p 
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.5)",
                margin: 0,
                fontFamily: "monospace",
              }}
            >
              💾 Login to save progress • Close to play without saving
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
