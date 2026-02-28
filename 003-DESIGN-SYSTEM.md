# CoachOS — File 003: Design System & UI Component Library

> **Purpose:** Every reusable UI component. Build these first before any screens.
> **Depends on:** 002-PROJECT-SCAFFOLD.md (project must be scaffolded first)
> **Location:** All components go in `components/ui/`
> **Design reference:** Vercel.com (light mode) + Linear.app. Monochrome. Clean. No decorative icons.

---

## Component Build Order

Build in this order — later components depend on earlier ones:

1. `cn.ts` (already in lib/ from File 002)
2. `StatusDot.tsx`
3. `Button.tsx`
4. `IconButton.tsx`
5. `Input.tsx`
6. `Select.tsx`
7. `Checkbox.tsx`
8. `Switch.tsx`
9. `Radio.tsx`
10. `Badge.tsx`
11. `Avatar.tsx`
12. `Divider.tsx`
13. `Card.tsx`
14. `Skeleton.tsx`
15. `ProgressBar.tsx`
16. `Toast.tsx`
17. `Modal.tsx`
18. `Sheet.tsx`
19. `SearchInput.tsx`
20. `FilterBar.tsx`
21. `Table.tsx` + `TableRow.tsx`
22. `EmptyState.tsx`
23. `index.ts` (barrel export)

---

## 1. `components/ui/StatusDot.tsx`

```tsx
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
```

---

## 2. `components/ui/Button.tsx`

```tsx
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react-native';

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
    containerPressed: 'bg-interactive-primary-hover',
    text: 'text-white',
    iconColor: '#FFFFFF',
  },
  secondary: {
    container: 'bg-white border border-border-default',
    containerPressed: 'bg-bg-tertiary',
    text: 'text-text-primary',
    iconColor: '#0A0A0A',
  },
  ghost: {
    container: 'bg-transparent border border-transparent',
    containerPressed: 'bg-bg-tertiary',
    text: 'text-text-primary',
    iconColor: '#0A0A0A',
  },
  danger: {
    container: 'bg-interactive-danger border border-interactive-danger',
    containerPressed: 'bg-interactive-danger-hover',
    text: 'text-white',
    iconColor: '#FFFFFF',
  },
  link: {
    container: 'bg-transparent border border-transparent',
    containerPressed: 'bg-transparent',
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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        s.container,
        v.container,
        fullWidth && 'w-full',
        isDisabled && 'bg-interactive-disabled border-interactive-disabled opacity-60',
        className,
      )}
      style={({ pressed }) => [
        pressed && !isDisabled && { opacity: 0.9 },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#0A0A0A'}
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
              isDisabled && 'text-interactive-disabled-text',
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
```

---

## 3. `components/ui/IconButton.tsx`

```tsx
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
```

---

## 4. `components/ui/Input.tsx`

```tsx
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
  size?: 'md' | 'lg';
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      rightElement,
      size = 'md',
      containerClassName,
      className,
      ...props
    },
    ref,
  ) => {
    const heightClass = size === 'lg' ? 'h-12' : 'h-10';

    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text className="mb-1.5 font-inter-medium text-label-md text-text-secondary">
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center rounded-md border bg-white px-3',
            heightClass,
            error ? 'border-status-error' : 'border-border-default',
          )}
        >
          {Icon && (
            <Icon size={16} color="#999999" style={{ marginRight: 8 }} />
          )}
          <TextInput
            ref={ref}
            placeholderTextColor="#999999"
            className={cn(
              'flex-1 font-inter-regular text-body-md text-text-primary',
              className,
            )}
            {...props}
          />
          {rightElement}
        </View>
        {error && (
          <Text className="mt-1 font-inter-regular text-caption text-status-error">
            {error}
          </Text>
        )}
        {hint && !error && (
          <Text className="mt-1 font-inter-regular text-caption text-text-tertiary">
            {hint}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';
```

---

## 5. `components/ui/Select.tsx`

