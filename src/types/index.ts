export interface Ingredient {
    name: string;
    amount: string;
    unit: string;
}

export interface NutritionInfo {
    calories: number;
    protein?: number;    // grams
    carbs?: number;      // grams
    fat?: number;        // grams
    fiber?: number;      // grams
    sugar?: number;      // grams
    // Micronutrients
    sodium?: number;        // mg
    cholesterol?: number;   // mg
    saturatedFat?: number;  // grams
    vitaminA?: number;      // % daily value
    vitaminC?: number;      // % daily value
    calcium?: number;       // % daily value
    iron?: number;          // % daily value
}

export interface FlavorProfile {
    sweet: number;      // 0-10 scale
    salty: number;
    sour: number;
    bitter: number;
    umami: number;
    spicy: number;
}

export interface BaseRecipe {
    id: string;
    title: string;
    description?: string;
    ingredients: Ingredient[];
    instructions: string; // For drinks: "Step 1...", for food: same
    notes?: string;
    allergens: string[];
    categories: string[];
    imageUrl?: string;
    sourceUrl?: string;
    aiGenerated: boolean;
    aiReason?: string;
    createdAt: string;
    updatedAt: string;
    flavorProfile?: FlavorProfile;
}

export interface FoodRecipe extends BaseRecipe {
    type: 'food';
    cookingTime?: number; // in minutes
    servings?: number;
    nutrition?: NutritionInfo;
}

export interface AIVariants {
    virgin_version?: string; // Instructions or description for non-alcoholic version
    twist_version?: string;  // A creative variation
}

export interface DrinkRecipe extends BaseRecipe {
    type: 'drink';
    glassware: string;
    ice: 'Cubetti' | 'Tritato' | 'Sfera' | 'Nessuno' | string; // Allowing string for flexibility/import
    tools: string[];
    isAlcoholic: boolean;
    aiVariants?: AIVariants;
    cookingTime?: number; // Used for preparation time
    servings?: number; // Drinks can also have servings (e.g. 1 drink, or a pitcher)
    // Map prep time to something? utilizing BaseRecipe fields if needed, or just skipping cookingTime.
    // We will leave cookingTime out for drinks or make it optional in Base? 
    // The prompt requested cookingTime in FoodRecipe explicitly. 
    // I'll keep cookingTime in FoodRecipe only for now, but drinks have 'prep time'.
    // Maybe allow cookingTime in Base as optional? No, prompt specified split.
}

export type Recipe = FoodRecipe | DrinkRecipe;

export interface AIProvider {
    id: string;
    name: string;
    requiresApiKey: boolean;
    supportsImageGeneration: boolean;
}

export interface AISettings {
    provider: string;
    model?: string;
    apiKey?: string;
    ollamaEndpoint?: string;
    ollamaModel?: string;
    imageProvider?: string;
    imageModel?: string;
    imageApiKey?: string;
    cloudflareAccountId?: string;
    cloudflareApiToken?: string;
}

export interface AppSettings {
    ai: AISettings;
    theme: 'dark' | 'light' | 'system' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'slate' | 'lavender' | 'sand' | 'sky';
    language: 'en' | 'it';
    tourCompleted?: boolean;
}

// Electron API types
export interface ElectronAPI {
    recipe: {
        getAll: () => Promise<Recipe[]>;
        getById: (id: string) => Promise<Recipe | null>;
        create: (recipe: Recipe) => Promise<Recipe>;
        update: (recipe: Recipe) => Promise<Recipe>;
        delete: (id: string) => Promise<boolean>;
        search: (query: string) => Promise<Recipe[]>;
        searchByIngredient: (ingredient: string) => Promise<Recipe[]>;
    };
    settings: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<boolean>;
        getAll: () => Promise<Record<string, unknown>>;
    };
    platform: string;
    fetchUrl: (url: string) => Promise<string>;
    ai: {
        generateImage: (params: { provider: string; prompt: string; settings: AISettings }) => Promise<string>;
    };
}

// Extend Window interface
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

// This export is needed to make this file a module
export { };
