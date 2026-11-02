import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

/** Wraps account pages: shows a short message and redirects to /login when there is no session. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: loading, isFetching } = useAuth();
  const isLoading = loading || (isFetching && !isAuthenticated);
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== "undefined") {
      navigate(`/login?next=${encodeURIComponent(location)}`);
    }
  }, [isLoading, isAuthenticated, location, navigate]);
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4 text-[15px] text-[#5B6475]" role="status">
        {isLoading ? "Loading your account…" : "Please log in to view this page."}
      </div>
    );
  }
  return <>{children}</>;
}