```tsx
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal as RNModal } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  placeholder = 'Select...',
  options,
  value,
  onValueChange,
  error,
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View className={cn('w-full', className)}>
      {label && (
        <Text className="mb-1.5 font-inter-medium text-label-md text-text-secondary">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        className={cn(
          'h-10 flex-row items-center justify-between rounded-md border bg-white px-3',
          error ? 'border-status-error' : 'border-border-default',
          disabled && 'opacity-50',
        )}
      >
        <Text
          className={cn(
            'font-inter-regular text-body-md',
            selectedOption ? 'text-text-primary' : 'text-text-tertiary',
          )}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={16} color="#999999" />
      </Pressable>
      {error && (
        <Text className="mt-1 font-inter-regular text-caption text-status-error">
          {error}
        </Text>
      )}

      {/* Dropdown Modal */}
      <RNModal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setIsOpen(false)}
        >
          <View className="max-h-[50%] rounded-t-xl bg-white pb-8">
            <View className="items-center py-3">
              <View className="h-1 w-9 rounded-full bg-border-default" />
            </View>
            {label && (
              <Text className="px-4 pb-2 font-inter-semibold text-h3 text-text-primary">
                {label}
              </Text>
            )}
            <ScrollView className="px-2">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'mx-2 flex-row items-center justify-between rounded-md px-3 py-3',
                    value === option.value && 'bg-bg-tertiary',
                  )}
                >
                  <Text
                    className={cn(
                      'font-inter-regular text-body-md',
                      value === option.value
                        ? 'font-inter-medium text-text-primary'
                        : 'text-text-secondary',
                    )}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Check size={16} color="#0A0A0A" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </RNModal>
    </View>
  );
}
```

---

## 6. `components/ui/Checkbox.tsx`

```tsx
import { Pressable, View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      className={cn('flex-row items-center', disabled && 'opacity-50', className)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded border',
          checked
            ? 'border-interactive-primary bg-interactive-primary'
            : 'border-border-default bg-white',
        )}
      >
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </View>
      {label && (
        <Text className="ml-2 font-inter-regular text-body-md text-text-primary">
          {label}
        </Text>
      )}
    </Pressable>
  );
}
```

---

## 7. `components/ui/Switch.tsx`

```tsx
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
```

---

## 8. `components/ui/Badge.tsx`

```tsx
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
  success: 'bg-green-50',
  warning: 'bg-amber-50',
  error: 'bg-red-50',
  info: 'bg-blue-50',
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
```

---

## 9. `components/ui/Avatar.tsx`

```tsx
import { View, Text, Image } from 'react-native';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { container: 'h-8 w-8', text: 'text-caption', imageSize: 32 },
  md: { container: 'h-10 w-10', text: 'text-label-sm', imageSize: 40 },
  lg: { container: 'h-12 w-12', text: 'text-label-lg', imageSize: 48 },
  xl: { container: 'h-16 w-16', text: 'text-h3', imageSize: 64 },
};

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const s = sizeMap[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={cn('rounded-full bg-bg-tertiary', s.container, className)}
        style={{ width: s.imageSize, height: s.imageSize }}
      />
    );
  }

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full bg-bg-tertiary',
        s.container,
        className,
      )}
    >
      <Text className={cn('font-inter-medium text-text-secondary', s.text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
```

---

## 10. `components/ui/Divider.tsx`

```tsx
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
```

---

## 11. `components/ui/Card.tsx`

```tsx
import { View, Pressable } from 'react-native';
import { cn } from '@/lib/cn';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  padded?: boolean;
}

export function Card({ children, onPress, className, padded = true }: CardProps) {
  const content = (
    <View
      className={cn(
        'rounded-lg border border-border-default bg-white',
        padded && 'p-4',
        className,
      )}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.95 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}
```

---

## 12. `components/ui/Skeleton.tsx`

```tsx
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function Skeleton({ width, height = 16, rounded = 'md', className }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <Animated.View
      style={[animStyle, { width, height }]}
      className={cn('bg-bg-tertiary', roundedClass, className)}
    />
  );
}
```

---

## 13. `components/ui/ProgressBar.tsx`

