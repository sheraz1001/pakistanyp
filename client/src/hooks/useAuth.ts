import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, isFetching } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (response.status === 401) {
        return null; // User not authenticated
      }
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  return {
    user,
    isLoading,
    isFetching,
    isAuthenticated: !!user,
  };
}
