import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  action?: { label: string; onPress: () => void };
  duration?: number; // ms, default 4000
  variant?: 'default' | 'success' | 'error';
}

export function Toast({
  message,
  visible,
  onDismiss,
  action,
  duration = 4000,
  variant = 'default',
}: ToastProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });

      // Auto-dismiss
      translateY.value = withDelay(
        duration,
        withTiming(100, { duration: 250 }, () => {
          runOnJS(onDismiss)();
        }),
      );
      opacity.value = withDelay(duration, withTiming(0, { duration: 250 }));
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const bgColor = {
    default: 'bg-bg-inverse',
    success: 'bg-status-success',
    error: 'bg-status-error',
  }[variant];

  return (
    <Animated.View
      style={animStyle}
      className={cn(
        'absolute bottom-6 left-4 right-4 flex-row items-center justify-between rounded-lg px-4 py-3',
        bgColor,
      )}
    >
      <Text className="flex-1 font-inter-regular text-body-sm text-white" numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <Pressable onPress={action.onPress} className="ml-3">
          <Text className="font-inter-semibold text-label-sm text-white underline">
            {action.label}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={onDismiss} className="ml-2">
        <X size={16} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}
