import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const barColors = {
  default: 'bg-interactive-primary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
};

export function ProgressBar({
  value,
  label,
  showPercentage = false,
  variant = 'default',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <View className="mb-1.5 flex-row items-center justify-between">
          {label && (
            <Text className="font-inter-medium text-label-sm text-text-secondary">
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text className="font-inter-medium text-label-sm text-text-tertiary">
              {clampedValue}%
            </Text>
          )}
        </View>
      )}
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
        <View
          className={cn('h-full rounded-full', barColors[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </View>
    </View>
  );
}
