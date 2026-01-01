import type { Recipe, AISettings, Ingredient } from '../types';

export const AI_PROVIDERS = [
    { id: 'openai', name: 'OpenAI (GPT-4)', requiresApiKey: true, supportsImageGeneration: true },
    { id: 'anthropic', name: 'Anthropic (Claude)', requiresApiKey: true, supportsImageGeneration: false },
    { id: 'gemini', name: 'Google Gemini', requiresApiKey: true, supportsImageGeneration: true },
    { id: 'ollama', name: 'Ollama (Local)', requiresApiKey: false, supportsImageGeneration: false },
];

// Available models for each provider
export const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o (Latest)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Faster)' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Cheapest)' },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest)' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Faster)' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Smartest)' },
    ],
    gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Faster)' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
    ],
};

export const IMAGE_PROVIDERS = [
    { id: 'pollinations', name: 'Pollinations.ai (Free Tier available)', requiresApiKey: true },
    { id: 'openai', name: 'DALL-E (OpenAI)', requiresApiKey: true },
    { id: 'gemini', name: 'Imagen (Google)', requiresApiKey: true },
    { id: 'stability', name: 'Stability AI', requiresApiKey: true },
    { id: 'cloudflare', name: 'Cloudflare Workers AI (Flux)', requiresApiKey: true },
];

