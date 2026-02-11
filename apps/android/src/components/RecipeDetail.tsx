import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    Alert
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { getRecipe, Recipe, deleteRecipe } from '../lib/api';
import { ArrowLeft, Clock, Globe, Hash, Trash2, ChefHat } from 'lucide-react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

interface RecipeDetailProps {
    recipeId: string;
    onBack: () => void;
}

export default function RecipeDetail({ recipeId, onBack }: RecipeDetailProps) {
    const { getToken } = useAuth();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [cookMode, setCookMode] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await getRecipe(token, recipeId);
            if (response.ok) {
                const data = await response.json();
                setRecipe(data);
            } else {
                console.error('Failed to fetch recipe detail');
            }
        } catch (error) {
            console.error('Error fetching recipe detail:', error);
        } finally {
            setLoading(false);
        }
    }, [getToken, recipeId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    useEffect(() => {
        if (cookMode) {
            activateKeepAwakeAsync();
        } else {
            deactivateKeepAwake();
        }
        return () => {
            deactivateKeepAwake();
        };
    }, [cookMode]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const token = await getToken();
            const response = await deleteRecipe(token, recipeId);
            if (response.ok) {
                onBack(); // Successfully deleted, go back
            } else {
                Alert.alert('Archive Error', 'Failed to purge record from the archive.');
                setDeleting(false);
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            Alert.alert('System Error', 'Could not connect to the archive.');
            setDeleting(false);
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            'Purge Record?',
            'This recipe will be permanently removed from the Culinary Archive. This action cannot be undone.',
            [
                { text: 'Keep Record', style: 'cancel' },
                { text: 'Purge', onPress: handleDelete, style: 'destructive' }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-ivory">
                <ActivityIndicator color="#6C2E2E" />
                <Text className="mt-4 text-charcoal-muted font-sans text-xs uppercase tracking-widest">
                    Transcribing Record...
                </Text>
            </View>
        );
    }

    if (!recipe) return null;

    return (
        <SafeAreaView className="flex-1 bg-ivory">
            {/* Header */}
            <View className="px-6 py-4 border-b border-parchment flex-row items-center">
                <TouchableOpacity onPress={onBack} className="mr-4 p-2">
                    <ArrowLeft size={24} color="#6C2E2E" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase">
                        ARCHIVE RECORD
                    </Text>
                    <Text className="text-xl font-serif font-bold text-charcoal" numberOfLines={1}>
                        {recipe.title}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setCookMode(!cookMode)}
                    className={`mr-2 p-2 rounded-full ${cookMode ? 'bg-wine/10' : ''}`}
                >
                    <ChefHat size={20} color={cookMode ? "#6C2E2E" : "#6C2E2E"} opacity={cookMode ? 1 : 0.4} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={confirmDelete}
                    disabled={deleting}
                    className="p-2"
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color="#6C2E2E" />
                    ) : (
                        <Trash2 size={20} color="#6C2E2E" opacity={0.6} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
                {/* Metadata Section */}
                <View className="mb-8 p-4 bg-parchment/10 border border-parchment">
                    {recipe.sourceTitle && (
                        <View className="flex-row items-center mb-3">
                            <Globe size={14} color="#6C2E2E" opacity={0.6} />
                            <Text className="ml-2 text-xs font-sans text-charcoal-muted italic">
                                {recipe.sourceTitle}
                            </Text>
                        </View>
                    )}
                    <View className="flex-row items-center mb-3">
                        <Clock size={14} color="#6C2E2E" opacity={0.6} />
                        <Text className="ml-2 text-xs font-sans text-charcoal-muted">
                            Archived on {new Date(recipe.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        {recipe.tags.map((tag) => (
                            <View key={tag} className="flex-row items-center bg-wine/5 px-2 py-1 rounded">
                                <Hash size={10} color="#6C2E2E" />
                                <Text className="ml-1 text-[10px] font-sans text-wine font-bold uppercase">{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Ingredients */}
                <View className="mb-10">
                    <Text className="text-sm font-serif font-bold text-wine mb-4 border-b border-wine/20 pb-2">
                        Ingredients
                    </Text>
                    {recipe.ingredients.map((group, idx) => (
                        <View key={idx} className="mb-4">
                            {group.component && (
                                <Text className="text-[10px] font-sans font-bold text-charcoal-muted uppercase mb-2">
                                    {group.component}
                                </Text>
                            )}
                            {group.items.map((item, i) => (
                                <View key={i} className="flex-row mb-2">
                                    <Text className="text-wine mr-2">•</Text>
                                    <Text className="flex-1 text-sm font-sans text-charcoal leading-5">{item}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Instructions */}
                <View className="mb-10">
                    <Text className="text-sm font-serif font-bold text-wine mb-4 border-b border-wine/20 pb-2">
                        Method
                    </Text>
                    {recipe.instructions.map((step, idx) => (
                        <View key={idx} className="flex-row mb-6">
                            <View className="w-6 h-6 rounded-full bg-parchment items-center justify-center mr-3 mt-1">
                                <Text className="text-[10px] font-bold text-wine">{idx + 1}</Text>
                            </View>
                            <Text className="flex-1 text-sm font-sans text-charcoal leading-6">
                                {step}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Variations & Suggestions */}
                {recipe.suggestions && recipe.suggestions.length > 0 && (
                    <View className="mb-10">
                        <Text className="text-sm font-serif font-bold text-wine mb-4 border-b border-wine/20 pb-2">
                            Variations & Creative Ideas
                        </Text>
                        {recipe.suggestions.map((suggestion, idx) => (
                            <View key={idx} className="flex-row mb-3 bg-parchment/5 p-3 border-l-2 border-wine/20">
                                <Text className="flex-1 text-xs font-sans text-charcoal italic leading-5">
                                    {suggestion}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Archivist Notes */}
                {recipe.notes && (
                    <View className="mb-10 p-6 bg-ivory border-2 border-dashed border-parchment rounded-xl">
                        <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase mb-3">
                            ARCHIVIST OBSERVATIONS
                        </Text>
                        <Text className="text-sm font-sans text-charcoal italic leading-6">
                            "{recipe.notes}"
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