```tsx
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
```

---

## 14. `components/ui/Toast.tsx`

```tsx
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
```

---

## 15. `components/ui/Modal.tsx`

```tsx
import { View, Text, Pressable, Modal as RNModal } from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ visible, onClose, title, children, className }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View
          className={cn(
            'w-full max-w-md rounded-xl bg-white p-6',
            className,
          )}
        >
          {/* Header */}
          {title && (
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-inter-semibold text-h3 text-text-primary">
                {title}
              </Text>
              <Pressable onPress={onClose} className="rounded-md p-1">
                <X size={20} color="#666666" />
              </Pressable>
            </View>
          )}
          {/* Content */}
          {children}
        </View>
      </View>
    </RNModal>
  );
}
```

---

## 16. `components/ui/Sheet.tsx`

```tsx
import { View, Text, Pressable, Modal as RNModal, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: number; // 0-1, default 0.5 (50% of screen)
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
  snapPoint = 0.5,
}: SheetProps) {
  const translateY = useSharedValue(0);
  const sheetHeight = SCREEN_HEIGHT * snapPoint;

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > sheetHeight * 0.3 || e.velocityY > 500) {
        translateY.value = withTiming(sheetHeight, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset translateY when opened
  if (visible) {
    translateY.value = withTiming(0, { duration: 300 });
  }

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="flex-1" />
      </Pressable>

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[sheetStyle, { height: sheetHeight }]}
          className="rounded-t-xl bg-white"
        >
          {/* Handle */}
          <View className="items-center py-3">
            <View className="h-1 w-9 rounded-full bg-border-default" />
          </View>

          {/* Title */}
          {title && (
            <Text className="px-4 pb-3 font-inter-semibold text-h3 text-text-primary">
              {title}
            </Text>
          )}

          {/* Content */}
          <View className="flex-1 px-4">{children}</View>
        </Animated.View>
      </GestureDetector>
    </RNModal>
  );
}
```

---

## 17. `components/ui/SearchInput.tsx`

```tsx
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  return (
    <View
      className={cn(
        'h-9 flex-row items-center rounded-md border border-border-default bg-white px-3',
        className,
      )}
    >
      <Search size={16} color="#999999" style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        className="flex-1 font-inter-regular text-body-md text-text-primary"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} className="ml-2">
          <X size={16} color="#999999" />
        </Pressable>
      )}
    </View>
  );
}
```

---

## 18. `components/ui/FilterBar.tsx` — Linear-Style

