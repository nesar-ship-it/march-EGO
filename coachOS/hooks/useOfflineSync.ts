import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore, AttendanceRecordPayload } from '@/stores/offline-store';
import { supabase } from '@/lib/supabase';

export function useOfflineSync() {
  const { pendingAttendance, isSyncing, setSyncing, addRecords, removeRecords } = useOfflineStore();

  const syncPendingItems = async () => {
    if (isSyncing || pendingAttendance.length === 0) return;
    
    // Check real network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    setSyncing(true);
    
    try {
      // Chunking can be done here if payload is massive
      const payload = pendingAttendance.map(p => ({
        student_id: p.student_id,
        batch_id: p.batch_id,
        status: p.status,
        date: p.timestamp ? new Date(p.timestamp).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      }));

      // In real scenario, upsert to avoid duplicate check-ins on same day
      const { error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'student_id, date, batch_id' });

      if (!error) {
        // Success
        removeRecords(pendingAttendance);
      } else {
        console.error('Offline sync error:', error);
      }
    } catch (err) {
      console.error('Offline sync exception:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Sync when app comes to foreground or network comes online
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncPendingItems();
      }
    };
    
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncPendingItems();
      }
    });

    return () => {
      appStateSub.remove();
      unsubscribeNetInfo();
    };
  }, [pendingAttendance.length]);

  return {
    syncStatus: isSyncing ? 'syncing' : 'idle',
    pendingCount: pendingAttendance.length,
    isSyncing,
    queueAttendance: async (records: AttendanceRecordPayload[]) => {
      addRecords(records);
      // Attempt immediate sync
      await syncPendingItems();
    }
  };
}