// Available image models for each provider
export const IMAGE_MODELS: Record<string, { id: string; name: string }[]> = {
    pollinations: [
        { id: 'flux', name: 'Flux (Best Quality)' },
        { id: 'turbo', name: 'Turbo (Faster)' },
    ],
    openai: [
        { id: 'dall-e-3', name: 'DALL-E 3 (Best Quality)' },
        { id: 'dall-e-2', name: 'DALL-E 2 (Faster/Cheaper)' },
    ],
    gemini: [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
    ],
    stability: [
        { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0' },
        { id: 'stable-diffusion-v1-6', name: 'SD 1.6' },
        { id: 'stable-image-ultra', name: 'Stable Image Ultra' },
        { id: 'stable-image-core', name: 'Stable Image Core' },
    ],
    cloudflare: [
        { id: '@cf/black-forest-labs/flux-1-schnell', name: 'Flux-1 Schnell (Fastest)' },
    ],
};

// Ollama model interface
export interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

// Fetch available models from Ollama
export async function fetchOllamaModels(endpoint: string = 'http://localhost:11434'): Promise<OllamaModel[]> {
    try {
        const response = await fetch(`${endpoint}/api/tags`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Ollama models');
        }

        const data = await response.json();
        return data.models || [];
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

// Analyze fridge image using multimodal Ollama model (Android only)
export async function analyzeFridgeImage(
    settings: AISettings,
    imageBase64: string,
    language: string = 'en'
): Promise<{ ingredients: string[], debug: string }> {
    // We allow trying even if provider is not 'ollama', assuming the user has an Ollama instance accessible.
    // This supports 'Hybrid' setups (e.g. Gemini for Text, Ollama for Vision).
    const endpoint = settings.ollamaEndpoint || 'http://localhost:11434';

    // On Android, localhost won't work unless running on device. 
    // We proceed and let the fetch fail if unreachable.
    // Use the configured model or default to gemma3:12b for multimodal
    const model = settings.ollamaModel || 'gemma3:12b';

    // Balanced anti-hallucination prompt
    const systemPrompt = language === 'it'
        ? `Sei un assistente che analizza foto di frigo/dispensa. REGOLE:
1. Elenca gli ingredienti che puoi VEDERE CHIARAMENTE nell'immagine
2. Includi solo cibi riconoscibili e identificabili
3. NON inventare ingredienti che non vedi
4. Se vedi contenitori/bottiglie senza etichetta chiara, prova a identificare il contenuto dal contesto
5. Restituisci un array JSON di stringhe

Esempio: ["pomodori", "latte", "uova", "formaggio", "olio"]`
        : `You are an assistant analyzing fridge/pantry photos. RULES:
1. List ingredients you can CLEARLY SEE in the image
2. Include only recognizable and identifiable foods
3. Do NOT invent ingredients you don't see
4. If you see containers/bottles without clear labels, try to identify contents from context
5. Return a JSON array of strings

Example: ["tomatoes", "milk", "eggs", "cheese", "oil"]`;

    try {
        console.log(`Analyzing image with model: ${model} at ${endpoint}`);

        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: systemPrompt,
                images: [imageBase64], // Ollama multimodal format
                stream: false,
                format: "json",
                options: {
                    temperature: settings.visionTemperature ?? 0.3,  // User-configurable, default 0.3
                    top_p: 0.9,
                    num_predict: 150   // Allow slightly longer responses
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ollama API error:', errorText);
            throw new Error(`Failed to analyze image (Status ${response.status}): ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        const responseText = data.response;

        console.log('Raw AI Response:', responseText);

        // Parse the JSON array from the response
        try {
            // Try to extract JSON array from response
            const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                const ingredients = JSON.parse(jsonMatch[0]);
                if (Array.isArray(ingredients)) {
                    return {
                        ingredients: ingredients.map((ing: string) => ing.toLowerCase().trim()),
                        debug: `Model: ${model}\nResponse: ${responseText}`
                    };
                }
            }

            // If we got here, we found a match but it wasn't an array, or no match
            return {
                ingredients: [],
                debug: `Model: ${model}\nRaw Response (Parse Failed): ${responseText}`
            };

        } catch (parseError) {
            console.error('Error parsing ingredients:', parseError);
            return {
                ingredients: [],
                debug: `Model: ${model}\nParse Error: ${parseError}\nRaw Response: ${responseText}`
            };
        }
    } catch (error) {
        console.error('Error analyzing fridge image:', error);
        throw error;
    }
}

export interface SuggestedRecipe {
    title: string;
    description: string;
    ingredients: Ingredient[];
    instructions: string;
    // Food specific
    cookingTime?: number;
    servings?: number;
    nutrition?: {
        calories: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        fiber?: number;
        sugar?: number;
    };
    // Drink specific
    glassware?: string;
    ice?: string;
    tools?: string[];
    isAlcoholic?: boolean;
    aiVariants?: {
        virgin_version?: string;
        twist_version?: string;
    };
    // Common
    allergens: string[];
    categories: string[];
    aiReason?: string;
    type?: 'food' | 'drink';
}

const RECIPE_SUGGESTION_PROMPT = `You are a creative chef assistant. Based on the user's existing recipes, suggest a new unique recipe that complements their cooking style and preferences.

Analyze their recipes and suggest something new that:
1. Uses similar ingredients they already work with
2. Matches their cuisine preferences
3. Offers something different but achievable with their skill level

Respond ONLY with valid JSON in this exact format:
{
  "title": "Recipe Name",
  "description": "Brief appetizing description",
  "aiReason": "Explain in 2-3 sentences why you created this recipe. Mention flavor profiles, texture combinations, ingredient synergies, or cooking techniques that make this dish special.",
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup"}
  ],
  "instructions": "Step 1: First instruction.\\nStep 2: Second instruction.\\nStep 3: Third instruction.",
  "cookingTime": 30,
  "servings": 4,
  "allergens": ["dairy", "gluten"],
  "categories": ["Italian", "Dinner"],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 45,
    "fat": 18,
    "fiber": 5,
    "sugar": 8
  },
  "type": "food"
}

IMPORTANT: 
1. In the instructions field, each step MUST be on a separate line (use \\n between steps). Number each step.
2. Always estimate nutrition values per serving (calories, protein, carbs, fat in grams).
3. The aiReason should explain your culinary thinking - why these ingredients work together, what makes the texture or flavor profile appealing.`;

const DRINK_SYSTEM_PROMPT = `You are an expert mixologist.
Generate a JSON recipe for a drink based on the user request.

Key rules:
1. Structure: Output strictly JSON matching the DrinkRecipe interface.
2. Fields: "glassware", "ice", and "tools" are required.
3. Variants: If "isAlcoholic" is true, you MUST populate "aiVariants.virgin_version" with a non-alcoholic modification.
4. Servings: Standard drink recipes are for 1 serving. Ensure "servings" is set to 1 unless the user explicitly asks for a batch. Verify that ingredient quantities match the serving size (e.g., ~60-90ml spirit total for 1 serving). DO NOT hallucinate "4 servings" for single-drink quantities.

Respond ONLY with valid JSON in this exact format:
{
  "title": "Drink Name",
  "description": "Appetizing description of the drink",
  "aiReason": "Why this drink suits the request or pairs with the context.",
  "ingredients": [
    {"name": "Gin", "amount": "60", "unit": "ml"}
  ],
  "instructions": "Step 1: Fill shaker with ice.\\nStep 2: Add ingredients.\\nStep 3: Shake and strain.",
  "glassware": "Coupe",
  "ice": "Nessuno",
  "tools": ["Shaker", "Hawthorne Strainer"],
  "isAlcoholic": true,
  "aiVariants": {
    "virgin_version": "Use non-alcoholic gin substitute...",
    "twist_version": "Add a splash of elderflower liqueur..."
  },
  "servings": 1,
  "allergens": [],
  "categories": ["Cocktail", "Gin"],
  "type": "drink"
}

IMPORTANT: "ice" must be one of: "Cubetti", "Tritato", "Sfera", "Nessuno".`;

async function callOpenAI(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
            max_tokens: 2000,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: systemPrompt,
            messages: [
                { role: 'user', content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content[0].text;
}

async function callGemini(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2000,
                responseMimeType: "application/json"
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callOllama(endpoint: string, model: string, prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            prompt: `${systemPrompt}\n\n${prompt}`,
            stream: false,
            format: "json"
        }),
    });

    if (!response.ok) {
        throw new Error('Ollama API error - make sure Ollama is running');
    }

    const data = await response.json();
    return data.response;
}

export async function suggestRecipe(settings: AISettings, existingRecipes: Recipe[], language: string, suggestedIngredients: string[] = [], dishType: string = 'any', flavorProfile: string = '', mode: 'food' | 'drink' = 'food'): Promise<SuggestedRecipe> {
    const recipeSummary = existingRecipes.slice(0, 10).map(r => ({
        title: r.title,
        categories: r.categories,
        ingredients: r.ingredients.map(i => i.name).join(', '),
    }));

    let prompt = `Here are the user's existing recipes:\n${JSON.stringify(recipeSummary, null, 2)}\n\n`;

    if (suggestedIngredients.length > 0) {
        prompt += `The user specifically wants to use these ingredients: ${suggestedIngredients.join(', ')}.\n\n`;
    }

    // Add flavor profile constraint if provided
    if (flavorProfile.trim()) {
        prompt += `IMPORTANT FLAVOR PROFILE: The user wants the item to have the following flavor characteristics: "${flavorProfile}". Make sure the recipe reflects this flavor profile.\n\n`;
    }

    // Add dish type constraint
    const dishTypeLabels: Record<string, string> = {
        any: '',
        appetizer: 'an appetizer/starter',
        firstCourse: 'a pasta dish or first course (primo piatto)',
        mainCourse: 'a main course/entrée (secondo piatto)',
        side: 'a side dish (contorno)',
        dessert: 'a dessert',
        kids: 'a kid-friendly dish',
        romantic: 'a romantic option',
        party: 'a party-friendly option',
        quick: 'quick and easy',
        vegan: 'VEGAN',
        vegetarian: 'VEGETARIAN',
        glutenFree: 'GLUTEN-FREE',
        cocktail: 'an alcoholic COCKTAIL',
        mocktail: 'a NON-ALCOHOLIC mocktail (0% ABV). Do NOT include any alcohol',
        smoothie: 'a fruit/vegetable SMOOTHIE',
        shake: 'a creamy MILKSHAKE',
        coffeeTea: 'a COFFEE or TEA based drink',
    };

    // Drink specific types could be added, but recycling is fine for now if user passed generic tags

    const dishTypeConstraint = dishType !== 'any' ? `The request MUST be ${dishTypeLabels[dishType]}.\n\n` : '';

    prompt += `${dishTypeConstraint}Suggest a new ${mode} recipe that complements their collection${suggestedIngredients.length > 0 ? ' and features the requested ingredients' : ''}${flavorProfile.trim() ? ' with the requested flavor profile' : ''}.
    
    IMPORTANT: Respond in ${language === 'it' ? 'Italian' : 'English'} language. Ensure all JSON keys remain in English.`;

    const systemPrompt = mode === 'drink' ? DRINK_SYSTEM_PROMPT : RECIPE_SUGGESTION_PROMPT;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, systemPrompt);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, systemPrompt);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, systemPrompt);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                systemPrompt
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr.trim());

    // Ensure the result has the correct type
    result.type = mode;

    // Validate Drink Portions (User Request)
    if (mode === 'drink') {
        return await validateDrinkRecipe(settings, result, language);
    }

    return result;
}

// Validation helper for drink portions
export async function validateDrinkRecipe(settings: AISettings, recipe: any, language: string): Promise<SuggestedRecipe> {
    console.log('[AI] Validating drink portions...');
    const prompt = `Review this drink recipe and correct any inconsistencies between "servings" and ingredient amounts:\n${JSON.stringify(recipe, null, 2)}\n\nPROBLEM: Often recipes say "4 servings" but ingredients are for 1 serving (e.g. 60ml gin total). \n\nACTION:\n1. Check if ingredients correspond to a SINGLE drink (standard cocktail).\n2. If "servings" > 1 but ingredients are single-portion, MULTIPLY the ingredients by the serving count.\n3. OR set servings to 1 if that was the intent.\n4. Ensure the output JSON is valid and matches the input structure.\n\nRespond ONLY with the corrected JSON. Keep string values in the original language (${language}).`;

    const systemPrompt = "You are a quality control assistant for a bar. You fix recipe scaling errors. Output raw JSON only.";

    let response: string;
    try {
        switch (settings.provider) {
            case 'openai':
                if (!settings.apiKey) return recipe;
                response = await callOpenAI(settings.apiKey, prompt, systemPrompt);
                break;
            case 'anthropic':
                if (!settings.apiKey) return recipe;
                response = await callAnthropic(settings.apiKey, prompt, systemPrompt);
                break;
            case 'gemini':
                if (!settings.apiKey) return recipe;
                response = await callGemini(settings.apiKey, prompt, systemPrompt);
                break;
            case 'ollama':
                response = await callOllama(
                    settings.ollamaEndpoint || 'http://localhost:11434',
                    settings.ollamaModel || 'llama3.2',
                    prompt,
                    systemPrompt
                );
                break;
            default:
                return recipe;
        }

        const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const fixed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            return { ...recipe, ...fixed };
        }
        return recipe;
    } catch (e) {
        console.warn('Drink validation failed, using original', e);
        return recipe;
    }
}

