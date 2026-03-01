import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';
import { StatusDot } from './StatusDot';

interface BadgeProps {
  children: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-bg-tertiary',
  success: 'bg-status-success/15',
  warning: 'bg-status-warning/15',
  error: 'bg-status-error/15',
  info: 'bg-status-info/15',
};

const textStyles = {
  default: 'text-text-secondary',
  success: 'text-green-700',
  warning: 'text-amber-700',
  error: 'text-red-700',
  info: 'text-blue-700',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center self-start rounded-full',
        variantStyles[variant],
        size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
        className,
      )}
    >
      {dot && <StatusDot variant={variant === 'default' ? 'neutral' : variant} className="mr-1.5" />}
      <Text
        className={cn(
          'font-inter-medium',
          textStyles[variant],
          size === 'sm' ? 'text-caption' : 'text-label-sm',
        )}
      >
        {children}
      </Text>
    </View>
  );
}
