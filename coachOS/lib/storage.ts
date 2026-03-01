import { Platform } from 'react-native';

type StorageBackend = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys: () => string[];
  clearAll: () => void;
};

let backend: StorageBackend | null = null;

function getBackend(): StorageBackend {
  if (backend) return backend;
  if (Platform.OS === 'web') {
    backend = {
      getString: (key: string) => {
        if (typeof window === 'undefined') return undefined;
        return window.localStorage.getItem(key) ?? undefined;
      },
      set: (key: string, value: string) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      },
      delete: (key: string) => {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      },
      getAllKeys: () => (typeof window === 'undefined' ? [] : Object.keys(window.localStorage)),
      clearAll: () => {
        if (typeof window !== 'undefined') window.localStorage.clear();
      },
    };
    return backend;
  }
  // Native: use in-memory store to avoid "Cannot read property 'prototype' of undefined"
  // from react-native-mmkv in some RN/Expo setups. Re-enable MMKV later if needed.
  const memory = new Map<string, string>();
  backend = {
    getString: (key) => memory.get(key),
    set: (key, value) => { memory.set(key, value); },
    delete: (key) => { memory.delete(key); },
    getAllKeys: () => Array.from(memory.keys()),
    clearAll: () => { memory.clear(); },
  };
  return backend;
}

const storage: StorageBackend = {
  getString: (key) => getBackend().getString(key),
  set: (key, value) => getBackend().set(key, value),
  delete: (key) => getBackend().delete(key),
  getAllKeys: () => getBackend().getAllKeys(),
  clearAll: () => getBackend().clearAll(),
};

export { storage };

export function getJSON<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'offline-queue',
  LAST_BRANCH_ID: 'last-branch-id',
  LAST_BATCH_ID: 'last-batch-id',
  ATTENDANCE_DRAFT: 'attendance-draft',
  ONBOARDING_STEP: 'onboarding-step',
  SELECTED_ORG_ID: 'selected-org-id',
} as const;
