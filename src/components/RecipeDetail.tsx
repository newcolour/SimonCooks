import { useState, useEffect, useRef, useCallback } from 'react';
import type { Recipe, AISettings, ShoppingItem } from '../types';
import { get, set } from 'idb-keyval';
const SHOPPING_STORAGE_KEY = 'simoncooks_shopping';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { generateRecipeImage, suggestWinePairing, translateRecipe, calculateNutrition, calculateFlavorProfile, mergeShoppingList, simpleShoppingMerge, type SuggestedRecipe } from '../services/aiService';
import type { WinePairingSuggestion, WinePairing } from '../services/aiService';
import { FlavorChart } from './FlavorChart';
import { RemixModal } from './RemixModal';
import { CookingMode } from './CookingMode';
import {
    Clock,
    Users,
    Sparkles,
    Edit,
    Trash2,
    ChefHat,
    AlertTriangle,
    X,
    Image as ImageIcon,
    Loader,
    Plus,
    Minus,
    RefreshCw,
    Languages,
    Wine,
    Flame,
    Link as LinkIcon,
    CheckCircle,
    ArrowUp,
    Martini,
    Snowflake,
    Maximize2,
    Minimize2,
    ShoppingCart,
    PlayCircle
} from 'lucide-react';
import './RecipeDetail.css';

interface RecipeDetailProps {
    recipe: Recipe | null;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    onUpdateRecipe?: (recipe: Recipe) => Promise<void>;
    onSaveNewRecipe?: (recipe: SuggestedRecipe) => Promise<void>;
    aiSettings?: AISettings;
    language: Language;
    isFocusMode?: boolean;
    onToggleFocus?: () => void;
}

export function RecipeDetail({ recipe, onEdit, onDelete, onClose, onUpdateRecipe, onSaveNewRecipe, aiSettings, language, isFocusMode, onToggleFocus }: RecipeDetailProps) {
    const [generatingImage, setGeneratingImage] = useState(false);
    const [showRemixModal, setShowRemixModal] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [adjustedServings, setAdjustedServings] = useState<number>(recipe?.servings || 4);
    const [winePairing, setWinePairing] = useState<WinePairingSuggestion | null>(null);
    const [loadingWine, setLoadingWine] = useState(false);
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [wineError, setWineError] = useState<string | null>(null);
    const [translatedRecipe, setTranslatedRecipe] = useState<Partial<Recipe> | null>(null);
    const [translating, setTranslating] = useState(false);
    const [calculatingNutrition, setCalculatingNutrition] = useState(false);
    const [nutritionError, setNutritionError] = useState<string | null>(null);
    const [calculatingFlavor, setCalculatingFlavor] = useState(false);
    const [flavorError, setFlavorError] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | null>(null); // New image waiting for confirmation
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [addingToList, setAddingToList] = useState(false);
    const [addedToList, setAddedToList] = useState(false);
    const [showCookingMode, setShowCookingMode] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const t = getTranslation(language);

    const activeRecipe = recipe ? (translatedRecipe ? { ...recipe, ...translatedRecipe } as Recipe : recipe) : null;

    // Reset adjusted servings and wine pairing when recipe changes
    useEffect(() => {
        if (recipe?.servings) {
            setAdjustedServings(recipe.servings);
        }
        setWinePairing(null);
        setWineError(null);
        setTranslatedRecipe(null);
        // Reset scroll position when recipe changes
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
        setShowBackToTop(false);
    }, [recipe?.id, recipe?.servings]);

    // Handle scroll to show/hide back to top button
    const handleScroll = useCallback(() => {
        if (contentRef.current) {
            setShowBackToTop(contentRef.current.scrollTop > 300);
        }
    }, []);

    // Scroll to top function
    const scrollToTop = useCallback(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, []);

    // Helper to identify drinks
    const isDrink = (r: Recipe | null | undefined): boolean => {
        if (!r) return false;
        if (r.type === 'drink') return true;
        const keywords = ['drink', 'bevanda', 'bevande', 'cocktail', 'mocktail', 'smoothie', 'shake', 'coffee', 'tea', 'beverage', 'liquor', 'alcolico', 'aperitif', 'digestif'];
        return r.categories?.some(c => keywords.some(k => c.toLowerCase().includes(k))) || false;
    };

    // Add ingredients to shopping list (with AI merge)
    const handleAddToShoppingList = async () => {
        if (!activeRecipe) return;

        setAddingToList(true);
        setAddedToList(false);

        try {
            // Get current shopping list
            let currentItems: ShoppingItem[] = [];
            if (window.electronAPI?.shoppingList) {
                currentItems = await window.electronAPI.shoppingList.getAll();
            } else {
                const stored = await get<ShoppingItem[]>(SHOPPING_STORAGE_KEY);
                if (stored) currentItems = stored;
            }

            const newIngredients = activeRecipe.ingredients.map(ing => ({
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit
            }));

            const hasAI = aiSettings?.apiKey || aiSettings?.provider === 'ollama';
            let newItems: ShoppingItem[] = [];

            if (hasAI && aiSettings && currentItems.length > 0) {
                // Use AI merge
                try {
                    const merged = await mergeShoppingList(aiSettings, currentItems, newIngredients);
                    newItems = merged.map(m => ({
                        id: crypto.randomUUID(),
                        name: m.name,
                        amount: m.amount,
                        unit: m.unit,
                        checked: m.checked
                    }));
                } catch {
                    // Fallback to simple merge
                    const merged = simpleShoppingMerge(currentItems, newIngredients);
                    newItems = merged.map(m => ({
                        id: crypto.randomUUID(),
                        name: m.name,
                        amount: m.amount,
                        unit: m.unit,
                        checked: m.checked
                    }));
                }
            } else {
                // Simple merge (append)
                const merged = simpleShoppingMerge(currentItems, newIngredients);
                newItems = merged.map(m => ({
                    id: crypto.randomUUID(),
                    name: m.name,
                    amount: m.amount,
                    unit: m.unit,
                    checked: m.checked
                }));
            }

            // Save updated list
            // Save updated list
            if (window.electronAPI?.shoppingList) {
                await window.electronAPI.shoppingList.replaceAll(newItems);
            } else {
                await set(SHOPPING_STORAGE_KEY, newItems);
            }

            setAddedToList(true);
            setTimeout(() => setAddedToList(false), 3000);
        } catch (err) {
            console.error('Failed to add to shopping list:', err);
        } finally {
            setAddingToList(false);
        }
    };

    // Calculate scaled ingredient amount
    const getScaledAmount = (originalAmount: string): string => {
        if (!activeRecipe?.servings || activeRecipe.servings === adjustedServings) {
            return originalAmount;
        }

        const ratio = adjustedServings / activeRecipe.servings;
        const numericMatch = originalAmount.match(/^([\d.,/]+)/);

        if (!numericMatch) return originalAmount;

        let numericValue: number;
        const numStr = numericMatch[1];

        // Handle fractions like "1/2"
        if (numStr.includes('/')) {
            const [num, denom] = numStr.split('/').map(Number);
            numericValue = num / denom;
        } else {
            numericValue = parseFloat(numStr.replace(',', '.'));
        }

        if (isNaN(numericValue)) return originalAmount;

        const scaledValue = numericValue * ratio;

        // Format nicely: show fractions for small numbers, round others
        if (scaledValue < 1 && scaledValue > 0) {
            // Try common fractions
            const fractions: [number, string][] = [
                [0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']
            ];
            for (const [val, frac] of fractions) {
                if (Math.abs(scaledValue - val) < 0.05) return frac;
            }
        }

        // Round to reasonable precision
        const formatted = scaledValue < 10
            ? Math.round(scaledValue * 4) / 4  // Quarter precision for small
            : Math.round(scaledValue);

        return formatted.toString().replace('.25', '¼').replace('.5', '½').replace('.75', '¾');
    };

    if (!recipe) {
        return (
            <div className="recipe-detail-empty">
                <div className="empty-content">
                    <ChefHat size={64} />
                    <h2>{t.recipe.selectRecipe}</h2>
                    <p>{t.recipe.selectRecipeDesc}</p>
                </div>
            </div>
        );
    }

    const handleDelete = () => {
        if (window.confirm(`${t.recipe.deleteConfirm} "${recipe.title}"?`)) {
            onDelete();
        }
    };

    const handleGenerateImage = async () => {
        if (!aiSettings || !onUpdateRecipe) {
            setImageError(t.ai.configureFirst);
            return;
        }

        // Check if API key is available for image generation
        const imageApiKey = aiSettings.imageApiKey || aiSettings.apiKey;
        if (!imageApiKey && aiSettings.imageProvider !== 'ollama') {
            setImageError(t.ai.noApiKey);
            return;
        }

        setGeneratingImage(true);
        setImageError(null);

        try {
            const imageUrl = await generateRecipeImage(aiSettings, recipe);
            // If recipe already has an image, show preview for confirmation
            if (recipe.imageUrl) {
                setPendingImage(imageUrl);
            } else {
                // First image - apply directly
                await onUpdateRecipe({ ...recipe, imageUrl });
            }
        } catch (error) {
            setImageError(error instanceof Error ? error.message : t.common.error);
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleConfirmNewImage = async () => {
        if (!onUpdateRecipe || !recipe || !pendingImage) return;
        await onUpdateRecipe({ ...recipe, imageUrl: pendingImage });
        setPendingImage(null);
    };

    const handleCancelNewImage = () => {
        setPendingImage(null);
    };

    const handleRemoveImage = async () => {
        if (!onUpdateRecipe || !recipe) return;
        await onUpdateRecipe({ ...recipe, imageUrl: undefined });
    };

    const handleCalculateNutrition = async () => {
        if (!aiSettings || !onUpdateRecipe || !recipe) {
            setNutritionError(t.ai.configureFirst);
            return;
        }

        if (recipe.type !== 'food') return;

        setCalculatingNutrition(true);
        setNutritionError(null);

        try {
            const nutrition = await calculateNutrition(aiSettings, recipe);
            await onUpdateRecipe({ ...recipe, nutrition });
        } catch (error) {
            setNutritionError(error instanceof Error ? error.message : t.common.error);
        } finally {
            setCalculatingNutrition(false);
        }
    };

    const handleCalculateFlavorProfile = async () => {
        if (!aiSettings || !onUpdateRecipe || !recipe) {
            setFlavorError(t.ai.configureFirst);
            return;
        }

        setCalculatingFlavor(true);
        setFlavorError(null);

        try {
            const flavorProfile = await calculateFlavorProfile(aiSettings, recipe);
            await onUpdateRecipe({ ...recipe, flavorProfile });
        } catch (error) {
            setFlavorError(error instanceof Error ? error.message : t.common.error);
        } finally {
            setCalculatingFlavor(false);
        }
    };

    const handleSuggestWine = async () => {
        if (!aiSettings) return;

        setLoadingWine(true);
        setWineError(null);
        setWinePairing(null);

        try {
            const suggestion = await suggestWinePairing(aiSettings, recipe, language) as WinePairingSuggestion;
            setWinePairing(suggestion);
        } catch (error) {
            setWineError(error instanceof Error ? error.message : t.common.error);
        } finally {
            setLoadingWine(false);
        }
    };

    const handleRegenerateTier = async (tier: 'budget' | 'mid-range' | 'luxury') => {
        if (!aiSettings || !winePairing) return;

        setLoadingTier(tier);
        try {
            const newPairing = await suggestWinePairing(aiSettings, recipe, language, tier) as WinePairing;

            // Map the API tier name to our state property name
            const tierProp = tier === 'mid-range' ? 'midRange' : tier;

            setWinePairing({
                ...winePairing,
                [tierProp]: newPairing
            });
        } catch (error) {
            console.error('Failed to regenerate wine tier:', error);
        } finally {
            setLoadingTier(null);
        }
    };

    const handleTranslate = async () => {
        if (!aiSettings || !recipe) return;

        // If already translated, clear it (toggle)
        if (translatedRecipe) {
            setTranslatedRecipe(null);
            return;
        }

        setTranslating(true);
        try {
            const translated = await translateRecipe(aiSettings, recipe, language);
            setTranslatedRecipe(translated);
        } catch (error) {
            console.error(error);
        } finally {
            setTranslating(false);
        }
    };

    // Touch Handling for Swipe Back
    const minSwipeDistance = 100;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchEnd - touchStart;
        const isRightSwipe = distance > minSwipeDistance;
        // Only trigger if swipe started from the left edge area (optional, but better UX)
        // For now, allow any right swipe to close
        if (isRightSwipe) {
            onClose();
        }
    };

    return (
        <div
            className="recipe-detail"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >

            {showRemixModal && activeRecipe && aiSettings && onSaveNewRecipe && (
                <RemixModal
                    originalRecipe={activeRecipe}
                    aiSettings={aiSettings}
                    language={language}
                    onClose={() => setShowRemixModal(false)}
                    onSave={onSaveNewRecipe}
                />
            )}
            {/* Header */}
            <div className="recipe-detail-header">
                <button className="close-btn" onClick={onClose} title={t.common.close}>
                    <X size={20} />
                </button>
                <div className="recipe-detail-actions">
                    {onToggleFocus && (
                        <button
                            className="action-btn toggle-focus"
                            onClick={onToggleFocus}
                            title={isFocusMode ? (language === 'it' ? 'Riduci' : 'Minimize') : (language === 'it' ? 'Espandi' : 'Maximize')}
                            style={{ marginRight: '8px' }}
                        >
                            {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    )}
                    {aiSettings && (
                        <button
                            className={`action-btn translate ${translatedRecipe ? 'active' : ''}`}
                            onClick={handleTranslate}
                            disabled={translating}
                            title={translatedRecipe ? t.recipe.showOriginal : t.recipe.translate}
                            style={{ marginRight: '8px' }}
                        >
                            {translating ? <Loader size={18} className="animate-spin" /> : <Languages size={18} />}
                            <span>{translatedRecipe ? t.recipe.showOriginal : t.recipe.translate}</span>
                        </button>
                    )}
                    {/* Remix Button (Drinks Only) */}
                    {activeRecipe?.type === 'drink' && aiSettings && onSaveNewRecipe && (
                        <button
                            className="action-btn remix"
                            onClick={() => setShowRemixModal(true)}
                            title={language === 'it' ? 'Crea una variante' : 'Create a variation'}
                            style={{ marginRight: '8px' }}
                        >
                            <Sparkles size={18} />
                            <span>Remix</span>
                        </button>
                    )}

                    {/* Start Cooking Button */}
                    <button
                        className="action-btn start-cooking"
                        onClick={() => setShowCookingMode(true)}
                        title={t.cooking?.start || "Start Cooking"}
                    >
                        <PlayCircle size={18} />
                        <span>{t.cooking?.start || "Start Cooking"}</span>
                    </button>

                    {/* Add to Shopping List */}
                    <button
                        className={`action-btn shopping ${addedToList ? 'success' : ''}`}
                        onClick={handleAddToShoppingList}
                        disabled={addingToList}
                        title={t.shopping?.addedToList || 'Add to Shopping List'}
                        style={{ marginRight: '8px' }}
                    >
                        {addingToList ? (
                            <Loader size={18} className="animate-spin" />
                        ) : addedToList ? (
                            <CheckCircle size={18} />
                        ) : (
                            <ShoppingCart size={18} />
                        )}
                        <span>{addedToList ? (t.shopping?.addedToList || 'Added!') : (t.nav?.shopping || 'Shopping')}</span>
                    </button>
                    <button className="action-btn edit" onClick={onEdit}>
                        <Edit size={18} />
                        <span>{t.recipe.edit}</span>
                    </button>
                    <button className="action-btn delete" onClick={handleDelete}>
                        <Trash2 size={18} />
                        <span>{t.recipe.delete}</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="recipe-detail-content">
                <div className="recipe-scrollable-content" ref={contentRef} onScroll={handleScroll}>
                    {/* Hero Image */}
                    <div className="recipe-hero">
                        {activeRecipe?.imageUrl ? (
                            <img
                                src={activeRecipe.imageUrl}
                                alt={activeRecipe.title}
                                onClick={() => setShowImageModal(true)}
                                className="clickable-image"
                            />
                        ) : (
                            <div className="recipe-hero-placeholder">
                                <ChefHat size={64} />
                                {onUpdateRecipe && aiSettings && (
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
                                )}
                            </div>
                        )}
                        {recipe.aiGenerated && (
                            <div className="ai-badge-large">
                                <Sparkles size={16} />
                                <span>{t.home.aiGenerated}</span>
                            </div>
                        )}
                        {/* Regenerate button for existing images */}
                        {recipe.imageUrl && onUpdateRecipe && aiSettings && (
                            <button
                                className="regenerate-image-btn"
                                onClick={handleGenerateImage}
                                disabled={generatingImage}
                                title={t.recipe.regenerateImage}
                            >
                                {generatingImage ? (
                                    <Loader size={16} className="animate-spin" />
                                ) : (
                                    <ImageIcon size={16} />
                                )}
                            </button>
                        )}
                        {/* Remove image button */}
                        {recipe.imageUrl && onUpdateRecipe && (
                            <button
                                className="remove-image-btn"
                                onClick={handleRemoveImage}
                                title={language === 'it' ? 'Rimuovi immagine' : 'Remove image'}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>


                    {/* Image Error */}
                    {imageError && (
                        <div className="image-error">
                            <AlertTriangle size={16} />
                            <span>{imageError}</span>
                        </div>
                    )}

                    {/* Title & Meta */}
                    <div className="recipe-info">
                        <div className="title-row">
                            <h1 className="recipe-title">{activeRecipe?.title}</h1>
                            {activeRecipe?.sourceUrl && (
                                <a
                                    href={activeRecipe.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="source-link-icon"
                                    title={t.recipe.sourceUrl}
                                >
                                    <LinkIcon size={20} />
                                </a>
                            )}
                        </div>

                        {activeRecipe?.description && (
                            <p className="recipe-description">{activeRecipe.description}</p>
                        )}

                        <div className="recipe-meta">
                            {activeRecipe?.type === 'food' && activeRecipe.cookingTime && (
                                <div className="meta-card">
                                    <Clock size={24} />
                                    <span className="meta-value">{activeRecipe.cookingTime}</span>
                                    <span className="meta-label">{t.recipe.minutes}</span>
                                </div>
                            )}
                            {activeRecipe?.type === 'drink' && activeRecipe.glassware && (
                                <div className="meta-card">
                                    <Martini size={24} />
                                    <span className="meta-value">{activeRecipe.glassware}</span>
                                    <span className="meta-label">{t.recipe.glassware}</span>
                                </div>
                            )}
                            {activeRecipe?.type === 'drink' && activeRecipe.ice && (
                                <div className="meta-card">
                                    <Snowflake size={24} />
                                    <span className="meta-value">{activeRecipe.ice}</span>
                                    <span className="meta-label">{t.recipe.ice}</span>
                                </div>
                            )}
                            {activeRecipe?.servings && (
                                <div className="meta-card servings-adjuster">
                                    <Users size={24} />
                                    <div className="servings-controls">
                                        <button
                                            className="servings-btn"
                                            onClick={() => setAdjustedServings(Math.max(1, adjustedServings - 1))}
                                            disabled={adjustedServings <= 1}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="meta-value">{adjustedServings}</span>
                                        <button
                                            className="servings-btn"
                                            onClick={() => setAdjustedServings(adjustedServings + 1)}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <span className="meta-label">{t.recipe.servings}</span>
                                    {adjustedServings !== activeRecipe.servings && (
                                        <span className="original-servings">({t.recipe.originalServings}: {activeRecipe.servings})</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Nutrition - Food Only */}
                        {activeRecipe?.type === 'food' && (
                            <div className="nutrition-section-container">
                                {activeRecipe?.nutrition ? (
                                    <div className="nutrition-section">
                                        <div className="nutrition-header">
                                            <Flame size={20} />
                                            <h3>{t.recipe.nutrition}
                                                <span className="nutrition-per-serving">({t.recipe.perServing})</span>
                                            </h3>
                                        </div>
                                        <div className="nutrition-grid">
                                            <div className="nutrition-item main">
                                                <span className="nutrition-value">{activeRecipe.nutrition.calories}</span>
                                                <span className="nutrition-label">{t.recipe.calories}</span>
                                            </div>
                                            <div className="nutrition-item">
                                                <span className="nutrition-value">{activeRecipe.nutrition.protein}g</span>
                                                <span className="nutrition-label">{t.recipe.protein}</span>
                                            </div>
                                            <div className="nutrition-item">
                                                <span className="nutrition-value">{activeRecipe.nutrition.carbs}g</span>
                                                <span className="nutrition-label">{t.recipe.carbs}</span>
                                            </div>
                                            <div className="nutrition-item">
                                                <span className="nutrition-value">{activeRecipe.nutrition.fat}g</span>
                                                <span className="nutrition-label">{t.recipe.fat}</span>
                                            </div>
                                        </div>

                                        {/* Detailed Nutrition toggle could go here */}

                                        {(activeRecipe.nutrition.fiber || activeRecipe.nutrition.sugar || activeRecipe.nutrition.sodium || activeRecipe.nutrition.cholesterol ||
                                            activeRecipe.nutrition.vitaminA || activeRecipe.nutrition.vitaminC ||
                                            activeRecipe.nutrition.calcium || activeRecipe.nutrition.iron) && (
                                                <div className="nutrition-subsection">
                                                    <h4>{t.recipe.micronutrients}</h4>
                                                    <div className="nutrition-grid micro">
                                                        {activeRecipe.nutrition.sodium && (
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-value">{activeRecipe.nutrition.sodium}mg</span>
                                                                <span className="nutrition-label">{t.recipe.sodium}</span>
                                                            </div>
                                                        )}
                                                        {activeRecipe.nutrition.cholesterol && (
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-value">{activeRecipe.nutrition.cholesterol}mg</span>
                                                                <span className="nutrition-label">{t.recipe.cholesterol}</span>
                                                            </div>
                                                        )}
                                                        {activeRecipe.nutrition.vitaminA && (
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-value">{activeRecipe.nutrition.vitaminA}%</span>
                                                                <span className="nutrition-label">{t.recipe.vitaminA}</span>
                                                            </div>
                                                        )}
                                                        {activeRecipe.nutrition.vitaminC && (
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-value">{activeRecipe.nutrition.vitaminC}%</span>
                                                                <span className="nutrition-label">{t.recipe.vitaminC}</span>
                                                            </div>
                                                        )}
                                                        {activeRecipe.nutrition.calcium && (
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-value">{activeRecipe.nutrition.calcium}%</span>
                                                                <span className="nutrition-label">{t.recipe.calcium}</span>
                                                            </div>
                                                        )}
                                                        {activeRecipe.nutrition.iron && (
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-value">{activeRecipe.nutrition.iron}%</span>
                                                                <span className="nutrition-label">{t.recipe.iron}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="daily-value-note">{t.recipe.dailyValue}</span>
                                                </div>
                                            )}
                                    </div>
                                ) : (
                                    // Empty Nutrition State
                                    <div className="nutrition-section empty">
                                        <div className="nutrition-header">
                                            <Flame size={20} />
                                            <h3>{t.recipe.nutrition}</h3>
                                        </div>
                                        <button
                                            className="calculate-nutrition-btn"
                                            onClick={handleCalculateNutrition}
                                            disabled={calculatingNutrition || !aiSettings}
                                        >
                                            {calculatingNutrition ? (
                                                <>
                                                    <Loader size={16} className="animate-spin" />
                                                    {t.recipe.calculating}
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    {t.recipe.calculateNutrition}
                                                </>
                                            )}
                                        </button>
                                        {nutritionError && (
                                            <p className="nutrition-error">{nutritionError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Drink Specific - Tools & Variants */}
                        {activeRecipe?.type === 'drink' && (
                            <div className="drink-extras">
                                {activeRecipe.tools && activeRecipe.tools.length > 0 && (
                                    <div className="drink-tools-section">
                                        <h3>{t.recipe.tools}</h3>
                                        <div className="tools-list">
                                            {activeRecipe.tools.map((tool, i) => (
                                                <span key={i} className="tool-tag">{tool}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeRecipe.aiVariants && (activeRecipe.aiVariants.virgin_version || activeRecipe.aiVariants.twist_version) && (
                                    <div className="drink-variants-section">
                                        <h3>{t.recipe.variants}</h3>
                                        {activeRecipe.aiVariants.virgin_version && (
                                            <div className="variant-card virgin">
                                                <h4>🚫 {t.recipe.virgin}</h4>
                                                <p>{activeRecipe.aiVariants.virgin_version}</p>
                                            </div>
                                        )}
                                        {activeRecipe.aiVariants.twist_version && (
                                            <div className="variant-card twist">
                                                <h4>🌪️ {t.recipe.twist}</h4>
                                                <p>{activeRecipe.aiVariants.twist_version}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Categories */}
                        {activeRecipe?.categories && activeRecipe.categories.length > 0 && (
                            <div className="recipe-categories">
                                {activeRecipe.categories.map(cat => (
                                    <span key={cat} className="category-tag">{cat}</span>
                                ))}
                            </div>
                        )}

                        {/* Allergens */}
                        {recipe.allergens.length > 0 && (
                            <div className="recipe-allergens">
                                <div className="allergen-header">
                                    <AlertTriangle size={18} />
                                    <span>{t.recipe.allergens}</span>
                                </div>
                                <div className="allergen-tags">
                                    {recipe.allergens.map(allergen => (
                                        <span key={allergen} className="allergen-tag">{allergen}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="recipe-section">
                        <h2>
                            {t.recipe.ingredients}
                            {adjustedServings !== activeRecipe?.servings && (
                                <span className="scaled-badge">({adjustedServings} {t.recipe.servings})</span>
                            )}
                        </h2>
                        <ul className="ingredients-list">
                            {activeRecipe?.ingredients.map((ing, idx) => (
                                <li key={idx} className={`ingredient-item ${adjustedServings !== activeRecipe?.servings ? 'scaled' : ''}`}>
                                    <span className="ingredient-amount">{getScaledAmount(ing.amount)} {ing.unit}</span>
                                    <span className="ingredient-name">{ing.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Wine Pairing - Hide for drinks */}
                    {aiSettings && !isDrink(activeRecipe) && (
                        <div className="recipe-section">
                            <div className="section-header-actions">
                                <h2>{t.recipe.winePairing}</h2>
                                {!winePairing && !loadingWine && (
                                    <button className="suggest-wine-btn" onClick={handleSuggestWine}>
                                        <Wine size={16} />
                                        <span>{t.recipe.suggestWine}</span>
                                    </button>
                                )}
                            </div>

                            {loadingWine && (
                                <div className="wine-loading">
                                    <Loader size={20} className="animate-spin" />
                                    <span>{t.recipe.suggestingWine}</span>
                                </div>
                            )}

                            {wineError && (
                                <div className="image-error">
                                    <AlertTriangle size={16} />
                                    <span>{wineError}</span>
                                </div>
                            )}

                            {winePairing && (
                                <div className="wine-pairing-results">
                                    <div className="wine-grid">
                                        <div className="wine-card budget">
                                            <div className="wine-header">
                                                <span className="wine-tier">{t.recipe.budget}</span>
                                                <div className="wine-header-right">
                                                    <span className="wine-price">{winePairing.budget.priceRange}</span>
                                                    <button
                                                        className="refresh-tier-btn"
                                                        onClick={() => handleRegenerateTier('budget')}
                                                        disabled={!!loadingTier}
                                                        title={t.recipe.regenerateImage}
                                                    >
                                                        <RefreshCw size={14} className={loadingTier === 'budget' ? 'animate-spin' : ''} />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3>{winePairing.budget.name}</h3>
                                            <div className="wine-details">
                                                <span className="wine-type">{winePairing.budget.type}</span>
                                                <span className="wine-region">{winePairing.budget.region}</span>
                                            </div>
                                            <p className="wine-desc">{winePairing.budget.description}</p>
                                            <div className="wine-reason">
                                                <strong>{t.recipe.whyItPairs}:</strong> {winePairing.budget.whyItPairs}
                                            </div>
                                        </div>

                                        <div className="wine-card mid">
                                            <div className="wine-header">
                                                <span className="wine-tier">{t.recipe.midRange}</span>
                                                <div className="wine-header-right">
                                                    <span className="wine-price">{winePairing.midRange.priceRange}</span>
                                                    <button
                                                        className="refresh-tier-btn"
                                                        onClick={() => handleRegenerateTier('mid-range')}
                                                        disabled={!!loadingTier}
                                                        title={t.recipe.regenerateImage}
                                                    >
                                                        <RefreshCw size={14} className={loadingTier === 'mid-range' ? 'animate-spin' : ''} />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3>{winePairing.midRange.name}</h3>
                                            <div className="wine-details">
                                                <span className="wine-type">{winePairing.midRange.type}</span>
                                                <span className="wine-region">{winePairing.midRange.region}</span>
                                            </div>
                                            <p className="wine-desc">{winePairing.midRange.description}</p>
                                            <div className="wine-reason">
                                                <strong>{t.recipe.whyItPairs}:</strong> {winePairing.midRange.whyItPairs}
                                            </div>
                                        </div>

                                        <div className="wine-card luxury">
                                            <div className="wine-header">
                                                <span className="wine-tier">{t.recipe.luxury}</span>
                                                <div className="wine-header-right">
                                                    <span className="wine-price">{winePairing.luxury.priceRange}</span>
                                                    <button
                                                        className="refresh-tier-btn"
                                                        onClick={() => handleRegenerateTier('luxury')}
                                                        disabled={!!loadingTier}
                                                        title={t.recipe.regenerateImage}
                                                    >
                                                        <RefreshCw size={14} className={loadingTier === 'luxury' ? 'animate-spin' : ''} />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3>{winePairing.luxury.name}</h3>
                                            <div className="wine-details">
                                                <span className="wine-type">{winePairing.luxury.type}</span>
                                                <span className="wine-region">{winePairing.luxury.region}</span>
                                            </div>
                                            <p className="wine-desc">{winePairing.luxury.description}</p>
                                            <div className="wine-reason">
                                                <strong>{t.recipe.whyItPairs}:</strong> {winePairing.luxury.whyItPairs}
                                            </div>
                                        </div>
                                    </div>
                                    {winePairing.generalTips && (
                                        <div className="wine-tips">
                                            <strong>{t.recipe.servingTips}:</strong> {winePairing.generalTips}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="recipe-section">
                        <h2>{t.recipe.instructions}</h2>
                        <div className="instructions-content">
                            {(() => {
                                const instructions = activeRecipe?.instructions || '';
                                // Try to split by newlines first
                                let steps = instructions.split('\n').filter(line => line.trim());

                                // If only one step (no newlines), try splitting by numbered patterns
                                if (steps.length <= 1 && instructions.length > 100) {
                                    // Try to split by "Step X:" or "X." or "X)" patterns
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
                                        // Last resort: split by sentences (". " followed by capital letter)
                                        steps = instructions.split(/\.(?=\s+[A-Z])/).map(s => s.trim()).filter(s => s);
                                    }
                                }

                                return steps.map((step, idx) => (
                                    <div key={idx} className="instruction-step">
                                        <span className="step-number">{idx + 1}</span>
                                        <p>{step.replace(/^(?:Step\s*)?\d+[:.)\s]+/i, '').trim()}</p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>


                    {/* Flavor Profile Section */}
                    <div className="recipe-section flavor-profile-section">
                        <h2>{t.recipe.flavorProfile}</h2>
                        {activeRecipe?.flavorProfile ? (
                            <FlavorChart flavorProfile={activeRecipe.flavorProfile} language={language} />
                        ) : (
                            <div className="flavor-empty">
                                <button
                                    className="calculate-flavor-btn"
                                    onClick={handleCalculateFlavorProfile}
                                    disabled={calculatingFlavor || !aiSettings}
                                >
                                    {calculatingFlavor ? (
                                        <>
                                            <Loader size={16} className="animate-spin" />
                                            {t.recipe.calculating}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            {t.recipe.calculateFlavor}
                                        </>
                                    )}
                                </button>
                                {flavorError && (
                                    <p className="flavor-error">{flavorError}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notes - at the end of the recipe */}
                    {activeRecipe?.notes && (
                        <div className="recipe-section notes-section">
                            <h2>{t.recipe.notes}</h2>
                            <p className="recipe-notes">{activeRecipe.notes}</p>
                        </div>
                    )}

                </div>

                {/* Image Lightbox Modal */}
                {
                    showImageModal && activeRecipe?.imageUrl && (
                        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
                            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="image-modal-close"
                                    onClick={() => setShowImageModal(false)}
                                >
                                    <X size={24} />
                                </button>
                                <img
                                    src={activeRecipe.imageUrl}
                                    alt={activeRecipe.title}
                                    className="image-modal-img"
                                />
                            </div>
                        </div>
                    )
                }

                {/* New Image Preview Modal */}
                {
                    pendingImage && (
                        <div className="image-modal-overlay" onClick={handleCancelNewImage}>
                            <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
                                <h3 className="preview-title">
                                    {language === 'it' ? 'Nuova immagine generata' : 'New image generated'}
                                </h3>
                                <p className="preview-subtitle">
                                    {language === 'it'
                                        ? 'Vuoi sostituire l\'immagine attuale con questa nuova?'
                                        : 'Do you want to replace the current image with this new one?'}
                                </p>
                                <div className="preview-comparison">
                                    <div className="preview-image-container">
                                        <span className="preview-label">
                                            {language === 'it' ? 'Attuale' : 'Current'}
                                        </span>
                                        <img src={recipe.imageUrl} alt="Current" className="preview-img" />
                                    </div>
                                    <div className="preview-arrow">→</div>
                                    <div className="preview-image-container">
                                        <span className="preview-label new">
                                            {language === 'it' ? 'Nuova' : 'New'}
                                        </span>
                                        <img src={pendingImage} alt="New" className="preview-img" />
                                    </div>
                                </div>
                                <div className="preview-actions">
                                    <button className="preview-btn cancel" onClick={handleCancelNewImage}>
                                        <X size={18} />
                                        {language === 'it' ? 'Mantieni attuale' : 'Keep current'}
                                    </button>
                                    <button className="preview-btn confirm" onClick={handleConfirmNewImage}>
                                        <CheckCircle size={18} />
                                        {language === 'it' ? 'Usa nuova' : 'Use new image'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

            </div>
            {/* Hero Image moved to bottom for split view */}

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    className="back-to-top-btn"
                    onClick={scrollToTop}
                    title={language === 'it' ? 'Torna su' : 'Back to top'}
                >
                    <ArrowUp size={20} />
                </button>
            )}
            {/* Cooking Mode Overlay */}
            {showCookingMode && activeRecipe && aiSettings && (
                <CookingMode
                    recipe={activeRecipe}
                    aiSettings={aiSettings}
                    language={language}
                    onClose={() => setShowCookingMode(false)}
                />
            )}
        </div>
    );
}
