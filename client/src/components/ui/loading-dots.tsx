import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "pk";
  className?: string;
}

export function LoadingDots({ size = "md", color = "primary", className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  };

  const colorClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    pk: "bg-pk-gold"
  };

  return (
    <div className={cn("flex space-x-1 items-center justify-center", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s"
          }}
        />
      ))}
    </div>
  );
}