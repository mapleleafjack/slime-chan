"use client"

import { Card, Button } from "pixel-retroui"

interface ConfirmDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  confirmColor?: string
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmColor = "#dc2626",
}) => {
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
        zIndex: 9998,
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
        onClick={onCancel}
      />

      {/* Dialog Panel */}
      <Card
        bg="rgba(0, 0, 0, 0.9)"
        borderColor="rgba(255,255,255,0.3)"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          padding: "24px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
          backdropFilter: "blur(16px)",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ffffff",
            fontFamily: "monospace",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.8)",
            fontFamily: "monospace",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button
            onClick={onCancel}
            bg="#444444"
            textColor="#ffffff"
            borderColor="#000000"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              backgroundColor: "#444444",
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            bg={confirmColor}
            textColor="#ffffff"
            borderColor="#000000"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              backgroundColor: confirmColor,
            }}
          >
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ConfirmDialog