```tsx
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal as RNModal } from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { cn } from '@/lib/cn';

// ─── Types ──────────────────────────────────────────────────────

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'single' | 'multi';
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (key: string, value: string | string[] | undefined) => void;
  onClearAll: () => void;
  className?: string;
}

// ─── FilterChip ─────────────────────────────────────────────────

function FilterChip({
  config,
  activeValue,
  onPress,
}: {
  config: FilterConfig;
  activeValue?: string | string[];
  onPress: () => void;
}) {
  const isActive =
    activeValue !== undefined &&
    (Array.isArray(activeValue) ? activeValue.length > 0 : activeValue !== '');

  const displayLabel = () => {
    if (!isActive) return config.label;
    if (config.type === 'single') {
      const opt = config.options.find((o) => o.value === activeValue);
      return opt?.label || config.label;
    }
    if (Array.isArray(activeValue) && activeValue.length > 0) {
      if (activeValue.length === 1) {
        return config.options.find((o) => o.value === activeValue[0])?.label || config.label;
      }
      return `${config.label} (${activeValue.length})`;
    }
    return config.label;
  };

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mr-2 flex-row items-center rounded-md border px-2.5 py-1.5',
        isActive
          ? 'border-interactive-primary bg-interactive-primary'
          : 'border-border-default bg-white',
      )}
    >
      <Text
        className={cn(
          'font-inter-medium text-label-sm',
          isActive ? 'text-white' : 'text-text-secondary',
        )}
      >
        {displayLabel()}
      </Text>
      <ChevronDown
        size={14}
        color={isActive ? '#FFFFFF' : '#999999'}
        style={{ marginLeft: 4 }}
      />
    </Pressable>
  );
}

// ─── FilterDropdown ─────────────────────────────────────────────

function FilterDropdown({
  config,
  activeValue,
  onSelect,
  onClose,
}: {
  config: FilterConfig;
  activeValue?: string | string[];
  onSelect: (value: string | string[] | undefined) => void;
  onClose: () => void;
}) {
  const [localValue, setLocalValue] = useState<string[]>(
    Array.isArray(activeValue)
      ? activeValue
      : activeValue
        ? [activeValue]
        : [],
  );

  const handleOptionPress = (optionValue: string) => {
    if (config.type === 'single') {
      onSelect(optionValue === activeValue ? undefined : optionValue);
      onClose();
    } else {
      setLocalValue((prev) =>
        prev.includes(optionValue)
          ? prev.filter((v) => v !== optionValue)
          : [...prev, optionValue],
      );
    }
  };

  const handleApply = () => {
    onSelect(localValue.length > 0 ? localValue : undefined);
    onClose();
  };

  const handleClear = () => {
    onSelect(undefined);
    onClose();
  };

  return (
    <RNModal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <View className="max-h-[50%] rounded-t-xl bg-white pb-6">
          <View className="items-center py-3">
            <View className="h-1 w-9 rounded-full bg-border-default" />
          </View>

          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="font-inter-semibold text-h3 text-text-primary">
              {config.label}
            </Text>
            <Pressable onPress={handleClear}>
              <Text className="font-inter-medium text-label-md text-text-tertiary">
                Clear
              </Text>
            </Pressable>
          </View>

          <ScrollView className="px-2">
            {config.options.map((option) => {
              const isSelected =
                config.type === 'single'
                  ? activeValue === option.value
                  : localValue.includes(option.value);

              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleOptionPress(option.value)}
                  className={cn(
                    'mx-2 flex-row items-center justify-between rounded-md px-3 py-3',
                    isSelected && 'bg-bg-tertiary',
                  )}
                >
                  <Text
                    className={cn(
                      'font-inter-regular text-body-md',
                      isSelected ? 'font-inter-medium text-text-primary' : 'text-text-secondary',
                    )}
                  >
                    {option.label}
                  </Text>
                  {isSelected && <Check size={16} color="#0A0A0A" />}
                </Pressable>
              );
            })}
          </ScrollView>

          {config.type === 'multi' && (
            <View className="mt-3 px-4">
              <Pressable
                onPress={handleApply}
                className="h-10 items-center justify-center rounded-md bg-interactive-primary"
              >
                <Text className="font-inter-medium text-label-lg text-white">
                  Apply{localValue.length > 0 ? ` (${localValue.length})` : ''}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </RNModal>
  );
}

// ─── FilterBar (main export) ────────────────────────────────────

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className,
}: FilterBarProps) {
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  const hasActiveFilters = Object.values(activeFilters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '',
  );

  const openConfig = filters.find((f) => f.key === openFilterKey);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className={cn('flex-row', className)}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {filters.map((config) => (
          <FilterChip
            key={config.key}
            config={config}
            activeValue={activeFilters[config.key]}
            onPress={() => setOpenFilterKey(config.key)}
          />
        ))}

        {hasActiveFilters && (
          <Pressable
            onPress={onClearAll}
            className="flex-row items-center rounded-md px-2.5 py-1.5"
          >
            <X size={14} color="#999999" style={{ marginRight: 4 }} />
            <Text className="font-inter-medium text-label-sm text-text-tertiary">
              Clear all
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Active filter dropdown */}
      {openConfig && (
        <FilterDropdown
          config={openConfig}
          activeValue={activeFilters[openConfig.key]}
          onSelect={(value) => onFilterChange(openConfig.key, value)}
          onClose={() => setOpenFilterKey(null)}
        />
      )}
    </>
  );
}
```

---

## 19. `components/ui/Table.tsx` — Linear-Style Mobile Table