const CHEF_MODE_PROMPT = `You are a professional chef participating in a cooking challenge. 
Your task is to create a delicious, cohesive recipe using a specific set of ingredients provided by the user.

Rules:
1. You MUST highlight the provided ingredients in the recipe.
2. You can add common pantry staples (oil, salt, pepper, water, basic spices, flour, sugar, etc.) to make the dish work.
3. The recipe should be creative but practical.
4. Do NOT simply list the ingredients; create a real culinary dish.

Respond ONLY with valid JSON in this exact format:
{
  "title": "Creative Recipe Name",
  "description": "Appetizing description highlighting the key ingredients",
  "aiReason": "Explain in 2-3 sentences why you chose this combination. Describe how the ingredients complement each other in terms of flavor, texture, or cooking technique.",
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "cup"}
  ],
  "instructions": "Step 1: First instruction.\\nStep 2: Second instruction.\\nStep 3: Third instruction.",
  "cookingTime": 30,
  "servings": 2,
  "allergens": ["list", "allergens"],
  "categories": ["Category1", "Category2"],
  "nutrition": {
    "calories": 350,
    "protein": 20,
    "carbs": 40,
    "fat": 12,
    "fiber": 4,
    "sugar": 6
  }
}

IMPORTANT: 
1. In the instructions field, each step MUST be on a separate line (use \\n between steps). Number each step.
2. Always estimate nutrition values per serving (calories, protein, carbs, fat in grams).
3. The aiReason should explain your culinary reasoning - how the given ingredients create harmony in the dish.`;

const DRINK_CHEF_MODE_PROMPT = `You are a master mixologist.
Create a unique drink recipe using the specific set of ingredients provided by the user.

Rules:
1. You MUST highlight the provided ingredients in the drink.
2. You can add common bar staples (syrup, lemon/lime, soda, ice, bitters, basic spirits if implied) to make the drink work.
3. The recipe should be creative but balanced (Sweet, Sour, Strong, Weak).

Respond ONLY with valid JSON in this exact format:
{
  "title": "Creative Drink Name",
  "description": "Appetizing description",
  "aiReason": "Explain in 2-3 sentences why you chose this combination. Describe the balance of flavors.",
  "ingredients": [
    {"name": "ingredient name", "amount": "1", "unit": "oz"}
  ],
  "instructions": "Step 1: Preparation step.\\nStep 2: Mixing step.\\nStep 3: Serving step.",
  "cookingTime": 5,
  "servings": 1,
  "glassware": "Type of glass",
  "ice": "Ice type (Cubetti, Tritato, Sfera, Nessuno)",
  "tools": ["Tool1", "Tool2"],
  "isAlcoholic": true,
  "aiVariants": {
    "virgin_version": "Non-alcoholic alternative...",
    "twist_version": "A variant idea..."
  },
  "allergens": [],
  "categories": ["Category1"],
  "type": "drink"
}

IMPORTANT:
1. "ice" must be one of: "Cubetti", "Tritato", "Sfera", "Nessuno".
2. In instructions, use \\n for new lines.`;

export async function suggestRecipeFromIngredients(settings: AISettings, ingredients: string[], language: string, dishType: string = 'any', flavorProfile: string = '', mode: 'food' | 'drink' = 'food'): Promise<SuggestedRecipe> {
    // Add dish type constraint
    const dishTypeLabels: Record<string, string> = {
        any: '',
        appetizer: 'an appetizer/starter',
        firstCourse: 'a pasta dish or first course (primo piatto)',
        mainCourse: 'a main course/entrée (secondo piatto)',
        side: 'a side dish (contorno)',
        dessert: 'a dessert',
        kids: 'a kid-friendly dish that children will love - simple flavors, fun presentation, not spicy',
        romantic: 'a romantic dinner dish - elegant, sophisticated, perfect for a date night',
        party: 'a dish suitable for large parties/gatherings - easy to scale, crowd-pleasing',
        quick: 'a quick and easy dish - under 30 minutes total time',
        vegan: 'a VEGAN dish - NO animal products (no meat, dairy, eggs, honey)',
        vegetarian: 'a VEGETARIAN dish - no meat or fish (dairy and eggs are OK)',
        glutenFree: 'a GLUTEN-FREE dish - no wheat, barley, rye (rice, potatoes are OK)',
        cocktail: 'an alcoholic COCKTAIL',
        mocktail: 'a NON-ALCOHOLIC mocktail (0% ABV). Do NOT include any alcohol',
        smoothie: 'a fruit/vegetable SMOOTHIE',
        shake: 'a creamy MILKSHAKE',
        coffeeTea: 'a COFFEE or TEA based drink',
    };
    const dishTypeConstraint = dishType !== 'any' ? `The recipe MUST be ${dishTypeLabels[dishType]}.\n` : '';

    // Add flavor profile constraint if provided
    const flavorConstraint = flavorProfile.trim()
        ? `IMPORTANT FLAVOR PROFILE: The user wants the dish to have the following flavor characteristics: "${flavorProfile}". Make sure the recipe reflects this flavor profile in its ingredients, seasonings, and methods.\n`
        : '';

    const prompt = `Create a ${mode} recipe using these ingredients: ${ingredients.join(', ')}.
You may add staples, but the core flavor profile should come from the provided list.
${dishTypeConstraint}${flavorConstraint}IMPORTANT: Respond in ${language === 'it' ? 'Italian' : 'English'} language. Ensure all JSON keys remain in English.`;

    const systemPrompt = mode === 'drink' ? DRINK_CHEF_MODE_PROMPT : CHEF_MODE_PROMPT;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, systemPrompt);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, systemPrompt);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, systemPrompt);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                systemPrompt
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr.trim());
}

// Wine Pairing Types
export interface WinePairing {
    tier: 'budget' | 'mid-range' | 'luxury';
    name: string;
    type: string; // e.g., "Red - Cabernet Sauvignon"
    region: string;
    priceRange: string;
    description: string;
    whyItPairs: string;
}

export interface WinePairingSuggestion {
    budget: WinePairing;
    midRange: WinePairing;
    luxury: WinePairing;
    generalTips: string;
}

/**
 * Internal interface for the multi-option response from the AI
 */
interface MultiOptionWineTier {
    safe: WinePairing;       // Option A: Safe Bet
    sommelier: WinePairing;  // Option B: Sommelier Choice
    hiddenGem: WinePairing;  // Option C: Hidden Gem
}

