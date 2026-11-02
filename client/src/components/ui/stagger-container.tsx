import { cn } from "@/lib/utils";
import { Children, cloneElement, isValidElement } from "react";

interface StaggerContainerProps {
  children: React.ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function StaggerContainer({ 
  children, 
  delay = 0, 
  staggerDelay = 100,
  className,
  direction = "up"
}: StaggerContainerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child, {
            ...child.props,
            className: cn(
              child.props.className,
              "opacity-0 animate-fade-in-up"
            ),
            style: {
              ...child.props.style,
              animationDelay: `${delay + (index * staggerDelay)}ms`,
              animationFillMode: "forwards"
            }
          });
        }
        return child;
      })}
    </div>
  );
}