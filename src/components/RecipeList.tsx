import { useState, useMemo } from 'react';
import type { Recipe } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { RecipeCard } from './RecipeCard';
import { Search, ChefHat, X, Grid, List, Clock, ChevronUp, ChevronDown, CheckSquare, Square, Trash2 } from 'lucide-react';
import './RecipeList.css';

type FilterType = 'all' | 'recent' | 'quick' | 'favorites' | 'lowcalorie' | 'food' | 'drink' | 'ai';
type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'cookingTime' | 'updatedAt' | 'calories';
type SortDirection = 'asc' | 'desc';

interface RecipeListProps {
    recipes: Recipe[];
    filter: FilterType;
    selectedRecipeId: string | null;
    onSelectRecipe: (recipe: Recipe) => void;
    onDeleteMultiple?: (ids: string[]) => Promise<void>;
    loading: boolean;
    language: Language;
}

export function RecipeList({
    recipes,
    filter,
    selectedRecipeId,
    onSelectRecipe,
    onDeleteMultiple,
    loading,
    language
}: RecipeListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortField, setSortField] = useState<SortField>('updatedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const t = getTranslation(language);

    // Low calorie threshold (per serving)


    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection(field === 'title' ? 'asc' : 'desc');
        }
    };

    // Helper to identify drinks even if labeled as food (legacy/migration)
    const isDrink = (r: Recipe) => {
        if (r.type === 'drink') return true;
        const keywords = ['cocktail', 'mocktail', 'smoothie', 'shake', 'coffee', 'tea', 'drink', 'bevanda', 'bevande', 'aperitif', 'digestif', 'liquor', 'alcolico'];
        return r.categories?.some(c => keywords.some(k => c.toLowerCase().includes(k)));
    };

    const filteredRecipes = useMemo(() => {
        let result = [...recipes];

        // Apply search (includes notes)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(query) ||
                r.description?.toLowerCase().includes(query) ||
                r.notes?.toLowerCase().includes(query) ||
                r.ingredients.some(i => i.name.toLowerCase().includes(query)) ||
                r.categories.some(c => c.toLowerCase().includes(query))
            );
        }

        // Apply filters
        switch (filter) {
            case 'recent':
                // Already sorted by date in default, just slice or keep?
                // The 'recent' filter usually implies "show all, sorted by date".
                // But the user might want explicitly "Recent" view. 
                // Typically 'recent' is just a sort order or default view.
                // Assuming 'recent' filter just passes through (as sort is applied after).
                result = result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);
                break;
            case 'quick':
                result = result.filter(r => {
                    const isFood = !isDrink(r);
                    return isFood && r.cookingTime && r.cookingTime <= 30;
                });
                break;
            case 'favorites':
                // result = result.filter(r => r.isFavorite); // If favorite implemented
                break;
            case 'lowcalorie':
                result = result.filter(r => {
                    const isFood = !isDrink(r);
                    const nutrition = (r as any).nutrition;
                    return isFood && nutrition?.calories && nutrition.calories < 500;
                });
                break;
            case 'food':
                result = result.filter(r => !isDrink(r));
                break;
            case 'drink':
                result = result.filter(r => isDrink(r));
                break;
            case 'ai':
                result = result.filter(r => r.aiGenerated);
                break;
            default:
                break;
        }

        // Apply sorting (only in list mode or for non-recent filter)
        if (filter !== 'recent') {
            result.sort((a, b) => {
                let comparison = 0;
                switch (sortField) {
                    case 'title':
                        comparison = a.title.localeCompare(b.title);
                        break;
                    case 'cookingTime':
                        {
                            const timeA = a.cookingTime || 0;
                            const timeB = b.cookingTime || 0;
                            comparison = timeA - timeB;
                        }
                        break;
                    case 'updatedAt':
                        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                        break;
                    case 'calories':
                        {
                            const calA = a.type === 'food' ? (a.nutrition?.calories || 0) : 0;
                            const calB = b.type === 'food' ? (b.nutrition?.calories || 0) : 0;
                            comparison = calA - calB;
                        }
                        break;
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [recipes, filter, searchQuery, sortField, sortDirection]);

    // Selection handlers
    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectedIds(new Set());
        }
        setSelectionMode(!selectionMode);
    };

    const toggleRecipeSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        setSelectedIds(new Set(filteredRecipes.map(r => r.id)));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0 || !onDeleteMultiple) return;

        const confirmed = window.confirm(t.common.deleteSelectedConfirm);
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await onDeleteMultiple(Array.from(selectedIds));
            setSelectedIds(new Set());
            setSelectionMode(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRecipeClick = (recipe: Recipe) => {
        if (selectionMode) {
            const newSelected = new Set(selectedIds);
            if (newSelected.has(recipe.id)) {
                newSelected.delete(recipe.id);
            } else {
                newSelected.add(recipe.id);
            }
            setSelectedIds(newSelected);
        } else {
            onSelectRecipe(recipe);
        }
    };

    return (
        <div className="recipe-list">
            {/* Selection Toolbar */}
            {selectionMode && (
                <div className="selection-toolbar">
                    <div className="selection-info">
                        <span className="selection-count">
                            {selectedIds.size} {t.common.selected}
                        </span>
                    </div>
                    <div className="selection-actions">
                        <button
                            className="selection-btn"
                            onClick={selectedIds.size === filteredRecipes.length ? deselectAll : selectAll}
                        >
                            {selectedIds.size === filteredRecipes.length ? (
                                <>
                                    <Square size={16} />
                                    {t.common.deselectAll}
                                </>
                            ) : (
                                <>
                                    <CheckSquare size={16} />
                                    {t.common.selectAll}
                                </>
                            )}
                        </button>
                        <button
                            className="selection-btn delete-btn"
                            onClick={handleDeleteSelected}
                            disabled={selectedIds.size === 0 || isDeleting}
                        >
                            <Trash2 size={16} />
                            {isDeleting ? '...' : t.common.deleteSelected}
                        </button>
                        <button
                            className="selection-btn cancel-btn"
                            onClick={toggleSelectionMode}
                        >
                            <X size={16} />
                            {t.common.cancelSelection}
                        </button>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="recipe-list-header">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder={t.common.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                            title="Clear search"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="header-actions">
                    {/* Selection Mode Toggle */}
                    {onDeleteMultiple && !selectionMode && filteredRecipes.length > 0 && (
                        <button
                            className={`selection-toggle-btn ${selectionMode ? 'active' : ''}`}
                            onClick={toggleSelectionMode}
                            title={t.common.select}
                        >
                            <CheckSquare size={18} />
                        </button>
                    )}
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title={language === 'it' ? 'Vista griglia' : 'Grid view'}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title={language === 'it' ? 'Vista elenco' : 'List view'}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Recipe Content */}
            <div className="recipe-list-content">
                {loading ? (
                    <div className="recipe-list-loading">
                        <div className="loading-spinner" />
                        <p>{t.common.loading}</p>
                    </div>
                ) : filteredRecipes.length === 0 ? (
                    <div className="recipe-list-empty">
                        <div className="empty-icon">
                            <ChefHat size={48} />
                        </div>
                        <h3>{t.common.noResults}</h3>
                        <p>
                            {searchQuery
                                ? t.common.noResults
                                : t.home.createFirst
                            }
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="recipe-grid">
                        {filteredRecipes.map(recipe => (
                            <div
                                key={recipe.id}
                                className={`recipe-card-wrapper ${selectionMode ? 'selection-mode' : ''} ${selectedIds.has(recipe.id) ? 'selected' : ''}`}
                            >
                                {selectionMode && (
                                    <button
                                        className="recipe-checkbox"
                                        onClick={(e) => toggleRecipeSelection(recipe.id, e)}
                                    >
                                        {selectedIds.has(recipe.id) ? (
                                            <CheckSquare size={22} />
                                        ) : (
                                            <Square size={22} />
                                        )}
                                    </button>
                                )}
                                <RecipeCard
                                    recipe={recipe}
                                    onClick={() => handleRecipeClick(recipe)}
                                    isSelected={recipe.id === selectedRecipeId}
                                    language={language}
                                    showCalories={filter === 'lowcalorie'}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="recipe-table">
                        <div className="recipe-table-header">
                            {selectionMode && (
                                <div className="table-header-cell checkbox-cell">
                                    <button
                                        className="header-checkbox"
                                        onClick={selectedIds.size === filteredRecipes.length ? deselectAll : selectAll}
                                    >
                                        {selectedIds.size === filteredRecipes.length ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </div>
                            )}
                            <button
                                className={`table-header-cell sortable ${sortField === 'title' ? 'active' : ''}`}
                                onClick={() => handleSort('title')}
                            >
                                {language === 'it' ? 'Nome' : 'Name'}
                                {sortField === 'title' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                            </button>
                            <button
                                className={`table-header-cell sortable ${sortField === 'cookingTime' ? 'active' : ''}`}
                                onClick={() => handleSort('cookingTime')}
                            >
                                <Clock size={14} />
                                {language === 'it' ? 'Tempo' : 'Time'}
                                {sortField === 'cookingTime' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                            </button>
                            <button
                                className={`table-header-cell sortable ${sortField === 'calories' ? 'active' : ''}`}
                                onClick={() => handleSort('calories')}
                            >
                                {language === 'it' ? 'Calorie' : 'Calories'}
                                {sortField === 'calories' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                            </button>
                            <div className="table-header-cell">
                                {language === 'it' ? 'Categorie' : 'Categories'}
                            </div>
                        </div>
                        <div className="recipe-table-body">
                            {filteredRecipes.map(recipe => (
                                <div
                                    key={recipe.id}
                                    className={`recipe-table-row ${recipe.id === selectedRecipeId ? 'selected' : ''} ${selectionMode && selectedIds.has(recipe.id) ? 'selection-selected' : ''}`}
                                    onClick={() => handleRecipeClick(recipe)}
                                >
                                    {selectionMode && (
                                        <div className="table-cell checkbox-cell">
                                            <button
                                                className="row-checkbox"
                                                onClick={(e) => toggleRecipeSelection(recipe.id, e)}
                                            >
                                                {selectedIds.has(recipe.id) ? (
                                                    <CheckSquare size={18} />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    <div className="table-cell recipe-name">
                                        {recipe.imageUrl && (
                                            <img src={recipe.imageUrl} alt="" className="recipe-thumb" />
                                        )}
                                        <span>{recipe.title}</span>
                                    </div>
                                    <div className="table-cell">
                                        {recipe.type === 'food' && recipe.cookingTime ? `${recipe.cookingTime} min` : '-'}
                                    </div>
                                    <div className="table-cell">
                                        {recipe.type === 'food' && recipe.nutrition?.calories ? `${recipe.nutrition.calories} kcal` : '-'}
                                    </div>
                                    <div className="table-cell categories">
                                        {recipe.categories.slice(0, 2).map((cat, idx) => (
                                            <span key={idx} className="category-tag">{cat}</span>
                                        ))}
                                        {recipe.categories.length > 2 && (
                                            <span className="more-categories">+{recipe.categories.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
