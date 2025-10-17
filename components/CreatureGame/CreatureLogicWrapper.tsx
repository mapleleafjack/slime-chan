"use client"

import { useCreatureLogic } from "@/hooks/useCreatureLogic"

// This component exists solely to properly call the useCreatureLogic hook
// for each creature at the component level (following React's Rules of Hooks)
const CreatureLogicWrapper = ({ id }: { id: string }) => {
  useCreatureLogic(id)
  return null
}

export default CreatureLogicWrapper
