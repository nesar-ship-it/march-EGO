// Definitions for RBAC in RoleGate
export type Role = 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach' | 'student';
export type Resource = 'organization' | 'branch' | 'staff' | 'student' | 'batch' | 'attendance' | 'payment' | 'match' | 'news';
export type Action = 'create' | 'read' | 'update' | 'delete';

type Permissions = Record<Role, Partial<Record<Resource, Action[]>>>;

const permissions: Permissions = {
  super_admin: {
    organization: ['create', 'read', 'update', 'delete'],
    branch: ['create', 'read', 'update', 'delete'],
    staff: ['create', 'read', 'update', 'delete'],
    student: ['create', 'read', 'update', 'delete'],
    batch: ['create', 'read', 'update', 'delete'],
    attendance: ['create', 'read', 'update', 'delete'],
    payment: ['create', 'read', 'update', 'delete'],
    match: ['create', 'read', 'update', 'delete'],
    news: ['create', 'read', 'update', 'delete'],
  },
  branch_admin: {
    organization: ['read'],
    branch: ['read', 'update'],
    staff: ['read'],
    student: ['create', 'read', 'update'],
    batch: ['read'],
    attendance: ['create', 'read', 'update'],
    payment: ['create', 'read', 'update'],
    match: ['create', 'read', 'update'],
    news: ['create', 'read', 'update'],
  },
  coach: {
    organization: ['read'],
    branch: ['read'],
    staff: ['read'],
    student: ['create', 'read', 'update'],
    batch: ['read'],
    attendance: ['create', 'read'],
    payment: ['read'],
    match: ['read'],
    news: ['read'],
  },
  temp_coach: {
    organization: ['read'],
    branch: ['read'],
    staff: ['read'],
    student: ['read'],
    batch: ['read'],
    attendance: ['create', 'read'],
    payment: [],
    match: ['read'],
    news: ['read'],
  },
  student: {
    organization: ['read'],
    branch: ['read'],
    staff: ['read'],
    student: ['read'],
    batch: ['read'],
    attendance: ['read'],
    payment: ['read'],
    match: ['read'],
    news: ['read'],
  }
};

export function hasPermission(roleStr: string, resource: Resource, action: Action): boolean {
  if (!roleStr) return false;
  const role = roleStr as Role;
  if (!permissions[role]) return false;
  if (!permissions[role][resource]) return false;
  
  return permissions[role][resource]!.includes(action);
}

export function canResetStudentPassword(roleStr: string): boolean {
  if (!roleStr) return false;
  const role = roleStr as Role;
  // Super Admins, Branch Admins, and Coaches can reset passwords
  return role === 'super_admin' || role === 'branch_admin' || role === 'coach';
}

export function canSeeRevenueDashboard(roleStr: string): boolean {
  if (!roleStr) return false;
  const role = roleStr as Role;
  return role === 'super_admin' || role === 'branch_admin';
}