```tsx
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { cn } from '@/lib/cn';

// ─── Types ──────────────────────────────────────────────────────

interface Column<T> {
  key: string;
  label: string;
  width?: number;         // fixed width in px
  minWidth?: number;      // min width in px
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sticky?: boolean;       // sticky first column on horizontal scroll
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// ─── TableHeader ────────────────────────────────────────────────

function TableHeader<T>({
  columns,
  sortKey,
  sortDirection,
  onSort,
}: {
  columns: Column<T>[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}) {
  return (
    <View className="flex-row border-b border-border-subtle bg-bg-secondary">
      {columns.map((col) => {
        const isSorted = sortKey === col.key;
        const SortIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

        return (
          <Pressable
            key={col.key}
            onPress={() => col.sortable && onSort?.(col.key)}
            disabled={!col.sortable}
            className={cn(
              'flex-row items-center px-3 py-2.5',
              col.align === 'right' && 'justify-end',
              col.align === 'center' && 'justify-center',
            )}
            style={{
              width: col.width,
              minWidth: col.minWidth || 80,
              flex: col.width ? undefined : 1,
            }}
          >
            <Text className="font-inter-medium text-caption uppercase tracking-wide text-text-tertiary">
              {col.label}
            </Text>
            {col.sortable && isSorted && (
              <SortIcon size={12} color="#999999" style={{ marginLeft: 4 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── TableRow ───────────────────────────────────────────────────

function TableRowComponent<T>({
  item,
  columns,
  onPress,
}: {
  item: T;
  columns: Column<T>[];
  onPress?: (item: T) => void;
}) {
  const Row = (
    <View className="flex-row border-b border-border-subtle">
      {columns.map((col) => (
        <View
          key={col.key}
          className={cn(
            'justify-center px-3 py-3',
            col.align === 'right' && 'items-end',
            col.align === 'center' && 'items-center',
          )}
          style={{
            width: col.width,
            minWidth: col.minWidth || 80,
            flex: col.width ? undefined : 1,
          }}
        >
          {col.render ? (
            col.render(item)
          ) : (
            <Text className="font-inter-regular text-body-sm text-text-primary" numberOfLines={1}>
              {String((item as Record<string, unknown>)[col.key] ?? '')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [pressed && { backgroundColor: '#FAFAFA' }]}
      >
        {Row}
      </Pressable>
    );
  }

  return Row;
}

// ─── Table (main export) ────────────────────────────────────────

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  sortKey,
  sortDirection,
  onSort,
  loading,
  emptyMessage = 'No data found',
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <View className={cn('rounded-lg border border-border-default bg-white', className)}>
        <TableHeader columns={columns} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row border-b border-border-subtle px-3 py-3.5">
            <View className="h-4 flex-1 rounded bg-bg-tertiary" />
          </View>
        ))}
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className={cn('rounded-lg border border-border-default bg-white', className)}>
        <TableHeader columns={columns} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
        <View className="items-center py-12">
          <Text className="font-inter-regular text-body-md text-text-tertiary">
            {emptyMessage}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('rounded-lg border border-border-default bg-white', className)}
    >
      <View style={{ minWidth: '100%' }}>
        <TableHeader columns={columns} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
        {data.map((item) => (
          <TableRowComponent
            key={keyExtractor(item)}
            item={item}
            columns={columns}
            onPress={onRowPress}
          />
        ))}
      </View>
    </ScrollView>
  );
}
```

---

## 20. `components/ui/EmptyState.tsx`

```tsx
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
```

---

## 21. `components/ui/index.ts` — Barrel Export

```typescript
export { StatusDot } from './StatusDot';
export { Button } from './Button';
export { IconButton } from './IconButton';
export { Input } from './Input';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Switch } from './Switch';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { Divider } from './Divider';
export { Card } from './Card';
export { Skeleton } from './Skeleton';
export { ProgressBar } from './ProgressBar';
export { Toast } from './Toast';
export { Modal } from './Modal';
export { Sheet } from './Sheet';
export { SearchInput } from './SearchInput';
export { FilterBar } from './FilterBar';
export { Table } from './Table';
export { EmptyState } from './EmptyState';
```

