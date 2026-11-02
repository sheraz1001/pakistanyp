import { useState, useEffect, createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
  isVerified: boolean;
  lastLoginAt?: string;
}

interface AdminAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<any>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/admin/user"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "super_admin") return true; // Super admin has all permissions
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const logout = async () => {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      queryClient.clear();
      window.location.href = "/admin-login";
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        hasPermission,
        hasRole,
        logout,
        refetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

// Hook for protecting admin routes
export function useAdminProtection(requiredPermissions: string[] = []) {
  const { user, isLoading, hasPermission } = useAdminAuth();
  
  const hasAccess = () => {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  return {
    user,
    isLoading,
    hasAccess: hasAccess(),
    canAccess: hasAccess
  };
}