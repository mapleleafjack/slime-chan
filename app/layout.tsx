import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/context/authContext"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Slime-chan",
  description: "A cute slime pet game",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
