import { Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react-native';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost';
  disabled?: boolean;
  label?: string; // accessibility label
  className?: string;
}

const sizeMap = {
  sm: { container: 'h-7 w-7', iconSize: 14 },
  md: { container: 'h-9 w-9', iconSize: 18 },
  lg: { container: 'h-11 w-11', iconSize: 22 },
};

export function IconButton({
  icon: Icon,
  onPress,
  size = 'md',
  variant = 'default',
  disabled = false,
  label,
  className,
}: IconButtonProps) {
  const s = sizeMap[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      className={cn(
        'items-center justify-center rounded-md',
        s.container,
        variant === 'default' && 'border border-border-default bg-white',
        variant === 'ghost' && 'bg-transparent',
        disabled && 'opacity-40',
        className,
      )}
      style={({ pressed }) => [pressed && !disabled && { opacity: 0.7 }]}
    >
      <Icon size={s.iconSize} color={disabled ? '#999999' : '#0A0A0A'} />
    </Pressable>
  );
}
