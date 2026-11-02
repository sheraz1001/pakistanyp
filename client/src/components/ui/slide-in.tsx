import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface SlideInProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  triggerOnce?: boolean;
}

export function SlideIn({ 
  children, 
  direction = "left", 
  delay = 0, 
  duration = 500,
  distance = 50,
  className,
  triggerOnce = true 
}: SlideInProps) {
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

  // Tailwind cannot compile interpolated arbitrary values. Keep dynamic
  // distance in the inline transform rather than emitting invalid CSS rules.
  const offset = direction === "left" || direction === "up" ? -distance : distance;
  const transform = isVisible
    ? "translate3d(0, 0, 0)"
    : direction === "left" || direction === "right"
      ? `translate3d(${offset}px, 0, 0)`
      : `translate3d(0, ${offset}px, 0)`;

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[transform,opacity] ease-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        transform,
        transitionDuration: `${duration}ms`,
        transitionDelay: isVisible ? `${delay}ms` : "0ms"
      }}
    >
      {children}
    </div>
  );
}