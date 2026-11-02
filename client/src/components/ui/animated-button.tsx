import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";

interface AnimatedButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "glow" | "bounce" | "slide";
  animationType?: "hover" | "click" | "focus" | "all";
}

const AnimatedButton = forwardRef<
  React.ElementRef<typeof Button>,
  AnimatedButtonProps
>(({ className, variant = "default", animationType = "all", children, ...props }, ref) => {
  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-300 ease-in-out transform-gpu";
    
    switch (variant) {
      case "glow":
        return cn(
          baseClasses,
          "bg-[#0B6B2E] text-white font-semibold hover:bg-[#05501F]"
        );
      case "bounce":
        return cn(
          baseClasses,
          "hover:bg-[#F1F2F6]"
        );
      case "slide":
        return cn(
          baseClasses,
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-[#0B6B2E]",
          "before:translate-x-[-100%] before:transition-transform before:duration-300",
          "hover:before:translate-x-0 hover:text-white",
          "before:z-[-1]"
        );
      default:
        return cn(
          baseClasses,
          "hover:scale-105 hover:shadow-md active:scale-95"
        );
    }
  };

  return (
    <Button
      ref={ref}
      className={cn(getAnimationClasses(), className)}
      {...props}
    >
      {children}
    </Button>
  );
});

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };