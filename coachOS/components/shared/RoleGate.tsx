import type { ReactNode } from 'react';
import { hasPermission, type Action, type Resource } from '@/lib/permissions';

interface RoleGateProps {
  /** Current user's role */
  role: string;
  /** Resource to check */
  resource: Resource;
  /** Action to check */
  action: Action;
  /** Content to render if permitted */
  children: ReactNode;
  /** Optional fallback content */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on RBAC permissions.
 *
 * Usage:
 * <RoleGate role={user.role} resource="student" action="delete">
 *   <Button onPress={handleDelete}>Delete Student</Button>
 * </RoleGate>
 */
export function RoleGate({ role, resource, action, children, fallback = null }: RoleGateProps) {
  if (hasPermission(role, resource, action)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
