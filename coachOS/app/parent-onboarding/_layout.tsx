import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ParentOnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }} className="bg-white">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="[token]" />
      </Stack>
    </View>
  );
}
