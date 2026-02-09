import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { ClerkProvider, ClerkLoaded, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { tokenCache } from './src/lib/cache';
import SignInScreen from './src/components/SignInScreen';
import SignUpScreen from './src/components/SignUpScreen';
import RecipeDashboard from './src/components/RecipeDashboard';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}
export default function App() {
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SignedIn>
          <RecipeDashboard />
        </SignedIn>

        <SignedOut>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-ivory">
            <View className="flex-1 items-center justify-center p-8">
              <View className="items-center w-full">
                <Text className="text-wine font-serif text-4xl mb-2 tracking-tighter">
                  RecipeVault
                </Text>
                <Text className="text-[10px] font-sans font-bold tracking-[4px] text-charcoal-muted uppercase mb-8">
                  DIGITAL CULINARY ARCHIVE
                </Text>

                {authMode === 'signin' ? (
                  <SignInScreen />
                ) : (
                  <SignUpScreen />
                )}

                <TouchableOpacity
                  onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="mt-8 border-b border-charcoal-muted"
                >
                  <Text className="text-charcoal-muted font-sans text-[10px] uppercase font-bold tracking-[1px]">
                    {authMode === 'signin' ? 'Switch to Registration' : 'Return to Access Gate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SignedOut>

        <StatusBar style="dark" />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
