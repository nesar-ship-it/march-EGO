import { Pressable, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: SwitchProps) {
  const translateX = useSharedValue(checked ? 18 : 2);

  useEffect(() => {
    translateX.value = withTiming(checked ? 18 : 2, { duration: 150 });
  }, [checked]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      className={cn('flex-row items-center', disabled && 'opacity-50', className)}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
    >
      <View
        className={cn(
          'h-6 w-10 rounded-full',
          checked ? 'bg-interactive-primary' : 'bg-border-default',
        )}
      >
        <Animated.View
          style={thumbStyle}
          className="mt-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </View>
      {label && (
        <Text className="ml-3 font-inter-regular text-body-md text-text-primary">
          {label}
        </Text>
      )}
    </Pressable>
  );
}
