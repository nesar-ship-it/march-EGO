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
