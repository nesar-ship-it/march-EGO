import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, MessageSquare, Settings, FileText, CreditCard, Smartphone, Building2 } from 'lucide-react-native';
import { Button } from '@/components/ui';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { storage, STORAGE_KEYS } from '@/lib/storage';

const items = [
  { label: 'Communication', href: '/(staff)/(communicate)' as const, icon: MessageSquare },
  { label: 'Branches', href: '/(staff)/(settings)/branches' as const, icon: Settings },
  { label: 'Staff & invites', href: '/(staff)/(settings)/staff' as const, icon: Settings },
  { label: 'Batches', href: '/(staff)/(settings)/batches' as const, icon: Settings },
  { label: 'Age groups', href: '/(staff)/(settings)/age-groups' as const, icon: Settings },
  { label: 'Audit logs', href: '/(staff)/(settings)/audit-logs' as const, icon: FileText },
  { label: 'Payments config', href: '/(staff)/(settings)/payments-config' as const, icon: CreditCard },
  { label: 'WhatsApp config', href: '/(staff)/(settings)/whatsapp-config' as const, icon: Smartphone },
];

export default function SettingsIndexScreen() {
  const { signOut, user } = useAuth();
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);

  const handleSwitchAcademy = () => {
    storage.delete(STORAGE_KEYS.SELECTED_ORG_ID);
    setSwitchConfirmOpen(false);
    router.replace('/');
  };

  return (
    <ScrollView className="flex-1 bg-bg-secondary">
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          More
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          Communication, settings & audit
        </Text>
      </View>
      <View className="mt-2 bg-white">
        {items.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.href)}
            className="flex-row items-center justify-between border-b border-border-subtle px-4 py-3"
            style={({ pressed }) => [pressed && { backgroundColor: '#FAFAFA' }]}
          >
            <View className="flex-row items-center gap-3">
              <item.icon size={20} color="#666666" />
              <Text className="font-inter-regular text-body-md text-text-primary">
                {item.label}
              </Text>
            </View>
            <ChevronRight size={18} color="#999999" />
          </Pressable>
        ))}
      </View>
      <View className="mt-6 px-4 gap-2">
        <Pressable
          onPress={() => setSwitchConfirmOpen(true)}
          className="flex-row items-center justify-between rounded-lg border border-border-subtle bg-white px-4 py-3"
        >
          <View className="flex-row items-center gap-3">
            <Building2 size={20} color="#666666" />
            <Text className="font-inter-regular text-body-md text-text-primary">
              Switch Academy
            </Text>
          </View>
          <ChevronRight size={18} color="#999999" />
        </Pressable>
        <Button
          variant="secondary"
          size="lg"
          onPress={() => setSignOutConfirmOpen(true)}
        >
          Sign out
        </Button>
      </View>

      <ConfirmDialog
        visible={signOutConfirmOpen}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        variant="danger"
        onConfirm={async () => {
          await signOut();
          setSignOutConfirmOpen(false);
          router.replace('/(auth)/login');
        }}
        onCancel={() => setSignOutConfirmOpen(false)}
      />

      <ConfirmDialog
        visible={switchConfirmOpen}
        title="Switch Academy"
        message="You will be taken to the academy selector. Continue?"
        confirmLabel="Switch"
        onConfirm={handleSwitchAcademy}
        onCancel={() => setSwitchConfirmOpen(false)}
      />
    </ScrollView>
  );
}
