import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <View className={cn('flex-row items-center', className)}>
        <View className="h-px flex-1 bg-border-default" />
        <Text className="mx-3 font-inter-regular text-caption text-text-tertiary">
          {label}
        </Text>
        <View className="h-px flex-1 bg-border-default" />
      </View>
    );
  }

  return <View className={cn('h-px w-full bg-border-default', className)} />;
}
