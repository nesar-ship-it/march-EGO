import { View, Pressable } from 'react-native';
import { cn } from '@/lib/cn';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  padded?: boolean | string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, onPress, className, padded = true, padding }: CardProps) {
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
