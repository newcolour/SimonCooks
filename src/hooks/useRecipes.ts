import { useState, useEffect, useCallback } from 'react';
import type { Recipe } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseRecipesReturn {
    recipes: Recipe[];
    loading: boolean;
    error: string | null;
    createRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
    updateRecipe: (recipe: Recipe) => Promise<Recipe>;
    deleteRecipe: (id: string) => Promise<boolean>;
    deleteMultipleRecipes: (ids: string[]) => Promise<boolean>;
    searchRecipes: (query: string) => Promise<Recipe[]>;
    searchByIngredient: (ingredient: string) => Promise<Recipe[]>;
    refreshRecipes: () => Promise<void>;
    importRecipes: (recipes: Recipe[]) => Promise<void>;
}

export function useRecipes(): UseRecipesReturn {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecipes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (window.electronAPI) {
                const data = await window.electronAPI.recipe.getAll();
                setRecipes(data);
            } else {
                // Fallback for web development
                const stored = localStorage.getItem('simoncooks_recipes');
                setRecipes(stored ? JSON.parse(stored) : []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recipes');
            console.error('Error fetching recipes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const createRecipe = useCallback(async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newRecipe = {
            ...recipeData,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
        } as Recipe;

        try {
            if (window.electronAPI) {
                const created = await window.electronAPI.recipe.create(newRecipe);
                setRecipes(prev => [created, ...prev]);
                return created;
            } else {
                // Fallback for web development
                const stored = localStorage.getItem('simoncooks_recipes');
                const current = stored ? JSON.parse(stored) : [];
                const updated = [newRecipe, ...current];
                localStorage.setItem('simoncooks_recipes', JSON.stringify(updated));
                setRecipes(updated);
                return newRecipe;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create recipe');
            throw err;
        }
    }, []);

    const updateRecipe = useCallback(async (recipe: Recipe) => {
        const updatedRecipe = {
            ...recipe,
            updatedAt: new Date().toISOString(),
        };

        try {
            if (window.electronAPI) {
                const updated = await window.electronAPI.recipe.update(updatedRecipe);
                setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
                return updated;
            } else {
                // Fallback for web development
                const stored = localStorage.getItem('simoncooks_recipes');
                const current = stored ? JSON.parse(stored) : [];
                const updated = current.map((r: Recipe) => r.id === updatedRecipe.id ? updatedRecipe : r);
                localStorage.setItem('simoncooks_recipes', JSON.stringify(updated));
                setRecipes(updated);
                return updatedRecipe;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update recipe');
            throw err;
        }
    }, []);

    const deleteRecipe = useCallback(async (id: string) => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.recipe.delete(id);
                setRecipes(prev => prev.filter(r => r.id !== id));
                return true;
            } else {
                // Fallback for web development
                const stored = localStorage.getItem('simoncooks_recipes');
                const current = stored ? JSON.parse(stored) : [];
                const updated = current.filter((r: Recipe) => r.id !== id);
                localStorage.setItem('simoncooks_recipes', JSON.stringify(updated));
                setRecipes(updated);
                return true;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete recipe');
            throw err;
        }
    }, []);

    const deleteMultipleRecipes = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return true;

        try {
            if (window.electronAPI) {
                // Delete each recipe using the Electron API
                for (const id of ids) {
                    await window.electronAPI.recipe.delete(id);
                }
                setRecipes(prev => prev.filter(r => !ids.includes(r.id)));
                return true;
            } else {
                // Fallback for web development - bulk delete in localStorage
                const stored = localStorage.getItem('simoncooks_recipes');
                const current = stored ? JSON.parse(stored) : [];
                const updated = current.filter((r: Recipe) => !ids.includes(r.id));
                localStorage.setItem('simoncooks_recipes', JSON.stringify(updated));
                setRecipes(updated);
                return true;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete recipes');
            throw err;
        }
    }, []);

    const searchRecipes = useCallback(async (query: string) => {
        if (!query.trim()) {
            await fetchRecipes();
            return recipes;
        }

        try {
            if (window.electronAPI) {
                const results = await window.electronAPI.recipe.search(query);
                return results;
            } else {
                // Fallback for web development
                const lowerQuery = query.toLowerCase();
                return recipes.filter(r =>
                    r.title.toLowerCase().includes(lowerQuery) ||
                    r.ingredients.some(i => i.name.toLowerCase().includes(lowerQuery)) ||
                    r.categories.some(c => c.toLowerCase().includes(lowerQuery))
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
            throw err;
        }
    }, [recipes, fetchRecipes]);

    const searchByIngredient = useCallback(async (ingredient: string) => {
        try {
            if (window.electronAPI) {
                return await window.electronAPI.recipe.searchByIngredient(ingredient);
            } else {
                // Fallback for web development
                const lowerIngredient = ingredient.toLowerCase();
                return recipes.filter(r =>
                    r.ingredients.some(i => i.name.toLowerCase().includes(lowerIngredient))
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
            throw err;
        }
    }, [recipes]);

    const importRecipes = useCallback(async (newRecipes: Recipe[]) => {
        try {
            if (window.electronAPI) {
                // For Electron, we ideally use the IPC bulk import, but if we have the data already:
                // We can iterate and create. However, Electron's `recipe:import` handles file reading itself.
                // This function might be used if we read file in frontend.
                // Let's assume for now this is primarily for Web fallback or if we chose to read file in frontend.
                // But specifically for the Web Fallback case:
                console.warn("importRecipes called in Electron mode - consider using IPC");
            } else {
                // Fallback for web/android
                const stored = localStorage.getItem('simoncooks_recipes');
                const current = stored ? JSON.parse(stored) : [];

                // Merge strategies: using ID as key
                const currentIds = new Set(current.map((r: Recipe) => r.id));
                const toAdd = newRecipes.filter(r => !currentIds.has(r.id));
                const toUpdate = newRecipes.filter(r => currentIds.has(r.id));

                let updated = [...current];
                // Updates
                if (toUpdate.length > 0) {
                    updated = updated.map(r => {
                        const newer = toUpdate.find(u => u.id === r.id);
                        return newer || r;
                    });
                }
                // Adds
                updated = [...toAdd, ...updated];

                localStorage.setItem('simoncooks_recipes', JSON.stringify(updated));
                setRecipes(updated);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import recipes');
            throw err;
        }
    }, []);

    return {
        recipes,
        loading,
        error,
        createRecipe,
        updateRecipe,
        deleteRecipe,
        deleteMultipleRecipes,
        searchRecipes,
        searchByIngredient,
        refreshRecipes: fetchRecipes,
        importRecipes
    };
}

