import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
}

const GamifiedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-display font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          "gamified-active-effect",
          
          // Variants
          variant === "primary" && "bg-primary text-primary-foreground border-b-4 border-primary-dark hover:bg-primary/90",
          variant === "secondary" && "bg-secondary text-secondary-foreground border-b-4 border-secondary-dark hover:bg-secondary/90",
          variant === "danger" && "bg-destructive text-destructive-foreground border-b-4 border-destructive-dark hover:bg-destructive/90",
          variant === "success" && "bg-success text-success-foreground border-b-4 border-success-dark hover:bg-success/90",
          variant === "outline" && "border-2 border-border bg-white text-gray-700 border-b-4 hover:bg-gray-50",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground active:translate-y-0 active:margin-0",
          
          // Sizes
          size === "default" && "h-12 px-6 py-2 text-sm",
          size === "sm" && "h-10 px-4 text-xs",
          size === "lg" && "h-14 px-8 text-base",
          size === "icon" && "h-12 w-12",
          
          className
        )}
        {...props}
      />
    )
  }
)
GamifiedButton.displayName = "GamifiedButton"

export { GamifiedButton }
