import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { ClerkProvider, ClerkLoaded, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { tokenCache } from './src/lib/cache';

console.log('--- MOBILE DEBUG START ---');
console.log('React version:', React.version);
// @ts-ignore
console.log('Dispatcher Check:', !!(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher));
console.log('--- MOBILE DEBUG END ---');

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <View className="flex-1 bg-ivory items-center justify-center p-6">
          <SignedIn>
            <Text className="text-charcoal font-serif text-2xl mb-4">
              Welcome to RecipeVault
            </Text>
            <Text className="text-charcoal-muted font-sans text-center italic">
              The Archive is at your fingertips.
            </Text>
          </SignedIn>
          <SignedOut>
            <Text className="text-charcoal font-serif text-2xl mb-4">
              RecipeVault
            </Text>
            <Text className="text-charcoal-muted font-sans text-center mb-8">
              Sign in to access your culinary archive.
            </Text>
            {/* TODO: Add Sign In Component */}
            <View className="bg-wine px-8 py-3 rounded-sm">
              <Text className="text-ivory font-bold tracking-widest uppercase text-xs">
                Enter the Archive
              </Text>
            </View>
          </SignedOut>
          <StatusBar style="auto" />
        </View>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
