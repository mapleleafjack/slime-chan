import { Bubble } from "pixel-retroui"

interface SlimeBubbleProps {
  text: string
  direction: "left" | "right"
  visible: boolean
}

export default function SlimeBubble({ text, direction, visible }: SlimeBubbleProps) {
  if (!visible) return null
  return (
    <Bubble direction={direction} bg="#ffffff" textColor="#000000" borderColor="#000000">
      {text}
    </Bubble>
  )
}