interface MultiOptionWineResponse {
    budget: MultiOptionWineTier;
    midRange: MultiOptionWineTier;
    luxury: MultiOptionWineTier;
    generalTips: string;
}

/**
 * Helper to select the best wine option based on weighted probabilities.
 * Weights: Safe (20%), Sommelier (40%), Hidden Gem (40%)
 */
function selectBestOption(options: MultiOptionWineTier): WinePairing {
    const rand = Math.random();

    // 0.0 - 0.2: Safe Bet (20%)
    if (rand < 0.2) return options.safe;

    // 0.2 - 0.6: Sommelier Choice (40%)
    if (rand < 0.6) return options.sommelier;

    // 0.6 - 1.0: Hidden Gem (40%)
    return options.hiddenGem;
}

const WINE_PAIRING_MULTI_PROMPT = `You are an expert sommelier following ASI guidelines.
Analyze the recipe and suggest wine pairings for THREE price tiers.

For EACH price tier, you must generate 3 distinct options (Archetypes):
1. "safe": A recognizable, classic pairing.
2. "sommelier": A specific region or slightly more complex choice.
3. "hiddenGem": An indigenous grape or underrated region/producer (High QPR).

Consider:
- Main proteins, cooking methods, and sauce intensity.
- Identify COMPLEMENTARY notes (matching flavors) and CONTRASTING notes (balancing structure).

CONSTRAINT: Ensure diversity across tiers. Do NOT suggest the same wine type or region for multiple tiers. 
- Budget wines ($8-15) should be entry-level, younger, or from high-value regions.
- Mid-Range wines ($20-40) should be Riserva, distinct vineyards, or more prestigious appellations.
- Luxury wines ($60+) should be Grand Cru, iconic producers, or aged vintages.

Respond ONLY with valid JSON in this exact format:
{
  "budget": {
    "safe": { "tier": "budget", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$8-15", "description": "Desc", "whyItPairs": "Reason" },
    "sommelier": { "tier": "budget", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$8-15", "description": "Desc", "whyItPairs": "Reason" },
    "hiddenGem": { "tier": "budget", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$8-15", "description": "Desc", "whyItPairs": "Reason" }
  },
  "midRange": {
    "safe": { "tier": "mid-range", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$20-40", "description": "Desc", "whyItPairs": "Reason" },
    "sommelier": { "tier": "mid-range", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$20-40", "description": "Desc", "whyItPairs": "Reason" },
    "hiddenGem": { "tier": "mid-range", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$20-40", "description": "Desc", "whyItPairs": "Reason" }
  },
  "luxury": {
    "safe": { "tier": "luxury", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$60+", "description": "Desc", "whyItPairs": "Reason" },
    "sommelier": { "tier": "luxury", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$60+", "description": "Desc", "whyItPairs": "Reason" },
    "hiddenGem": { "tier": "luxury", "name": "Name", "type": "Type", "region": "Region", "priceRange": "$60+", "description": "Desc", "whyItPairs": "Reason" }
  },
  "generalTips": "General tips..."
}`;

export async function suggestWinePairing(settings: AISettings, recipe: Recipe, language: string, specificTier?: 'budget' | 'mid-range' | 'luxury'): Promise<WinePairingSuggestion | WinePairing> {
    const prompt = `Recipe: "${recipe.title}"
Description: ${recipe.description || 'N/A'}
Main ingredients: ${recipe.ingredients.slice(0, 8).map(i => i.name).join(', ')}
Categories: ${recipe.categories.join(', ') || 'N/A'}

${specificTier
            ? `Please suggest ONLY the "${specificTier}" price tier with 3 options (Safe, Sommelier, Hidden Gem).`
            : 'Please suggest wine pairings for all three price tiers with 3 options each.'}

IMPORTANT: Respond in ${language === 'it' ? 'Italian' : 'English'} language. Ensure JSON keys remain in English.`;

    // Specialized system prompt for single tier selection to keep JSON structure consistent-ish or adaptable
    const systemPrompt = specificTier
        ? `You are an expert sommelier. Suggest 3 options for the "${specificTier}" tier.
           Respond ONLY with valid JSON including crucial details ("description", "whyItPairs"):
           {
             "options": {
                "safe": { 
                    "tier": "${specificTier}", 
                    "name": "Name", 
                    "type": "Type", 
                    "region": "Region", 
                    "priceRange": "Price", 
                    "description": "Full description here", 
                    "whyItPairs": "Detailed pairing logic here" 
                },
                "sommelier": { 
                    "tier": "${specificTier}", 
                    "name": "Name", 
                    "type": "Type", 
                    "region": "Region", 
                    "priceRange": "Price", 
                    "description": "Full description here", 
                    "whyItPairs": "Detailed pairing logic here" 
                },
                "hiddenGem": { 
                    "tier": "${specificTier}", 
                    "name": "Name", 
                    "type": "Type", 
                    "region": "Region", 
                    "priceRange": "Price", 
                    "description": "Full description here", 
                    "whyItPairs": "Detailed pairing logic here" 
                }
             }
           }`
        : WINE_PAIRING_MULTI_PROMPT;

    let response: string;

    try {
        switch (settings.provider) {
            case 'openai': {
                if (!settings.apiKey) throw new Error('OpenAI API key is required');
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: settings.model || 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: "json_object" }
                    }),
                });
                const data = await res.json();
                response = data.choices?.[0]?.message?.content || '';
                break;
            }
            case 'gemini':
            case 'anthropic':
            case 'ollama':
                // Re-use existing simple calls for now, assuming they follow the system prompt
                // Ideally, these would also be updated to strict JSON mode where supported
                if (!settings.apiKey && settings.provider !== 'ollama') throw new Error(`${settings.provider} API key required`);

                // Construct specific call based on provider (re-using previous logic structure for brevity)
                if (settings.provider === 'gemini') {
                    const res = await callGemini(settings.apiKey!, prompt, systemPrompt);
                    response = res;
                } else if (settings.provider === 'anthropic') {
                    const res = await callAnthropic(settings.apiKey!, prompt, systemPrompt);
                    response = res;
                } else {
                    const res = await callOllama(settings.ollamaEndpoint!, settings.ollamaModel!, prompt, systemPrompt);
                    response = res;
                }
                break;
            default:
                throw new Error('Unknown AI provider');
        }

        const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Failed to parse wine pairing response');

        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsedData = JSON.parse(jsonStr.trim());

        // Handle Single Tier Request
        if (specificTier) {
            if (parsedData.options) {
                return selectBestOption(parsedData.options);
            } else if (parsedData[specificTier]) {
                // Fallback if AI returned full structure despite instruction
                return selectBestOption(parsedData[specificTier]);
            }
            // Fallback if structure is completely different (shouldn't happen with good prompt)
            throw new Error("Invalid response structure for single tier");
        }

        // Handle Full 3-Tier Request
        const fullData = parsedData as MultiOptionWineResponse;

        return {
            budget: selectBestOption(fullData.budget),
            midRange: selectBestOption(fullData.midRange),
            luxury: selectBestOption(fullData.luxury),
            generalTips: fullData.generalTips || "Serve at the appropriate temperature."
        };

    } catch (err) {
        console.error("Wine pairing generation failed:", err);
        throw err;
    }
}

