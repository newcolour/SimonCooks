import { useState, useEffect } from 'react';
import type { Recipe, AISettings } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { suggestRecipe, generateRecipeImage, suggestRecipeFromIngredients } from '../services/aiService';
import {
    Sparkles,
    Wand2,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle,
    Loader,
    ChefHat,
    Clock,
    Users,
    Plus,
    X,
    Utensils,
    Flame,
    Coffee
} from 'lucide-react';
import './AISuggestions.css';

interface AISuggestionsProps {
    aiSettings: AISettings;
    existingRecipes: Recipe[];
    onSaveRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
    onConfigureAI: () => void;
    language: Language;
    initialIngredients?: string[];
}

interface SuggestedRecipe {
    title: string;
    description: string;
    ingredients: { name: string; amount: string; unit: string }[];
    instructions: string;
    cookingTime?: number;
    servings?: number;
    allergens: string[];
    categories: string[];
    imageUrl?: string;
    aiReason?: string;
    // Drink specific
    type?: 'food' | 'drink';
    glassware?: string;
    ice?: string;
    tools?: string[];
    isAlcoholic?: boolean;
    nutrition?: {
        calories: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        fiber?: number;
        sugar?: number;
    };
}

export function AISuggestions({
    aiSettings,
    existingRecipes,
    onSaveRecipe,
    onConfigureAI,
    language,
    initialIngredients = []
}: AISuggestionsProps) {
    const [loading, setLoading] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [suggestion, setSuggestion] = useState<SuggestedRecipe | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [mode, setMode] = useState<'inspiration' | 'chef'>(initialIngredients.length > 0 ? 'chef' : 'inspiration');
    const [includedIngredients, setIncludedIngredients] = useState<string[]>(initialIngredients);
    const [ingredientInput, setIngredientInput] = useState('');
    const [flavorProfile, setFlavorProfile] = useState('');
    const [recipeType, setRecipeType] = useState<'food' | 'drink'>('food');
    const [dishType, setDishType] = useState<string>('any');
    const t = getTranslation(language);

    // Update ingredients if initialIngredients change (e.g., from fridge)
    useEffect(() => {
        if (initialIngredients.length > 0) {
            setIncludedIngredients(initialIngredients);
            setMode('chef');
        }
    }, [initialIngredients]);

    const needsApiKey = aiSettings.provider !== 'ollama' && !aiSettings.apiKey;

    const handleSuggest = async () => {
        if (needsApiKey) {
            onConfigureAI();
            return;
        }

        if (mode === 'chef' && includedIngredients.length === 0) {
            setError(t.ai.mustAddIngredients);
            return;
        }

        setLoading(true);
        setError(null);
        setSuggestion(null);
        setSaved(false);

        try {
            let result: SuggestedRecipe;
            if (mode === 'chef') {
                result = await suggestRecipeFromIngredients(aiSettings, includedIngredients, language, dishType, flavorProfile, recipeType);
            } else {
                result = await suggestRecipe(aiSettings, existingRecipes, language, includedIngredients, dishType, flavorProfile, recipeType);
            }
            setSuggestion(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate suggestion');
        } finally {
            setLoading(false);
        }
    };

    const handleAddIngredient = () => {
        if (ingredientInput.trim()) {
            setIncludedIngredients([...includedIngredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const handleRemoveIngredient = (index: number) => {
        setIncludedIngredients(includedIngredients.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddIngredient();
        }
    };

    const handleGenerateImage = async () => {
        if (!suggestion) return;

        setGeneratingImage(true);
        setError(null);

        try {
            const tempRecipe = {
                ...suggestion,
                id: 'temp',
                aiGenerated: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Recipe;

            const imageUrl = await generateRecipeImage(aiSettings, tempRecipe);
            // Use functional update to ensure we're working with the latest state
            setSuggestion(prev => prev ? { ...prev, imageUrl } : prev);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.common.error);
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleSave = async () => {
        if (!suggestion) return;

        try {
            await onSaveRecipe({
                title: suggestion.title,
                description: suggestion.description,
                ingredients: suggestion.ingredients,
                instructions: suggestion.instructions,
                cookingTime: suggestion.cookingTime,
                servings: suggestion.servings,
                allergens: suggestion.allergens,
                categories: suggestion.categories,
                imageUrl: suggestion.imageUrl,
                nutrition: suggestion.nutrition,
                aiGenerated: true,
                aiReason: suggestion.aiReason,
                // Drink fields
                type: (suggestion.type || 'food') as any, // Cast to avoid literal type issue
                glassware: suggestion.glassware,
                ice: suggestion.ice,
                tools: suggestion.tools,
                isAlcoholic: suggestion.isAlcoholic,
            } as any); // Cast to any to handle union Omit complexity
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save recipe');
        }
    };

    return (
        <div className="ai-suggestions">
            <div className="ai-header">
                <div className="ai-title">
                    <div className="ai-icon">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h1>{t.ai.title}</h1>
                        <p>{t.ai.subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="ai-content">
                {/* Generate Section */}
                <div className="generate-section">
                    <div className="generate-card">
                        <div className="generate-info">
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                <div className="mode-tabs" style={{ marginBottom: 0 }}>
                                    <button
                                        className={`mode-tab ${mode === 'inspiration' ? 'active' : ''}`}
                                        onClick={() => setMode('inspiration')}
                                    >
                                        <Sparkles size={16} />
                                        <span>{t.ai.inspirationMode}</span>
                                    </button>
                                    <button
                                        className={`mode-tab ${mode === 'chef' ? 'active' : ''}`}
                                        onClick={() => setMode('chef')}
                                    >
                                        <Utensils size={16} />
                                        <span>{t.ai.chefMode}</span>
                                    </button>
                                </div>

                                <div className="mode-tabs" style={{ marginBottom: 0 }}>
                                    <button
                                        className={`mode-tab ${recipeType === 'food' ? 'active' : ''}`}
                                        onClick={() => setRecipeType('food')}
                                    >
                                        <Utensils size={16} />
                                        <span>{t.recipe.food}</span>
                                    </button>
                                    <button
                                        className={`mode-tab ${recipeType === 'drink' ? 'active' : ''}`}
                                        onClick={() => setRecipeType('drink')}
                                    >
                                        <Coffee size={16} />
                                        <span>{t.recipe.drink}</span>
                                    </button>
                                </div>
                            </div>

                            <h2>{mode === 'inspiration' ? t.ai.generate : t.ai.chefMode}</h2>
                            <p>
                                {mode === 'inspiration' ? t.ai.inspirationModeDesc : t.ai.chefModeDesc}
                            </p>
                            <div className="ai-provider-info">
                                Using: <strong>{aiSettings.provider}</strong>
                                {needsApiKey && (
                                    <span className="warning"> ({t.ai.noApiKey})</span>
                                )}
                            </div>

                            <div className="ingredients-input-section">
                                <div className="input-label">
                                    {t.ai.includeIngredients}
                                    {mode === 'chef' && <span className="required-star">*</span>}
                                </div>
                                <div className="input-row">
                                    <input
                                        type="text"
                                        value={ingredientInput}
                                        onChange={(e) => setIngredientInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t.ai.enterIngredient}
                                    />
                                    <button onClick={handleAddIngredient} className="add-ing-btn" disabled={!ingredientInput.trim()}>
                                        <Plus size={18} />
                                    </button>
                                </div>
                                {includedIngredients.length > 0 && (
                                    <div className="ingredients-tags">
                                        {includedIngredients.map((ing, idx) => (
                                            <span key={idx} className="ingredient-tag">
                                                {ing}
                                                <button onClick={() => handleRemoveIngredient(idx)}>
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dish Type Selector */}
                            <div className="dish-type-section">
                                <div className="input-label">{recipeType === 'drink' ? t.ai.drinkType : t.ai.dishType}</div>
                                <select
                                    value={dishType}
                                    onChange={(e) => setDishType(e.target.value as typeof dishType)}
                                    className="dish-type-select"
                                >
                                    {recipeType === 'food' ? (
                                        <>
                                            <optgroup label={language === 'it' ? '📋 Tipo di portata' : '📋 Course Type'}>
                                                <option value="any">{t.ai.dishTypes.any}</option>
                                                <option value="appetizer">{t.ai.dishTypes.appetizer}</option>
                                                <option value="firstCourse">{t.ai.dishTypes.firstCourse}</option>
                                                <option value="mainCourse">{t.ai.dishTypes.mainCourse}</option>
                                                <option value="side">{t.ai.dishTypes.side}</option>
                                                <option value="dessert">{t.ai.dishTypes.dessert}</option>
                                            </optgroup>
                                            <optgroup label={language === 'it' ? '👨‍👩‍👧‍👦 Occasione' : '👨‍👩‍👧‍👦 Occasion'}>
                                                <option value="kids">{t.ai.dishTypes.kids}</option>
                                                <option value="romantic">{t.ai.dishTypes.romantic}</option>
                                                <option value="party">{t.ai.dishTypes.party}</option>
                                                <option value="quick">{t.ai.dishTypes.quick}</option>
                                            </optgroup>
                                            <optgroup label={language === 'it' ? '🥗 Dieta' : '🥗 Dietary'}>
                                                <option value="vegan">{t.ai.dishTypes.vegan}</option>
                                                <option value="vegetarian">{t.ai.dishTypes.vegetarian}</option>
                                                <option value="glutenFree">{t.ai.dishTypes.glutenFree}</option>
                                            </optgroup>
                                        </>
                                    ) : (
                                        <>
                                            <optgroup label={language === 'it' ? '🍹 Tipo' : '🍹 Type'}>
                                                <option value="any">{t.ai.dishTypes.any}</option>
                                                <option value="cocktail">{t.ai.dishTypes.cocktail}</option>
                                                <option value="mocktail">{t.ai.dishTypes.mocktail}</option>
                                                <option value="smoothie">{t.ai.dishTypes.smoothie}</option>
                                                <option value="shake">{t.ai.dishTypes.shake}</option>
                                                <option value="coffeeTea">{t.ai.dishTypes.coffeeTea}</option>
                                            </optgroup>
                                            <optgroup label={language === 'it' ? '🎉 Occasione' : '🎉 Occasion'}>
                                                <option value="party">{t.ai.dishTypes.party}</option>
                                                <option value="romantic">{t.ai.dishTypes.romantic}</option>
                                                <option value="quick">{t.ai.dishTypes.quick}</option>
                                            </optgroup>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Flavor Profile Input */}
                            <div className="flavor-profile-section">
                                <div className="input-label">
                                    <Flame size={14} />
                                    {t.ai.flavorProfile}
                                </div>
                                <textarea
                                    value={flavorProfile}
                                    onChange={(e) => setFlavorProfile(e.target.value)}
                                    placeholder={t.ai.flavorProfilePlaceholder}
                                    className="flavor-profile-input"
                                    rows={2}
                                />
                            </div>
                        </div>
                        <button
                            className="generate-btn"
                            onClick={handleSuggest}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    {t.ai.generating}
                                </>
                            ) : (
                                <>
                                    <Wand2 size={20} />
                                    {t.ai.generate}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="ai-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Suggestion Result */}
                {suggestion && (
                    <div className="suggestion-result animate-slide-up">
                        <div className="suggestion-header">
                            <h2>{t.home.aiGenerated}</h2>
                            {saved ? (
                                <span className="saved-badge">
                                    <CheckCircle size={16} />
                                    {t.recipe.saved}
                                </span>
                            ) : (
                                <button className="save-btn" onClick={handleSave}>
                                    <CheckCircle size={18} />
                                    {t.ai.saveRecipe}
                                </button>
                            )}
                        </div>

                        <div className="suggestion-content">
                            {/* Image */}
                            <div className="suggestion-image">
                                {suggestion.imageUrl ? (
                                    <img src={suggestion.imageUrl} alt={suggestion.title} />
                                ) : (
                                    <div className="image-placeholder">
                                        <ChefHat size={48} />
                                        <button
                                            className="generate-image-btn"
                                            onClick={handleGenerateImage}
                                            disabled={generatingImage}
                                        >
                                            {generatingImage ? (
                                                <>
                                                    <Loader size={16} className="animate-spin" />
                                                    {t.recipe.generating}
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={16} />
                                                    {t.recipe.generateImage}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="suggestion-details">
                                <h3>{suggestion.title}</h3>
                                <p className="suggestion-description">{suggestion.description}</p>

                                {/* AI Reasoning */}
                                {suggestion.aiReason && (
                                    <div className="ai-reason">
                                        <Sparkles size={14} />
                                        <span>{suggestion.aiReason}</span>
                                    </div>
                                )}
                                <div className="suggestion-meta">
                                    <span>
                                        <Clock size={16} />
                                        {suggestion.cookingTime} {t.recipe.minutes}
                                    </span>
                                    <span>
                                        <Users size={16} />
                                        {suggestion.servings} {t.recipe.servings}
                                    </span>
                                </div>

                                {suggestion.type === 'drink' && (
                                    <div className="suggestion-meta drink-meta" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {suggestion.glassware && <span><strong>{t.recipe.glassware}:</strong> {suggestion.glassware}</span>}
                                        {suggestion.ice && <span style={{ marginLeft: '12px' }}><strong>{t.recipe.ice}:</strong> {suggestion.ice}</span>}
                                        {suggestion.isAlcoholic !== undefined && (
                                            <span style={{ marginLeft: '12px' }}>
                                                {suggestion.isAlcoholic ? '🍷 Alcoholic' : '🧃 Non-Alcoholic'}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="suggestion-categories">
                                    {suggestion.categories.map(cat => (
                                        <span key={cat} className="category">{cat}</span>
                                    ))}
                                </div>

                                {/* Nutrition Info */}
                                {suggestion.nutrition && (
                                    <div className="suggestion-nutrition">
                                        <span className="nutrition-badge calories">
                                            {suggestion.nutrition.calories} {t.recipe.calories}
                                        </span>
                                        {suggestion.nutrition.protein && (
                                            <span className="nutrition-badge">
                                                {suggestion.nutrition.protein}g {t.recipe.protein}
                                            </span>
                                        )}
                                        {suggestion.nutrition.carbs && (
                                            <span className="nutrition-badge">
                                                {suggestion.nutrition.carbs}g {t.recipe.carbs}
                                            </span>
                                        )}
                                        {suggestion.nutrition.fat && (
                                            <span className="nutrition-badge">
                                                {suggestion.nutrition.fat}g {t.recipe.fat}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="suggestion-section">
                                    <h4>{t.recipe.ingredients}</h4>
                                    <ul>
                                        {suggestion.ingredients.map((ing, idx) => (
                                            <li key={idx}>
                                                <span className="amount">{ing.amount} {ing.unit}</span>
                                                {ing.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="suggestion-section">
                                    <h4>{t.recipe.instructions}</h4>
                                    <div className="instructions">
                                        {(() => {
                                            const instructions = suggestion.instructions || '';
                                            let steps = instructions.split('\n').filter(s => s.trim());

                                            // If only one step, try splitting by patterns
                                            if (steps.length <= 1 && instructions.length > 100) {
                                                const numberedPattern = /(?:^|\.\s+)(?:Step\s*)?(\d+)[:.)\s]/gi;
                                                const matches = [...instructions.matchAll(numberedPattern)];

                                                if (matches.length > 1) {
                                                    steps = [];
                                                    for (let i = 0; i < matches.length; i++) {
                                                        const start = matches[i].index || 0;
                                                        const end = i < matches.length - 1 ? matches[i + 1].index : instructions.length;
                                                        const stepText = instructions.slice(start, end).trim();
                                                        if (stepText) steps.push(stepText);
                                                    }
                                                } else {
                                                    steps = instructions.split(/\.(?=\s+[A-Z])/).map(s => s.trim()).filter(s => s);
                                                }
                                            }

                                            return steps.map((step, idx) => (
                                                <p key={idx}>{step.replace(/^(?:Step\s*)?\d+[:.)\s]+/i, '').trim()}</p>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!suggestion && !loading && (
                    <div className="ai-empty">
                        <div className="empty-illustration">
                            <Sparkles size={64} />
                        </div>
                        <h3>{t.ai.title}</h3>
                        <p>
                            {t.ai.subtitle}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