---

## 22. `components/shared/RoleGate.tsx`

```tsx
import type { ReactNode } from 'react';
import { hasPermission, type Action, type Resource } from '@/lib/permissions';

interface RoleGateProps {
  /** Current user's role */
  role: string;
  /** Resource to check */
  resource: Resource;
  /** Action to check */
  action: Action;
  /** Content to render if permitted */
  children: ReactNode;
  /** Optional fallback content */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on RBAC permissions.
 *
 * Usage:
 * <RoleGate role={user.role} resource="student" action="delete">
 *   <Button onPress={handleDelete}>Delete Student</Button>
 * </RoleGate>
 */
export function RoleGate({ role, resource, action, children, fallback = null }: RoleGateProps) {
  if (hasPermission(role, resource, action)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
```

---

## 23. `components/shared/ConfirmDialog.tsx`

```tsx
import { View, Text } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} onClose={onCancel} title={title}>
      <Text className="mb-6 font-inter-regular text-body-md text-text-secondary">
        {message}
      </Text>
      <View className="flex-row justify-end gap-3">
        <Button variant="secondary" size="md" onPress={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="md"
          onPress={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </View>
    </Modal>
  );
}
```

---

## Usage Examples

### Example: Student List with Filters and Table

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { SearchInput, FilterBar, Table, Badge } from '@/components/ui';
import type { Student } from '@/lib/types';

export function StudentList({ students }: { students: Student[] }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});

  return (
    <View className="flex-1 bg-bg-primary">
      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search students..."
        className="mx-4 mb-3"
      />

      <FilterBar
        filters={[
          {
            key: 'batch',
            label: 'Batch',
            type: 'single',
            options: [
              { value: 'morning', label: 'Morning' },
              { value: 'evening', label: 'Evening' },
            ],
          },
          {
            key: 'feeStatus',
            label: 'Fee Status',
            type: 'single',
            options: [
              { value: 'paid', label: 'Paid' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'overdue', label: 'Overdue' },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(key, value) =>
          setFilters((prev) => ({ ...prev, [key]: value }))
        }
        onClearAll={() => setFilters({})}
        className="mb-3"
      />

      <Table
        columns={[
          { key: 'name', label: 'Name', minWidth: 140,
            render: (s) => (
              <Text className="font-inter-medium text-body-sm text-text-primary">
                {s.first_name} {s.last_name}
              </Text>
            ),
          },
          { key: 'student_id_code', label: 'ID', width: 60 },
          { key: 'batch', label: 'Batch', width: 80,
            render: (s) => (
              <Text className="text-body-sm text-text-secondary">
                {s.batch?.name}
              </Text>
            ),
          },
          { key: 'fee_status', label: 'Fee', width: 80, align: 'center',
            render: (s) => (
              <Badge
                variant={
                  s.fee_status === 'paid' ? 'success' :
                  s.fee_status === 'overdue' ? 'error' : 'warning'
                }
                size="sm"
              >
                {s.fee_status}
              </Badge>
            ),
          },
        ]}
        data={students}
        keyExtractor={(s) => s.id}
        onRowPress={(s) => router.push(`/(staff)/(students)/${s.id}`)}
        emptyMessage="No students found"
      />
    </View>
  );
}
```

---

## Verification Checklist

After creating all components:

```bash
# Type check — should pass with no errors
npx tsc --noEmit

# Verify imports work
# Create a test screen that imports from @/components/ui
```

Expected state after this file:
- 21 UI components in `components/ui/`
- 2 shared components (`RoleGate`, `ConfirmDialog`)
- All components accept `className` for NativeWind overrides
- All components use design tokens (no hardcoded colors)
- Table component works on mobile with horizontal scroll
- FilterBar matches Linear's chip-based pattern
- Barrel export from `components/ui/index.ts`
- Ready to build screens (File 004+)

---

*Next file (004) builds the auth screens: Login, org onboarding wizard (5 steps), and invite acceptance.*
