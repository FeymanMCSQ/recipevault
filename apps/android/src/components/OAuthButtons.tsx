import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Text, TouchableOpacity, View } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
    React.useEffect(() => {
        // Warm up the android browser to improve UX
        // https://docs.expo.dev/guides/authentication/#improving-user-experience
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

export default function OAuthButtons() {
    useWarmUpBrowser();

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    const onPress = React.useCallback(async () => {
        try {
            const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/dashboard', { scheme: 'recipevault' }),
            });

            if (createdSessionId) {
                setActive!({ session: createdSessionId });
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err) {
            console.error('OAuth error', err);
        }
    }, [startOAuthFlow]);

    return (
        <View className="w-full mt-4">
            <View className="flex-row items-center mb-4">
                <View className="flex-1 h-[1px] bg-parchment" />
                <Text className="mx-4 text-[10px] font-sans font-bold text-charcoal-muted uppercase tracking-[1px]">
                    OR
                </Text>
                <View className="flex-1 h-[1px] bg-parchment" />
            </View>

            <TouchableOpacity
                onPress={onPress}
                className="bg-ivory border border-charcoal py-4 items-center flex-row justify-center shadow-sm"
            >
                <View className="mr-3 w-4 h-4 rounded-full bg-charcoal items-center justify-center">
                    <Text className="text-ivory text-[10px] font-bold">G</Text>
                </View>
                <Text className="text-charcoal font-sans font-bold tracking-[2px] text-xs uppercase">
                    CONTINUE WITH GOOGLE
                </Text>
            </TouchableOpacity>
        </View>
    );
}
