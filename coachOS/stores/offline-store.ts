import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface AttendanceRecordPayload {
  student_id: string;
  batch_id: string;
  status: 'present' | 'absent';
  timestamp?: string; // added internally
}

interface OfflineStore {
  pendingAttendance: AttendanceRecordPayload[];
  isSyncing: boolean;
  addRecords: (records: AttendanceRecordPayload[]) => void;
  removeRecords: (records: AttendanceRecordPayload[]) => void;
  setSyncing: (status: boolean) => void;
}

const storage = Platform.OS === 'web' 
  ? createJSONStorage(() => sessionStorage) 
  : createJSONStorage(() => AsyncStorage);

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      pendingAttendance: [],
      isSyncing: false,
      addRecords: (records) => {
        const timestamped = records.map(r => ({ ...r, timestamp: new Date().toISOString() }));
        set((state) => ({ pendingAttendance: [...state.pendingAttendance, ...timestamped] }));
      },
      removeRecords: (recordsToRemove) => {
        // Simple removal: filter out ones that exactly match
        set((state) => ({
          pendingAttendance: state.pendingAttendance.filter(
            (p) => !recordsToRemove.find(r => r.student_id === p.student_id && r.batch_id === p.batch_id && r.timestamp === p.timestamp)
          )
        }));
      },
      setSyncing: (isSyncing) => set({ isSyncing }),
    }),
    {
      name: 'offline-storage',
      storage,
    }
  )
);
