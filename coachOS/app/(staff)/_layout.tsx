import { Tabs } from 'expo-router';
import { View, Text, useWindowDimensions, Platform } from 'react-native';
import { Home, ClipboardList, Users, IndianRupee, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Sidebar } from '@/components/navigation/Sidebar';

const tabConfig = [
  { name: '(home)', href: '/(staff)/(home)', label: 'Home', icon: Home },
  { name: '(attendance)', href: '/(staff)/(attendance)', label: 'Attendance', icon: ClipboardList },
  { name: '(students)', href: '/(staff)/(students)', label: 'Students', icon: Users },
  { name: '(payments)', href: '/(staff)/(payments)', label: 'Payments', icon: IndianRupee },
  { name: '(settings)', href: '/(staff)/(settings)', label: 'More', icon: MoreHorizontal },
] as const;

function OfflineSyncIndicator() {
  const { pendingCount, isSyncing } = useOfflineSync();
  const isOnline = pendingCount === 0 && !isSyncing;
  const dotColor = isOnline ? 'bg-status-success' : isSyncing ? 'bg-amber-500' : 'bg-status-error';
  const label = isOnline ? 'Synced' : isSyncing ? 'Syncing...' : `${pendingCount} pending`;
  return (
    <View className="flex-row items-center gap-2 px-2 py-1">
      <View className={`h-2 w-2 rounded-full ${dotColor}`} />
      <Text className="font-inter-regular text-caption text-text-tertiary">{label}</Text>
    </View>
  );
}

export default function StaffLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const contentAreaStyle = Platform.OS === 'web' && isWeb ? { flex: 1, maxWidth: 1200, alignSelf: 'center' as const, width: '100%' } : { flex: 1 };

  return (
    <ErrorBoundary>
    <View className="flex-1 flex-row">
      {isWeb ? (
        <View style={{ width: 240 }}>
          <Sidebar />
        </View>
      ) : null}
      <View style={contentAreaStyle}>
      <View className="flex-row items-center justify-end border-b border-border-subtle bg-white pr-2">
        <OfflineSyncIndicator />
      </View>
      <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: isWeb ? 'none' : 'flex',
          paddingBottom: insets.bottom,
          paddingTop: 8,
          height: 56 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          backgroundColor: '#FFFFFF',
        },
        tabBarActiveTintColor: '#0A0A0A',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="(attendance)"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="(students)"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, focused }) => (
            <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="(payments)"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, focused }) => (
            <IndianRupee size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="(communicate)"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <MoreHorizontal size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
      </View>
      </View>
    </View>
    </ErrorBoundary>
  );
}
