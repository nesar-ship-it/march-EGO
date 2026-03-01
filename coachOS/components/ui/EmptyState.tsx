import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center px-8 py-16', className)}>
      {Icon && <Icon size={40} color="#CCCCCC" style={{ marginBottom: 16 }} />}
      <Text className="mb-1 text-center font-inter-semibold text-h3 text-text-primary">
        {title}
      </Text>
      {description && (
        <Text className="mb-6 text-center font-inter-regular text-body-md text-text-secondary">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
