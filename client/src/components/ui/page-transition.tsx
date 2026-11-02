import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fade" | "slide" | "scale" | "bounce";
}

export function PageTransition({ children, className, variant = "fade" }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getTransitionClasses = () => {
    const baseClasses = "transition-all duration-500 ease-out transform-gpu";
    
    if (!isVisible) {
      switch (variant) {
        case "fade":
          return cn(baseClasses, "opacity-0");
        case "slide":
          return cn(baseClasses, "opacity-0 translate-y-8");
        case "scale":
          return cn(baseClasses, "opacity-0 scale-95");
        case "bounce":
          return cn(baseClasses, "opacity-0 scale-95 translate-y-4");
        default:
          return cn(baseClasses, "opacity-0");
      }
    }
    
    return cn(baseClasses, "opacity-100 translate-y-0 scale-100");
  };

  return (
    <div className={cn(getTransitionClasses(), className)}>
      {children}
    </div>
  );
}