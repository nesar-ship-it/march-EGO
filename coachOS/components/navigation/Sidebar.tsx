import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, ClipboardList, Users, IndianRupee, MessageSquare, MoreHorizontal } from 'lucide-react-native';
import { cn } from '@/lib/cn';

const navItems = [
  { path: '/(staff)/(home)', label: 'Home', icon: Home },
  { path: '/(staff)/(attendance)', label: 'Attendance', icon: ClipboardList },
  { path: '/(staff)/(students)', label: 'Students', icon: Users },
  { path: '/(staff)/(payments)', label: 'Payments', icon: IndianRupee },
  { path: '/(staff)/(communicate)', label: 'Messages', icon: MessageSquare },
  { path: '/(staff)/(settings)', label: 'More', icon: MoreHorizontal },
] as const;

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      className={cn(
        'w-56 border-r border-border-default bg-bg-secondary',
        className
      )}
    >
      <View className="p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path) || pathname.includes(item.path.split('/').filter(Boolean)[0] ?? '');
          const Icon = item.icon;
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path as any)}
              className={cn(
                'mb-1 flex-row items-center rounded-md px-3 py-2',
                isActive && 'bg-bg-tertiary'
              )}
            >
              <Icon
                size={20}
                color={isActive ? '#0A0A0A' : '#666666'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                className={cn(
                  'ml-3 font-inter-medium text-body-md',
                  isActive ? 'text-text-primary' : 'text-text-secondary'
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
