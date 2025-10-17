import { Bubble } from "pixel-retroui"

interface SlimeBubbleProps {
  text: string
  direction: "left" | "right"
  visible: boolean
  isActive?: boolean
  firstName?: string
}

export default function SlimeBubble({ text, direction, visible, isActive = false, firstName }: SlimeBubbleProps) {
  if (!visible) return null
  
  return (
    <Bubble direction={direction} bg="#ffffff" textColor="#000000" borderColor="#000000">
      {isActive && firstName ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span style={{ 
            fontWeight: "bold", 
            fontSize: "1.1em",
            color: "#ff69b4",
            textShadow: "0 0 8px rgba(255, 105, 180, 0.5)",
            animation: "pulse 2s ease-in-out infinite"
          }}>
            {firstName}
          </span>
          {text && <span>{text}</span>}
        </div>
      ) : (
        <span style={{
          animation: isActive ? "none" : "fadeInOut 3s ease-in-out infinite"
        }}>
          {text}
        </span>
      )}
    </Bubble>
  )
}
