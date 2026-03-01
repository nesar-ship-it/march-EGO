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
