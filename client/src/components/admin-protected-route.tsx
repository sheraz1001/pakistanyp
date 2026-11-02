import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, AlertTriangle } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallbackRoute?: string;
}

export function AdminProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackRoute = "/admin-login"
}: AdminProtectedRouteProps) {
  const { user, isLoading, hasPermission, hasRole } = useAdminAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation(fallbackRoute);
    }
  }, [user, isLoading, setLocation, fallbackRoute]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <Card className="w-full max-w-[480px] rounded-[24px]">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-[3px] border-[#CFE8D8] border-t-[#0B6B2E] rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[#0A0A0A] mb-2">Verifying Access</h3>
            <p className="text-[#4B5565]">Please wait while we verify your credentials...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole) && user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px] rounded-[24px]">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-[#FDECEC] rounded-[14px] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-[#B91C1C]" />
            </div>
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[#0A0A0A] mb-2">Access Restricted</h3>
            <p className="text-[#4B5565] mb-4">
              This area requires {requiredRole.replace('_', ' ')} privileges.
            </p>
            <p className="text-sm text-[#5B6475]">
              Your current role: <span className="font-medium">{user.role.replace('_', ' ')}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permission requirements
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    hasPermission(permission) || user.role === "super_admin"
  );

  if (requiredPermissions.length > 0 && !hasRequiredPermissions) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px] rounded-[24px]">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-[#FFF4E0] rounded-[14px] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[#B45309]" />
            </div>
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[#0A0A0A] mb-2">Insufficient Permissions</h3>
            <p className="text-[#4B5565] mb-4">
              You don't have the required permissions to access this area.
            </p>
            <div className="text-sm text-[#5B6475] space-y-1">
              <p><strong>Required permissions:</strong></p>
              <ul className="list-disc list-inside text-left">
                {requiredPermissions.map(permission => (
                  <li key={permission}>{permission.replace('_', ' ')}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access
  return <>{children}</>;
}

// Component for checking permissions within rendered components
export function PermissionGate({ 
  permissions, 
  role, 
  children, 
  fallback = null 
}: { 
  permissions?: string[]; 
  role?: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  const { user, hasPermission, hasRole } = useAdminAuth();

  if (!user) return fallback;
  
  // Super admin has access to everything
  if (user.role === "super_admin") return <>{children}</>;

  // Check role requirement
  if (role && !hasRole(role)) return fallback;

  // Check permission requirements
  if (permissions && !permissions.every(permission => hasPermission(permission))) {
    return fallback;
  }

  return <>{children}</>;
}