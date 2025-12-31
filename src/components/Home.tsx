import type { Recipe } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { RecipeCard } from './RecipeCard';
import {
    ChefHat,
    Clock,
    TrendingUp,
    Sparkles,
    BookOpen,
    ArrowRight,
    Plus
} from 'lucide-react';
import './Home.css';

interface HomeProps {
    recipes: Recipe[];
    onSelectRecipe: (recipe: Recipe) => void;
    onNewRecipe: () => void;
    onViewAll: () => void;
    onAISuggestions: () => void;
    onFilterChange: (filter: 'all' | 'ai') => void;
    language: Language;
}

export function Home({
    recipes,
    onSelectRecipe,
    onNewRecipe,
    onViewAll,
    onAISuggestions,
    onFilterChange,
    language
}: HomeProps) {
    const t = getTranslation(language);

    // Sort recently created/updated
    const sortedRecipes = [...recipes].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const recentRecipes = sortedRecipes.slice(0, 4);
    const quickRecipes = recipes.filter(r => r.cookingTime && r.cookingTime <= 30).slice(0, 4);
    const aiRecipes = recipes.filter(r => r.aiGenerated).slice(0, 4);

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>{t.home.welcome}</h1>
                    <p>{t.home.subtitle}</p>
                    <div className="hero-stats">
                        <div
                            className="stat"
                            onClick={() => onFilterChange('all')}
                            style={{ cursor: 'pointer' }}
                            title={t.home.viewAll}
                        >
                            <BookOpen size={24} />
                            <div>
                                <span className="stat-value">{recipes.length}</span>
                                <span className="stat-label">{t.home.totalRecipes}</span>
                            </div>
                        </div>
                        <div
                            className="stat"
                            onClick={() => onFilterChange('ai')}
                            style={{ cursor: 'pointer' }}
                            title={t.home.aiGenerated}
                        >
                            <Sparkles size={24} />
                            <div>
                                <span className="stat-value">{recipes.filter(r => r.aiGenerated).length}</span>
                                <span className="stat-label">{t.home.aiGenerated}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hero-actions">
                    <button className="hero-btn primary" onClick={onNewRecipe}>
                        <ChefHat size={20} />
                        {recipes.length > 0 ? t.home.createOwn : t.home.createFirst}
                    </button>
                    <button className="hero-btn secondary" onClick={onAISuggestions}>
                        <Sparkles size={20} />
                        {t.home.getAISuggestion}
                    </button>
                </div>
            </section>

            {/* Recent Recipes */}
            {recentRecipes.length > 0 && (
                <section className="home-section">
                    <div className="section-header">
                        <div className="section-title">
                            <Clock size={22} />
                            <h2>{t.home.recentRecipes}</h2>
                        </div>
                        <button className="view-all-btn" onClick={onViewAll}>
                            {t.home.viewAll} <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="recipe-row">
                        {recentRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => onSelectRecipe(recipe)}
                                language={language}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Meals */}
            {quickRecipes.length > 0 && (
                <section className="home-section">
                    <div className="section-header">
                        <div className="section-title">
                            <TrendingUp size={22} />
                            <h2>{t.home.quickMealsSection}</h2>
                            <span className="badge">{t.home.under30}</span>
                        </div>
                    </div>
                    <div className="recipe-row">
                        {quickRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => onSelectRecipe(recipe)}
                                language={language}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* AI Generated */}
            {aiRecipes.length > 0 && (
                <section className="home-section">
                    <div className="section-header">
                        <div className="section-title">
                            <Sparkles size={22} />
                            <h2>{t.home.aiDiscoveries}</h2>
                        </div>
                        <button className="view-all-btn" onClick={onAISuggestions}>
                            {t.home.viewAll} <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="recipe-row">
                        {aiRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => onSelectRecipe(recipe)}
                                language={language}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {recipes.length === 0 && (
                <div className="home-empty">
                    <div className="empty-icon">
                        <ChefHat size={48} />
                    </div>
                    <h2>{t.home.noRecipes}</h2>
                    <p>{t.home.noRecipesDesc}</p>
                    <button className="hero-btn primary" onClick={onNewRecipe}>
                        <Plus size={20} />
                        {t.home.createFirst}
                    </button>
                </div>
            )}
        </div>
    );
}
