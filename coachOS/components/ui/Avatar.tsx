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
