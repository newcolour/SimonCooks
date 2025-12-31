import { useState } from 'react';
import { X, Sparkles, Loader, Save, AlertTriangle } from 'lucide-react';
import type { Recipe, AISettings } from '../types';
import type { SuggestedRecipe } from '../services/aiService';
import { remixCocktail } from '../services/aiService';
import './RemixModal.css';

interface RemixModalProps {
    originalRecipe: Recipe;
    aiSettings: AISettings;
    language: string; // 'en' | 'it'
    onClose: () => void;
    onSave: (recipe: SuggestedRecipe) => Promise<void>;
}

export function RemixModal({ originalRecipe, aiSettings, language, onClose, onSave }: RemixModalProps) {
    const [modifiers, setModifiers] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SuggestedRecipe | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const tags = [
        { id: 'mocktail', label: language === 'it' ? 'Mocktail (Analcolico)' : 'Mocktail (No Alcohol)' },
        { id: 'smokey', label: language === 'it' ? 'Affumicato' : 'Smokey' },
        { id: 'spicy', label: language === 'it' ? 'Piccante' : 'Spicy' },
        { id: 'frozen', label: language === 'it' ? 'Frozen' : 'Frozen' },
        { id: 'tropical', label: language === 'it' ? 'Tropicale' : 'Tropical' },
        { id: 'low-sugar', label: language === 'it' ? 'Poco Zucchero' : 'Low Sugar' },
        { id: 'bitter', label: language === 'it' ? 'Amaro' : 'Bitter' },
    ];

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleRemix = async () => {
        if (!modifiers && selectedTags.length === 0) return;

        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            const combinedModifiers = [
                ...selectedTags,
                modifiers
            ].filter(Boolean).join(', ');

            const remixed = await remixCocktail(aiSettings, originalRecipe, combinedModifiers, language);
            setResult(remixed);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remix cocktail');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            await onSave(result);
            onClose();
        } catch (err) {
            setError('Failed to save recipe');
            setIsSaving(false);
        }
    };

    return (
        <div className="remix-modal-overlay">
            <div className="remix-modal">
                <div className="remix-header">
                    <h2>
                        <Sparkles className="remix-icon" />
                        Remix: {originalRecipe.title}
                    </h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="remix-content">
                    {!result ? (
                        <div className="remix-input-section">
                            <p className="remix-description">
                                {language === 'it'
                                    ? 'Come vuoi trasformare questo drink? Seleziona dei tag o scrivi le tue istruzioni.'
                                    : 'How do you want to remix this drink? Select tags or write your instructions.'}
                            </p>

                            <div className="remix-tags">
                                {tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        className={`remix-tag ${selectedTags.includes(tag.label) ? 'selected' : ''}`}
                                        onClick={() => toggleTag(tag.label)}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="remix-textarea"
                                placeholder={language === 'it' ? "E.g., Usa Tequila invece del Gin..." : "E.g., Use Tequila instead of Gin..."}
                                value={modifiers}
                                onChange={(e) => setModifiers(e.target.value)}
                            />

                            {error && (
                                <div className="remix-error">
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                className="remix-btn"
                                onClick={handleRemix}
                                disabled={isGenerating || (!modifiers && selectedTags.length === 0)}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        {language === 'it' ? 'Mixando...' : 'Remixing...'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        {language === 'it' ? 'Esegui Remix' : 'Remix Cocktail'}
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="remix-result">
                            <div className="result-card">
                                <h3>{result.title}</h3>
                                <p className="result-desc">{result.description}</p>

                                <div className="result-stats">
                                    <span>{result.glassware}</span>
                                    <span>•</span>
                                    <span>{result.isAlcoholic ? (language === 'it' ? 'Alcolico' : 'Alcoholic') : (language === 'it' ? 'Analcolico' : 'Non-Alcoholic')}</span>
                                </div>

                                <div className="result-ingredients">
                                    <h4>{language === 'it' ? 'Ingredienti' : 'Ingredients'}</h4>
                                    <ul>
                                        {result.ingredients.map((ing, i) => (
                                            <li key={i}>{ing.amount} {ing.unit} {ing.name}</li>
                                        ))}
                                    </ul>
                                </div>

                                {result.aiReason && (
                                    <div className="result-reason">
                                        <strong>AI:</strong> {result.aiReason}
                                    </div>
                                )}
                            </div>

                            <div className="result-actions">
                                <button className="secondary-btn" onClick={() => setResult(null)}>
                                    {language === 'it' ? 'Riprova' : 'Try Again'}
                                </button>
                                <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader className="animate-spin" /> : <Save size={18} />}
                                    {language === 'it' ? 'Salva Come Nuovo' : 'Save as New'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
