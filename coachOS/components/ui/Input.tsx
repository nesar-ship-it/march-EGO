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
