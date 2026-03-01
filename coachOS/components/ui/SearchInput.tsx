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