const RECIPE_TRANSLATION_PROMPT = `You are a professional culinary translator.
Translate the following recipe content into the target language. 
Maintain all measurements (numbers) exactly as they are.
Translate ingredient units if applicable (e.g. "cup" -> "tazza" for Italian).
Keep the tone and style of the original.

Respond ONLY with valid JSON in this exact format:
{
  "title": "Translated Title",
  "description": "Translated Description",
  "ingredients": [
    {"name": "translated name", "amount": "original amount", "unit": "translated unit"}
  ],
  "instructions": "Translated instructions...",
  "notes": "Translated notes (if any)",
  "categories": ["Translated Category"]
}`;

export async function translateRecipe(settings: AISettings, recipe: Recipe, targetLanguage: string): Promise<Partial<Recipe>> {
    const prompt = `Translate this recipe to ${targetLanguage === 'it' ? 'Italian' : 'English'}:
    
Title: ${recipe.title}
Description: ${recipe.description}
Ingredients: ${JSON.stringify(recipe.ingredients)}
Instructions: ${recipe.instructions}
Notes: ${recipe.notes}
Categories: ${recipe.categories.join(', ')}`;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, RECIPE_TRANSLATION_PROMPT);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, RECIPE_TRANSLATION_PROMPT);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, RECIPE_TRANSLATION_PROMPT);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                RECIPE_TRANSLATION_PROMPT
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr.trim());
}

/**
 * Structured attributes for the visual description of a dish.
 */
interface VisualDescription {
    plating_type: string;
    primary_colors: string;
    texture_details: string;
    focal_point: string;
    is_cooked: boolean;
}

/**
 * Sanitizes text to remove unsafe words that might trigger image generation filters.
 */
function sanitizeForImageGen(text: string): string {
    const unsafeWords = [/knife/gi, /cut/gi, /blade/gi, /blood/gi, /kill/gi, /weapon/gi, /sharp/gi];
    let sanitized = text;
    unsafeWords.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });
    return sanitized;
}

/**
 * Uses AI to generate structured visual attributes for food styling.
 * Returns a JSON object defining the look of the dish.
 */
async function generateVisualDescription(settings: AISettings, recipe: Recipe): Promise<VisualDescription> {
    const ingredientList = recipe.ingredients.map(i => i.name).join(', ');

    // Step 1: The Visual Stylist - Structured JSON Prompt
    const isDrink = recipe.type === 'drink';
    let prompt = '';

    if (isDrink) {
        prompt = `You are an expert cocktail stylist. Describe detailed visual attributes for this drink.
Recipe: "${recipe.title}"
Ingredients: ${ingredientList}

Analyze the recipe and return a JSON object (and ONLY JSON) with these fields:
1. plating_type: The ideal glassware (e.g., "crystal coupe", "copper mug", "highball glass").
2. primary_colors: The liquid's color and opacity (e.g., "translucent amber", "opaque creamy pink").
3. texture_details: Visual details like condensation, bubbles, frost, or ice styling.
4. focal_point: The main garnish or visual hook (e.g., "flaming zest", "fresh mint sprig").
5. is_cooked: Set to false.

Constraint: Output valid JSON matching the structure.`;
    } else {
        prompt = `You are an expert food stylist. detailed visual attributes for this recipe.
Recipe: "${recipe.title}"
Ingredients: ${ingredientList}
${recipe.categories?.length ? `Categories: ${recipe.categories.join(', ')}` : ''}

Analyze the recipe and return a JSON object (and ONLY JSON) with these fields:
1. plating_type: Container style (e.g., "wide ceramic bowl", "rustic wooden board", "slate plate").
2. primary_colors: Comma-separated list of the 3 main visible colors.
3. texture_details: Specific texture keywords (e.g., "glistening", "crumbly", "charred edges", "creamy").
4. focal_point: The main visual element to focus on.
5. is_cooked: boolean (true if cooked, false if raw like salad).

CONSTRAINT: Exclude any ingredients not found in the original list.

Example Output format:
{
  "plating_type": "matte black round plate",
  "primary_colors": "golden brown, fresh green, deep red",
  "texture_details": "crispy skin, tender leaves, glossy sauce",
  "focal_point": "the sear on the main protein",
  "is_cooked": true
}`;
    }

    const systemPrompt = "You are a JSON-only API for food styling. Output valid JSON.";

    try {
        let response: string = '';

        // Helper to attempt parsing JSON
        const parseResponse = (text: string): VisualDescription => {
            const jsonMatch = text.match(/```json?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        };

        switch (settings.provider) {
            case 'openai': {
                if (!settings.apiKey) throw new Error('OpenAI API key is required');
                const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: settings.model || 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: "json_object" },
                        max_tokens: 300,
                    }),
                });
                const openaiData = await openaiResp.json();
                response = openaiData.choices?.[0]?.message?.content || '';
                break;
            }
            case 'gemini': {
                if (!settings.apiKey) throw new Error('Gemini API key is required');
                const geminiResp = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${settings.model || 'gemini-2.0-flash'}:generateContent?key=${settings.apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { responseMimeType: "application/json" }
                        }),
                    }
                );
                const geminiData = await geminiResp.json();
                response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                break;
            }
            case 'anthropic': {
                if (!settings.apiKey) throw new Error('Anthropic API key is required');
                const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': settings.apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true',
                    },
                    body: JSON.stringify({
                        model: settings.model || 'claude-3-haiku-20240307',
                        max_tokens: 300,
                        messages: [{ role: 'user', content: prompt }],
                        system: systemPrompt
                    }),
                });
                const anthropicData = await anthropicResp.json();
                response = anthropicData.content?.[0]?.text || '';
                break;
            }
            case 'ollama': {
                const ollamaResp = await fetch(`${settings.ollamaEndpoint || 'http://localhost:11434'}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: settings.ollamaModel || 'llama3.2',
                        prompt: prompt,
                        system: systemPrompt,
                        format: "json",
                        stream: false,
                    }),
                });
                const ollamaData = await ollamaResp.json();
                response = ollamaData.response || '';
                break;
            }
            default:
                throw new Error('Unknown AI provider');
        }

        return parseResponse(response);
    } catch (e) {
        console.warn("Visual Description Generation Failed, using default values", e);
        // Fallback or re-throw to be handled by the caller
        throw e;
    }
}

/**
 * Generates a recipe image using a robust two-step process with fallbacks and timeouts.
 */
