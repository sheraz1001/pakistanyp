import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { forwardRef } from "react";

interface AnimatedCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  hoverEffect?: "lift" | "glow" | "tilt" | "scale" | "border" | "gradient";
  delay?: number;
}

const AnimatedCard = forwardRef<
  React.ElementRef<typeof Card>,
  AnimatedCardProps
>(({ className, hoverEffect = "lift", delay = 0, children, ...props }, ref) => {
  const getHoverClasses = () => {
    const baseClasses = "transition-all duration-300 ease-in-out transform-gpu cursor-pointer";
    
    switch (hoverEffect) {
      case "lift":
        return cn(
          baseClasses,
          "hover:scale-105 hover:shadow-xl hover:-translate-y-2"
        );
      case "glow":
        return cn(
          baseClasses,
          "hover:shadow-2xl hover:shadow-pk-gold/20 hover:border-pk-gold/50"
        );
      case "tilt":
        return cn(
          baseClasses,
          "hover:rotate-1 hover:scale-105 hover:shadow-lg"
        );
      case "scale":
        return cn(
          baseClasses,
          "hover:scale-110 hover:shadow-lg"
        );
      case "border":
        return cn(
          baseClasses,
          "border-2 border-transparent hover:border-pk-gold hover:shadow-md"
        );
      case "gradient":
        return cn(
          baseClasses,
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-[#0B6B2E]/5 before:via-transparent before:to-pk-gold/10",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100 hover:shadow-lg"
        );
      default:
        return baseClasses;
    }
  };

  return (
    <Card
      ref={ref}
      className={cn(getHoverClasses(), className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Card>
  );
});

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };