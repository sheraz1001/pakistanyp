import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface FadeInProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
}

export function FadeIn({ 
  children, 
  direction = "up", 
  delay = 0, 
  duration = 600,
  className,
  triggerOnce = true 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!triggerOnce || !hasTriggered) {
            setIsVisible(true);
            setHasTriggered(true);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [triggerOnce, hasTriggered]);

  const getTransformClasses = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "translate-y-8 opacity-0";
        case "down":
          return "-translate-y-8 opacity-0";
        case "left":
          return "translate-x-8 opacity-0";
        case "right":
          return "-translate-x-8 opacity-0";
        default:
          return "opacity-0";
      }
    }
    return "translate-x-0 translate-y-0 opacity-100";
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out transform-gpu",
        getTransformClasses(),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: isVisible ? `${delay}ms` : "0ms"
      }}
    >
      {children}
    </div>
  );
}