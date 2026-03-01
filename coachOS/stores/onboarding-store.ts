import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type SportType = 'Cricket' | 'Football' | 'Hockey' | 'Tennis' | 'Badminton' | 'Basketball' | 'Swimming' | 'Athletics' | 'Other';

export interface OrgDetailsState {
  sport_type: SportType | null;
  sport_type_other: string;
  name: string;
}

export interface BranchState {
  id: string; // internal to frontend
  name: string;
  address: string;
  city: string;
  phone: string;
}

export interface BatchState {
  id: string; // internal to frontend
  name: string;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[];
  apply_to: 'all' | 'custom';
  selected_branches: string[]; // branch IDs
}

export interface AgeGroupState {
  id: string; // internal to frontend
  name: string;
  min_age: number;
  max_age: number;
  gender: 'All' | 'Male' | 'Female';
}

interface OnboardingState {
  orgDetails: OrgDetailsState;
  setOrgDetails: (details: Partial<OrgDetailsState>) => void;

  cofounderEmails: string[];
  setCofounderEmails: (emails: string[]) => void;

  branches: BranchState[];
  setBranches: (branches: BranchState[]) => void;

  batches: BatchState[];
  setBatches: (batches: BatchState[]) => void;

  ageGroups: AgeGroupState[];
  setAgeGroups: (groups: AgeGroupState[]) => void;

  reset: () => void;
}

const initialState = {
  orgDetails: {
    sport_type: null,
    sport_type_other: '',
    name: '',
  },
  cofounderEmails: [''],
  branches: [
    { id: '1', name: '', address: '', city: '', phone: '' },
  ],
  batches: [
    { id: '1', name: 'Morning Batch', start_time: '06:00', end_time: '08:00', days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], apply_to: 'all' as const, selected_branches: [] },
    { id: '2', name: 'Evening Batch', start_time: '16:00', end_time: '18:00', days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], apply_to: 'all' as const, selected_branches: [] },
  ],
  ageGroups: [],
};

// We use AsyncStorage to persist draft state so if user kills app they don't lose progress
// Only applies on native; web uses localStorage under the hood
const storage = Platform.OS === 'web' 
  ? createJSONStorage(() => sessionStorage) 
  : createJSONStorage(() => AsyncStorage);

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      setOrgDetails: (details) => set((state) => ({ orgDetails: { ...state.orgDetails, ...details } })),
      setCofounderEmails: (emails) => set({ cofounderEmails: emails }),
      setBranches: (branches) => set({ branches }),
      setBatches: (batches) => set({ batches }),
      setAgeGroups: (groups) => set({ ageGroups: groups }),
      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      storage,
    }
  )
);
