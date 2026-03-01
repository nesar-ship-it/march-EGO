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
