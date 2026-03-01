import { View } from 'react-native';
import { cn } from '@/lib/cn';

interface StatusDotProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

const variantStyles = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  info: 'bg-status-info',
  neutral: 'bg-text-tertiary',
};

const sizeStyles = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
};

export function StatusDot({ variant = 'neutral', size = 'sm', className }: StatusDotProps) {
  return (
    <View
      className={cn(
        'rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    />
  );
}
