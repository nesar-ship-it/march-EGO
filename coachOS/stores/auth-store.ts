import { create } from 'zustand';
import type { StaffProfile, Student } from '@/lib/types';

interface AuthUser {
  id: string;
  email?: string;
  role: string;
  orgId: string;
  branchId: string | null;
  profile: StaffProfile | Student;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
  setSession: () => void; // stub for existing code
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
  setSession: () => {},
}));
