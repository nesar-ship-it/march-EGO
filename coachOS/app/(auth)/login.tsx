import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Input, Divider, Toast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { APP_NAME } from '@/lib/constants';

export default function LoginScreen() {
  const { signInWithGoogle, signInAsStudent } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentError, setStudentError] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoadingGoogle(true);
      const { error } = await signInWithGoogle();
      
      // If error happens directly in the call (e.g. network error)
      if (error) {
        setToastMessage('Sign in failed. Please try again.');
        setIsLoadingGoogle(false);
        return;
      }
      // On success, the auth listener in _layout.tsx will redirect.
    } catch (err: any) {
      setToastMessage('Sign in failed. Please try again.');
      setIsLoadingGoogle(false);
    }
  };

  const handleStudentLogin = async () => {
    if (!username || !password) {
      setStudentError('Please enter username and password.');
      return;
    }
    
    try {
      setIsLoadingStudent(true);
      setStudentError(null);
      const { error } = await signInAsStudent(username, password);
      
      if (error) {
        setStudentError('Invalid username or password.');
        setIsLoadingStudent(false);
        return;
      }
      // On success, auth logic redirects
    } catch (err: any) {
      setStudentError('Invalid username or password.');
      setIsLoadingStudent(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="px-6 py-12 w-full max-w-[480px] mx-auto">
            
            {/* Logo Area */}
            <View className="items-center mb-12">
              <Text className="font-inter-bold text-[30px] text-text-primary leading-tight">
                {APP_NAME}
              </Text>
              <Text className="font-inter-regular text-body-md text-text-secondary mt-1">
                Manage your academy, effortlessly.
              </Text>
            </View>

            {/* Google Login */}
            <Button 
              variant="primary"
              size="lg"
              onPress={handleGoogleLogin}
              loading={isLoadingGoogle}
              disabled={isLoadingStudent}
              accessibilityLabel="Sign in with Google"
              className="mb-8"
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <View className="mb-8">
              <Divider label="or" />
            </View>

            {/* Student Login */}
            <View className="gap-4 mb-4">
              <Input
                label="Student Username"
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(text) => { setUsername(text); setStudentError(null); }}
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={(text) => { setPassword(text); setStudentError(null); }}
                error={studentError || undefined}
              />
            </View>

            <Button 
              variant="secondary"
              size="lg"
              onPress={handleStudentLogin}
              loading={isLoadingStudent}
              disabled={isLoadingGoogle}
              className="mb-12"
            >
              Sign In
            </Button>

            {/* Footer Link */}
            <View className="flex-row justify-center items-center mt-auto">
              <Text className="font-inter-regular text-body-sm text-text-secondary">
                Don't have an academy account?{' '}
              </Text>
              <Link href="/(auth)/onboarding/org-details" asChild>
                <Text className="font-inter-semibold text-body-sm text-text-primary">
                  Set up your academy →
                </Text>
              </Link>
            </View>

          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Toast Notification */}
      {toastMessage && (
        <View className="absolute top-12 w-full px-4">
          <Toast
            visible={true}
            variant="error"
            message={toastMessage}
            onDismiss={() => setToastMessage(null)}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
