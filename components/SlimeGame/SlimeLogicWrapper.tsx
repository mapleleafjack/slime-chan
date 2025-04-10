"use client"

import { useSlimeLogic } from "@/hooks/useSlimeLogic"

// This component exists solely to properly call the useSlimeLogic hook
// for each slime at the component level (following React's Rules of Hooks)
const SlimeLogicWrapper = ({ id }: { id: string }) => {
  useSlimeLogic(id)
  return null
}

export default SlimeLogicWrapper
