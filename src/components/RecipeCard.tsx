import type { Recipe } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { Clock, Users, Sparkles, ChefHat, Flame } from 'lucide-react';
import './RecipeCard.css';

interface RecipeCardProps {
    recipe: Recipe;
    onClick: () => void;
    isSelected?: boolean;
    language: Language;
    showCalories?: boolean;
}

export function RecipeCard({ recipe, onClick, isSelected, language, showCalories }: RecipeCardProps) {
    const t = getTranslation(language);

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            'Italian': '#ef4444',
            'Mexican': '#22c55e',
            'Asian': '#f97316',
            'Indian': '#8b5cf6',
            'French': '#3b82f6',
            'American': '#ec4899',
            'Mediterranean': '#06b6d4',
            'Breakfast': '#eab308',
            'Lunch': '#84cc16',
            'Dinner': '#f43f5e',
            'Dessert': '#d946ef',
            'Snack': '#14b8a6',
        };
        return colors[category] || '#64748b';
    };
    // Check for dietary categories
    const isVegan = recipe.categories.some(c =>
        c.toLowerCase().includes('vegan') || c.toLowerCase().includes('vegano')
    );
    const isVegetarian = recipe.categories.some(c =>
        c.toLowerCase().includes('vegetarian') || c.toLowerCase().includes('vegetariano')
    );
    const isGlutenFree = recipe.categories.some(c =>
        c.toLowerCase().includes('gluten') || c.toLowerCase().includes('glutine') || c.toLowerCase().includes('celiac')
    );

    return (
        <article
            className={`recipe-card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="recipe-card-image">
                {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} />
                ) : (
                    <div className="recipe-card-placeholder">
                        <ChefHat size={32} />
                    </div>
                )}
                {recipe.aiGenerated && (
                    <div className="ai-badge">
                        <Sparkles size={12} />
                        <span>AI</span>
                    </div>
                )}
            </div>

            <div className="recipe-card-content">
                <h3 className="recipe-card-title">{recipe.title}</h3>

                {recipe.description && (
                    <p className="recipe-card-description">{recipe.description}</p>
                )}

                <div className="recipe-card-meta">
                    {recipe.cookingTime && (
                        <span className="meta-item">
                            <Clock size={14} />
                            {recipe.cookingTime} {t.recipe.minutes}
                        </span>
                    )}
                    {recipe.servings && (
                        <span className="meta-item">
                            <Users size={14} />
                            {recipe.servings}
                        </span>
                    )}
                    {showCalories && recipe.type === 'food' && recipe.nutrition?.calories && (
                        <span className="meta-item calories">
                            <Flame size={14} />
                            {recipe.nutrition.calories} kcal
                        </span>
                    )}
                </div>

                <div className="recipe-card-footer">
                    {recipe.categories.length > 0 && (
                        <div className="recipe-card-tags">
                            {recipe.categories.slice(0, 3).map(cat => (
                                <span
                                    key={cat}
                                    className="tag"
                                    style={{ backgroundColor: `${getCategoryColor(cat)}20`, color: getCategoryColor(cat) }}
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}
                    {/* Dietary badges */}
                    {(isVegan || isVegetarian || isGlutenFree) && (
                        <div className="dietary-badges">
                            {isVegan && (
                                <span className="dietary-badge vegan" title="Vegan">🌱</span>
                            )}
                            {isVegetarian && !isVegan && (
                                <span className="dietary-badge vegetarian" title="Vegetarian">🥬</span>
                            )}
                            {isGlutenFree && (
                                <span className="dietary-badge gluten-free" title="Gluten Free">🌾</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
