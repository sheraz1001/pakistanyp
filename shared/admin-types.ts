// Admin role definitions and permissions
export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'content_manager' | 'business_manager';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  isVerified: boolean;
  lastLoginAt?: string;
}

// Permission categories
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users_read',
  USERS_WRITE: 'users_write',
  USERS_DELETE: 'users_delete',
  
  // Business management
  BUSINESSES_READ: 'businesses_read',
  BUSINESSES_WRITE: 'businesses_write',
  BUSINESSES_DELETE: 'businesses_delete',
  
  // Content management
  CONTENT_READ: 'content_read',
  CONTENT_WRITE: 'content_write',
  CONTENT_DELETE: 'content_delete',
  
  // Analytics
  ANALYTICS_READ: 'analytics_read',
  
  // Categories
  CATEGORIES_READ: 'categories_read',
  CATEGORIES_WRITE: 'categories_write',
  
  // Reviews
  REVIEWS_READ: 'reviews_read',
  REVIEWS_WRITE: 'reviews_write',
  
  // System administration
  SYSTEM_ADMIN: 'system_admin',
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'], // All permissions
  admin: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.BUSINESSES_READ,
    PERMISSIONS.BUSINESSES_WRITE,
    PERMISSIONS.BUSINESSES_DELETE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.REVIEWS_READ,
    PERMISSIONS.REVIEWS_WRITE,
    PERMISSIONS.SYSTEM_ADMIN,
  ],
  moderator: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.BUSINESSES_READ,
    PERMISSIONS.BUSINESSES_WRITE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.REVIEWS_READ,
    PERMISSIONS.REVIEWS_WRITE,
    PERMISSIONS.CATEGORIES_READ,
  ],
  content_manager: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_WRITE,
  ],
  business_manager: [
    PERMISSIONS.BUSINESSES_READ,
    PERMISSIONS.BUSINESSES_WRITE,
    PERMISSIONS.BUSINESSES_DELETE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.REVIEWS_READ,
  ],
};

// Helper function to check if a role has a specific permission
export function hasPermission(role: AdminRole, permission: string): boolean {
  if (role === 'super_admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: AdminRole): string[] {
  if (role === 'super_admin') return ['*'];
  return ROLE_PERMISSIONS[role] || [];
}