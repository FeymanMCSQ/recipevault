import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RecipeSummary } from '../lib/api';

interface RecipeCardProps {
  recipe: RecipeSummary;
  onPress: (id: string) => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <TouchableOpacity 
      onPress={() => onPress(recipe.id)}
      activeOpacity={0.7}
      className="bg-ivory border border-parchment p-5 mb-4 shadow-sm"
      style={{ borderTopWidth: 3, borderTopColor: '#6C2E2E' }}
    >
      <View className="mb-3">
        <Text className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase mb-1">
          {recipe.sourceTitle || 'ARCHIVE RECORD'}
        </Text>
        <Text className="text-xl font-serif font-bold text-charcoal leading-6">
          {recipe.title}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {recipe.tags.slice(0, 3).map((tag) => (
          <Text 
            key={tag} 
            className="text-[10px] font-sans text-wine italic border-b border-wine/20"
          >
            #{tag}
          </Text>
        ))}
        {recipe.tags.length > 3 && (
          <Text className="text-[10px] font-sans text-charcoal-muted opacity-50 italic">
            +{recipe.tags.length - 3} more
          </Text>
        )}
      </View>

      <Text className="text-[9px] font-sans text-charcoal-muted mt-4 text-right opacity-40 italic">
        REC. ID: {recipe.id.slice(0, 8).toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}
