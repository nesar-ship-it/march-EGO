import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { Button, Card, Badge, Modal, Input, Select, Toast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { createInvite } from '@/services/invites';

export default function StaffSettingsScreen() {
  const orgId = useAuthStore(s => s.user?.orgId);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('coach');
  const [branches, setBranches] = useState<any[]>([]);
  const [inviteBranchId, setInviteBranchId] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  const loadData = async () => {
    setLoading(true);
    const [
      { data: staffData },
      { data: branchesData }
    ] = await Promise.all([
      supabase.from('staff_profiles').select('*, auth_users(email)').eq('org_id', orgId!).order('created_at', { ascending: false }),
      supabase.from('branches').select('*').eq('org_id', orgId!)
    ]);

    setStaff(staffData || []);
    setBranches(branchesData || []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);

    const { invite, error } = await createInvite({
      org_id: orgId!,
      role: inviteRole as any,
      branch_id: inviteBranchId || '',
      created_by: 'system' // or pass auth_user_id
    });

    setIsInviting(false);

    if (error || !invite) {
      setToastMessage(error || 'Failed to create invite');
      return;
    }

    const inviteUrl = window.location.origin + `/invite/${invite.token}`;
    Clipboard.setStringAsync(inviteUrl);
    setToastMessage('Invite link generated and copied to clipboard.');
    setModalOpen(false);
    setInviteEmail('');
  };

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="flex-row items-center border-b border-border-default bg-white px-4 pb-4 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text className="font-inter-semibold text-h2 text-text-primary flex-1">
          Staff & Invites
        </Text>
        <Button variant="primary" size="sm" onPress={() => setModalOpen(true)} icon={Plus}>
          Invite
        </Button>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A0A0A" />
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Card className="p-4 mb-4 bg-white">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-inter-semibold text-body-md text-text-primary">
                  {item.auth_users?.email || 'Unknown User'}
                </Text>
                <Badge variant={item.role === 'org_admin' ? 'info' : 'default'}>
                  {item.role?.replace(/_/g, ' ') || 'Unknown'}
                </Badge>
              </View>
              <Text className="font-inter-regular text-caption text-text-secondary">
                Status: {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </Card>
          )}
          ListEmptyComponent={
            <Text className="font-inter-regular text-body-md text-text-secondary text-center mt-8">
              No staff members found.
            </Text>
          }
        />
      )}

      <Modal visible={modalOpen} onClose={() => setModalOpen(false)} title="Invite Staff">
        <View className="gap-4">
          <Input 
            label="Email Address" 
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChangeText={setInviteEmail}
          />
          <View>
            <Text className="font-inter-medium text-caption text-text-secondary mb-1">Role</Text>
            <Select 
              value={inviteRole} 
              onValueChange={setInviteRole}
              options={[
                { label: 'Coach', value: 'coach' },
                { label: 'Admin', value: 'org_admin' },
                { label: 'Branch Manager', value: 'branch_manager' },
              ]}
            />
          </View>
          
          {(inviteRole === 'branch_manager' || inviteRole === 'coach') && branches.length > 0 && (
            <View>
              <Text className="font-inter-medium text-caption text-text-secondary mb-1">Assigned Branch (Optional)</Text>
              <Select 
                value={inviteBranchId} 
                onValueChange={setInviteBranchId}
                options={[
                  { label: 'All Branches', value: '' },
                  ...branches.map(b => ({ label: b.name, value: b.id }))
                ]}
              />
            </View>
          )}

          <Button 
            variant="primary" 
            size="lg" 
            fullWidth 
            className="mt-4"
            onPress={handleInvite}
            loading={isInviting}
            disabled={!inviteEmail}
          >
            Generate Link
          </Button>
        </View>
      </Modal>

      {toastMessage && (
        <View className="absolute top-12 w-full px-4 z-50">
          <Toast
            visible={true}
            variant="success"
            message={toastMessage}
            onDismiss={() => setToastMessage(null)}
          />
        </View>
      )}
    </View>
  );
}
