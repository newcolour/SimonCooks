// Internationalization (i18n) support for SimonCooks

export type Language = 'en' | 'it';

export interface Translations {
    // Navigation
    nav: {
        home: string;
        recipes: string;
        aiSuggestions: string;
        settings: string;
        newRecipe: string;
        shopping: string;
        fridge: string;
    };
    // Filters
    filters: {
        all: string;
        recent: string;
        quick: string;
        favorites: string;
        lowCalorie: string;
    };
    // Home
    home: {
        welcome: string;
        subtitle: string;
        totalRecipes: string;
        aiGenerated: string;
        quickMeals: string;
        browseRecipes: string;
        getAISuggestion: string;
        recentRecipes: string;
        quickMealsSection: string;
        aiDiscoveries: string;
        viewAll: string;
        noRecipes: string;
        noRecipesDesc: string;
        createFirst: string;
        createOwn: string;
        under30: string;
    };
    // Recipe
    recipe: {
        title: string;
        description: string;
        ingredients: string;
        instructions: string;
        cookingTime: string;
        servings: string;
        minutes: string;
        notes: string;
        categories: string;
        allergens: string;
        selectRecipe: string;
        selectRecipeDesc: string;
        edit: string;
        delete: string;
        deleteConfirm: string;
        save: string;
        saved: string;
        cancel: string;
        addIngredient: string;
        ingredientName: string;
        amount: string;
        unit: string;
        generateImage: string;
        generating: string;
        regenerateImage: string;
        importFromWeb: string;
        importing: string;
        pasteUrl: string;
        adjustServings: string;
        originalServings: string;
        winePairing: string;
        sourceUrl: string;
        suggestWine: string;
        suggestingWine: string;
        budget: string;
        midRange: string;
        luxury: string;
        region: string;
        whyItPairs: string;
        servingTips: string;
        translate: string;
        showOriginal: string;
        translating: string;
        nutrition: string;
        calories: string;
        protein: string;
        carbs: string;
        fat: string;
        fiber: string;
        sugar: string;
        perServing: string;
        lowCalorie: string;
        calculateNutrition: string;
        calculating: string;
        macronutrients: string;
        micronutrients: string;
        sodium: string;
        cholesterol: string;
        saturatedFat: string;
        vitaminA: string;
        vitaminC: string;
        calcium: string;
        iron: string;
        dailyValue: string;
        flavorProfile: string;
        calculateFlavor: string;
        sweet: string;
        salty: string;
        sour: string;
        bitter: string;
        umami: string;
        spicy: string;
        type: string;
        food: string;
        drink: string;
        glassware: string;
        ice: string;
        tools: string;
        isAlcoholic: string;
        prepTime: string;
        noIce: string;
        cubes: string;
        crushed: string;
        sphere: string;
        variants: string;
        virgin: string;
        twist: string;
    };
    // AI Suggestions
    ai: {
        title: string;
        subtitle: string;
        generate: string;
        generating: string;
        saveRecipe: string;
        generateImage: string;
        configureFirst: string;
        configureSettings: string;
        noApiKey: string;
        basedOn: string;
        includeIngredients: string;
        enterIngredient: string;
        chefMode: string;
        chefModeDesc: string;
        inspirationMode: string;
        inspirationModeDesc: string;
        mustAddIngredients: string;
        dishType: string;
        drinkType: string;
        flavorProfile: string;
        flavorProfilePlaceholder: string;
        dishTypes: {
            any: string;
            appetizer: string;
            firstCourse: string;
            mainCourse: string;
            side: string;
            dessert: string;
            kids: string;
            romantic: string;
            party: string;
            quick: string;
            vegan: string;
            vegetarian: string;
            glutenFree: string;
            cocktail: string;
            mocktail: string;
            smoothie: string;
            shake: string;
            coffeeTea: string;
        };
    };
    // Settings
    settings: {
        title: string;
        subtitle: string;
        aiProvider: string;
        aiProviderDesc: string;
        apiKey: string;
        getApiKey: string;
        model: string;
        ollamaEndpoint: string;
        ollamaModel: string;
        refresh: string;
        noModels: string;
        imageGeneration: string;
        imageGenerationDesc: string;
        imageApiKey: string;
        imageModel: string;
        appearance: string;
        appearanceDesc: string;
        theme: string;
        dark: string;
        light: string;
        system: string;
        language: string;
        languageDesc: string;
        save: string;
        saving: string;
        saved: string;
        reset: string;
    };
    // Common
    common: {
        loading: string;
        error: string;
        search: string;
        searchPlaceholder: string;
        noResults: string;
        close: string;
        menu: string;
        filters: string;
        add: string;
        select: string;
        selectAll: string;
        deselectAll: string;
        selected: string;
        deleteSelected: string;
        deleteSelectedConfirm: string;
        cancelSelection: string;
    };
    // Web Import
    webImport: {
        title: string;
        subtitle: string;
        urlPlaceholder: string;
        import: string;
        importing: string;
        success: string;
        error: string;
    };
    // Shopping List
    shopping: {
        title: string;
        subtitle: string;
        addPlaceholder: string;
        aiMergeHint: string;
        itemsChecked: string;
        emptyList: string;
        emptyListHint: string;
        clearChecked: string;
        clearAll: string;
        clearAllConfirm: string;
        addedToList: string;
        completed: string;
        movedToCompleted: string;
    };
    // Fridge
    fridge: {
        title: string;
        subtitle: string;
        inputPlaceholder: string;
        resultsTitle: string;
        matched: string;
        missing: string;
        noMatches: string;
        generateWithAI: string;
        wantSomethingNew: string;
        generateNew: string;
        emptyTitle: string;
        emptySubtitle: string;
    };
    // Cooking Mode
    cooking: {
        start: string;
        step: string;
        ingredients: string;
        speak: string;
        listening: string;
        askPlaceholder: string;
        close: string;
        completed: string;
        enjoy: string;
        next: string;
        prev: string;
    };
}