export async function generateRecipeImage(settings: AISettings, recipe: Recipe): Promise<string> {
    const TIMEOUT_MS = 60000; // 60 seconds total timeout

    const generateWithTimeout = async () => {
        let imagePrompt = "";

        try {
            // Step 1: Generate Visual Description (The Visual Stylist)
            // We give this step about 15 seconds, if it fails, we fall back to a basic prompt
            const descriptionPromise = generateVisualDescription(settings, recipe);

            // Timeout specifically for step 1
            const step1Timeout = new Promise<VisualDescription>((_, reject) =>
                setTimeout(() => reject(new Error("Step 1 Timeout")), 15000)
            );

            const attrs = await Promise.race([descriptionPromise, step1Timeout]);

            const sanitizedPlating = sanitizeForImageGen(attrs.plating_type);
            const sanitizedTextures = sanitizeForImageGen(attrs.texture_details);
            const sanitizedFocal = sanitizeForImageGen(attrs.focal_point);

            // Step 2: The Photographer - Construct High-Performance Prompt
            if (recipe.type === 'drink') {
                const glass = sanitizeForImageGen(recipe.glassware || attrs.plating_type);
                const ice = sanitizeForImageGen(recipe.ice || "appropriate ice");

                imagePrompt = `Professional cocktail photography of ${recipe.title}. 
Subject: A ${glass} containing the drink. 
Details: ${attrs.primary_colors} liquid with ${sanitizedTextures}. ${ice !== 'Nessuno' ? `Ice style: ${ice}.` : ''}
Garnish: ${sanitizedFocal}.
Style: Cinematic back-lighting to enhance translucency, shallow depth of field f/2.8, 8k resolution, commercial beverage photography, condensation on glass. 
Environment: Elegant dark bar counter or moody atmosphere. No text. No utensils.`;
            } else {
                imagePrompt = `Professional editorial food photography of ${recipe.title}. 
Subject: ${sanitizedFocal} plated in a ${sanitizedPlating}. 
Attributes: ${attrs.primary_colors} colors, ${sanitizedTextures}. 
Style: Natural side-lighting, macro lens f/2.8, high-contrast textures, Michelin-star presentation, 4k. 
${!attrs.is_cooked ? 'Look: Fresh, raw, crisp.' : 'Look: Hot, appetizing, steaming.'} 
View: 45-degree angle. No text. No utensils.`;
            }

        } catch (err) {
            console.warn("Step 1 (Visual Stylist) failed or timed out. Using fallback prompt.", err);
            // Fallback Prompt
            const ingredientSnippet = recipe.ingredients.slice(0, 5).map(i => i.name).join(', ');
            imagePrompt = `Professional food photography of ${recipe.title}. 
Show delicious ${ingredientSnippet}. 
Style: High-end restaurant plating, soft natural lighting, shallow depth of field, f/2.8, 8k resolution. 
Appetizing, authentic texture. No text.`;
        }

        // Validate prompt length for DALL-E (approx constraint)
        if (imagePrompt.length > 1000) {
            imagePrompt = imagePrompt.substring(0, 997) + "...";
        }

        console.log("[AI Service] Final Image Prompt:", imagePrompt);

        // Step 3: Call Image API (The Photographer)
        const provider = settings.imageProvider || 'openai';
        const apiKey = settings.imageApiKey || settings.apiKey;
        const imageModel = settings.imageModel;

        if (provider === 'openai') {
            if (!apiKey) throw new Error('OpenAI API key is required');
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: imageModel || 'dall-e-3',
                    prompt: imagePrompt,
                    n: 1,
                    size: '1024x1024',
                    quality: 'standard', // 'hd' is slower, standard is safer for timeouts
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'OpenAI Image Gen Failed');
            }
            const data = await response.json();
            return data.data[0].url;

        } else if (provider === 'gemini') {
            if (!apiKey) throw new Error('Gemini API key is required');

            // Use the EXPERIMENTAL image model (Supports Multimodal)
            const modelId = 'gemini-2.0-flash-exp';

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: imagePrompt }] }],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        candidateCount: 1
                    },
                    // CRITICAL: Relax safety filters to prevent silent failures on food/textures
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
                    ]
                }),
            });

            if (!response.ok) {
                throw new Error(`Gemini Error: ${response.status} ${await response.text()}`);
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];

            // Check for refusal (e.g. Safety or Recitation)
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                throw new Error(`Gemini Refused Generation: ${candidate.finishReason}`);
            }

            // Extract Image Base64
            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData?.mimeType?.startsWith('image/')) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }

            console.error("Gemini Debug Dump:", JSON.stringify(data, null, 2));
            throw new Error('No image found in Gemini response');

        } else if (provider === 'stability') {
            if (!apiKey) throw new Error('Stability API key required');
            const modelId = imageModel || 'stable-diffusion-xl-1024-v1-0';
            const response = await fetch(`https://api.stability.ai/v1/generation/${modelId}/text-to-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    text_prompts: [{ text: imagePrompt, weight: 1 }],
                    cfg_scale: 7,
                    height: 1024,
                    width: 1024,
                    samples: 1,
                    steps: 30,
                }),
            });

            if (!response.ok) throw new Error('Stability AI Failed');
            const data = await response.json();
            return `data:image/png;base64,${data.artifacts[0].base64}`;

        } else if (provider === 'pollinations') {
            // Ensure model is valid for Pollinations, otherwise default to 'flux'
            const validModels = ['flux', 'turbo'];
            let modelId = imageModel || 'flux';
            if (!validModels.includes(modelId)) {
                modelId = 'flux'; // Fallback if user has a different provider's model selected
            }

            // Pollinations now requires an API key
            // Start with imageApiKey. Do not fallback to generic apiKey to avoid sending OpenAI keys to Pollinations
            const apiKey = settings.imageApiKey;
            if (!apiKey) {
                throw new Error('Pollinations API key missing. Please add your key in Settings > Image Generation.');
            }

            const encoded = encodeURIComponent(imagePrompt);
            const seed = Math.floor(Math.random() * 1000000);
            const url = `https://gen.pollinations.ai/image/${encoded}?width=1024&height=1024&seed=${seed}&model=${modelId}&nologo=true&key=${apiKey}`;

            try {
                const imgResp = await fetch(url);
                if (!imgResp.ok) throw new Error('Pollinations Failed');
                const blob = await imgResp.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.warn("Pollinations fetch failed (likely CORS), returning URL directly:", error);
                return url;
            }

        } else if (provider === 'cloudflare') {
            if (!settings.cloudflareAccountId || !settings.cloudflareApiToken) {
                throw new Error('Cloudflare Account ID and API Token are required');
            }

            // Use backend proxy to avoid CORS
            if (window.electronAPI?.ai) {
                // Ensure we send a valid Cloudflare model ID to avoid confusing logs/errors
                const cfModel = settings.imageModel?.startsWith('@cf/')
                    ? settings.imageModel
                    : '@cf/black-forest-labs/flux-1-schnell';

                return await window.electronAPI.ai.generateImage({
                    provider: 'cloudflare',
                    prompt: imagePrompt,
                    settings: {
                        ...settings,
                        imageModel: cfModel
                    }
                });
            }

            // Fallback for browser/mobile (direct API call)
            const accountId = settings.cloudflareAccountId?.trim();
            const apiToken = settings.cloudflareApiToken?.trim();

            // Fix: Ensure we use a valid Cloudflare model. If the user switched from Gemini/OpenAI, 
            // the model ID might be wrong (e.g. 'dall-e-3' or 'gemini-2.0').
            let modelId = (settings.imageModel || '').trim();
            if (!modelId.startsWith('@cf/')) {
                console.warn('Invalid Cloudflare model ID detected:', modelId, 'Reverting to default Flux.');
                modelId = '@cf/black-forest-labs/flux-1-schnell';
            }

            if (!accountId) throw new Error('Cloudflare Account ID is missing. Please check Settings.');
            if (!apiToken) throw new Error('Cloudflare API Token is missing. Please check Settings.');

            const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`;
            console.log('Attempting verify Cloudflare URL:', url);

            const response = await fetch(
                url,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: imagePrompt,
                        num_steps: 4
                    }),
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                // Include the URL in the error to verify what is actually being called
                throw new Error(`Cloudflare Error (${response.status}) at ${url}: ${errText}`);
            }

            const data = await response.json();

            if (data.success && data.result?.image) {
                return `data:image/jpeg;base64,${data.result.image}`;
            }

            console.error("Cloudflare Response Dump:", JSON.stringify(data, null, 2));
            throw new Error('No image found in Cloudflare response');
        }

        throw new Error('Unknown/Unsupported Image Provider');
    };

    // 60-second Total Timeout Wrapper
    const totalTimeout = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Image Generation Timed Out (60s)")), TIMEOUT_MS)
    );

    return Promise.race([generateWithTimeout(), totalTimeout]);
}

// Nutrition calculation prompt
const NUTRITION_CALCULATION_PROMPT = `You are a nutrition expert. Calculate the estimated nutritional values for a recipe based on its ingredients.

Analyze the ingredients and estimate the total nutritional content PER SERVING.

Respond ONLY with valid JSON in this exact format:
{
  "calories": 450,
  "protein": 25,
  "carbs": 45,
  "fat": 18,
  "fiber": 5,
  "sugar": 8,
  "sodium": 800,
  "cholesterol": 65,
  "saturatedFat": 6,
  "vitaminA": 15,
  "vitaminC": 20,
  "calcium": 10,
  "iron": 15
}

Notes:
- calories: total kcal per serving
- protein, carbs, fat, fiber, sugar, saturatedFat: grams per serving
- sodium, cholesterol: milligrams per serving  
- vitaminA, vitaminC, calcium, iron: percentage of daily value`;

export interface NutritionData {
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
    saturatedFat?: number;
    vitaminA?: number;
    vitaminC?: number;
    calcium?: number;
    iron?: number;
}

export async function calculateNutrition(settings: AISettings, recipe: Recipe): Promise<NutritionData> {
    const ingredientsList = recipe.ingredients.map(i =>
        `${i.amount} ${i.unit} ${i.name}`
    ).join('\n');

    const prompt = `Calculate nutrition for this recipe (${recipe.servings || 4} servings):

Recipe: ${recipe.title}

Ingredients:
${ingredientsList}

Estimate nutritional values per serving.`;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, NUTRITION_CALCULATION_PROMPT);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, NUTRITION_CALCULATION_PROMPT);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, NUTRITION_CALCULATION_PROMPT);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                NUTRITION_CALCULATION_PROMPT
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    // Extract JSON from response
    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse nutrition response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr.trim());
}

// Flavor Profile calculation
const FLAVOR_PROFILE_PROMPT = `You are a culinary expert. Analyze the recipe and its ingredients to determine the flavor profile.

Rate each taste dimension on a scale of 0-10:
- sweet: Sweetness level (sugars, fruits, honey, etc.)
- salty: Saltiness level (salt, soy sauce, cheese, etc.)
- sour: Sourness/acidity (citrus, vinegar, tomatoes, etc.)
- bitter: Bitterness (coffee, dark chocolate, leafy greens, etc.)
- umami: Savory depth (meat, mushrooms, parmesan, soy, etc.)
- spicy: Heat/spiciness (chili, pepper, ginger, etc.)

Respond ONLY with valid JSON:
{
  "sweet": 3,
  "salty": 5,
  "sour": 2,
  "bitter": 1,
  "umami": 7,
  "spicy": 4
}`;

export interface FlavorProfileData {
    sweet: number;
    salty: number;
    sour: number;
    bitter: number;
    umami: number;
    spicy: number;
}

export async function calculateFlavorProfile(settings: AISettings, recipe: Recipe): Promise<FlavorProfileData> {
    const ingredientsList = recipe.ingredients.map(i =>
        `${i.amount} ${i.unit} ${i.name}`
    ).join('\n');

    const prompt = `Analyze the flavor profile of this recipe:

Recipe: ${recipe.title}
${recipe.description ? `Description: ${recipe.description}` : ''}

Ingredients:
${ingredientsList}

Rate each taste dimension (0-10).`;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, FLAVOR_PROFILE_PROMPT);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, FLAVOR_PROFILE_PROMPT);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, FLAVOR_PROFILE_PROMPT);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                FLAVOR_PROFILE_PROMPT
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    // Extract JSON from response
    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse flavor profile response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr.trim());

    // Ensure all values are between 0-10
    return {
        sweet: Math.min(10, Math.max(0, result.sweet || 0)),
        salty: Math.min(10, Math.max(0, result.salty || 0)),
        sour: Math.min(10, Math.max(0, result.sour || 0)),
        bitter: Math.min(10, Math.max(0, result.bitter || 0)),
        umami: Math.min(10, Math.max(0, result.umami || 0)),
        spicy: Math.min(10, Math.max(0, result.spicy || 0)),
    };
}

const DRINK_REMIX_SYSTEM_PROMPT = `You are an expert mixologist.
Your task is to REMIX an existing cocktail recipe based on specific modification requests.

Rules:
1. Start with the original recipe as a base.
2. Apply the requested modifications (e.g., "make it smokey" -> add Mezcal or smoked syrup; "virgin" -> remove alcohol).
3. Ensure the result is balanced and drinkable.
4. Update the title to reflect the remix (e.g., "Smokey Negroni").
5. Update ingredients, instructions, glassware, and tools as needed.

Respond ONLY with valid JSON in this exact format:
{
  "title": "Remixed Drink Name",
  "description": "Description highlighting changes",
  "aiReason": "Explanation of how you adapted the recipe.",
  "ingredients": [
    {"name": "ingredient", "amount": "1", "unit": "oz"}
  ],
  "instructions": "Step 1...\\nStep 2...",
  "glassware": "Glass type",
  "ice": "Ice type (Cubetti, Tritato, Sfera, Nessuno)",
  "tools": ["Tool1", "Tool2"],
  "isAlcoholic": true,
  "aiVariants": null,
  "allergens": [],
  "categories": ["Cocktail", "Remix"],
  "type": "drink"
}

IMPORTANT: "ice" must be one of: "Cubetti", "Tritato", "Sfera", "Nessuno".
`;

export async function remixCocktail(settings: AISettings, originalRecipe: Recipe, modifications: string, language: string): Promise<SuggestedRecipe> {
    const prompt = `Original Recipe:
${JSON.stringify({
        title: originalRecipe.title,
        ingredients: originalRecipe.ingredients,
        instructions: originalRecipe.instructions,
        glassware: originalRecipe.type === 'drink' ? originalRecipe.glassware : 'Glass',
        isAlcoholic: originalRecipe.type === 'drink' ? originalRecipe.isAlcoholic : true
    }, null, 2)}

Requested Modifications: "${modifications}"

Create a remix of this cocktail.
IMPORTANT: Respond in ${language === 'it' ? 'Italian' : 'English'} language. Ensure JSON keys remain in English.`;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, DRINK_REMIX_SYSTEM_PROMPT);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, DRINK_REMIX_SYSTEM_PROMPT);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, DRINK_REMIX_SYSTEM_PROMPT);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                DRINK_REMIX_SYSTEM_PROMPT
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr.trim());
    result.type = 'drink';
    return result;
}

// Shopping List Merge System Prompt
const SHOPPING_LIST_MERGE_PROMPT = `You are a smart shopping list assistant. Your job is to merge and consolidate shopping list items.

Rules:
1. Combine duplicate ingredients by adding their quantities
2. Normalize units when possible (e.g., combine "1 cup" and "250ml" if both are milk)
3. Keep the most descriptive name (e.g., "fresh basil" over "basil")
4. Round to practical amounts (e.g., "3.5 onions" → "4 onions")
5. Preserve checked status from the current list
6. Remove truly duplicates, keeping the unchecked one

Respond with valid JSON only:
{
  "items": [
    { "name": "Onions", "amount": "3", "unit": "", "checked": false },
    { "name": "Milk", "amount": "500", "unit": "ml", "checked": false }
  ]
}`;

export interface MergedShoppingItem {
    name: string;
    amount: string;
    unit: string;
    checked: boolean;
}

/**
 * Merges the current shopping list with new ingredients using AI.
 */
export async function mergeShoppingList(
    settings: AISettings,
    currentItems: { name: string; amount?: string; unit?: string; checked: boolean }[],
    newIngredients: { name: string; amount: string; unit: string }[]
): Promise<MergedShoppingItem[]> {
    const currentListText = currentItems.length > 0
        ? currentItems.map(i => `${i.amount || ''} ${i.unit || ''} ${i.name} ${i.checked ? '(checked)' : ''}`.trim()).join('\n')
        : 'Empty list';

    const newItemsText = newIngredients.map(i => `${i.amount} ${i.unit} ${i.name}`.trim()).join('\n');

    const prompt = `Current Shopping List:
${currentListText}

New items to add:
${newItemsText}

Merge these lists intelligently, combining duplicates and normalizing quantities.`;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, SHOPPING_LIST_MERGE_PROMPT);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, SHOPPING_LIST_MERGE_PROMPT);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, SHOPPING_LIST_MERGE_PROMPT);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                SHOPPING_LIST_MERGE_PROMPT
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    const jsonMatch = response.match(/```json?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI merge response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const result = JSON.parse(jsonStr.trim());
    return result.items || [];
}

/**
 * Simple non-AI merge for when AI is not configured.
 * Groups by ingredient name and combines amounts.
 */
export function simpleShoppingMerge(
    currentItems: { name: string; amount?: string; unit?: string; checked: boolean }[],
    newIngredients: { name: string; amount: string; unit: string }[]
): MergedShoppingItem[] {
    const itemMap = new Map<string, MergedShoppingItem>();

    // Add current items
    for (const item of currentItems) {
        const key = item.name.toLowerCase().trim();
        if (!itemMap.has(key)) {
            itemMap.set(key, {
                name: item.name,
                amount: item.amount || '',
                unit: item.unit || '',
                checked: item.checked
            });
        }
    }

    // Merge new items
    for (const ing of newIngredients) {
        const key = ing.name.toLowerCase().trim();
        const existing = itemMap.get(key);

        if (existing && !existing.checked) {
            // Try to combine amounts if units match
            const existingAmt = parseFloat(existing.amount) || 0;
            const newAmt = parseFloat(ing.amount) || 0;
            if (existing.unit.toLowerCase() === ing.unit.toLowerCase() || !existing.unit) {
                existing.amount = String(existingAmt + newAmt);
                existing.unit = ing.unit || existing.unit;
            } else {
                // Different units - just append
                existing.amount = `${existing.amount}${existing.unit ? existing.unit : ''} + ${ing.amount}${ing.unit}`;
                existing.unit = '';
            }
        } else if (!existing) {
            itemMap.set(key, {
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                checked: false
            });
        }
    }

    return Array.from(itemMap.values());
}

// Chef Mode: Answer cooking questions
const COOKING_ASSISTANT_PROMPT = `You are a friendly cooking assistant helping someone while they cook. They are actively making a recipe and have their hands dirty, so keep answers SHORT and CLEAR.

Rules:
1. Be concise - 1-3 sentences max
2. If asked about an ingredient amount, give the EXACT amount from the recipe
3. If asked about technique, give practical, actionable advice
4. If asked "what's next" or "next step", just say the next step briefly
5. Speak naturally as if you're in the kitchen with them
6. If you don't know something, say so briefly

Recipe context will be provided. Answer based on that context.`;

export interface CookingQuestion {
    recipe: {
        title: string;
        ingredients: { name: string; amount: string; unit: string }[];
        instructions: string;
    };
    currentStep: number;
    totalSteps: number;
    question: string;
}

/**
 * Answer a cooking question in context of the current recipe.
 */
export async function askCookingQuestion(
    settings: AISettings,
    context: CookingQuestion
): Promise<string> {
    const ingredientList = context.recipe.ingredients
        .map(i => `${i.amount} ${i.unit} ${i.name}`.trim())
        .join('\n');

    const steps = context.recipe.instructions
        .split(/\n+/)
        .filter(s => s.trim())
        .map((s, i) => `Step ${i + 1}: ${s.trim()}`);

    const prompt = `Recipe: ${context.recipe.title}

Ingredients:
${ingredientList}

Instructions:
${steps.join('\n')}

Current step: ${context.currentStep} of ${context.totalSteps}
${steps[context.currentStep - 1] || ''}

User's question: "${context.question}"

Answer briefly and helpfully:`;

    let response: string;

    switch (settings.provider) {
        case 'openai':
            if (!settings.apiKey) throw new Error('OpenAI API key is required');
            response = await callOpenAI(settings.apiKey, prompt, COOKING_ASSISTANT_PROMPT);
            break;
        case 'anthropic':
            if (!settings.apiKey) throw new Error('Anthropic API key is required');
            response = await callAnthropic(settings.apiKey, prompt, COOKING_ASSISTANT_PROMPT);
            break;
        case 'gemini':
            if (!settings.apiKey) throw new Error('Gemini API key is required');
            response = await callGemini(settings.apiKey, prompt, COOKING_ASSISTANT_PROMPT);
            break;
        case 'ollama':
            response = await callOllama(
                settings.ollamaEndpoint || 'http://localhost:11434',
                settings.ollamaModel || 'llama3.2',
                prompt,
                COOKING_ASSISTANT_PROMPT
            );
            break;
        default:
            throw new Error('Unknown AI provider');
    }

    // Clean up response - remove any markdown or extra formatting
    return response.replace(/```[^`]*```/g, '').trim();
}
