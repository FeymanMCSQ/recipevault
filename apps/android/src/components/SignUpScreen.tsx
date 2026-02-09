import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import OAuthButtons from './OAuthButtons';

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [emailAddress, setEmailAddress] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState('');

    const onSignUpPress = async () => {
        if (!isLoaded) return;

        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

            setPendingVerification(true);
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
        }
    };

    return (
        <View className="w-full">
            {!pendingVerification && (
                <>
                    <View className="mb-6">
                        <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase mb-2">
                            NEW ARCHIVIST REGISTRATION
                        </Text>
                        <TextInput
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="EMAIL ADDRESS"
                            placeholderTextColor="#A1A1A1"
                            onChangeText={(email) => setEmailAddress(email)}
                            className="bg-ivory border border-parchment p-4 font-sans text-sm text-charcoal mb-4"
                        />
                        <TextInput
                            value={password}
                            placeholder="CREATE SECRET KEY"
                            placeholderTextColor="#A1A1A1"
                            secureTextEntry={true}
                            onChangeText={(password) => setPassword(password)}
                            className="bg-ivory border border-parchment p-4 font-sans text-sm text-charcoal"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onSignUpPress}
                        className="bg-wine py-4 items-center shadow-sm"
                    >
                        <Text className="text-ivory font-sans font-bold tracking-[3px] text-xs uppercase">
                            REGISTER IN ARCHIVE
                        </Text>
                    </TouchableOpacity>

                    <OAuthButtons />
                </>
            )}
            {pendingVerification && (
                <>
                    <View className="mb-6 text-center">
                        <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase mb-2 text-center">
                            VERIFICATION REQUIRED
                        </Text>
                        <Text className="text-charcoal-muted font-sans text-xs italic text-center mb-4">
                            We've sent a code to your terminal.
                        </Text>
                        <TextInput
                            value={code}
                            placeholder="VERIFICATION CODE"
                            placeholderTextColor="#A1A1A1"
                            onChangeText={(code) => setCode(code)}
                            className="bg-ivory border border-parchment p-4 font-sans text-sm text-charcoal text-center"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onPressVerify}
                        className="bg-wine py-4 items-center shadow-sm"
                    >
                        <Text className="text-ivory font-sans font-bold tracking-[3px] text-xs uppercase">
                            CONFIRM IDENTITY
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}
