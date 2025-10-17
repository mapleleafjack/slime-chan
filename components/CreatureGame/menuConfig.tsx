"use client"

import type React from "react"
import type { CreatureData } from "@/types/creatureTypes"
import type { MenuHandlers } from "./creatures/BaseCreature"

/**
 * Generic menu action types - completely agnostic of creature specifics
 */
export type MenuAction = {
  id: string
  icon: string
  title: string
  onClick: (e: React.MouseEvent) => void
  isVisible?: boolean
}

export type SubMenu = {
  id: string
  backButton?: boolean
  options: SubMenuOption[]
}

export type SubMenuOption = {
  id: string
  label: string
  className?: string
  onClick: (e: React.MouseEvent) => void
}

/**
 * Menu configuration - passed by each creature
 */
export type CreatureMenuConfig = {
  mainActions: MenuAction[]
  subMenus: { [key: string]: SubMenu }
}

/**
 * Generic menu renderer component
 * This component knows NOTHING about creature types - it just renders what it's told
 */
export const GenericCreatureMenu: React.FC<{
  config: CreatureMenuConfig
  currentMenuState: string
  onBackToMain: () => void
}> = ({ config, currentMenuState, onBackToMain }) => {
  // Handle back button click
  const handleBackToMainMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBackToMain()
  }

  // If showing a sub-menu
  const currentSubMenu = currentMenuState !== "main" && currentMenuState !== "none" 
    ? config.subMenus[currentMenuState] 
    : null

  if (currentSubMenu) {
    return (
      <div className="color-menu horizontal">
        {currentSubMenu.options.map((option) => (
          <div
            key={option.id}
            className={option.className || "menu-option"}
            onClick={option.onClick}
          >
            {option.label}
          </div>
        ))}
        {currentSubMenu.backButton && (
          <button className="back-button" onClick={handleBackToMainMenu}>
            ↩️
          </button>
        )}
      </div>
    )
  }

  // Main menu
  return (
    <div className="slime-menu">
      {config.mainActions.map((action) => {
        // Check if action should be visible
        const visible = action.isVisible !== undefined ? action.isVisible : true
        if (!visible) return null

        return (
          <button
            key={action.id}
            className={`slime-menu-btn ${action.id}`}
            onClick={action.onClick}
            title={action.title}
          >
            {action.icon}
          </button>
        )
      })}
    </div>
  )
}
