import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#BFE3CD] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#0B6B2E] text-white hover:bg-[#05501F]",
        destructive:
          "bg-[#D71920] text-white hover:bg-[#B3141B]",
        outline:
          "border border-[#E3E6EC] bg-white text-[#0A0A0A] hover:border-[#C9CED8] hover:bg-white hover:text-[#0A0A0A]",
        secondary:
          "bg-[#F1F2F6] text-[#0A0A0A] hover:bg-[#E7E9EE]",
        ghost: "text-[#3A4354] hover:bg-[#F1F2F6] hover:text-[#0A0A0A]",
        link: "text-[#0B6B2E] underline-offset-4 hover:underline hover:text-[#05501F]",
      },
      size: {
        default: "h-11 px-[18px] py-2",
        sm: "h-9 rounded-[10px] px-3",
        lg: "h-[52px] px-6 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
