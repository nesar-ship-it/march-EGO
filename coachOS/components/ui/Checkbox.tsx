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
