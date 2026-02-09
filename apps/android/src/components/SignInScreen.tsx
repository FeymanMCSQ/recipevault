import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import OAuthButtons from './OAuthButtons';

export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();

    const [emailAddress, setEmailAddress] = React.useState('');
    const [password, setPassword] = React.useState('');

    const onSignInPress = React.useCallback(async () => {
        if (!isLoaded) return;

        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId });
            } else {
                // Handle additional factors like MFA
                console.error(JSON.stringify(signInAttempt, null, 2));
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
        }
    }, [isLoaded, emailAddress, password]);

    return (
        <View className="w-full">
            <View className="mb-6">
                <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase mb-2">
                    IDENTITY VERIFICATION
                </Text>
                <TextInput
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="EMAIL@ARCHIVE.COM"
                    placeholderTextColor="#A1A1A1"
                    onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                    className="bg-ivory border border-parchment p-4 font-sans text-sm text-charcoal mb-4"
                />
                <TextInput
                    value={password}
                    placeholder="SECRET KEY"
                    placeholderTextColor="#A1A1A1"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                    className="bg-ivory border border-parchment p-4 font-sans text-sm text-charcoal"
                />
            </View>

            <TouchableOpacity
                onPress={onSignInPress}
                className="bg-wine py-4 items-center shadow-sm"
            >
                <Text className="text-ivory font-sans font-bold tracking-[3px] text-xs uppercase">
                    ACCESS ARCHIVE
                </Text>
            </TouchableOpacity>

            <OAuthButtons />

            <View className="mt-6 flex-row justify-center">
                <Text className="text-charcoal-muted font-sans text-xs italic">
                    New Archivist?
                </Text>
                <TouchableOpacity>
                    <Text className="text-wine font-sans text-xs font-bold ml-1">
                        REQUEST ENTRY
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
