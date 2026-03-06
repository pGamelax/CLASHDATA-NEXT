"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function Tooltip({ children, content, side = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-xs pointer-events-none",
            sideClasses[side],
            className
          )}
        >
          <div className="whitespace-normal">{content}</div>
          <div
            className={cn(
              "absolute w-2 h-2 bg-popover border-r border-b rotate-45",
              side === "top" && "top-full left-1/2 -translate-x-1/2 -mt-1",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 -mb-1",
              side === "left" && "left-full top-1/2 -translate-y-1/2 -ml-1",
              side === "right" && "right-full top-1/2 -translate-y-1/2 -mr-1"
            )}
          />
        </div>
      )}
    </div>
  )
}
