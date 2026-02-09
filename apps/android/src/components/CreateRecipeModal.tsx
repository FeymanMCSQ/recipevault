import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { X } from 'lucide-react-native';
import { createRecipe, CreateRecipeInput, BASE_URL } from '../lib/api';
import { useAuth } from '@clerk/clerk-expo';

interface CreateRecipeModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateRecipeModal({ visible, onClose, onSuccess }: CreateRecipeModalProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState('');
    const [capturedText, setCapturedText] = useState('');

    const [error, setError] = useState<string | null>(null);

    const formatUrl = (url: string) => {
        let formatted = url.trim();
        if (formatted && !/^https?:\/\//i.test(formatted)) {
            formatted = `https://${formatted}`;
        }
        return formatted;
    };

    const handleSubmit = async () => {
        if (!title) return;

        setError(null);
        setLoading(true);
        try {
            const token = await getToken();

            // If sourceUrl is empty, use BASE_URL as a fallback to satisfy schema
            const rawUrl = sourceUrl.trim() || BASE_URL || 'https://recipevault.archive';
            const formattedUrl = formatUrl(rawUrl);

            // Simple regex for URL validation
            const urlPattern = /^https?:\/\/.+\..+/;
            if (!urlPattern.test(formattedUrl)) {
                setError('Please enter a valid recipe URL or leave it empty.');
                setLoading(false);
                return;
            }

            const input: CreateRecipeInput = {
                title,
                sourceUrl: formattedUrl,
                notes,
                capturedText: capturedText.trim() || title,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                sourceTitle: sourceUrl.trim() ? undefined : 'MANUAL ENTRY',
            };

            const response = await createRecipe(token, input);
            if (response.ok) {
                setTitle('');
                setSourceUrl('');
                setNotes('');
                setTags('');
                setCapturedText('');
                onSuccess();
                onClose();
            } else {
                const errData = await response.json();
                if (errData.error?.code === 'VALIDATION_FAILED') {
                    setError('The archive rejected the entry. Please check your inputs.');
                } else {
                    setError('Archive connection failed. Please try again.');
                }
                console.error('Failed to create recipe:', errData);
            }
        } catch (err) {
            setError('A system error occurred. Please contact the administrator.');
            console.error('Error creating recipe:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-charcoal/40">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="bg-ivory rounded-t-[32px] overflow-hidden"
                    style={{ height: '85%' }}
                >
                    {/* Header */}
                    <View className="px-6 py-6 border-b border-parchment flex-row justify-between items-center">
                        <View>
                            <Text className="text-xl font-serif font-bold text-wine">New Entry</Text>
                            <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase">
                                APPEND TO ARCHIVE
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <X size={24} color="#333333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="px-6 py-4">
                        {error && (
                            <View className="mb-6 p-4 bg-wine/10 border-l-4 border-wine">
                                <Text className="text-wine font-sans text-xs font-bold leading-5">
                                    {error}
                                </Text>
                            </View>
                        )}

                        <View className="mb-6">
                            <Text className="text-[10px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase mb-2">
                                MAIN TEXT / RECIPE CONTENT
                            </Text>
                            <View className="bg-wine/5 border border-dashed border-wine/30 p-4 rounded-lg">
                                <TextInput
                                    value={capturedText}
                                    onChangeText={setCapturedText}
                                    multiline
                                    numberOfLines={6}
                                    placeholder="Paste ingredients, instructions, or full article text here..."
                                    placeholderTextColor="#A1A1A1"
                                    className="font-sans text-sm text-charcoal min-h-[120px]"
                                    textAlignVertical="top"
                                />
                                <Text className="text-[9px] font-sans text-charcoal-muted italic mt-2">
                                    AI will extract ingredients and method from this text.
                                </Text>
                            </View>
                        </View>

                        <View className="mb-6">
                            <Text className="text-[10px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase mb-2">
                                TITLE *
                            </Text>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="The Perfect Archive Entry..."
                                placeholderTextColor="#A1A1A1"
                                className="bg-parchment/10 border border-parchment p-4 font-sans text-sm text-charcoal"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-[10px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase mb-2">
                                SOURCE URL (OPTIONAL)
                            </Text>
                            <TextInput
                                value={sourceUrl}
                                onChangeText={setSourceUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                                placeholder="https://original-source.com/recipe"
                                placeholderTextColor="#A1A1A1"
                                className="bg-parchment/10 border border-parchment p-4 font-sans text-sm text-charcoal"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-[10px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase mb-2">
                                TAGS (COMMA SEPARATED)
                            </Text>
                            <TextInput
                                value={tags}
                                onChangeText={setTags}
                                placeholder="dessert, vegan, quick"
                                placeholderTextColor="#A1A1A1"
                                className="bg-parchment/10 border border-parchment p-4 font-sans text-sm text-charcoal"
                            />
                        </View>

                        <View className="mb-10">
                            <Text className="text-[10px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase mb-2">
                                ARCHIVIST NOTES
                            </Text>
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                placeholder="Observations, substitutions, or adjustments..."
                                placeholderTextColor="#A1A1A1"
                                className="bg-parchment/10 border border-parchment p-4 font-sans text-sm text-charcoal min-h-[100px]"
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    {/* Action Footer */}
                    <View className="p-6 bg-ivory border-t border-parchment">
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading || !title}
                            className={`py-4 items-center shadow-sm ${loading || !title ? 'bg-charcoal-muted/30' : 'bg-wine'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF9F0" />
                            ) : (
                                <Text className="text-ivory font-sans font-bold tracking-[3px] text-xs uppercase">
                                    COMMIT TO ARCHIVE
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
