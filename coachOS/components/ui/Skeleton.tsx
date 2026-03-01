import { View, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  className?: string;
  circle?: boolean;
}

export function Skeleton({ width = '100%', height = 20, className, circle }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ width, height }, animatedStyle]}
      className={cn(
        'bg-bg-tertiary',
        circle ? 'rounded-full' : 'rounded-md',
        className,
      )}
    />
  );
}
