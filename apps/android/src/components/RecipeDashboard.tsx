import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { fetchWithAuth, RecipeSummary, ListRecipesResponse } from '../lib/api';
import { RecipeCard } from './RecipeCard';
import { LogOut, Plus } from 'lucide-react-native';
import CreateRecipeModal from './CreateRecipeModal';

interface RecipeDashboardProps {
    onSelectRecipe: (id: string) => void;
}

export default function RecipeDashboard({ onSelectRecipe }: RecipeDashboardProps) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const fetchRecipes = useCallback(async () => {
        try {
            const token = await getToken();
            const response = await fetchWithAuth('/api/recipes', token);

            if (response.ok) {
                const data: ListRecipesResponse = await response.json();
                setRecipes(data.items);
            } else {
                console.error('Failed to fetch recipes:', response.status);
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRecipes();
    }, [fetchRecipes]);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-ivory">
                <ActivityIndicator color="#6C2E2E" />
                <Text className="mt-4 text-charcoal-muted font-sans text-xs uppercase tracking-widest">
                    Querying Archive...
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-ivory">
            {/* Header */}
            <View className="px-6 pt-12 pb-6 border-b border-parchment bg-ivory">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text- wine font-serif text-2xl tracking-tighter">
                        RecipeVault
                    </Text>
                    <TouchableOpacity onPress={() => signOut()} className="p-2">
                        <LogOut size={18} color="#6C2E2E" opacity={0.6} />
                    </TouchableOpacity>
                </View>
                <Text className="text-[10px] font-sans font-bold tracking-[3px] text-charcoal-muted uppercase">
                    CULINARY ARCHIVE | {user?.firstName?.toUpperCase() || 'ARCHIVIST'}
                </Text>
            </View>

            <FlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <RecipeCard
                        recipe={item}
                        onPress={onSelectRecipe}
                    />
                )}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C2E2E" />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20 px-10">
                        <Text className="text-charcoal font-serif text-lg text-center mb-2">
                            The Archive is Empty
                        </Text>
                        <Text className="text-charcoal-muted font-sans text-xs text-center italic leading-5">
                            Begin your collection by capturing recipes from the web extension or using the button below.
                        </Text>
                    </View>
                }
            />

            <CreateRecipeModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSuccess={fetchRecipes}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                className="absolute bottom-10 right-8 w-14 h-14 bg-wine rounded-full items-center justify-center shadow-lg"
                onPress={() => setIsModalVisible(true)}
            >
                <Plus size={28} color="#FFF9F0" />
            </TouchableOpacity>
        </View>
    );
}
