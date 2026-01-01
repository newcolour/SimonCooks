import { useState, useEffect } from 'react';
import type { Recipe } from './types';
import { useRecipes } from './hooks/useRecipes';
import { useSettings } from './hooks/useSettings';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeEditor } from './components/RecipeEditor';
import { Settings } from './components/Settings';
import { AISuggestions } from './components/AISuggestions';
import { WebImportModal } from './components/WebImportModal';
import { AppTour } from './components/AppTour';
import { ShoppingList } from './components/ShoppingList';
import { Fridge } from './components/Fridge';
import { BottomNav } from './components/BottomNav';
import './App.css';

type ViewType = 'home' | 'recipes' | 'ai-suggest' | 'settings' | 'shopping' | 'fridge';
type FilterType = 'all' | 'recent' | 'quick' | 'favorites' | 'lowcalorie' | 'food' | 'drink' | 'ai' | '5star';
type PanelType = 'detail' | 'editor' | 'none';

function App() {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe, deleteMultipleRecipes, importRecipes } = useRecipes();
  const { settings, updateAISettings, updateTheme, updateLanguage, resetSettings, importSettings } = useSettings();

  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [panelType, setPanelType] = useState<PanelType>('none');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [webImportOpen, setWebImportOpen] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [isFocusMode, setFocusMode] = useState(false);
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);

  // Tour is visible when settings are loaded, tour hasn't been completed, and user hasn't dismissed it this session
  const showTour = !loading && settings.tourCompleted === false && !tourDismissed;

  // Detect platform - add class for mobile-specific CSS
  useEffect(() => {
    const isMobile = !window.electronAPI && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.())
    );

    if (isMobile) {
      document.body.classList.add('mobile-platform');
    } else {
      document.body.classList.remove('mobile-platform');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const theme = settings.theme;

    const applyTheme = (themeName: string) => {
      document.documentElement.setAttribute('data-theme', themeName);
    };

    if (theme === 'system') {
      // Get current system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [settings.theme]);

  // Navigation handlers
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setFocusMode(false);
    if (view === 'recipes') {
      setCurrentFilter('all');
    } else {
      setSelectedRecipe(null);
      setPanelType('none');
    }
  };

  const handleNewRecipe = () => {
    setEditingRecipe(undefined);
    setPanelType('editor');
    if (currentView !== 'recipes') {
      setCurrentView('recipes');
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setPanelType('detail');
    if (currentView === 'home') {
      setCurrentView('recipes');
    }
  };

  const handleEditRecipe = () => {
    if (selectedRecipe) {
      setEditingRecipe(selectedRecipe);
      setPanelType('editor');
    }
  };

  const handleDeleteRecipe = async () => {
    if (selectedRecipe) {
      await deleteRecipe(selectedRecipe.id);
      setSelectedRecipe(null);
      setPanelType('none');
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    await deleteMultipleRecipes(ids);
    // Clear selection if selected recipe was deleted
    if (selectedRecipe && ids.includes(selectedRecipe.id)) {
      setSelectedRecipe(null);
      setPanelType('none');
    }
  };

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> | Recipe) => {
    if ('id' in recipeData) {
      await updateRecipe(recipeData);
    } else {
      const newRecipe = await createRecipe(recipeData);
      setSelectedRecipe(newRecipe);
    }
    setPanelType('detail');
  };

  const handleCancelEdit = () => {
    setPanelType(selectedRecipe ? 'detail' : 'none');
    setEditingRecipe(undefined);
  };

  const handleClosePanel = () => {
    setSelectedRecipe(null);
    setPanelType('none');
    setFocusMode(false);
  };

  const handleTourComplete = async (showAgain: boolean) => {
    setTourDismissed(true);
    // Save preference - inverse logic: if showAgain is false, tour is completed
    if (window.electronAPI?.settings) {
      await window.electronAPI.settings.set('tourCompleted', !showAgain);
    }
  };

  // Render main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home
            recipes={recipes}
            onSelectRecipe={handleSelectRecipe}
            onNewRecipe={handleNewRecipe}
            onViewAll={() => setCurrentView('recipes')}
            onAISuggestions={() => setCurrentView('ai-suggest')}
            onFilterChange={(filter) => {
              setCurrentView('recipes');
              setCurrentFilter(filter);
            }}
            language={settings.language || 'en'}
          />
        );
      case 'recipes':
        return (
          <RecipeList
            recipes={recipes}
            filter={currentFilter}
            selectedRecipeId={selectedRecipe?.id || null}
            onSelectRecipe={handleSelectRecipe}
            onDeleteMultiple={handleDeleteMultiple}
            loading={loading}
            language={settings.language || 'en'}
            onFilterChange={setCurrentFilter}
          />
        );
      case 'ai-suggest':
        return (
          <AISuggestions
            aiSettings={settings.ai}
            existingRecipes={recipes}
            onSaveRecipe={createRecipe}
            onConfigureAI={() => setCurrentView('settings')}
            language={settings.language || 'en'}
            initialIngredients={fridgeIngredients}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onUpdateAI={updateAISettings}
            onUpdateTheme={updateTheme}
            onUpdateLanguage={updateLanguage}
            onReset={resetSettings}
            recipes={recipes}
            onImportRecipes={importRecipes}
            onImportSettings={importSettings}
          />
        );
      case 'shopping':
        return (
          <ShoppingList
            aiSettings={settings.ai}
            language={settings.language || 'en'}
          />
        );
      case 'fridge':
        return (
          <Fridge
            recipes={recipes}
            aiSettings={settings.ai}
            language={settings.language || 'en'}
            onSelectRecipe={(recipe) => {
              handleSelectRecipe(recipe);
              setCurrentView('recipes');
            }}
            onGenerateWithAI={(ingredients) => {
              setFridgeIngredients(ingredients);
              setCurrentView('ai-suggest');
            }}
          />
        );
      default:
        return null;
    }
  };

  // Render right panel based on panel type
  const renderRightPanel = () => {
    if (currentView !== 'recipes') return null;

    switch (panelType) {
      case 'editor':
        return (
          <RecipeEditor
            recipe={editingRecipe}
            onSave={handleSaveRecipe}
            onCancel={handleCancelEdit}
            language={settings.language || 'en'}
          />
        );
      case 'detail':
        return (
          <RecipeDetail
            recipe={selectedRecipe}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
            onClose={handleClosePanel}
            onUpdateRecipe={async (recipe) => {
              await updateRecipe(recipe);
              setSelectedRecipe(recipe);
            }}
            onSaveNewRecipe={async (recipeData) => {
              const fullRecipe = {
                ...recipeData,
                type: recipeData.type || 'drink',
                aiGenerated: true
              };
              const newRecipe = await createRecipe(fullRecipe as any);
              setSelectedRecipe(newRecipe);
            }}
            aiSettings={settings.ai}
            language={settings.language || 'en'}
            isFocusMode={isFocusMode}
            onToggleFocus={() => setFocusMode(!isFocusMode)}
          />
        );
      default:
        return (
          <RecipeDetail
            recipe={null}
            onEdit={() => { }}
            onDelete={() => { }}
            onClose={() => { }}
            language={settings.language || 'en'}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        onNewRecipe={handleNewRecipe}
        onWebImport={() => setWebImportOpen(true)}
        recipeCount={recipes.length}
        language={settings.language || 'en'}
      />
      <BottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
        language={settings.language || 'en'}
      />
      <main className="app-main">
        <div className={`main-content ${currentView === 'recipes' && panelType !== 'none' ? 'with-panel' : ''} ${isFocusMode ? 'focus-hidden' : ''}`}>
          {renderMainContent()}
        </div>
        {currentView === 'recipes' && (
          <div className={`right-panel ${isFocusMode ? 'focus-expanded' : ''} ${panelType === 'none' ? 'panel-empty' : ''}`}>
            {renderRightPanel()}
          </div>
        )}
      </main>

      {/* Web Import Modal */}
      {webImportOpen && (
        <WebImportModal
          settings={settings}
          onClose={() => setWebImportOpen(false)}
          onImportComplete={async (importedRecipe) => {
            // Create a new recipe with imported data
            const newRecipe = await createRecipe({
              ...importedRecipe,
              title: importedRecipe.title || 'New Imported Recipe',
              ingredients: importedRecipe.ingredients || [],
              instructions: importedRecipe.instructions || '',
              allergens: importedRecipe.allergens || [],
              categories: importedRecipe.categories || [],
              aiGenerated: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as Recipe);
            setEditingRecipe(newRecipe);
            setPanelType('editor');
            setCurrentView('recipes');
          }}
        />
      )}

      {/* App Tour */}
      {showTour && (
        <AppTour
          language={settings.language}
          onComplete={handleTourComplete}
        />
      )}
    </div>
  );
}

export default App;