export const translations: Record<Language, Translations> = {
    en: {
        nav: {
            home: 'Home',
            recipes: 'All Recipes',
            aiSuggestions: 'AI Suggestions',
            settings: 'Settings',
            newRecipe: 'New Recipe',
            shopping: 'Shopping List',
            fridge: "What's in my Fridge?",
        },
        filters: {
            all: 'All',
            recent: 'Recent',
            quick: 'Quick Meals',
            favorites: 'Favorites',
            lowCalorie: 'Low Calorie',
        },
        home: {
            welcome: 'Welcome to SimonCooks',
            subtitle: 'Your personal recipe assistant powered by AI',
            totalRecipes: 'Total Recipes',
            aiGenerated: 'AI Generated',
            quickMeals: 'Quick Meals',
            browseRecipes: 'Browse Recipes',
            getAISuggestion: 'Get AI Suggestion',
            recentRecipes: 'Recent Recipes',
            quickMealsSection: 'Quick Meals',
            aiDiscoveries: 'AI Discoveries',
            viewAll: 'View All',
            noRecipes: 'No recipes yet',
            noRecipesDesc: 'Start building your recipe collection',
            createFirst: 'Create Your First Recipe',
            createOwn: 'Create Your Own Recipe',
            under30: 'Under 30 min',
        },
        recipe: {
            title: 'Title',
            description: 'Description',
            ingredients: 'Ingredients',
            instructions: 'Instructions',
            cookingTime: 'Cooking Time',
            servings: 'Servings',
            minutes: 'minutes',
            notes: 'Notes',
            categories: 'Categories',
            allergens: 'Allergens',
            selectRecipe: 'Select a recipe',
            selectRecipeDesc: 'Choose a recipe from the list to view its details',
            edit: 'Edit',
            delete: 'Delete',
            deleteConfirm: 'Are you sure you want to delete',
            save: 'Save Recipe',
            saved: 'Recipe saved',
            cancel: 'Cancel',
            addIngredient: 'Add Ingredient',
            ingredientName: 'Ingredient name',
            amount: 'Amount',
            unit: 'Unit',
            generateImage: 'Generate Image',
            generating: 'Generating...',
            regenerateImage: 'Regenerate image',
            importFromWeb: 'Import from Web',
            importing: 'Importing...',
            pasteUrl: 'Paste recipe URL',
            adjustServings: 'Adjust servings',
            originalServings: 'Original',
            winePairing: 'Wine Pairing',
            sourceUrl: 'Original Recipe',
            suggestWine: 'Suggest Wine',
            suggestingWine: 'Finding the perfect wine...',
            budget: 'Budget',
            midRange: 'Mid-Range',
            luxury: 'Luxury',
            region: 'Region',
            whyItPairs: 'Why it pairs',
            servingTips: 'Serving Tips',
            translate: 'Translate Recipe',
            showOriginal: 'Show Original',
            translating: 'Translating...',
            nutrition: 'Nutrition',
            calories: 'Calories',
            protein: 'Protein',
            carbs: 'Carbs',
            fat: 'Fat',
            fiber: 'Fiber',
            sugar: 'Sugar',
            perServing: 'per serving',
            lowCalorie: 'Low Calorie',
            calculateNutrition: 'Calculate Nutrition',
            calculating: 'Calculating...',
            macronutrients: 'Macronutrients',
            micronutrients: 'Micronutrients',
            sodium: 'Sodium',
            cholesterol: 'Cholesterol',
            saturatedFat: 'Sat. Fat',
            vitaminA: 'Vitamin A',
            vitaminC: 'Vitamin C',
            calcium: 'Calcium',
            iron: 'Iron',
            dailyValue: '% Daily Value',
            flavorProfile: 'Flavor Profile',
            calculateFlavor: 'Analyze Flavor',
            sweet: 'Sweet',
            salty: 'Salty',
            sour: 'Sour',
            bitter: 'Bitter',
            umami: 'Umami',
            spicy: 'Spicy',
            type: 'Type',
            food: 'Food',
            drink: 'Drink',
            glassware: 'Glassware',
            ice: 'Ice',
            tools: 'Tools',
            isAlcoholic: 'Alcoholic?',
            prepTime: 'Prep Time',
            noIce: 'None',
            cubes: 'Cubes',
            crushed: 'Crushed',
            sphere: 'Sphere',
            variants: 'Variants',
            virgin: 'Virgin Version',
            twist: 'Twist Version',
        },
        ai: {
            title: 'AI Recipe Suggestions',
            subtitle: 'Let AI inspire your next culinary adventure',
            generate: 'Generate Suggestion',
            generating: 'Creating your recipe...',
            saveRecipe: 'Save Recipe',
            generateImage: 'Generate Image',
            configureFirst: 'Configure AI settings first',
            configureSettings: 'Go to Settings',
            noApiKey: 'API key required',
            basedOn: 'Based on your existing recipes',
            includeIngredients: 'Include Ingredients (Optional)',
            enterIngredient: 'Enter an ingredient and press Enter...',
            chefMode: 'Chef Mode',
            chefModeDesc: 'Create a recipe using specific ingredients',
            inspirationMode: 'Inspiration',
            inspirationModeDesc: 'Get suggestions based on your collection',
            mustAddIngredients: 'Please add at least one ingredient for Chef Mode',
            dishType: 'Dish Type',
            drinkType: 'Drink Type',
            flavorProfile: 'Flavor Profile (Optional)',
            flavorProfilePlaceholder: 'e.g., spicy, sweet, smoky, tangy, umami-rich...',
            dishTypes: {
                any: 'Any',
                appetizer: 'Appetizer',
                firstCourse: 'Pasta / First Course',
                mainCourse: 'Main Course',
                side: 'Side Dish',
                dessert: 'Dessert',
                kids: '👶 Kids Friendly',
                romantic: '💕 Romantic Dinner',
                party: '🎉 Large Party',
                quick: '⚡ Quick & Easy',
                vegan: '🌱 Vegan',
                vegetarian: '🥬 Vegetarian',
                glutenFree: '🌾 Gluten Free',
                cocktail: '🍸 Cocktail',
                mocktail: '🍹 Mocktail / Alcohol Free',
                smoothie: '🥤 Smoothie',
                shake: '🍦 Milkshake',
                coffeeTea: '☕ Coffee / Tea',
            },
        },
        settings: {
            title: 'Settings',
            subtitle: 'Configure your AI providers and preferences',
            aiProvider: 'AI Provider',
            aiProviderDesc: 'Select your preferred AI service for recipe suggestions',
            apiKey: 'API Key',
            getApiKey: 'Get API Key',
            model: 'Model',
            ollamaEndpoint: 'Ollama Endpoint',
            ollamaModel: 'Model',
            refresh: 'Refresh',
            noModels: 'No models found. Make sure Ollama is running.',
            imageGeneration: 'Image Generation',
            imageGenerationDesc: 'Configure AI image generation for recipes',
            imageApiKey: 'Image API Key',
            imageModel: 'Image Model',
            appearance: 'Appearance',
            appearanceDesc: 'Customize the look and feel of the app',
            theme: 'Theme',
            dark: 'Dark',
            light: 'Light',
            system: 'System',
            language: 'Language',
            languageDesc: 'Select your preferred language',
            save: 'Save Settings',
            saving: 'Saving...',
            saved: 'Settings saved successfully',
            reset: 'Reset to Defaults',
        },
        common: {
            loading: 'Loading...',
            error: 'Error',
            search: 'Search',
            searchPlaceholder: 'Search recipes...',
            noResults: 'No results found',
            close: 'Close',
            menu: 'Menu',
            filters: 'Filters',
            add: 'Add',
            select: 'Select',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            selected: 'selected',
            deleteSelected: 'Delete Selected',
            deleteSelectedConfirm: 'Are you sure you want to delete the selected recipes? This cannot be undone.',
            cancelSelection: 'Cancel',
        },
        webImport: {
            title: 'Import Recipe from Web',
            subtitle: 'Paste a URL to import a recipe',
            urlPlaceholder: 'https://example.com/recipe',
            import: 'Import Recipe',
            importing: 'Importing recipe...',
            success: 'Recipe imported successfully!',
            error: 'Failed to import recipe',
        },
        shopping: {
            title: 'Shopping List',
            subtitle: 'Your smart, AI-powered shopping list',
            addPlaceholder: 'Add item...',
            aiMergeHint: 'AI will merge duplicates automatically',
            itemsChecked: 'checked',
            emptyList: 'Your shopping list is empty',
            emptyListHint: 'Add items above or from any recipe',
            clearChecked: 'Clear Checked',
            clearAll: 'Clear All',
            clearAllConfirm: 'Clear entire shopping list?',
            addedToList: 'Added to shopping list',
            completed: 'Completed Items',
            movedToCompleted: 'Moved to completed',
        },
        fridge: {
            title: "What's in my Fridge?",
            subtitle: 'Enter ingredients you have and find matching recipes',
            inputPlaceholder: 'Type an ingredient...',
            resultsTitle: 'Matching Recipes',
            matched: 'matched',
            missing: 'needed',
            noMatches: 'No matching recipes found',
            generateWithAI: 'Generate Recipe with AI',
            wantSomethingNew: 'Want something new?',
            generateNew: 'Create New Recipe with AI',
            emptyTitle: 'Start by adding ingredients',
            emptySubtitle: "Enter what you have in your fridge and we'll find recipes you can make",
        },
        cooking: {
            start: 'Start Cooking',
            step: 'Step',
            ingredients: 'Ingredients',
            speak: 'Read aloud',
            listening: 'Listening...',
            askPlaceholder: 'Ask a question about this step or recipe...',
            close: 'Exit Cooking Mode',
            completed: 'All steps completed!',
            enjoy: 'Enjoy your meal!',
            next: 'Next',
            prev: 'Previous',
        },
    },
    it: {
        nav: {
            home: 'Home',
            recipes: 'Tutte le Ricette',
            aiSuggestions: 'Suggerimenti IA',
            settings: 'Impostazioni',
            newRecipe: 'Nuova Ricetta',
            shopping: 'Lista della Spesa',
            fridge: 'Cosa ho in Frigo?',
        },
        filters: {
            all: 'Tutte',
            recent: 'Recenti',
            quick: 'Veloci',
            favorites: 'Preferite',
            lowCalorie: 'Basso Contenuto Calorico',
        },
        home: {
            welcome: 'Benvenuto su SimonCooks',
            subtitle: 'Il tuo assistente personale per ricette con IA',
            totalRecipes: 'Ricette Totali',
            aiGenerated: 'Generate dall\'IA',
            quickMeals: 'Piatti Veloci',
            browseRecipes: 'Sfoglia Ricette',
            getAISuggestion: 'Ottieni Suggerimento IA',
            recentRecipes: 'Ricette Recenti',
            quickMealsSection: 'Piatti Veloci',
            aiDiscoveries: 'Scoperte IA',
            viewAll: 'Vedi Tutte',
            noRecipes: 'Nessuna ricetta',
            noRecipesDesc: 'Inizia a costruire la tua collezione di ricette',
            createFirst: 'Crea la Tua Prima Ricetta',
            createOwn: 'Crea la Tua Ricetta',
            under30: 'Meno di 30 min',
        },
        recipe: {
            title: 'Titolo',
            description: 'Descrizione',
            ingredients: 'Ingredienti',
            instructions: 'Istruzioni',
            cookingTime: 'Tempo di Cottura',
            servings: 'Porzioni',
            minutes: 'minuti',
            notes: 'Note',
            categories: 'Categorie',
            allergens: 'Allergeni',
            selectRecipe: 'Seleziona una ricetta',
            selectRecipeDesc: 'Scegli una ricetta dalla lista per vedere i dettagli',
            edit: 'Modifica',
            delete: 'Elimina',
            deleteConfirm: 'Sei sicuro di voler eliminare',
            save: 'Salva Ricetta',
            saved: 'Ricetta salvata',
            cancel: 'Annulla',
            addIngredient: 'Aggiungi Ingrediente',
            ingredientName: 'Nome ingrediente',
            amount: 'Quantità',
            unit: 'Unità',
            generateImage: 'Genera Immagine',
            generating: 'Generazione...',
            regenerateImage: 'Rigenera immagine',
            importFromWeb: 'Importa dal Web',
            importing: 'Importazione...',
            pasteUrl: 'Incolla URL ricetta',
            adjustServings: 'Regola porzioni',
            originalServings: 'Originale',
            winePairing: 'Abbinamento Vino',
            sourceUrl: 'Ricetta Originale',
            suggestWine: 'Suggerisci Vino',
            suggestingWine: 'Cerco il vino perfetto...',
            budget: 'Economico',
            midRange: 'Fascia Media',
            luxury: 'Lusso',
            region: 'Regione',
            whyItPairs: 'Perché si abbina',
            servingTips: 'Consigli di Servizio',
            translate: 'Traduci Ricetta',
            showOriginal: 'Mostra Originale',
            translating: 'Traduzione in corso...',
            nutrition: 'Valori Nutrizionali',
            calories: 'Calorie',
            protein: 'Proteine',
            carbs: 'Carboidrati',
            fat: 'Grassi',
            fiber: 'Fibre',
            sugar: 'Zuccheri',
            perServing: 'per porzione',
            lowCalorie: 'Basso Contenuto Calorico',
            calculateNutrition: 'Calcola Nutrienti',
            calculating: 'Calcolo in corso...',
            macronutrients: 'Macronutrienti',
            micronutrients: 'Micronutrienti',
            sodium: 'Sodio',
            cholesterol: 'Colesterolo',
            saturatedFat: 'Grassi Sat.',
            vitaminA: 'Vitamina A',
            vitaminC: 'Vitamina C',
            calcium: 'Calcio',
            iron: 'Ferro',
            dailyValue: '% Valore Giorn.',
            flavorProfile: 'Profilo Sapori',
            calculateFlavor: 'Analizza Sapori',
            sweet: 'Dolce',
            salty: 'Salato',
            sour: 'Acido',
            bitter: 'Amaro',
            umami: 'Umami',
            spicy: 'Piccante',
            type: 'Tipo',
            food: 'Cibo',
            drink: 'Bevanda',
            glassware: 'Bicchiere',
            ice: 'Ghiaccio',
            tools: 'Strumenti',
            isAlcoholic: 'Alcolico?',
            prepTime: 'Tempo Prepara.',
            noIce: 'Nessuno',
            cubes: 'Cubetti',
            crushed: 'Tritato',
            sphere: 'Sfera',
            variants: 'Varianti',
            virgin: 'Versione Analcolica',
            twist: 'Twist / Variante',
        },
        ai: {
            title: 'Suggerimenti Ricette IA',
            subtitle: 'Lascia che l\'IA ispiri la tua prossima avventura culinaria',
            generate: 'Genera Suggerimento',
            generating: 'Creazione ricetta...',
            saveRecipe: 'Salva Ricetta',
            generateImage: 'Genera Immagine',
            configureFirst: 'Configura prima le impostazioni IA',
            configureSettings: 'Vai alle Impostazioni',
            noApiKey: 'Chiave API richiesta',
            basedOn: 'Basato sulle tue ricette esistenti',
            includeIngredients: 'Includi Ingredienti (Opzionale)',
            enterIngredient: 'Inserisci un ingrediente e premi Invio...',
            chefMode: 'Modalità Chef',
            chefModeDesc: 'Crea una ricetta usando ingredienti specifici',
            inspirationMode: 'Ispirazione',
            inspirationModeDesc: 'Ottieni suggerimenti basati sulla tua collezione',
            mustAddIngredients: 'Aggiungi almeno un ingrediente per la Modalità Chef',
            dishType: 'Tipo di Piatto',
            drinkType: 'Tipo di Bevanda',
            flavorProfile: 'Profilo Sapori (Opzionale)',
            flavorProfilePlaceholder: 'es., piccante, dolce, affumicato, acidulo, ricco di umami...',
            dishTypes: {
                any: 'Qualsiasi',
                appetizer: 'Antipasto',
                firstCourse: 'Pasta / Primo Piatto',
                mainCourse: 'Secondo Piatto',
                side: 'Contorno',
                dessert: 'Dolce',
                kids: '👶 Per Bambini',
                romantic: '💕 Cena Romantica',
                party: '🎉 Grandi Feste',
                quick: '⚡ Veloce e Facile',
                vegan: '🌱 Vegano',
                vegetarian: '🥬 Vegetariano',
                glutenFree: '🌾 Senza Glutine',
                cocktail: '🍸 Cocktail',
                mocktail: '🍹 Mocktail / Analcolico',
                smoothie: '🥤 Smoothie / Frullato',
                shake: '🍦 Milkshake',
                coffeeTea: '☕ Caffè / Tè',
            },
        },
        settings: {
            title: 'Impostazioni',
            subtitle: 'Configura i provider IA e le preferenze',
            aiProvider: 'Provider IA',
            aiProviderDesc: 'Seleziona il servizio IA preferito per i suggerimenti',
            apiKey: 'Chiave API',
            getApiKey: 'Ottieni Chiave API',
            model: 'Modello',
            ollamaEndpoint: 'Endpoint Ollama',
            ollamaModel: 'Modello',
            refresh: 'Aggiorna',
            noModels: 'Nessun modello trovato. Assicurati che Ollama sia in esecuzione.',
            imageGeneration: 'Generazione Immagini',
            imageGenerationDesc: 'Configura la generazione di immagini IA per le ricette',
            imageApiKey: 'Chiave API Immagini',
            imageModel: 'Modello Immagini',
            appearance: 'Aspetto',
            appearanceDesc: 'Personalizza l\'aspetto dell\'app',
            theme: 'Tema',
            dark: 'Scuro',
            light: 'Chiaro',
            system: 'Sistema',
            language: 'Lingua',
            languageDesc: 'Seleziona la lingua preferita',
            save: 'Salva Impostazioni',
            saving: 'Salvataggio...',
            saved: 'Impostazioni salvate con successo',
            reset: 'Ripristina Predefiniti',
        },
        common: {
            loading: 'Caricamento...',
            error: 'Errore',
            search: 'Cerca',
            searchPlaceholder: 'Cerca ricette...',
            noResults: 'Nessun risultato trovato',
            close: 'Chiudi',
            menu: 'Menu',
            filters: 'Filtri',
            add: 'Aggiungi',
            select: 'Seleziona',
            selectAll: 'Seleziona Tutto',
            deselectAll: 'Deseleziona Tutto',
            selected: 'selezionate',
            deleteSelected: 'Elimina Selezionate',
            deleteSelectedConfirm: 'Sei sicuro di voler eliminare le ricette selezionate? Questa azione non può essere annullata.',
            cancelSelection: 'Annulla',
        },
        webImport: {
            title: 'Importa Ricetta dal Web',
            subtitle: 'Incolla un URL per importare una ricetta',
            urlPlaceholder: 'https://esempio.com/ricetta',
            import: 'Importa Ricetta',
            importing: 'Importazione ricetta...',
            success: 'Ricetta importata con successo!',
            error: 'Impossibile importare la ricetta',
        },
        shopping: {
            title: 'Lista della Spesa',
            subtitle: 'La tua lista della spesa intelligente con IA',
            addPlaceholder: 'Aggiungi articolo...',
            aiMergeHint: 'L\'IA unirà automaticamente i duplicati',
            itemsChecked: 'selezionati',
            emptyList: 'La tua lista della spesa è vuota',
            emptyListHint: 'Aggiungi articoli sopra o da qualsiasi ricetta',
            clearChecked: 'Rimuovi Selezionati',
            clearAll: 'Svuota Tutto',
            clearAllConfirm: 'Svuotare l\'intera lista della spesa?',
            addedToList: 'Aggiunto alla lista della spesa',
            completed: 'Articoli Completati',
            movedToCompleted: 'Spostato nei completati',
        },
        fridge: {
            title: 'Cosa ho in Frigo?',
            subtitle: 'Inserisci gli ingredienti che hai e trova ricette corrispondenti',
            inputPlaceholder: 'Scrivi un ingrediente...',
            resultsTitle: 'Ricette Corrispondenti',
            matched: 'corrispondenti',
            missing: 'mancanti',
            noMatches: 'Nessuna ricetta corrispondente trovata',
            generateWithAI: 'Genera Ricetta con IA',
            wantSomethingNew: 'Vuoi qualcosa di nuovo?',
            generateNew: 'Crea Nuova Ricetta con IA',
            emptyTitle: 'Inizia aggiungendo ingredienti',
            emptySubtitle: 'Inserisci cosa hai in frigo e troveremo le ricette che puoi preparare',
        },
        cooking: {
            start: 'Inizia a Cucinare',
            step: 'Passo',
            ingredients: 'Ingredienti',
            speak: 'Leggi ad alta voce',
            listening: 'Ascolto...',
            askPlaceholder: 'Fai una domanda su questo passo o sulla ricetta...',
            close: 'Esci dalla Modalità Cucina',
            completed: 'Tutti i passi completati!',
            enjoy: 'Buon appetito!',
            next: 'Avanti',
            prev: 'Indietro',
        },
    },
};

// Get translation helper
export function getTranslation(language: Language): Translations {
    return translations[language] || translations.en;
}

// Language names for display
export const LANGUAGES = [
    { id: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { id: 'it' as Language, name: 'Italiano', flag: '🇮🇹' },
];
