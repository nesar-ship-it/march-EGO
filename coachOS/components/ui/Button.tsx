import { Pressable, Text, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/cn';

type LucideIcon = React.ComponentType<{
  size: number;
  color: string;
  style?: { marginRight?: number; marginLeft?: number };
}>;

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles = {
  primary: {
    container: 'bg-interactive-primary border border-interactive-primary',
    text: 'text-white',
    iconColor: '#FFFFFF',
  },
  secondary: {
    container: 'bg-white border border-border-default',
    text: 'text-text-primary',
    iconColor: '#0A0A0A',
  },
  ghost: {
    container: 'bg-transparent border border-transparent',
    text: 'text-text-primary',
    iconColor: '#0A0A0A',
  },
  danger: {
    container: 'bg-interactive-danger border border-interactive-danger',
    text: 'text-white',
    iconColor: '#FFFFFF',
  },
  link: {
    container: 'bg-transparent border border-transparent',
    text: 'text-text-primary underline',
    iconColor: '#0A0A0A',
  },
};

const sizeStyles = {
  sm: { container: 'h-8 px-3 rounded-md', text: 'text-body-sm', iconSize: 14 },
  md: { container: 'h-9 px-4 rounded-md', text: 'text-body-md', iconSize: 16 },
  lg: { container: 'h-11 px-5 rounded-md', text: 'text-body-lg', iconSize: 18 },
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      className={cn(
        'flex-row items-center justify-center',
        s.container,
        v.container,
        fullWidth && 'w-full',
        isDisabled && 'bg-interactive-disabled border-interactive-disabled opacity-60',
        className
      )}
      style={({ pressed }) => [pressed && !isDisabled && { opacity: 0.9 }]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#0A0A0A'
          }
        />
      ) : (
        <>
          {Icon && (
            <Icon
              size={s.iconSize}
              color={isDisabled ? '#999999' : v.iconColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            className={cn(
              'font-inter-medium',
              s.text,
              v.text,
              isDisabled && 'text-interactive-disabled-text'
            )}
          >
            {children}
          </Text>
          {IconRight && (
            <IconRight
              size={s.iconSize}
              color={isDisabled ? '#999999' : v.iconColor}
              style={{ marginLeft: 6 }}
            />
          )}
        </>
      )}
    </Pressable>
  );
}
