import {
    ChefHat,
    Home,
    BookOpen,
    Sparkles,
    Settings,
    Plus,
    Clock,
    Flame,
    Globe,
    Leaf,
    Utensils,
    Coffee,
    ShoppingCart,
    Refrigerator,
    Star
} from 'lucide-react';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import './Sidebar.css';

type ViewType = 'home' | 'recipes' | 'ai-suggest' | 'settings' | 'shopping' | 'fridge';
type FilterType = 'all' | 'recent' | 'quick' | 'favorites' | 'lowcalorie' | 'food' | 'drink' | 'ai' | '5star';

interface SidebarProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    currentFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    onNewRecipe: () => void;
    onWebImport: () => void;
    recipeCount: number;
    language: Language;
}

export function Sidebar({
    currentView,
    onViewChange,
    currentFilter,
    onFilterChange,
    onNewRecipe,
    onWebImport,
    recipeCount,
    language
}: SidebarProps) {
    const t = getTranslation(language);

    const navItems = [
        { id: 'home' as ViewType, icon: Home, label: t.nav.home },
        { id: 'recipes' as ViewType, icon: BookOpen, label: t.nav.recipes, count: recipeCount },
        { id: 'fridge' as ViewType, icon: Refrigerator, label: t.nav?.fridge || "What's in my Fridge?" },
        { id: 'ai-suggest' as ViewType, icon: Sparkles, label: t.nav.aiSuggestions },
        { id: 'shopping' as ViewType, icon: ShoppingCart, label: t.nav?.shopping || 'Shopping List' },
    ];

    const filterItems = [
        { id: 'food' as FilterType, icon: Utensils, label: t.recipe.food },
        { id: 'drink' as FilterType, icon: Coffee, label: t.recipe.drink },
        { id: '5star' as FilterType, icon: Star, label: '5 Stars' },
        { id: 'ai' as FilterType, icon: Sparkles, label: t.home.aiGenerated },
        { id: 'recent' as FilterType, icon: Clock, label: t.filters.recent },
        { id: 'quick' as FilterType, icon: Flame, label: t.filters.quick },
        { id: 'lowcalorie' as FilterType, icon: Leaf, label: t.filters.lowCalorie },
    ];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <ChefHat size={28} />
                    </div>
                    <span className="logo-text">SimonCooks</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="sidebar-actions">
                <button className="new-recipe-btn" onClick={onNewRecipe}>
                    <Plus size={20} />
                    <span>{t.nav.newRecipe}</span>
                </button>
                <button className="web-import-btn" onClick={onWebImport} title={t.recipe.importFromWeb}>
                    <Globe size={20} />
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-section-title">{t.common.menu}</span>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => onViewChange(item.id)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                            {item.count !== undefined && (
                                <span className="nav-count">{item.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {currentView === 'recipes' && (
                    <div className="nav-section">
                        <span className="nav-section-title">{t.common.filters}</span>
                        {filterItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-item ${currentFilter === item.id ? 'active' : ''}`}
                                onClick={() => onFilterChange(item.id)}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className={`nav-item settings-btn ${currentView === 'settings' ? 'active' : ''}`}
                    onClick={() => onViewChange('settings')}
                >
                    <Settings size={20} />
                    <span>{t.nav.settings}</span>
                </button>
                <div className="app-version">v1.0.0</div>
            </div>
        </aside>
    );
}
