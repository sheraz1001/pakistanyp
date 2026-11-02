import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-xl border border-[#DDE1E8] bg-white px-3.5 py-2.5 text-base md:text-sm text-[#0A0A0A] ring-offset-background placeholder:text-[#8A93A3] focus-visible:outline-none focus-visible:border-[#0B6B2E] focus-visible:ring-[3px] focus-visible:ring-[#BFE3CD] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }