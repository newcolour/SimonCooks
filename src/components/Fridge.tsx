import { useState, useMemo } from 'react';
import type { Recipe, AISettings } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { analyzeFridgeImage } from '../services/aiService';
import {
    Refrigerator,
    Search,
    Sparkles,
    ChefHat,
    Clock,
    Users,
    X,
    Plus,
    ArrowRight,
    Camera as CameraIcon,
    Loader,
    ImageUp
} from 'lucide-react';
import './Fridge.css';

interface FridgeProps {
    recipes: Recipe[];
    aiSettings: AISettings;
    language: Language;
    onSelectRecipe: (recipe: Recipe) => void;
    onGenerateWithAI: (ingredients: string[]) => void;
}

interface RecipeMatch {
    recipe: Recipe;
    matchPercentage: number;
    matchedIngredients: string[];
    missingIngredients: string[];
}

export function Fridge({
    recipes,
    aiSettings,
    language,
    onSelectRecipe,
    onGenerateWithAI
}: FridgeProps) {
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const t = getTranslation(language);

    const isMobile = Capacitor.isNativePlatform();
    const canUseCamera = isMobile && aiSettings.provider === 'ollama';

    const handleAddIngredient = () => {
        if (inputValue.trim() && !ingredients.includes(inputValue.trim().toLowerCase())) {
            setIngredients([...ingredients, inputValue.trim().toLowerCase()]);
            setInputValue('');
        }
    };

    const handleRemoveIngredient = (ing: string) => {
        setIngredients(ingredients.filter(i => i !== ing));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddIngredient();
        }
    };

    // Shared function to analyze a photo (from camera or gallery)
    const analyzePhoto = async (source: typeof CameraSource.Camera | typeof CameraSource.Photos) => {
        if (!canUseCamera) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        setDebugInfo(null);
        setShowDebug(false);

        try {
            // Get photo using Capacitor Camera
            const photo = await Camera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: source,
                width: 1024,
                height: 1024
            });

            if (!photo.base64String) {
                throw new Error('No image selected');
            }

            // Analyze the image with AI
            const result = await analyzeFridgeImage(
                aiSettings,
                photo.base64String,
                language
            );

            setDebugInfo(result.debug || null);

            if (result.ingredients.length > 0) {
                // Add detected ingredients (avoid duplicates)
                const newIngredients = result.ingredients.filter(
                    ing => !ingredients.includes(ing.toLowerCase())
                );
                setIngredients([...ingredients, ...newIngredients]);
            } else {
                setAnalysisError(language === 'it'
                    ? 'Nessun ingrediente rilevato. Prova con una foto più chiara.'
                    : 'No ingredients detected. Try a clearer photo.');
                setShowDebug(true);
            }
        } catch (error: any) {
            console.error('Camera/Analysis error:', error);
            const errorMessage = error.message || String(error);
            setDebugInfo(`Error: ${errorMessage}`);
            setAnalysisError(language === 'it'
                ? 'Errore nell\'analisi. Clicca per dettagli.'
                : 'Analysis error. Click for details.');
            setShowDebug(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleTakeFridgePhoto = () => analyzePhoto(CameraSource.Camera);

    // Handle file upload from Files app
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !canUseCamera) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        setDebugInfo(null);
        setShowDebug(false);

        try {
            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(file);

            const base64String = await base64Promise;

            // Analyze the image with AI
            const result = await analyzeFridgeImage(
                aiSettings,
                base64String,
                language
            );

            setDebugInfo(result.debug || null);

            if (result.ingredients.length > 0) {
                const newIngredients = result.ingredients.filter(
                    ing => !ingredients.includes(ing.toLowerCase())
                );
                setIngredients([...ingredients, ...newIngredients]);
            } else {
                setAnalysisError(language === 'it'
                    ? 'Nessun ingrediente rilevato. Prova con una foto più chiara.'
                    : 'No ingredients detected. Try a clearer photo.');
                setShowDebug(true);
            }
        } catch (error: any) {
            console.error('File upload/Analysis error:', error);
            const errorMessage = error.message || String(error);
            setDebugInfo(`Error: ${errorMessage}`);
            setAnalysisError(language === 'it'
                ? 'Errore nell\'analisi. Clicca per dettagli.'
                : 'Analysis error. Click for details.');
            setShowDebug(true);
        } finally {
            setIsAnalyzing(false);
            // Reset the input so the same file can be selected again
            event.target.value = '';
        }
    };

    // Calculate recipe matches
    const recipeMatches: RecipeMatch[] = useMemo(() => {
        if (ingredients.length === 0) return [];

        const matches: RecipeMatch[] = [];

        for (const recipe of recipes) {
            const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
            const matched: string[] = [];
            const missing: string[] = [];

            for (const recipeIng of recipeIngredients) {
                const isMatched = ingredients.some(ing =>
                    recipeIng.includes(ing) || ing.includes(recipeIng)
                );
                if (isMatched) {
                    matched.push(recipeIng);
                } else {
                    missing.push(recipeIng);
                }
            }

            if (matched.length > 0) {
                const matchPercentage = Math.round((matched.length / recipeIngredients.length) * 100);
                matches.push({
                    recipe,
                    matchPercentage,
                    matchedIngredients: matched,
                    missingIngredients: missing
                });
            }
        }

        // Sort by match percentage descending
        return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }, [recipes, ingredients]);

    const hasAI = aiSettings.apiKey || aiSettings.provider === 'ollama';

    return (
        <div className="fridge">
            <div className="fridge-header">
                <div className="fridge-title">
                    <Refrigerator size={28} />
                    <h1>{t.fridge?.title || "What's in my Fridge?"}</h1>
                </div>
                <p className="fridge-subtitle">
                    {t.fridge?.subtitle || 'Enter ingredients you have and find matching recipes'}
                </p>
            </div>

            <div className="fridge-content">
                {/* Ingredient Input */}
                <div className="ingredient-input-section">
                    <div className="input-row">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.fridge?.inputPlaceholder || 'Type an ingredient...'}
                            className="ingredient-input"
                        />
                        <button
                            onClick={handleAddIngredient}
                            disabled={!inputValue.trim()}
                            className="add-ingredient-btn"
                        >
                            <Plus size={18} />
                        </button>

                        {/* Camera button - mobile only with Ollama */}
                        {canUseCamera && (
                            <button
                                onClick={handleTakeFridgePhoto}
                                disabled={isAnalyzing}
                                className="camera-btn"
                                title={language === 'it' ? 'Scatta foto del frigo' : 'Take fridge photo'}
                            >
                                {isAnalyzing ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    <CameraIcon size={18} />
                                )}
                            </button>
                        )}

                        {/* Upload photo from Files - mobile only with Ollama */}
                        {canUseCamera && (
                            <label
                                className={`upload-btn ${isAnalyzing ? 'disabled' : ''}`}
                                title={language === 'it' ? 'Carica foto da file' : 'Upload from files'}
                            >
                                <ImageUp size={18} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isAnalyzing}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>

                    {/* Camera/Upload hint - mobile only */}
                    {canUseCamera && !isAnalyzing && !analysisError && ingredients.length === 0 && (
                        <div className="camera-hint">
                            <CameraIcon size={14} />
                            <span>
                                {language === 'it'
                                    ? 'Scatta o carica una foto del frigo per rilevare gli ingredienti'
                                    : 'Take or upload a photo of your fridge to detect ingredients'}
                            </span>
                        </div>
                    )}

                    {/* Analysis loading state */}
                    {isAnalyzing && (
                        <div className="analysis-status">
                            <Loader size={16} className="animate-spin" />
                            <span>
                                {language === 'it'
                                    ? 'Analizzando immagine...'
                                    : 'Analyzing image...'}
                            </span>
                        </div>
                    )}

                    {/* Analysis error */}
                    {analysisError && (
                        <div
                            className={`analysis-error ${debugInfo ? 'clickable' : ''}`}
                            onClick={() => debugInfo && setShowDebug(!showDebug)}
                        >
                            {analysisError}
                        </div>
                    )}

                    {/* Debug Info */}
                    {showDebug && debugInfo && (
                        <div className="debug-info">
                            <pre>{debugInfo}</pre>
                        </div>
                    )}

                    {ingredients.length > 0 && (
                        <div className="ingredients-list">
                            {ingredients.map(ing => (
                                <span key={ing} className="ingredient-chip">
                                    {ing}
                                    <button onClick={() => handleRemoveIngredient(ing)}>
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Results */}
                {ingredients.length > 0 && (
                    <div className="fridge-results">
                        <h2>
                            <Search size={20} />
                            {t.fridge?.resultsTitle || 'Matching Recipes'}
                            <span className="match-count">({recipeMatches.length})</span>
                        </h2>

                        {recipeMatches.length > 0 ? (
                            <div className="recipe-matches">
                                {recipeMatches.slice(0, 10).map(match => (
                                    <div
                                        key={match.recipe.id}
                                        className="match-card"
                                        onClick={() => onSelectRecipe(match.recipe)}
                                    >
                                        <div className="match-image">
                                            {match.recipe.imageUrl ? (
                                                <img src={match.recipe.imageUrl} alt={match.recipe.title} />
                                            ) : (
                                                <ChefHat size={32} />
                                            )}
                                            <div className="match-badge" data-level={
                                                match.matchPercentage >= 80 ? 'high' :
                                                    match.matchPercentage >= 50 ? 'medium' : 'low'
                                            }>
                                                {match.matchPercentage}%
                                            </div>
                                        </div>
                                        <div className="match-info">
                                            <h3>{match.recipe.title}</h3>
                                            <div className="match-meta">
                                                {match.recipe.cookingTime && (
                                                    <span><Clock size={14} /> {match.recipe.cookingTime}m</span>
                                                )}
                                                {match.recipe.servings && (
                                                    <span><Users size={14} /> {match.recipe.servings}</span>
                                                )}
                                            </div>
                                            <div className="match-details">
                                                <span className="matched">
                                                    ✓ {match.matchedIngredients.length} {t.fridge?.matched || 'matched'}
                                                </span>
                                                {match.missingIngredients.length > 0 && (
                                                    <span className="missing">
                                                        + {match.missingIngredients.length} {t.fridge?.missing || 'needed'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="arrow" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-matches">
                                <ChefHat size={48} />
                                <p>{t.fridge?.noMatches || 'No matching recipes found'}</p>
                                {hasAI && (
                                    <button
                                        className="generate-btn"
                                        onClick={() => onGenerateWithAI(ingredients)}
                                    >
                                        <Sparkles size={18} />
                                        {t.fridge?.generateWithAI || 'Generate Recipe with AI'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* AI Generate Option when matches exist but user wants more */}
                        {recipeMatches.length > 0 && hasAI && (
                            <div className="ai-generate-section">
                                <p>{t.fridge?.wantSomethingNew || "Want something new?"}</p>
                                <button
                                    className="generate-btn secondary"
                                    onClick={() => onGenerateWithAI(ingredients)}
                                >
                                    <Sparkles size={16} />
                                    {t.fridge?.generateNew || 'Create New Recipe with AI'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {ingredients.length === 0 && (
                    <div className="fridge-empty">
                        <Refrigerator size={64} />
                        <h3>{t.fridge?.emptyTitle || 'Start by adding ingredients'}</h3>
                        <p>{t.fridge?.emptySubtitle || "Enter what you have in your fridge and we'll find recipes you can make"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
