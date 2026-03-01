import { create } from 'zustand';

export interface AttendanceSession {
  batchId: string;
  batchName: string;
  presentIds: string[];
  absentIds: string[];
  students: any[];
}

interface AttendanceStore {
  session: AttendanceSession | null;
  setSessionData: (data: AttendanceSession) => void;
  clearSession: () => void;
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  session: null,
  setSessionData: (data) => set({ session: data }),
  clearSession: () => set({ session: null }),
}));
